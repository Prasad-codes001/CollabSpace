import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate as any);
router.use(requireRole('ADMIN') as any);

router.get('/stats', asyncHandler(adminController.getStats));
router.get('/members', asyncHandler(adminController.getMembers));
router.patch('/members/:id/role', asyncHandler(adminController.updateRole));
router.patch('/members/:id/status', asyncHandler(adminController.updateStatus));
router.post('/members', asyncHandler(adminController.inviteMember));
router.get('/security', asyncHandler(adminController.getSecurityConfig));
router.patch('/security', asyncHandler(adminController.updateSecurityConfig));

export default router;
