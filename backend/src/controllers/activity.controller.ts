import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { Document } from '../models/Document.js';
import { Workspace } from '../models/Workspace.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const activityController = {
  // Users only see activities for their own actions, or actions on
  // documents/workspaces they can access.
  async list(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const { type, targetId } = req.query;

    const [accessibleDocs, accessibleWorkspaces] = await Promise.all([
      Document.find({
        isTrashed: false,
        $or: [{ owner: userId }, { 'collaborators.user': userId }],
      }).select('_id'),
      Workspace.find({ 'members.user': userId }).select('_id'),
    ]);

    const docIds = accessibleDocs.map((d) => d._id.toString());
    const wsIds = accessibleWorkspaces.map((w) => w._id.toString());

    const query: any = {};

    if (targetId) {
      const target = String(targetId);
      if (
        !docIds.includes(target) &&
        !wsIds.includes(target) &&
        target !== userId
      ) {
        throw new ApiError(403, 'Access denied');
      }
      query.targetId = target;
    } else {
      query.$or = [
        { actorId: new mongoose.Types.ObjectId(userId) },
        { targetType: 'document', targetId: { $in: docIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { targetType: 'workspace', targetId: { $in: wsIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      ];
    }

    if (type && type !== 'ALL') {
      query.type = type;
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const result = activities.map((a) => ({
      id: a._id.toString(),
      type: a.type,
      actorId: a.actorId.toString(),
      actorName: a.actorName,
      targetId: a.targetId.toString(),
      targetTitle: a.targetTitle,
      targetType: a.targetType,
      details: a.details,
      timestamp: a.createdAt.toISOString(),
    }));

    res.json(result);
  },
};
