import { Router } from 'express';
import { invitationController } from '../controllers/invitation.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All invitation routes require authentication
router.use(authenticate as any);

router.get('/', asyncHandler(invitationController.list));
router.post('/:id/accept', asyncHandler(invitationController.accept));
router.post('/:id/reject', asyncHandler(invitationController.reject));

export default router;
