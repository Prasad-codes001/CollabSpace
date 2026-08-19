import type { ActivityItem } from '../types/activity';
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

function transformActivity(a: any, index: number): ActivityItem {
  return {
    id: a.id || a._id,
    type: a.type,
    actor: {
      id: a.actorId,
      name: a.actorName,
      email: '',
      color: COLORS[index % COLORS.length],
    },
    target: {
      id: a.targetId,
      title: a.targetTitle,
      type: a.targetType,
    },
    details: a.details,
    timestamp: a.timestamp || a.createdAt,
    timeAgo: timeAgo(a.timestamp || a.createdAt),
  };
}

export const activityService = {
  getActivities: async (): Promise<ActivityItem[]> => {
    const data = await apiClient.get<any[]>('/activities');
    return data.map((a, i) => transformActivity(a, i));
  }
};