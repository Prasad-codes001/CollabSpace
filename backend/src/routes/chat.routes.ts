import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Document } from '../models/Document.js';
import { OrgSettings } from '../models/OrgSettings.js';
import { ApiError } from '../utils/ApiError.js';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types.js';

const router = Router();

router.use(authenticate as any);

// GET /api/v1/documents/:id/chat — load chat history
router.get('/:id/chat', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const docId = req.params.id as string;

  const doc = await Document.findById(docId);
  if (!doc) throw new ApiError(404, 'Document not found');

  // Check access
  const isOwner = doc.owner.toString() === authReq.user.id;
  const isCollab = doc.collaborators.some((c) => c.user.toString() === authReq.user.id);
  const orgSettings = await OrgSettings.findOne();
  const publicAllowed = doc.isPublic && !!orgSettings?.allowPublicLinks;
  if (!isOwner && !isCollab && !publicAllowed) throw new ApiError(403, 'Access denied');

  const messages = await ChatMessage.find({ documentId: docId })
    .sort({ createdAt: -1 })
    .limit(100);

  const result = messages.reverse().map((m) => ({
    id: m._id.toString(),
    userId: m.userId.toString(),
    userName: m.userName,
    userColor: m.userColor || null,
    content: m.content,
    timestamp: m.createdAt.toISOString(),
  }));

  res.json(result);
}));

export default router;
