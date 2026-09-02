
import { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { OrgSettings } from '../models/OrgSettings.js';
import { env } from '../config/env.js';

// --- Module-level IO reference (set once setupSocket runs) ---
let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

// Broadcast a collaborator role change to everyone currently in the doc room,
// so invited users see the updated permission in real time instead of on refresh.
export function notifyRoleChanged(
  docId: string,
  userId: string,
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
): void {
  const io = ioInstance;
  if (!io) return;
  io.to(`doc:${docId}`).emit('document:role-updated', { documentId: docId, userId, role });
}

// Remove a collaborator's sockets from the doc room and tell their clients their
// access was revoked. Even without this, the DB is the source of truth and every
// subsequent REST/socket action is rejected — this just makes the revocation
// immediate on the connected client.
export async function revokeCollaboratorAccess(docId: string, userId: string): Promise<void> {
  const io = ioInstance;
  if (!io) return;
  const roomKey = `doc:${docId}`;

  try {
    const sockets = await io.in(roomKey).fetchSockets();
    for (const remote of sockets as any[]) {
      const socketId = (remote as any).id as string;
      const sUserId = (remote as any).data?.userId as string | undefined;
      if (sUserId && sUserId === userId) {
        const roomSocket = io.sockets.sockets.get(socketId);
        if (roomSocket) {
          roomSocket.emit('document:access-revoked', { documentId: docId, userId });
          roomSocket.leave(roomKey);
        }
        socketRooms.get(socketId)?.delete(docId);
      }
    }
  } catch {
    // Some adapters don't support fetchSockets; access is still revoked via the DB.
  }

  io.to(roomKey).emit('document:access-revoked', { documentId: docId, userId });
}

// --- In-memory state ---

interface PresenceEntry {
  userId: string;
  socketId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
}

interface LockEntry {
  userId: string;
  userName: string;
  color: string;
  lockedAt: number;
  // Ordinal of the top-level block the editor is typing in. Sent by the client
  // so receivers can locate the block even when random block ids don't match.
  blockIndex: number | null;
}

// documentId → Map<socketId, PresenceEntry>
const documentPresence = new Map<string, Map<string, PresenceEntry>>();

// documentId → Map<blockId, LockEntry>
const documentLocks = new Map<string, Map<string, LockEntry>>();

// socketId → Set<documentId> (track which rooms a socket is in)
const socketRooms = new Map<string, Set<string>>();

// Debounced save timers: documentId → timeout
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const LOCK_CLEANUP_INTERVAL_MS = 60 * 1000; // check every 60s
const SAVE_DEBOUNCE_MS = 3000;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function getColor(userId: string): string {
  let hash = 0;
  for (const ch of userId) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getPresenceList(docId: string): PresenceEntry[] {
  const map = documentPresence.get(docId);
  if (!map) return [];
  // Deduplicate by userId (keep latest socket)
  const byUser = new Map<string, PresenceEntry>();
  for (const entry of map.values()) {
    byUser.set(entry.userId, entry);
  }
  return [...byUser.values()];
}

function getLocksObject(docId: string): Record<string, LockEntry> {
  const map = documentLocks.get(docId);
  if (!map) return {};
  const result: Record<string, LockEntry> = {};
  for (const [blockId, lock] of map) {
    result[blockId] = lock;
  }
  return result;
}

async function getUserDocRole(userId: string, docId: string): Promise<'OWNER' | 'EDITOR' | 'VIEWER' | null> {
  const doc = await Document.findById(docId);
  if (!doc) return null;
  if (doc.owner.toString() === userId) return 'OWNER';
  const collab = doc.collaborators.find((c) => c.user.toString() === userId);
  if (collab) return collab.role;
  // Public links are opt-in; without them a non-collaborator has no access.
  if (doc.isPublic) {
    const orgSettings = await OrgSettings.findOne();
    if (orgSettings && orgSettings.allowPublicLinks) return 'VIEWER';
  }
  return null;
}

function removePresence(socketId: string, docId: string, io: Server) {
  const presMap = documentPresence.get(docId);
  if (presMap) {
    presMap.delete(socketId);
    if (presMap.size === 0) documentPresence.delete(docId);
  }

  // Release locks owned by this socket's user
  const lockMap = documentLocks.get(docId);
  if (lockMap) {
    // Find userId from presence or from the lock itself
    for (const [blockId, lock] of lockMap) {
      // Check if this user still has another socket in the room
      const stillPresent = presMap?.size
        ? [...presMap.values()].some((p) => p.userId === lock.userId)
        : false;
      if (!stillPresent) {
        lockMap.delete(blockId);
        io.to(`doc:${docId}`).emit('block:unlocked', { blockId });
      }
    }
    if (lockMap.size === 0) documentLocks.delete(docId);
  }

  io.to(`doc:${docId}`).emit('document:presence', getPresenceList(docId));
}

export function setupSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  ioInstance = io;

  // --- Auth middleware ---
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.userId);
      if (!user) return next(new Error('User not found'));
      if (user.status === 'SUSPENDED') return next(new Error('Account suspended'));

      (socket as any).userId = user._id.toString();
      (socket as any).userName = user.name;
      (socket as any).userAvatarUrl = user.avatarUrl || null;
      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // --- Connection handler ---
  io.on('connection', (socket: Socket) => {
    const userId: string = (socket as any).userId;
    const userName: string = (socket as any).userName;
    const userAvatarUrl: string | null = (socket as any).userAvatarUrl;
    const userColor = getColor(userId);

    socketRooms.set(socket.id, new Set());

    // === 7B: Join document room ===
    socket.on('document:join', async (data: { documentId: string }, callback?: Function) => {
      const { documentId } = data;
      if (!documentId) return callback?.({ error: 'documentId required' });

      const role = await getUserDocRole(userId, documentId);
      if (!role) return callback?.({ error: 'Access denied' });

      const roomKey = `doc:${documentId}`;
      socket.join(roomKey);

      // Track rooms for this socket
      socketRooms.get(socket.id)?.add(documentId);

      // Add presence
      if (!documentPresence.has(documentId)) documentPresence.set(documentId, new Map());
      documentPresence.get(documentId)!.set(socket.id, {
        userId,
        socketId: socket.id,
        name: userName,
        avatarUrl: userAvatarUrl,
        color: userColor,
      });

      // Notify others
      socket.to(roomKey).emit('document:user-joined', {
        userId,
        name: userName,
        avatarUrl: userAvatarUrl,
        color: userColor,
      });

      // Send current state to the joining user
      const presence = getPresenceList(documentId);
      const locks = getLocksObject(documentId);
      callback?.({ ok: true, presence, locks, role });

      // Broadcast updated presence
      io.to(roomKey).emit('document:presence', presence);
    });

    // === 7B: Leave document room ===
    socket.on('document:leave', (data: { documentId: string }) => {
      const { documentId } = data;
      if (!documentId) return;

      const roomKey = `doc:${documentId}`;
      socket.leave(roomKey);
      socketRooms.get(socket.id)?.delete(documentId);

      socket.to(roomKey).emit('document:user-left', { userId, name: userName });
      removePresence(socket.id, documentId, io);
    });

    // === 7C: Cursor sync ===
    socket.on('document:cursor-update', (data: { documentId: string; cursor: any }) => {
      const { documentId, cursor } = data;
      if (!documentId || !socketRooms.get(socket.id)?.has(documentId)) return;

      socket.to(`doc:${documentId}`).emit('document:cursor-updated', {
        userId,
        name: userName,
        color: userColor,
        cursor,
      });
    });

    // === 7D: Block locking ===
    socket.on('block:lock', async (data: { documentId: string; blockId: string; blockIndex?: number }, callback?: Function) => {
      const { documentId, blockId } = data;
      if (!documentId || !blockId) return callback?.({ error: 'documentId and blockId required' });
      if (!socketRooms.get(socket.id)?.has(documentId)) return callback?.({ error: 'Not in document room' });

      const role = await getUserDocRole(userId, documentId);
      if (!role || role === 'VIEWER') return callback?.({ error: 'Edit access required' });

      if (!documentLocks.has(documentId)) documentLocks.set(documentId, new Map());
      const lockMap = documentLocks.get(documentId)!;

      const existing = lockMap.get(blockId);
      if (existing && existing.userId !== userId) {
        return callback?.({ error: 'Block is locked', lockedBy: existing });
      }

      const lock: LockEntry = {
        userId,
        userName,
        color: userColor,
        lockedAt: Date.now(),
        blockIndex: typeof data.blockIndex === 'number' ? data.blockIndex : null,
      };
      lockMap.set(blockId, lock);

      // socket.to → the sender never receives its own lock echo, so a user can
      // never see a "X is typing" indicator caused by their own editing.
      socket.to(`doc:${documentId}`).emit('block:locked', { blockId, lock });
      callback?.({ ok: true });
    });

    socket.on('block:unlock', (data: { documentId: string; blockId: string }, callback?: Function) => {
      const { documentId, blockId } = data;
      if (!documentId || !blockId) return callback?.({ error: 'documentId and blockId required' });

      const lockMap = documentLocks.get(documentId);
      if (!lockMap) return callback?.({ ok: true });

      const existing = lockMap.get(blockId);
      if (existing && existing.userId !== userId) {
        return callback?.({ error: 'Cannot unlock another user\'s lock' });
      }

      lockMap.delete(blockId);
      if (lockMap.size === 0) documentLocks.delete(documentId);

      socket.to(`doc:${documentId}`).emit('block:unlocked', { blockId });
      callback?.({ ok: true });
    });

    // === 7E: Content sync ===
    socket.on('document:content-update', async (data: { documentId: string; html: string }) => {
      const { documentId, html } = data;
      if (!documentId || typeof html !== 'string') return;
      if (!socketRooms.get(socket.id)?.has(documentId)) return;

      // Check edit permission
      const role = await getUserDocRole(userId, documentId);
      if (!role || role === 'VIEWER') return;

      // Broadcast to others
      socket.to(`doc:${documentId}`).emit('document:content-updated', {
        userId,
        html,
      });

      // Debounced save to MongoDB — preserve existing content structure
      const existingTimer = saveTimers.get(documentId);
      if (existingTimer) clearTimeout(existingTimer);

      saveTimers.set(documentId, setTimeout(async () => {
        try {
          // Use the same canonical block format as the REST save path:
          // [{ id: 'blk_main', type: 'paragraph', content: html }]
          // findByIdAndUpdate replaces the content field entirely, which is correct
          // since the frontend always converts to this single-block format.
          await Document.findByIdAndUpdate(documentId, {
            content: [{ id: 'blk_main', type: 'paragraph', content: html }],
            updatedAt: new Date(),
          });
          saveTimers.delete(documentId);
        } catch {
          saveTimers.delete(documentId);
        }
      }, SAVE_DEBOUNCE_MS));
    });

    socket.on('document:title-update', async (data: { documentId: string; title: string }) => {
      const { documentId, title } = data;
      if (!documentId || typeof title !== 'string') return;
      if (!socketRooms.get(socket.id)?.has(documentId)) return;

      const role = await getUserDocRole(userId, documentId);
      if (!role || role === 'VIEWER') return;

      socket.to(`doc:${documentId}`).emit('document:title-updated', { userId, title });

      // Save title immediately
      await Document.findByIdAndUpdate(documentId, { title }).catch(() => {});
    });

    // === 7F: Chat ===
    socket.on('chat:send', async (data: { documentId: string; content: string }, callback?: Function) => {
      const { documentId, content } = data;
      if (!documentId || !content?.trim()) return callback?.({ error: 'documentId and content required' });
      if (content.length > 2000) return callback?.({ error: 'Message too long' });
      if (!socketRooms.get(socket.id)?.has(documentId)) return callback?.({ error: 'Not in document room' });

      const role = await getUserDocRole(userId, documentId);
      if (!role) return callback?.({ error: 'Access denied' });

      const msg = await ChatMessage.create({
        documentId,
        userId,
        userName,
        userColor: userColor,
        content: content.trim(),
      });

      const payload = {
        id: msg._id.toString(),
        userId,
        userName,
        userColor,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
      };

      io.to(`doc:${documentId}`).emit('chat:received', payload);
      callback?.({ ok: true, message: payload });
    });

    // === 7G: Disconnect cleanup ===
    socket.on('disconnect', () => {
      const rooms = socketRooms.get(socket.id);
      if (rooms) {
        for (const docId of rooms) {
          socket.to(`doc:${docId}`).emit('document:user-left', { userId, name: userName });
          removePresence(socket.id, docId, io);
        }
      }
      socketRooms.delete(socket.id);
    });
  });

  // --- Lock expiry cleanup ---
  setInterval(() => {
    const now = Date.now();
    for (const [docId, lockMap] of documentLocks) {
      for (const [blockId, lock] of lockMap) {
        if (now - lock.lockedAt > LOCK_TIMEOUT_MS) {
          lockMap.delete(blockId);
          io.to(`doc:${docId}`).emit('block:unlocked', { blockId });
        }
      }
      if (lockMap.size === 0) documentLocks.delete(docId);
    }
  }, LOCK_CLEANUP_INTERVAL_MS);

  return io;
}
