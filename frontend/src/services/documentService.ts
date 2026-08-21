import type { DocumentItem } from '../types/document';
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function assignColor(index: number): string {
  return COLORS[index % COLORS.length];
}

function transformDocItem(doc: any): DocumentItem {
  return {
    id: doc.id,
    title: doc.title,
    workspaceId: doc.workspaceId || '',
    ownerId: doc.ownerId,
    ownerName: doc.ownerName,
    updatedAt: timeAgo(doc.updatedAt),
    createdAt: doc.createdAt,
    isStarred: doc.isStarred ?? false,
    isPublic: doc.isPublic ?? false,
    myRole: doc.myRole || undefined,
    type: doc.type || 'blank',
    collaborators: (doc.collaborators || []).map((c: any, i: number) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      avatarUrl: c.avatarUrl || undefined,
      role: c.role,
      isOnline: c.isOnline ?? false,
      color: c.color || assignColor(i),
    })),
    blocks: doc.blocks || [],
  };
}

function transformDocList(doc: any): DocumentItem {
  return {
    id: doc.id,
    title: doc.title,
    workspaceId: doc.workspaceId || '',
    ownerId: doc.ownerId,
    ownerName: doc.ownerName,
    updatedAt: timeAgo(doc.updatedAt),
    createdAt: doc.createdAt,
    isStarred: doc.isStarred ?? false,
    isPublic: doc.isPublic ?? false,
    myRole: doc.myRole || undefined,
    type: doc.type || 'blank',
    collaborators: [],
    blocks: [],
  };
}

export const documentService = {
  async getDocuments(): Promise<DocumentItem[]> {
    const docs = await apiClient.get<any[]>('/documents?filter=all');
    return docs.map(transformDocList);
  },
  async getTrashedDocuments(): Promise<DocumentItem[]> {
    const docs = await apiClient.get<any[]>('/documents?filter=trash');
    return docs.map(transformDocList);
  },
  async getSharedDocuments(): Promise<DocumentItem[]> {
    const docs = await apiClient.get<any[]>('/documents?filter=shared');
    return docs.map(transformDocList);
  },
  async getWorkspaceDocuments(workspaceId: string): Promise<DocumentItem[]> {
    const docs = await apiClient.get<any[]>(`/documents?filter=workspace&workspaceId=${workspaceId}`);
    return docs.map(transformDocList);
  },
  async joinDocument(docId: string): Promise<{ role: string }> {
    return apiClient.post<{ role: string }>(`/documents/${docId}/join`, {});
  },
  async getDocumentById(id: string): Promise<DocumentItem | null> {
    const doc = await apiClient.get<any>(`/documents/${id}`);
    return transformDocItem(doc);
  },
  async createDocument(title: string, type: DocumentItem['type'] = 'blank', workspaceId?: string): Promise<DocumentItem> {
    const body: any = { title, type };
    if (workspaceId) body.workspaceId = workspaceId;
    const doc = await apiClient.post<any>('/documents', body);
    return transformDocItem(doc);
  },
  async toggleStar(id: string): Promise<{ isStarred: boolean }> {
    return apiClient.post<{ isStarred: boolean }>(`/documents/${id}/star`, {});
  },
  async renameDocument(id: string, newTitle: string): Promise<DocumentItem | null> {
    const doc = await apiClient.patch<any>(`/documents/${id}`, { title: newTitle });
    return transformDocItem(doc);
  },
  async deleteDocument(id: string): Promise<boolean> {
    await apiClient.delete(`/documents/${id}`);
    return true;
  },
  async deleteDocumentForever(id: string): Promise<boolean> {
    await apiClient.delete(`/documents/${id}/permanent`);
    return true;
  },
  async restoreDocument(id: string): Promise<boolean> {
    await apiClient.post(`/documents/${id}/restore`, {});
    return true;
  },
  async saveContent(id: string, content: any[]): Promise<DocumentItem | null> {
    const doc = await apiClient.patch<any>(`/documents/${id}`, { content });
    return transformDocItem(doc);
  },
  async addCollaborator(docId: string, email: string, role: string) {
    return apiClient.post<any>(`/documents/${docId}/collaborators`, { email, role });
  },
  async updateCollaboratorRole(docId: string, userId: string, role: string) {
    return apiClient.patch<any>(`/documents/${docId}/collaborators/${userId}`, { role });
  },
  async removeCollaborator(docId: string, userId: string) {
    return apiClient.delete(`/documents/${docId}/collaborators/${userId}`);
  },
  async updateAccess(docId: string, isPublic: boolean) {
    return apiClient.patch<{ isPublic: boolean }>(`/documents/${docId}/access`, { isPublic });
  },
  async createVersion(docId: string) {
    return apiClient.post<any>(`/documents/${docId}/versions`, {});
  },
  async listVersions(docId: string) {
    return apiClient.get<any[]>(`/documents/${docId}/versions`);
  },
  async getVersion(docId: string, versionId: string) {
    return apiClient.get<any>(`/documents/${docId}/versions/${versionId}`);
  },
  async exportDocument(docId: string, format: string) {
    const token = localStorage.getItem('collabspace_token');
    const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';
    const res = await fetch(`${BASE_URL}/documents/${docId}/export/${format}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    return blob;
  },
};