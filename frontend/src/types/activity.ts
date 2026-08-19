export type ActivityType = 'EDIT' | 'PERMISSION_CHANGE' | 'CREATE' | 'DELETE' | 'WORKSPACE' | 'EXPORT';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    color?: string;
  };
  target: {
    id: string;
    title: string;
    type: 'document' | 'workspace';
  };
  details: string;
  timestamp: string;
  timeAgo: string;
}
