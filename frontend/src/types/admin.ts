export type SystemRole = 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: MemberStatus;
  joinedAt: string;
  lastActive: string;
  avatarColor?: string;
}

export interface OrgStats {
  totalMembers: number;
  activeWorkspaces: number;
  totalDocuments: number;
  storageUsedGB: number;
  storageLimitGB: number;
}

export interface SecurityConfig {
  requireTwoFactor: boolean;
  allowPublicLinks: boolean;
  ssoProvider: 'OKTA' | 'GOOGLE' | 'DISABLED';
  sessionTimeoutMinutes: number;
}
