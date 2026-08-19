import type { Workspace, WorkspaceMember } from '../types/workspace';
import { apiClient } from '../api/client';

function transformWorkspace(ws: any): Workspace {
  return {
    id: ws.id || ws._id,
    name: ws.name,
    description: ws.description || '',
    ownerId: ws.ownerId || ws.owner?._id || ws.owner || '',
    membersCount: ws.membersCount ?? ws.memberCount ?? ws.members?.length ?? 0,
    documentsCount: ws.documentsCount ?? ws.documentCount ?? 0,
    createdAt: ws.createdAt,
  };
}

function transformMember(m: any): WorkspaceMember {
  return {
    id: m.id || m._id,
    name: m.name,
    email: m.email,
    avatarUrl: m.avatarUrl || undefined,
    role: m.role,
    joinedAt: m.joinedAt || m.addedAt || m.createdAt || '',
  };
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const data = await apiClient.get<any[]>('/workspaces');
    return data.map(transformWorkspace);
  },
  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const data = await apiClient.get<any>(`/workspaces/${id}`);
    return transformWorkspace(data);
  },
  async createWorkspace(name: string, description: string): Promise<Workspace> {
    const data = await apiClient.post<any>('/workspaces', { name, description });
    return transformWorkspace(data);
  },
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const data = await apiClient.get<any[]>(`/workspaces/${workspaceId}/members`);
    return data.map(transformMember);
  },
  async inviteMember(workspaceId: string, email: string, role: WorkspaceMember['role'] = 'VIEWER'): Promise<WorkspaceMember> {
    const data = await apiClient.post<any>(`/workspaces/${workspaceId}/invitations`, { email, role });
    return { id: data.id || data._id || '', name: email.split('@')[0], email, role, joinedAt: new Date().toISOString() };
  },
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },
  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}`);
  },
};