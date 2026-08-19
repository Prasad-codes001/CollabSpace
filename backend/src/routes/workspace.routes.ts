import { Router } from 'express';
import { workspaceController } from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All workspace routes require authentication
router.use(authenticate as any);

router.post('/', asyncHandler(workspaceController.create));
router.get('/', asyncHandler(workspaceController.list));
router.get('/:id', asyncHandler(workspaceController.getById));
router.get('/:id/members', asyncHandler(workspaceController.getMembers));
router.delete('/:id/members/:userId', asyncHandler(workspaceController.removeMember));
router.post('/:id/invitations', asyncHandler(workspaceController.createInvitation));
router.delete('/:id', asyncHandler(workspaceController.delete));

export default router;
