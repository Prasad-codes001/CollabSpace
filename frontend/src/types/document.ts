export type DocumentRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: DocumentRole;
  isOnline: boolean;
  color?: string;
  activeBlockId?: string;
}

export interface DocumentBlock {
  id: string;
  type: 'heading-1' | 'heading-2' | 'paragraph' | 'callout' | 'code' | 'todo';
  content: string;
  lockedBy?: {
    id: string;
    name: string;
    avatarUrl?: string;
    color: string;
  };
}

export interface DocumentItem {
  id: string;
  title: string;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  updatedAt: string;
  createdAt: string;
  isStarred?: boolean;
  isPublic?: boolean;
  myRole?: DocumentRole;
  type: 'blank' | 'template' | 'docx' | 'markdown' | 'pdf';
  collaborators: Collaborator[];
  blocks: DocumentBlock[];
}
