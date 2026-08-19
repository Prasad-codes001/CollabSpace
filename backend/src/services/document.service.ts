import mongoose from 'mongoose';
import { Document, type IDocumentBlock } from '../models/Document.js';
import { DocumentVersion } from '../models/DocumentVersion.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Activity } from '../models/Activity.js';
import { OrgSettings } from '../models/OrgSettings.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyRoleChanged, revokeCollaboratorAccess } from '../socket/index.js';

async function logActivity(
  type: 'EDIT' | 'PERMISSION_CHANGE' | 'CREATE' | 'DELETE' | 'WORKSPACE' | 'EXPORT',
  actorId: string,
  actorName: string,
  targetId: string,
  targetTitle: string,
  targetType: 'document' | 'workspace',
  details: string
) {
  await Activity.create({ type, actorId, actorName, targetId, targetTitle, targetType, details });
}

function getOwnerId(doc: any): string {
  return doc.owner?._id?.toString() || doc.owner.toString();
}

function getUserRole(doc: any, userId: string): 'OWNER' | 'EDITOR' | 'VIEWER' | null {
  if (getOwnerId(doc) === userId) return 'OWNER';
  const collab = doc.collaborators.find(
    (c: any) => (c.user?._id?.toString() || c.user.toString()) === userId
  );
  return collab ? collab.role : null;
}

async function checkPublicAccess(doc: any, userId: string): Promise<void> {
  if (doc.isPublic) {
    const orgSettings = await OrgSettings.findOne();
    if (orgSettings && !orgSettings.allowPublicLinks) {
      const role = getUserRole(doc, userId);
      if (!role) throw new ApiError(403, 'Public links are disabled');
    }
    return;
  }
  const role = getUserRole(doc, userId);
  if (!role) throw new ApiError(403, 'Access denied');
}

export const documentService = {
  async create(userId: string, title: string, type: string, workspaceId?: string) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    if (workspaceId) {
      const ws = await Workspace.findById(workspaceId);
      if (!ws) throw new ApiError(404, 'Workspace not found');
      const isMember = ws.members.some((m) => m.user.toString() === userId);
      if (!isMember) throw new ApiError(403, 'Not a workspace member');
    }

    // Canonical content shape: a single "blk_main" block wrapping the TipTap HTML,
    // matching what the Socket.IO debounced save and the REST save both persist.
    const defaultContent: IDocumentBlock[] = [
      { id: 'blk_main', type: 'paragraph', content: `<h1>${title}</h1><p></p>` },
    ];

    const doc = await Document.create({
      title,
      type,
      owner: userId,
      workspaceId: workspaceId || undefined,
      content: defaultContent,
      collaborators: [{ user: userId, role: 'OWNER' }],
    });

    await logActivity('CREATE', userId, user.name, doc._id.toString(), title, 'document', `Created document "${title}"`);

    await doc.populate('collaborators.user', 'name email avatarUrl');
    return formatDocumentItem(doc, user, userId);
  },

  async getDocuments(userId: string, filter: string, workspaceId?: string) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    // Strict per-user isolation: a user only ever sees documents they own.
    // Collaborator/shared docs are excluded from the owner's other lists and
    // only surface under the explicit "shared" filter. This applies to every
    // filter bucket, including workspaces.
    const accessible: any = { owner: userId };

    let query: any = {};

    switch (filter) {
      case 'trash':
        query = {
          isTrashed: true,
          ...accessible,
        };
        break;
      case 'starred':
        query = {
          isTrashed: false,
          starredBy: userId,
          ...accessible,
        };
        break;
      case 'shared':
        query = {
          isTrashed: false,
          'collaborators.user': userId,
          owner: { $ne: userId },
        };
        break;
      case 'workspace':
        if (!workspaceId) throw new ApiError(400, 'workspaceId required');
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) throw new ApiError(400, 'Invalid workspace ID');
        {
          const isMember = await Workspace.exists({ _id: workspaceId, 'members.user': userId });
          if (!isMember) throw new ApiError(403, 'You are not a member of this workspace');
          query = {
            isTrashed: false,
            workspaceId,
            ...accessible,
          };
        }
        break;
      default:
        query = {
          isTrashed: false,
          ...accessible,
        };
    }

    const docs = await Document.find(query)
      .populate('owner', 'name email avatarUrl')
      .sort({ updatedAt: -1 });

    return docs.map((doc) => formatDocumentDTO(doc, userId));
  },

  async getById(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId)
      .populate('owner', 'name email avatarUrl')
      .populate('collaborators.user', 'name email avatarUrl');

    if (!doc) throw new ApiError(404, 'Document not found');

    await checkPublicAccess(doc, userId);

    return formatDocumentItem(doc, doc.owner as any, userId);
  },

  async update(docId: string, userId: string, data: { title?: string; content?: IDocumentBlock[] }) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    const role = getUserRole(doc, userId);
    if (!role || role === 'VIEWER') throw new ApiError(403, 'Edit access required');

    if (data.title !== undefined) doc.title = data.title;
    if (data.content !== undefined) doc.content = data.content;
    await doc.save();

    const user = await User.findById(userId);
    await logActivity('EDIT', userId, user?.name || '', doc._id.toString(), doc.title, 'document', `Updated document "${doc.title}"`);

    await doc.populate('owner', 'name email avatarUrl');
    await doc.populate('collaborators.user', 'name email avatarUrl');
    return formatDocumentItem(doc, doc.owner as any, userId);
  },

  async trash(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can delete');

    doc.isTrashed = true;
    doc.trashedAt = new Date();
    await doc.save();

    const user = await User.findById(userId);
    await logActivity('DELETE', userId, user?.name || '', doc._id.toString(), doc.title, 'document', `Moved "${doc.title}" to trash`);

    return { message: 'Document moved to trash' };
  },

  async restore(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can restore');
    if (!doc.isTrashed) throw new ApiError(400, 'Document is not trashed');

    doc.isTrashed = false;
    doc.trashedAt = undefined;
    await doc.save();

    const user = await User.findById(userId);
    await logActivity('CREATE', userId, user?.name || '', doc._id.toString(), doc.title, 'document', `Restored "${doc.title}" from trash`);

    return { message: 'Document restored' };
  },

  async deletePermanent(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can delete');

    if (doc.isTrashed) {
      await DocumentVersion.deleteMany({ document: doc._id });
    }

    await doc.deleteOne();

    const user = await User.findById(userId);
    await logActivity('DELETE', userId, user?.name || '', docId, doc.title, 'document', `Permanently deleted "${doc.title}"`);

    return { message: 'Document deleted permanently' };
  },

  // Join a document via an invite/link. Adds the authenticated user as a
  // VIEWER collaborator if they are not already owner/collaborator. Reuses the
  // existing collaborators array — no separate invitation architecture.
  async joinByLink(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() === userId) return { role: 'OWNER' };

    const existing = doc.collaborators.find((c) => c.user.toString() === userId);
    if (existing) return { role: existing.role };

    doc.collaborators.push({ user: new mongoose.Types.ObjectId(userId), role: 'VIEWER', addedAt: new Date() });
    await doc.save();

    return { role: 'VIEWER' };
  },

  async toggleStar(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    const role = getUserRole(doc, userId);
    if (!role && !doc.isPublic) throw new ApiError(403, 'Access denied');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const isStarred = doc.starredBy.some((id) => id.toString() === userId);

    if (isStarred) {
      doc.starredBy = doc.starredBy.filter((id) => id.toString() !== userId);
    } else {
      doc.starredBy.push(userObjId);
    }
    await doc.save();

    return { isStarred: !isStarred };
  },

  // --- Phase 5: Collaborator management ---

  async addCollaborator(docId: string, userId: string, email: string, role: 'EDITOR' | 'VIEWER') {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can manage collaborators');

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) throw new ApiError(404, 'User not found');

    if (targetUser._id.toString() === userId) throw new ApiError(400, 'Cannot add yourself');

    const existing = doc.collaborators.find((c) => c.user.toString() === targetUser._id.toString());
    if (existing) throw new ApiError(409, 'User is already a collaborator');

    doc.collaborators.push({ user: targetUser._id, role, addedAt: new Date() });
    await doc.save();

    const actor = await User.findById(userId);
    await logActivity('PERMISSION_CHANGE', userId, actor?.name || '', doc._id.toString(), doc.title, 'document', `Added ${targetUser.name} as ${role}`);

    return {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl || null,
      role,
    };
  },

  async updateCollaboratorRole(docId: string, userId: string, targetUserId: string, role: 'EDITOR' | 'VIEWER') {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can manage collaborators');

    if (targetUserId === userId) throw new ApiError(400, 'Cannot change your own role');

    const collab = doc.collaborators.find((c) => c.user.toString() === targetUserId);
    if (!collab) throw new ApiError(404, 'Collaborator not found');
    if (collab.role === 'OWNER') throw new ApiError(400, 'Cannot change owner role');

    collab.role = role;
    await doc.save();

    const actor = await User.findById(userId);
    const target = await User.findById(targetUserId);
    await logActivity('PERMISSION_CHANGE', userId, actor?.name || '', doc._id.toString(), doc.title, 'document', `Changed ${target?.name} role to ${role}`);

    // Push the new role to the invited user's open clients in real time so their
    // editor toggles between editable / read-only without a refresh. Socket.IO
    // actions already re-read the role from the DB on every event, so this also
    // takes effect immediately for any live edit requests.
    notifyRoleChanged(doc._id.toString(), targetUserId, role);

    return { message: 'Role updated' };
  },

  async removeCollaborator(docId: string, userId: string, targetUserId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can manage collaborators');

    if (targetUserId === doc.owner.toString()) throw new ApiError(400, 'Cannot remove the owner');

    const idx = doc.collaborators.findIndex((c) => c.user.toString() === targetUserId);
    if (idx === -1) throw new ApiError(404, 'Collaborator not found');

    doc.collaborators.splice(idx, 1);
    await doc.save();

    const actor = await User.findById(userId);
    const target = await User.findById(targetUserId);
    await logActivity('PERMISSION_CHANGE', userId, actor?.name || '', doc._id.toString(), doc.title, 'document', `Removed ${target?.name} from collaborators`);

    // Kick the removed user's connected sockets out of the document room and tell
    // their client that access was revoked. All further REST/socket requests are
    // rejected by the backend regardless.
    await revokeCollaboratorAccess(doc._id.toString(), targetUserId);

    return { message: 'Collaborator removed' };
  },

  async updateAccess(docId: string, userId: string, isPublic: boolean) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.owner.toString() !== userId) throw new ApiError(403, 'Only the owner can change access');

    doc.isPublic = isPublic;
    await doc.save();

    const actor = await User.findById(userId);
    await logActivity('PERMISSION_CHANGE', userId, actor?.name || '', doc._id.toString(), doc.title, 'document', `Set document to ${isPublic ? 'public' : 'private'}`);

    return { isPublic };
  },

  // --- Phase 5: Version history ---

  async createVersion(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    const role = getUserRole(doc, userId);
    if (!role || role === 'VIEWER') throw new ApiError(403, 'Edit access required');

    // Avoid duplicate: check if the latest version has the same content
    const latest = await DocumentVersion.findOne({ document: docId }).sort({ createdAt: -1 });
    if (latest && JSON.stringify(latest.content) === JSON.stringify(doc.content) && latest.title === doc.title) {
      return { message: 'No changes since last version', version: latest };
    }

    const version = await DocumentVersion.create({
      document: docId,
      title: doc.title,
      content: doc.content,
      editedBy: userId,
    });

    return { message: 'Version created', version };
  },

  async listVersions(docId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    await checkPublicAccess(doc, userId);

    const versions = await DocumentVersion.find({ document: docId })
      .populate('editedBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    return versions;
  },

  async getVersion(docId: string, versionId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(docId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      throw new ApiError(400, 'Invalid ID');
    }

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    await checkPublicAccess(doc, userId);

    const version = await DocumentVersion.findOne({ _id: versionId, document: docId })
      .populate('editedBy', 'name email avatarUrl');
    if (!version) throw new ApiError(404, 'Version not found');

    return version;
  },

  // --- Phase 5: Export ---

  async exportDocument(docId: string, userId: string, format: string) {
    if (!mongoose.Types.ObjectId.isValid(docId)) throw new ApiError(400, 'Invalid document ID');

    const doc = await Document.findById(docId);
    if (!doc) throw new ApiError(404, 'Document not found');

    await checkPublicAccess(doc, userId);

    const user = await User.findById(userId);
    await logActivity('EXPORT', userId, user?.name || '', doc._id.toString(), doc.title, 'document', `Exported "${doc.title}" as ${format}`);

    const html = blocksToHtml(doc.title, doc.content);

    switch (format) {
      case 'html':
        return { contentType: 'text/html', content: html };
      case 'markdown':
        return { contentType: 'text/markdown', content: blocksToMarkdown(doc.title, doc.content) };
      case 'pdf':
        return { contentType: 'text/html', content: html, isPdf: true };
      default:
        throw new ApiError(400, 'Unsupported format. Use: html, markdown, pdf');
    }
  },
};

// --- Helpers ---

function formatDocumentDTO(doc: any, userId: string) {
  const owner = doc.owner;
  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    ownerId: owner?._id?.toString() || doc.owner.toString(),
    ownerName: owner?.name || '',
    workspaceId: doc.workspaceId?.toString() || null,
    isStarred: doc.starredBy.some((id: any) => id.toString() === userId),
    isPublic: doc.isPublic,
    isTrashed: doc.isTrashed,
    collaboratorCount: doc.collaborators.length,
    myRole: getUserRole(doc, userId),
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

function formatDocumentItem(doc: any, owner: any, userId: string) {
  const collaborators = doc.collaborators.map((c: any) => {
    const u = c.user;
    return {
      id: u?._id?.toString() || c.user.toString(),
      name: u?.name || '',
      email: u?.email || '',
      avatarUrl: u?.avatarUrl || null,
      role: c.role,
      isOnline: false,
      color: null,
    };
  });

  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    workspaceId: doc.workspaceId?.toString() || null,
    ownerId: owner?._id?.toString() || doc.owner.toString(),
    ownerName: owner?.name || '',
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    isStarred: doc.starredBy.some((id: any) => id.toString() === userId),
    isPublic: doc.isPublic,
    isTrashed: doc.isTrashed,
    collaborators,
    blocks: doc.content,
    fileUrl: doc.fileUrl || null,
    myRole: getUserRole(doc, userId),
  };
}

function blocksToHtml(title: string, blocks: IDocumentBlock[]): string {
  let body = '';
  for (const block of blocks) {
    if (block.id === 'blk_main') {
      // blk_main stores the raw TipTap HTML — emit it directly instead of wrapping it.
      body += `${block.content}\n`;
      continue;
    }
    switch (block.type) {
      case 'heading-1': body += `<h1>${block.content}</h1>\n`; break;
      case 'heading-2': body += `<h2>${block.content}</h2>\n`; break;
      case 'paragraph': body += `<p>${block.content}</p>\n`; break;
      case 'callout': body += `<blockquote>${block.content}</blockquote>\n`; break;
      case 'code': body += `<pre><code>${block.content}</code></pre>\n`; break;
      default: body += `<p>${block.content}</p>\n`;
    }
  }
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem}blockquote{border-left:3px solid #ccc;margin-left:0;padding-left:1rem;color:#555}pre{background:#f5f5f5;padding:1rem;border-radius:4px;overflow-x:auto}</style>
</head><body>${body}</body></html>`;
}

function blocksToMarkdown(title: string, blocks: IDocumentBlock[]): string {
  let md = `# ${title}\n\n`;
  for (const block of blocks) {
    if (block.id === 'blk_main') {
      // blk_main stores raw HTML — do a minimal HTML → Markdown conversion.
      md += block.content
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<code>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
        .replace(/<[^>]+>/g, '')
        .trim() + '\n\n';
      continue;
    }
    switch (block.type) {
      case 'heading-1': md += `# ${block.content}\n\n`; break;
      case 'heading-2': md += `## ${block.content}\n\n`; break;
      case 'paragraph': md += `${block.content}\n\n`; break;
      case 'callout': md += `> ${block.content}\n\n`; break;
      case 'code': md += `\`\`\`\n${block.content}\n\`\`\`\n\n`; break;
      default: md += `${block.content}\n\n`;
    }
  }
  return md;
}
