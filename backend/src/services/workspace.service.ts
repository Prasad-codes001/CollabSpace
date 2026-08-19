import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { Invitation } from '../models/Invitation.js';
import { Document } from '../models/Document.js';
import { ApiError } from '../utils/ApiError.js';

export const workspaceService = {
  async create(userId: string, name: string, description?: string) {
    const workspace = await Workspace.create({
      name,
      description: description || '',
      owner: userId,
      members: [{ user: userId, role: 'OWNER', joinedAt: new Date() }],
    });

    return workspace.populate('members.user', 'name email avatarUrl');
  },

  async listByUser(userId: string) {
    const workspaces = await Workspace.find({
      'members.user': userId,
    })
      .populate('owner', 'name email avatarUrl')
      .sort({ updatedAt: -1 });

    const result = await Promise.all(
      workspaces.map(async (ws) => {
        const docCount = await Document.countDocuments({ workspaceId: ws._id, isTrashed: false });
        return {
          id: ws._id.toString(),
          name: ws.name,
          description: ws.description,
          ownerId: ws.owner._id.toString(),
          membersCount: ws.members.length,
          documentsCount: docCount,
          createdAt: ws.createdAt.toISOString(),
        };
      })
    );
    return result;
  },

  async getById(workspaceId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(400, 'Invalid workspace ID');
    }

    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl');

    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    // Check the requesting user is a member
    const isMember = workspace.members.some(
      (m) => m.user._id.toString() === userId
    );
    if (!isMember) {
      throw new ApiError(403, 'You are not a member of this workspace');
    }

    return workspace;
  },

  async getMembers(workspaceId: string, userId: string) {
    const workspace = await this.getById(workspaceId, userId);

    return workspace.members.map((m: any) => ({
      id: m.user._id.toString(),
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl || null,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }));
  },

  async removeMember(workspaceId: string, targetUserId: string, requesterId: string) {
    if (!mongoose.Types.ObjectId.isValid(workspaceId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new ApiError(400, 'Invalid ID');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    if (workspace.owner.toString() !== requesterId) {
      throw new ApiError(403, 'Only the workspace owner can remove members');
    }

    if (targetUserId === requesterId) {
      throw new ApiError(400, 'Cannot remove yourself from the workspace');
    }

    const memberIndex = workspace.members.findIndex(
      (m) => m.user.toString() === targetUserId
    );
    if (memberIndex === -1) {
      throw new ApiError(404, 'User is not a member of this workspace');
    }

    workspace.members.splice(memberIndex, 1);
    await workspace.save();

    return { message: 'Member removed' };
  },

  async delete(workspaceId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(400, 'Invalid workspace ID');
    }
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new ApiError(404, 'Workspace not found');
    if (workspace.owner.toString() !== userId) {
      throw new ApiError(403, 'Only the workspace owner can delete this workspace');
    }
    await Workspace.findByIdAndDelete(workspaceId);
    return { message: 'Workspace deleted' };
  },

  async createInvitation(
    workspaceId: string,
    inviterId: string,
    email: string,
    role: 'OWNER' | 'EDITOR' | 'VIEWER'
  ) {
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(400, 'Invalid workspace ID');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    if (workspace.owner.toString() !== inviterId) {
      throw new ApiError(403, 'Only the workspace owner can send invitations');
    }

    // Check if the invited user already exists and is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const alreadyMember = workspace.members.some(
        (m) => m.user.toString() === existingUser._id.toString()
      );
      if (alreadyMember) {
        throw new ApiError(409, 'User is already a member of this workspace');
      }
    }

    // Check for pending invitation to the same email for this workspace
    const pendingInvite = await Invitation.findOne({
      workspace: workspaceId,
      invitedEmail: email.toLowerCase(),
      status: 'PENDING',
    });
    if (pendingInvite) {
      throw new ApiError(409, 'An invitation is already pending for this email');
    }

    const invitation = await Invitation.create({
      workspace: workspaceId,
      invitedBy: inviterId,
      invitedEmail: email.toLowerCase(),
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return invitation.populate([
      { path: 'workspace', select: 'name' },
      { path: 'invitedBy', select: 'name email' },
    ]);
  },

  async listInvitationsForUser(userEmail: string) {
    const invitations = await Invitation.find({
      invitedEmail: userEmail.toLowerCase(),
      status: 'PENDING',
    })
      .populate('workspace', 'name description')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    return invitations;
  },

  async acceptInvitation(invitationId: string, userId: string, userEmail: string) {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      throw new ApiError(400, 'Invalid invitation ID');
    }

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      throw new ApiError(404, 'Invitation not found');
    }

    if (invitation.invitedEmail !== userEmail.toLowerCase()) {
      throw new ApiError(403, 'This invitation was not sent to you');
    }

    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, `Invitation already ${invitation.status.toLowerCase()}`);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      throw new ApiError(400, 'Invitation has expired');
    }

    // Add user to workspace
    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) {
      throw new ApiError(404, 'Workspace no longer exists');
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userId
    );
    if (!alreadyMember) {
      workspace.members.push({
        user: new mongoose.Types.ObjectId(userId),
        role: invitation.role,
        joinedAt: new Date(),
      });
      await workspace.save();
    }

    invitation.status = 'ACCEPTED';
    await invitation.save();

    return { message: 'Invitation accepted', workspaceId: workspace._id.toString() };
  },

  async rejectInvitation(invitationId: string, userEmail: string) {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      throw new ApiError(400, 'Invalid invitation ID');
    }

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      throw new ApiError(404, 'Invitation not found');
    }

    if (invitation.invitedEmail !== userEmail.toLowerCase()) {
      throw new ApiError(403, 'This invitation was not sent to you');
    }

    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, `Invitation already ${invitation.status.toLowerCase()}`);
    }

    invitation.status = 'REJECTED';
    await invitation.save();

    return { message: 'Invitation rejected' };
  },
};
