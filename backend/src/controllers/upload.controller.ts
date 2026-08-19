import type { Request, Response } from 'express';
import { uploadService } from '../services/upload.service.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const uploadController = {
  async avatar(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    if (!req.file) throw new ApiError(400, 'No file provided');

    const result = await uploadService.uploadAvatar(authReq.user.id, req.file);
    res.json(result);
  },

  async document(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    if (!req.file) throw new ApiError(400, 'No file provided');

    const result = await uploadService.uploadDocumentFile(authReq.user.id, req.file);
    res.status(201).json(result);
  },
};
