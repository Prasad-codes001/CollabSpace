import type { Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service.js';
import { createWorkspaceSchema, createInvitationSchema } from '../validators/workspace.validator.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const workspaceController = {
  async create(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = createWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0].message);
    }

    const workspace = await workspaceService.create(
      authReq.user.id,
      parsed.data.name,
      parsed.data.description
    );
    res.status(201).json(workspace);
  },

  async list(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const workspaces = await workspaceService.listByUser(authReq.user.id);
    res.json(workspaces);
  },

  async getById(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const workspace = await workspaceService.getById(req.params.id as string, authReq.user.id);
    res.json(workspace);
  },

  async getMembers(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const members = await workspaceService.getMembers(req.params.id as string, authReq.user.id);
    res.json(members);
  },

  async removeMember(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await workspaceService.removeMember(
      req.params.id as string,
      req.params.userId as string,
      authReq.user.id
    );
    res.json(result);
  },

  async createInvitation(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = createInvitationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0].message);
    }

    const invitation = await workspaceService.createInvitation(
      req.params.id as string,
      authReq.user.id,
      parsed.data.email,
      parsed.data.role
    );
    res.status(201).json(invitation);
  },

  async delete(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await workspaceService.delete(req.params.id as string, authReq.user.id);
    res.json(result);
  },
};
