import type { Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const invitationController = {
  async list(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const user = await User.findById(authReq.user.id);
    if (!user) throw new ApiError(404, 'User not found');

    const invitations = await workspaceService.listInvitationsForUser(user.email);
    res.json(invitations);
  },

  async accept(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const user = await User.findById(authReq.user.id);
    if (!user) throw new ApiError(404, 'User not found');

    const result = await workspaceService.acceptInvitation(
      req.params.id as string,
      authReq.user.id,
      user.email
    );
    res.json(result);
  },

  async reject(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const user = await User.findById(authReq.user.id);
    if (!user) throw new ApiError(404, 'User not found');

    const result = await workspaceService.rejectInvitation(req.params.id as string, user.email);
    res.json(result);
  },
};
