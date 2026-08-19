import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAvatar, uploadDocument } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate as any);

router.post('/avatar', uploadAvatar as any, asyncHandler(uploadController.avatar));
router.post('/document', uploadDocument as any, asyncHandler(uploadController.document));

export default router;
