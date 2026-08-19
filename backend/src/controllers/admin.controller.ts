import type { Request, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import {
  updateRoleSchema,
  updateStatusSchema,
  inviteMemberSchema,
  updateSecuritySchema,
} from '../validators/admin.validator.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const adminController = {
  async getStats(_req: Request, res: Response) {
    const stats = await adminService.getStats();
    res.json(stats);
  },

  async getMembers(_req: Request, res: Response) {
    const members = await adminService.getMembers();
    res.json(members);
  },

  async updateRole(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const result = await adminService.updateRole(
      req.params.id as string,
      parsed.data.role,
      authReq.user.id
    );
    res.json(result);
  },

  async updateStatus(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const result = await adminService.updateStatus(
      req.params.id as string,
      parsed.data.status,
      authReq.user.id
    );
    res.json(result);
  },

  async inviteMember(req: Request, res: Response) {
    const parsed = inviteMemberSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const result = await adminService.inviteMember(
      parsed.data.email,
      parsed.data.name,
      parsed.data.password,
      parsed.data.role
    );
    res.status(201).json(result);
  },

  async getSecurityConfig(_req: Request, res: Response) {
    const config = await adminService.getSecurityConfig();
    res.json(config);
  },

  async updateSecurityConfig(req: Request, res: Response) {
    const parsed = updateSecuritySchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const config = await adminService.updateSecurityConfig(parsed.data);
    res.json(config);
  },
};
