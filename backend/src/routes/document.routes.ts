import { Router } from 'express';
import { documentController } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All document routes require authentication
router.use(authenticate as any);

// CRUD
router.post('/', asyncHandler(documentController.create));
router.get('/', asyncHandler(documentController.list));
router.get('/:id', asyncHandler(documentController.getById));
router.patch('/:id', asyncHandler(documentController.update));
router.delete('/:id', asyncHandler(documentController.trash));
router.delete('/:id/permanent', asyncHandler(documentController.deletePermanent));
router.post('/:id/restore', asyncHandler(documentController.restore));
router.post('/:id/star', asyncHandler(documentController.toggleStar));
router.post('/:id/join', asyncHandler(documentController.joinByLink));

// Collaborators
router.post('/:id/collaborators', asyncHandler(documentController.addCollaborator));
router.patch('/:id/collaborators/:userId', asyncHandler(documentController.updateCollaborator));
router.delete('/:id/collaborators/:userId', asyncHandler(documentController.removeCollaborator));

// Access
router.patch('/:id/access', asyncHandler(documentController.updateAccess));

// Versions
router.post('/:id/versions', asyncHandler(documentController.createVersion));
router.get('/:id/versions', asyncHandler(documentController.listVersions));
router.get('/:id/versions/:versionId', asyncHandler(documentController.getVersion));

// Export
router.get('/:id/export/:format', asyncHandler(documentController.exportDoc));

export default router;
