/**
 * CollabSpace — API Contract Interfaces
 * ──────────────────────────────────────
 * These TypeScript interfaces define the exact shapes the backend API
 * must return. All frontend services call the real REST API through
 * apiClient and the responses must conform to these contracts.
 */

// ─── AUTH ────────────────────────────────────────────────────────────────────
export interface LoginRequest  { email: string; password: string; }
export interface SignupRequest { name: string; email: string; password: string; }
export interface AuthResponse  { token: string; user: UserDTO; }

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  avatarUrl?: string;
  createdAt: string;
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export interface DocumentDTO {
  id: string;
  title: string;
  type: 'doc' | 'markdown' | 'pdf' | 'docx';
  ownerId: string;
  ownerName: string;
  workspaceId?: string;
  isStarred: boolean;
  isPublic: boolean;
  isTrashed: boolean;
  collaboratorCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  type: DocumentDTO['type'];
  workspaceId?: string;
}

// ─── WORKSPACES ──────────────────────────────────────────────────────────────
export interface WorkspaceDTO {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberCount: number;
  documentCount: number;
  updatedAt: string;
  createdAt: string;
}

// ─── ACTIVITY ────────────────────────────────────────────────────────────────
export interface ActivityDTO {
  id: string;
  type: 'EDIT' | 'PERMISSION_CHANGE' | 'CREATE' | 'DELETE' | 'WORKSPACE' | 'EXPORT';
  actorId: string;
  actorName: string;
  targetId: string;
  targetTitle: string;
  targetType: 'document' | 'workspace';
  details: string;
  timestamp: string;
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export interface OrgMemberDTO {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt: string;
  lastActive: string;
}

export interface InviteMemberRequest { email: string; role: 'ADMIN' | 'MEMBER'; }

// ─── PAGINATION ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}
