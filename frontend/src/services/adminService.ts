import type { OrgMember, OrgStats, SecurityConfig, SystemRole, MemberStatus } from '../types/admin';
import { apiClient } from '../api/client';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(isoDate).toLocaleDateString();
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

function transformMember(m: any, i: number): OrgMember {
  return {
    id: m.id || m._id,
    name: m.name,
    email: m.email,
    role: m.role as SystemRole,
    status: m.status as MemberStatus,
    joinedAt: m.joinedAt || m.createdAt || '',
    lastActive: m.lastActive ? timeAgo(m.lastActive) : 'Never',
    avatarColor: COLORS[i % COLORS.length],
  };
}

export const adminService = {
  getStats: async (): Promise<OrgStats> => {
    const data = await apiClient.get<any>('/admin/stats');
    return {
      totalMembers: data.totalMembers,
      activeWorkspaces: data.activeWorkspaces,
      totalDocuments: data.totalDocuments,
      storageUsedGB: data.storageUsedGB ?? 0,
      storageLimitGB: data.storageLimitGB ?? 10,
    };
  },
  getMembers: async (): Promise<OrgMember[]> => {
    const data = await apiClient.get<any[]>('/admin/members');
    return data.map((m, i) => transformMember(m, i));
  },
  getSecurityConfig: async (): Promise<SecurityConfig> => {
    return apiClient.get<SecurityConfig>('/admin/security');
  },
  updateMemberRole: async (memberId: string, role: SystemRole): Promise<void> => {
    await apiClient.patch(`/admin/members/${memberId}/role`, { role });
  },
  updateMemberStatus: async (memberId: string, status: MemberStatus): Promise<void> => {
    await apiClient.patch(`/admin/members/${memberId}/status`, { status });
  },
  inviteMember: async (email: string, role: SystemRole): Promise<OrgMember> => {
    const data = await apiClient.post<any>('/admin/members', {
      email,
      name: email.split('@')[0],
      role,
    });
    return transformMember(data, 0);
  },
  updateSecurityConfig: async (config: Partial<SecurityConfig>): Promise<SecurityConfig> => {
    return apiClient.patch<SecurityConfig>('/admin/security', config);
  }
};