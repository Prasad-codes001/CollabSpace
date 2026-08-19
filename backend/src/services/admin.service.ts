import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Document } from '../models/Document.js';
import { Activity } from '../models/Activity.js';
import { OrgSettings } from '../models/OrgSettings.js';
import { ApiError } from '../utils/ApiError.js';

// Map backend role to frontend-expected role
function mapRole(role: string): string {
  return role === 'USER' ? 'MEMBER' : role;
}

// Generate a temporary password: two random word-groups plus a number.
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 12; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${pw}${Math.floor(10 + Math.random() * 90)}`;
}

export const adminService = {
  async getStats() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalMembers, activeUsers, suspendedUsers, activeWorkspaces, totalDocuments, trashedDocuments, recentActivity] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'ACTIVE' }),
        User.countDocuments({ status: 'SUSPENDED' }),
        Workspace.countDocuments(),
        Document.countDocuments({ isTrashed: false }),
        Document.countDocuments({ isTrashed: true }),
        Activity.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ]);

    return {
      totalMembers,
      activeUsers,
      suspendedUsers,
      activeWorkspaces,
      totalDocuments,
      trashedDocuments,
      recentActivity,
      storageUsedGB: 0,
      storageLimitGB: 10,
    };
  },

  async getMembers() {
    const users = await User.find().sort({ createdAt: -1 });

    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: mapRole(u.role),
      status: u.status,
      joinedAt: u.createdAt.toISOString(),
      lastActive: u.lastActive?.toISOString() || u.createdAt.toISOString(),
      avatarUrl: u.avatarUrl || null,
    }));
  },

  async updateRole(memberId: string, role: 'ADMIN' | 'MEMBER', currentAdminId: string) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) throw new ApiError(400, 'Invalid member ID');
    if (memberId === currentAdminId) throw new ApiError(400, 'Cannot change your own role');

    const dbRole = role === 'MEMBER' ? 'USER' : role;
    const user = await User.findById(memberId);
    if (!user) throw new ApiError(404, 'User not found');

    // Prevent removing the last admin
    if (user.role === 'ADMIN' && dbRole === 'USER') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) throw new ApiError(400, 'Cannot remove the last admin');
    }

    user.role = dbRole;
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: mapRole(user.role),
      status: user.status,
    };
  },

  async updateStatus(memberId: string, status: 'ACTIVE' | 'SUSPENDED', currentAdminId: string) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) throw new ApiError(400, 'Invalid member ID');
    if (memberId === currentAdminId) throw new ApiError(400, 'Cannot change your own status');

    const user = await User.findById(memberId);
    if (!user) throw new ApiError(404, 'User not found');

    user.status = status;
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: mapRole(user.role),
      status: user.status,
    };
  },

  async inviteMember(email: string, name: string, password: string | undefined, role: 'ADMIN' | 'MEMBER') {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new ApiError(409, 'Email already registered');

    // Generate a strong temporary password when the client doesn't provide one.
    const finalPassword = password || generateTemporaryPassword();

    const dbRole = role === 'MEMBER' ? 'USER' : role;
    const user = await User.create({ name, email, password: finalPassword, role: dbRole });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: mapRole(user.role),
      status: user.status,
      joinedAt: user.createdAt.toISOString(),
      lastActive: user.createdAt.toISOString(),
    };
  },

  async getSecurityConfig() {
    let settings = await OrgSettings.findOne();
    if (!settings) {
      settings = await OrgSettings.create({});
    }
    return {
      requireTwoFactor: settings.requireTwoFactor,
      allowPublicLinks: settings.allowPublicLinks,
      ssoProvider: settings.ssoProvider,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
    };
  },

  async updateSecurityConfig(data: Partial<{
    requireTwoFactor: boolean;
    allowPublicLinks: boolean;
    ssoProvider: 'OKTA' | 'GOOGLE' | 'DISABLED';
    sessionTimeoutMinutes: number;
  }>) {
    let settings = await OrgSettings.findOne();
    if (!settings) {
      settings = await OrgSettings.create({});
    }

    if (data.requireTwoFactor !== undefined) settings.requireTwoFactor = data.requireTwoFactor;
    if (data.allowPublicLinks !== undefined) settings.allowPublicLinks = data.allowPublicLinks;
    if (data.ssoProvider !== undefined) settings.ssoProvider = data.ssoProvider;
    if (data.sessionTimeoutMinutes !== undefined) settings.sessionTimeoutMinutes = data.sessionTimeoutMinutes;

    await settings.save();

    return {
      requireTwoFactor: settings.requireTwoFactor,
      allowPublicLinks: settings.allowPublicLinks,
      ssoProvider: settings.ssoProvider,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
    };
  },
};
