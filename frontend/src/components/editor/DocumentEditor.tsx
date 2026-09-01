import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { io, type Socket } from 'socket.io-client';
import { DOMParser as ProseMirrorDOMParser, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  ArrowLeft, Share2, Download, CheckCircle2,
  Loader2, Cloud, MessageSquare, History, Eye, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';
import { EditorToolbar } from './EditorToolbar';
import { ShareModal } from './ShareModal';
import { CollaborationOverlay } from './CollaborationOverlay';
import { LockOverlay, type LockInfo } from './LockOverlay';
import { BlockId } from './BlockId';
import { DocumentChat } from './DocumentChat';
import { VersionHistory } from './VersionHistory';
import { ExportModal } from './ExportModal';
import { blocksToHtml, htmlToBlocks } from '../../utils/document';
import type { DocumentItem, Collaborator } from '../../types/document';

interface DocumentEditorProps {
  document: DocumentItem;
  onBack: () => void;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';
const SOCKET_URL = API_BASE.replace('/api/v1', '');

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document: doc,
  onBack
}) => {
  const { user } = useAuth();
  const [localDoc, setLocalDoc] = useState<DocumentItem>(doc);
  const [title, setTitle] = useState(doc.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'history'>('none');
  const [selectedVersionId, setSelectedVersionId] = useState('v_curr');
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [docRole, setDocRole] = useState<string | null>(doc.myRole || null);
  const [docLoading, setDocLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessRevoked, setAccessRevoked] = useState(false);
  const [locks, setLocks] = useState<Record<string, LockInfo>>({});
  const [lockedNotice, setLockedNotice] = useState<LockInfo | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdate = useRef(false);
  const redirectingRef = useRef(false);
  const myLockBlockRef = useRef<string | null>(null);
  // Set once a remote socket update has been applied, so the initial REST fetch
  // never overwrites fresher real-time content (stale-REST race).
  const appliedRemoteRef = useRef(false);

  // Latest remote HTML that we have not yet applied (coalesced at ~100ms).
  const pendingRemoteRef = useRef<string | null>(null);
  // Last HTML we actually emitted, so we never re-broadcast an identical payload.
  const lastSentHtmlRef = useRef('');

  // Refs mirroring state so the editor callbacks (created once) always read fresh values
  const locksRef = useRef(locks);
  useEffect(() => { locksRef.current = locks; }, [locks]);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const isReadOnly = docRole === 'VIEWER' || selectedVersionId !== 'v_curr';
  const canEditRef = useRef(!isReadOnly);
  useEffect(() => { canEditRef.current = !isReadOnly; }, [isReadOnly]);

  // The document owner is the only one allowed to invite/change-role/remove
  // collaborators — the backend enforces this too (403 otherwise).
  const isOwner = user?.id === localDoc.ownerId;

  const getBlockIdAtSelection = (): string | null => {
    if (!editor) return null;
    const { $from } = editor.state.selection;
    if ($from.depth < 1) return null;
    const blockId = $from.node(1).attrs.blockId as string | null;
    return blockId || null;
  };

  const getBlockIndexAtSelection = (): number => {
    if (!editor) return -1;
    const { $from } = editor.state.selection;
    if ($from.depth < 1) return -1;
    const blockStart = $from.before(1);
    let idx = 0;
    let found = -1;
    editor.state.doc.forEach((_node, offset) => {
      if (offset === blockStart) {
        found = idx;
        return false;
      }
      idx++;
    });
    return found;
  };

  // Acquire (or keep) the lock on the block the user is currently editing.
  // The lock auto-releases 2.5s after the last keystroke/selection change,
  // so it represents "this person is typing here" rather than a permanent claim.
  const acquireLock = (blockId: string) => {
    if (!canEditRef.current || !userRef.current) return;

    if (blockId !== myLockBlockRef.current) {
      if (myLockBlockRef.current) {
        socketRef.current?.emit('block:unlock', { documentId: doc.id, blockId: myLockBlockRef.current });
      }
      myLockBlockRef.current = blockId;
      const blockIndex = getBlockIndexAtSelection();
      socketRef.current?.emit('block:lock', { documentId: doc.id, blockId, blockIndex }, (res: any) => {
        if (res && !res.ok && myLockBlockRef.current === blockId) {
          // Another user got the lock first — drop our claim.
          myLockBlockRef.current = null;
        }
      });
    }

    if (lockReleaseTimerRef.current) clearTimeout(lockReleaseTimerRef.current);
    lockReleaseTimerRef.current = setTimeout(() => {
      if (myLockBlockRef.current === blockId) {
        myLockBlockRef.current = null;
        socketRef.current?.emit('block:unlock', { documentId: doc.id, blockId });
      }
    }, 2500);
  };

  const getNextEditableBlockPos = (fromBlockId: string): number | null => {
    if (!editor) return null;
    const current = locksRef.current;
    const me = userRef.current?.id;
    let afterTarget = false;
    let target: number | null = null;

    editor.state.doc.forEach((node, offset) => {
      const id = node.attrs.blockId as string | null;
      if (id === fromBlockId) { afterTarget = true; return; }
      if (afterTarget) {
        const locked = id ? current[id] : null;
        if (!(locked && locked.userId !== me)) { target = offset; return false; }
      }
    });

    if (target === null) {
      editor.state.doc.forEach((node, offset) => {
        const id = node.attrs.blockId as string | null;
        const locked = id ? current[id] : null;
        if (!(locked && locked.userId !== me)) { target = offset; return false; }
      });
    }

    return target;
  };

  // Apply a collaborator's HTML update reliably. Block ids are NOT guaranteed to
  // match between users (each editor instance assigns its own random ids), so we
  // never rely on id-based matching. Instead:
  //  - Same top-level block count → replace blocks positionally (skipping the
  //    block this user is actively typing in). This also adopts the sender's
  //    block ids, so ids converge across clients.
  //  - Different block count (a block was added/removed) → adopt the remote
  //    document wholesale so the structure stays consistent.
  // Remote applies are guarded with isRemoteUpdate so they never re-broadcast.
  const applyRemoteContent = (html: string) => {
    const ed = editorRef.current;
    if (!ed) return;

    const currentHtml = ed.getHTML();
    if (currentHtml === html) return;

    let incomingDoc: ProseMirrorNode;
    try {
      const dom = new DOMParser().parseFromString(html, 'text/html');
      incomingDoc = ProseMirrorDOMParser.fromSchema(ed.schema).parse(dom.body);
    } catch {
      // Unparseable content — skip this broadcast; the next valid one applies.
      return;
    }

    const state = ed.state;
    const myActive = myLockBlockRef.current;

    const curBlocks: ProseMirrorNode[] = [];
    state.doc.forEach((node) => curBlocks.push(node));
    const incBlocks: ProseMirrorNode[] = [];
    incomingDoc.forEach((node) => incBlocks.push(node));

    if (curBlocks.length === incBlocks.length) {
      const tr = state.tr;
      tr.setMeta('addToHistory', false);

      const ops: { start: number; end: number; node: ProseMirrorNode }[] = [];
      let offset = 0;
      for (let i = 0; i < curBlocks.length; i++) {
        const cur = curBlocks[i];
        const inc = incBlocks[i];
        const isActive = !!cur.attrs.blockId && cur.attrs.blockId === myActive;
        if (!isActive && !inc.eq(cur)) {
          ops.push({ start: offset, end: offset + cur.nodeSize, node: inc });
        }
        offset += cur.nodeSize;
      }

      if (ops.length === 0) {
        lastSentHtmlRef.current = ed.getHTML();
        return;
      }

      ops.sort((a, b) => b.start - a.start);
      for (const op of ops) tr.replaceWith(op.start, op.end, op.node);

      appliedRemoteRef.current = true;
      isRemoteUpdate.current = true;
      ed.view.dispatch(tr);
      isRemoteUpdate.current = false;
      lastSentHtmlRef.current = ed.getHTML();
      return;
    }

    // Structural change (block added/removed) → adopt the remote doc wholesale
    // so the order/ids stay consistent across all connected editors.
    appliedRemoteRef.current = true;
    isRemoteUpdate.current = true;
    ed.commands.setContent(html, { emitUpdate: false });
    isRemoteUpdate.current = false;
    lastSentHtmlRef.current = html;
  };

  // Coalesce rapid collab broadcasts so the editor is not re-written on every
  // single keystroke of the other user — the main cause of "laggy" typing.
  const scheduleRemoteApply = (html: string) => {
    pendingRemoteRef.current = html;
    if (remoteTimerRef.current) return;
    remoteTimerRef.current = setTimeout(() => {
      remoteTimerRef.current = null;
      const pending = pendingRemoteRef.current;
      pendingRemoteRef.current = null;
      if (pending) {
        if (!editorRef.current) {
          // Editor not ready yet (initial mount race) — keep pending for next tick
          pendingRemoteRef.current = pending;
          remoteTimerRef.current = setTimeout(() => {
            remoteTimerRef.current = null;
            const retry = pendingRemoteRef.current;
            pendingRemoteRef.current = null;
            if (retry) applyRemoteContent(retry);
          }, 100);
          return;
        }
        applyRemoteContent(pending);
      }
    }, 100);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Press "/" for commands, or start typing...' }),
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      BlockId,
    ],
    content: blocksToHtml(localDoc.blocks),
    editable: selectedVersionId === 'v_curr',
    editorProps: {
      attributes: {
        class: 'prose prose-stone prose-lg max-w-none focus:outline-none px-12 py-10 sm:px-16 md:px-20 lg:px-24',
      },
    },
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;
      setSaveStatus('unsaved');

      const html = editor.getHTML();
      if (html !== lastSentHtmlRef.current) {
        lastSentHtmlRef.current = html;
        socketRef.current?.emit('document:content-update', {
          documentId: doc.id,
          html,
        });
      }

      const blockId = getBlockIdAtSelection();
      if (blockId) {
        const lock = locksRef.current[blockId];
        if (!lock || lock.userId === userRef.current?.id) {
          acquireLock(blockId);
        }
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await documentService.saveContent(doc.id, htmlToBlocks(html));
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
        }
      }, 2000);
    },
    onSelectionUpdate: ({ editor }) => {
      if (!userRef.current || !socketRef.current) return;
      const { view } = editor;
      const { selection } = view.state;
      if (!selection) return;

      const blockId = getBlockIdAtSelection();
      if (blockId) {
        const lock = locksRef.current[blockId];
        if (lock && lock.userId !== userRef.current.id) {
          // User clicked into a section someone else is editing.
          setLockedNotice(lock);
          if (canEditRef.current && !redirectingRef.current) {
            redirectingRef.current = true;
            const target = getNextEditableBlockPos(blockId);
            if (target !== null) {
              editor.chain().setTextSelection(target).run();
            }
            setTimeout(() => { redirectingRef.current = false; }, 100);
          }
        } else {
          setLockedNotice(null);
          if (canEditRef.current) acquireLock(blockId);
        }
      }

      try {
        const coords = view.coordsAtPos(selection.anchor);
        const editorElement = view.dom;
        const rect = editorElement.getBoundingClientRect();

        const cursorPayload: any = {
          top: coords.top - rect.top + editorElement.scrollTop,
          left: coords.left - rect.left,
          height: coords.bottom - coords.top,
          // Absolute ProseMirror doc position, used by receivers as a last-resort
          // anchor to resolve the caret via coordsAtPos when ids/indexes drift.
          pos: selection.from,
        };

        // Send the block identity (+ a small offset within the block) so the
        // receiving editor can resolve the caret position against its OWN DOM.
        // This keeps the remote caret on the same block the lock indicator uses.
        const cursorBlockId = getBlockIdAtSelection();
        if (cursorBlockId) {
          const blockEl = editorElement.querySelector<HTMLElement>(`[data-block-id="${cursorBlockId}"]`);
          let relTop = 0;
          let relLeft = 0;
          if (blockEl) {
            const blockRect = blockEl.getBoundingClientRect();
            relTop = coords.top - blockRect.top;
            relLeft = coords.left - blockRect.left;
          }
          let blockIndex = getBlockIndexAtSelection();
          cursorPayload.blockId = cursorBlockId;
          cursorPayload.blockIndex = blockIndex;
          cursorPayload.relTop = relTop;
          cursorPayload.relLeft = relLeft;
        }

        socketRef.current.emit('document:cursor-update', {
          documentId: doc.id,
          cursor: cursorPayload,
        });
      } catch {
        // coordsAtPos might fail
      }
    },
  });

  // Keep a ref pointing at the live editor so stable socket handlers always
  // operate on the current instance (the remote-merge helpers read this ref).
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Pending fetch html when editor not yet ready (mount race). Applied once editor mounts.
  const pendingFetchHtmlRef = useRef<string | null>(null);

  // Fetch the full document (with blocks + collaborators) on mount — DB is source of truth.
  useEffect(() => {
    let cancelled = false;
    setDocLoading(true);
    // Reset per-document state: new doc means stale remote flag must not suppress its DB load.
    appliedRemoteRef.current = false;
    pendingFetchHtmlRef.current = null;
    documentService.getDocumentById(doc.id).then((fullDoc) => {
      if (cancelled || !fullDoc) return;
      setLocalDoc(fullDoc);
      setTitle(fullDoc.title);
      const myId = userRef.current?.id;
      if (myId) {
        const role =
          fullDoc.ownerId === myId
            ? 'OWNER'
            : (fullDoc.collaborators.find(c => c.id === myId)?.role || null);
        if (role) setDocRole(role);
      }
      const html = blocksToHtml(fullDoc.blocks);
      // Always prefer DB content on initial open; only suppress if we already have
      // fresher live content via socket (appliedRemoteRef) AND fetch html equals default placeholder.
      // Never overwrite live edits with stale DB, but never keep default placeholder when DB has real content.
      const isDefaultHtml = html === '<h1>Untitled Document</h1><p>Start writing here...</p>';
      const shouldApply = !appliedRemoteRef.current || !isDefaultHtml;
      if (editor && shouldApply) {
        // A remote socket update may already have applied while this REST call
        // was in flight — only suppress if remote is fresher than DB.
        if (!appliedRemoteRef.current || html !== lastSentHtmlRef.current) {
          isRemoteUpdate.current = true;
          editor.commands.setContent(html, { emitUpdate: false });
          isRemoteUpdate.current = false;
          lastSentHtmlRef.current = html;
        }
      } else if (!editor && shouldApply) {
        pendingFetchHtmlRef.current = html;
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setDocLoading(false);
    });
    return () => { cancelled = true; };
  }, [doc.id, editor]);

  // If fetch completed before editor was ready, apply pending html once editor mounts
  useEffect(() => {
    if (editor && pendingFetchHtmlRef.current && !appliedRemoteRef.current) {
      const html = pendingFetchHtmlRef.current;
      pendingFetchHtmlRef.current = null;
      isRemoteUpdate.current = true;
      editor.commands.setContent(html, { emitUpdate: false });
      isRemoteUpdate.current = false;
      lastSentHtmlRef.current = html;
      setDocLoading(false);
    }
  }, [editor]);

  // Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('collabspace_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('document:join', { documentId: doc.id }, (res: any) => {
        if (res?.ok) {
          setOnlineUsers(res.presence || []);
          setDocRole(res.role || null);
          const initialLocks: Record<string, LockInfo> = {};
          for (const [blockId, lock] of Object.entries(res.locks || {})) {
            const l = lock as any;
            if (l.userId === userRef.current?.id) continue;
            initialLocks[blockId] = {
              userId: l.userId,
              name: l.userName || l.name || 'Someone',
              color: l.color,
              blockIndex: typeof l.blockIndex === 'number' ? l.blockIndex : undefined,
            };
          }
          setLocks(initialLocks);
        }
      });
    });

    socket.on('document:presence', (presence: PresenceUser[]) => {
      setOnlineUsers(presence);
    });

    socket.on('document:content-updated', (data: { userId: string; html: string }) => {
      if (typeof data.html !== 'string') return;
      // Allow same-user multi-tab sync: server already excludes sender socket via socket.to(),
      // so we must NOT filter by userId here. Otherwise second tab of same account never receives.
      scheduleRemoteApply(data.html);
    });

    socket.on('document:title-updated', (data: { userId: string; title: string }) => {
      if (data.userId !== user?.id) {
        setTitle(data.title);
        setLocalDoc(prev => ({ ...prev, title: data.title }));
      }
    });

    socket.on('block:locked', (data: { blockId: string; lock: any }) => {
      const l = data.lock;
      // Never render our own lock — a user must not see their own remote cursor
      // or a fake "X is typing" indicator caused by their own editing.
      if (l.userId === userRef.current?.id) return;
      setLocks(prev => ({
        ...prev,
        [data.blockId]: {
          userId: l.userId,
          name: l.userName || l.name || 'Someone',
          color: l.color,
          blockIndex: typeof l.blockIndex === 'number' ? l.blockIndex : undefined,
        },
      }));
    });

    socket.on('block:unlocked', (data: { blockId: string }) => {
      setLocks(prev => {
        const next = { ...prev };
        delete next[data.blockId];
        return next;
      });
    });

    // A collaborator's role changed (owner updated it in the Share modal).
    // Update our local role + collaborator list so editing toggles immediately,
    // with no refresh needed. Persisted permission is already enforced by the
    // backend — this just keeps the UI in sync in real time.
    socket.on('document:role-updated', (data: { documentId: string; userId: string; role: string }) => {
      if (data.documentId !== doc.id || data.userId !== userRef.current?.id) return;
      const newRole = data.role;
      setDocRole(newRole);
      setLocalDoc(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c =>
          c.id === data.userId ? { ...c, role: newRole as Collaborator['role'] } : c
        ),
      }));
    });

    // The owner removed this user from the document — show the revoked screen.
    socket.on('document:access-revoked', (data: { documentId: string; userId: string }) => {
      if (data.documentId !== doc.id || data.userId !== userRef.current?.id) return;
      setAccessRevoked(true);
    });

    socket.on('disconnect', () => {
      setOnlineUsers([]);
    });

    return () => {
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
      remoteTimerRef.current = null;
      pendingRemoteRef.current = null;
      if (myLockBlockRef.current) {
        socket.emit('block:unlock', { documentId: doc.id, blockId: myLockBlockRef.current });
        myLockBlockRef.current = null;
      }
      if (lockReleaseTimerRef.current) clearTimeout(lockReleaseTimerRef.current);
      socket.emit('document:leave', { documentId: doc.id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [doc.id, user?.id]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('unsaved');

    socketRef.current?.emit('document:title-update', {
      documentId: doc.id,
      title: newTitle,
    });

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      setLocalDoc(prev => ({ ...prev, title: newTitle }));
      setSaveStatus('saving');
      try {
        await documentService.renameDocument(doc.id, newTitle);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }, 1500);
  };

  const handleUpdateAccess = async (isPublic: boolean) => {
    try {
      await documentService.updateAccess(doc.id, isPublic);
      setLocalDoc(prev => ({ ...prev, isPublic }));
    } catch (err: any) {
      setError(err?.message || 'Failed to update access');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleInvite = async (email: string, role: Collaborator['role']) => {
    try {
      const result = await documentService.addCollaborator(doc.id, email, role);
      if (result) {
        setLocalDoc(prev => ({
          ...prev,
          collaborators: [...prev.collaborators, {
            id: result.id,
            name: result.name,
            email: result.email,
            avatarUrl: result.avatarUrl || undefined,
            role: result.role,
            isOnline: false,
            color: '#3B82F6',
          }],
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to invite collaborator');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleUpdateRole = async (id: string, role: Collaborator['role']) => {
    try {
      await documentService.updateCollaboratorRole(doc.id, id, role);
      setLocalDoc(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c => c.id === id ? { ...c, role } : c),
      }));
    } catch (err: any) {
      setError(err?.message || 'Failed to update role');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    try {
      await documentService.removeCollaborator(doc.id, id);
      setLocalDoc(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.id !== id),
      }));
    } catch (err: any) {
      setError(err?.message || 'Failed to remove collaborator');
      setTimeout(() => setError(null), 4000);
    }
  };

  // Guard: if the owner removed this user while the doc is open, stop rendering
  // an editable surface. The backend has already kicked the socket out of the
  // room and rejects every subsequent request — this is purely the UI reacting.
  if (accessRevoked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="text-center max-w-sm bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-2xl">
          <Lock className="w-8 h-8 text-[#DC2626] mx-auto mb-3" />
          <h2 className="font-serif-editorial text-xl font-bold text-[#1C1917] mb-1">Access Revoked</h2>
          <p className="text-sm text-[#57534E] mb-6">You no longer have access to this document.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] rounded-xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#FAF8F5] overflow-hidden">
      <header className="bg-[#FFFFFF] border-b border-[#E7E5E4] px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={onBack} className="p-2 rounded-lg text-[#57534E] hover:bg-[#F4F0EA] hover:text-[#1C1917] transition-colors shrink-0" title="Back to Dashboard">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1 max-w-md">
            <input type="text" value={title} onChange={handleTitleChange} className="w-full bg-transparent text-sm font-semibold text-[#1C1917] focus:outline-none border-b border-transparent hover:border-[#E7E5E4] focus:border-[#D97706] transition-colors pb-0.5 truncate" placeholder="Document title" readOnly={isReadOnly} />
          </div>
          <div className="shrink-0">
            {saveStatus === 'saved' && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
            {saveStatus === 'saving' && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D97706]"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</span>}
            {saveStatus === 'unsaved' && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#78716C]"><Cloud className="w-3.5 h-3.5" /> Unsaved</span>}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4">
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-2 items-center">
              {onlineUsers.slice(0, 4).map(u => (
                <div key={u.userId} className="w-7 h-7 rounded-full border-2 border-white text-[10px] font-bold flex items-center justify-center text-white shadow-xs" style={{ backgroundColor: u.color }} title={`${u.name} (online)`}>
                  {u.name[0]}
                </div>
              ))}
              {onlineUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E7E5E4] text-[10px] font-bold flex items-center justify-center text-[#57534E]">+{onlineUsers.length - 4}</div>
              )}
            </div>
          )}
          <span className="text-[11px] text-[#10B981] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            {onlineUsers.length} online
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setActivePanel(activePanel === 'history' ? 'none' : 'history')} className={`p-2 rounded-lg transition-colors ${activePanel === 'history' ? 'bg-[#1C1917] text-[#FAF8F5]' : 'text-[#57534E] hover:bg-[#F4F0EA] hover:text-[#1C1917]'}`} title="Version History">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => setActivePanel(activePanel === 'chat' ? 'none' : 'chat')} className={`p-2 rounded-lg transition-colors ${activePanel === 'chat' ? 'bg-[#1C1917] text-[#FAF8F5]' : 'text-[#57534E] hover:bg-[#F4F0EA] hover:text-[#1C1917]'}`} title="Toggle Chat">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => setShareOpen(true)} className="hidden sm:inline-flex items-center gap-1.5 bg-[#F4F0EA] hover:bg-[#E7E5E4] text-[#1C1917] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E7E5E4] transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={() => setExportOpen(true)} className="hidden sm:inline-flex items-center gap-1.5 bg-[#F4F0EA] hover:bg-[#E7E5E4] text-[#1C1917] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E7E5E4] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <EditorToolbar editor={editor} readOnly={isReadOnly} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-[#FAF8F5] relative flex flex-col">
          {isReadOnly && docRole === 'VIEWER' && (
            <div className="bg-[#EFF6FF] border-b border-[#3B82F6]/30 px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-[#1D4ED8] shrink-0">
              <Eye className="w-4 h-4 text-[#3B82F6]" /> Read-Only Mode — You have view-only permissions.
            </div>
          )}
          {selectedVersionId !== 'v_curr' && (
            <div className="bg-[#FEF3C7] border-b border-[#F59E0B] px-4 py-2.5 flex items-center justify-center gap-3 shrink-0">
              <span className="text-sm text-[#92400E] font-medium">Previewing an older version of this document</span>
              <button onClick={() => setSelectedVersionId('v_curr')} className="text-xs font-bold text-[#92400E] hover:text-[#78350F] underline underline-offset-2">Back to current</button>
            </div>
          )}
          {docLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
                <span className="text-xs text-[#78716C] font-medium">Loading document...</span>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto my-8 bg-[#FFFFFF] rounded-2xl border border-[#E7E5E4] shadow-paper relative w-full flex-1">
              <EditorContent editor={editor} />
              {lockedNotice && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#1C1917] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xl animate-in fade-in duration-200">
                  <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: lockedNotice.color }} />
                  This section is locked by {lockedNotice.name} — start editing in the next section.
                </div>
              )}
              {selectedVersionId === 'v_curr' && (
                <>
                  <LockOverlay editor={editor} locks={locks} currentUserId={user?.id || ''} />
                  <CollaborationOverlay editor={editor} docId={localDoc.id} socket={socketRef.current} currentUserId={user?.id || ''} />
                </>
              )}
            </div>
          )}
        </div>

        {activePanel === 'chat' && (
          <DocumentChat
            docId={doc.id}
            socket={socketRef.current}
            onClose={() => setActivePanel('none')}
          />
        )}
        {activePanel === 'history' && (
          <VersionHistory
            docId={doc.id}
            editor={editor}
            onClose={() => setActivePanel('none')}
            selectedVersionId={selectedVersionId}
            onSelectVersion={setSelectedVersionId}
            onRestore={async (versionId) => {
              try {
                const version = await documentService.getVersion(doc.id, versionId);
                if (version && editor) {
const html = blocksToHtml(Array.isArray(version.content) ? version.content : []);
                isRemoteUpdate.current = true;
                editor.commands.setContent(html, { emitUpdate: false });
                isRemoteUpdate.current = false;
                lastSentHtmlRef.current = html;
                socketRef.current?.emit('document:content-update', {
                  documentId: doc.id,
                  html,
                });
                  await documentService.saveContent(doc.id, htmlToBlocks(html));
                  setSaveStatus('saved');
                }
              } catch {}
              setSelectedVersionId('v_curr');
              setActivePanel('none');
            }}
          />
        )}
      </div>

      <ShareModal
        isOpen={shareOpen}
        document={localDoc}
        currentUserId={user?.id || ''}
        isOwner={isOwner}
        onClose={() => setShareOpen(false)}
        onUpdateAccess={handleUpdateAccess}
        onInvite={handleInvite}
        onUpdateRole={handleUpdateRole}
        onRemove={handleRemoveCollaborator}
      />
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        document={localDoc}
        editor={editor}
      />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#FEF2F2] text-[#DC2626] p-4 rounded-xl shadow-2xl border border-[#FECACA] flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <p className="flex-1 text-xs font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-[#DC2626]/60 hover:text-[#DC2626]">
            <span className="text-sm font-bold">×</span>
          </button>
        </div>
      )}
    </div>
  );
};
