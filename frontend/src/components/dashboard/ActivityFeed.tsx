import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  FileEdit, 
  ShieldCheck, 
  PlusCircle, 
  FolderKanban, 
  Download, 
  Trash2, 
  Search,
  Filter
} from 'lucide-react';
import { activityService } from '../../services/activityService';
import type { ActivityItem, ActivityType } from '../../types/activity';

interface ActivityFeedProps {
  onOpenDoc?: (docId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    activityService.getActivities().then(data => {
      setActivities(data);
      setLoading(false);
    });
  }, []);

  const filteredActivities = activities.filter(act => {
    if (filterType !== 'ALL' && act.type !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchActor = act.actor.name.toLowerCase().includes(q);
      const matchTarget = act.target.title.toLowerCase().includes(q);
      const matchDetails = act.details.toLowerCase().includes(q);
      return matchActor || matchTarget || matchDetails;
    }
    return true;
  });

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'EDIT': return <FileEdit className="w-4 h-4 text-[#3B82F6]" />;
      case 'PERMISSION_CHANGE': return <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />;
      case 'CREATE': return <PlusCircle className="w-4 h-4 text-[#10B981]" />;
      case 'WORKSPACE': return <FolderKanban className="w-4 h-4 text-[#8B5CF6]" />;
      case 'EXPORT': return <Download className="w-4 h-4 text-[#6366F1]" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-[#EF4444]" />;
      default: return <Activity className="w-4 h-4 text-[#78716C]" />;
    }
  };

  const getTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'EDIT': return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#3B82F6]/10 text-[#2563EB]">EDIT</span>;
      case 'PERMISSION_CHANGE': return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#F59E0B]/10 text-[#D97706]">PERMISSION</span>;
      case 'CREATE': return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#10B981]/10 text-[#059669]">CREATED</span>;
      case 'WORKSPACE': return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#8B5CF6]/10 text-[#7C3AED]">WORKSPACE</span>;
      case 'EXPORT': return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#6366F1]/10 text-[#4F46E5]">EXPORT</span>;
      case 'DELETE': return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#EF4444]/10 text-[#DC2626]">DELETED</span>;
    }
  };

  const filterOptions = [
    { label: 'All Activity', value: 'ALL' },
    { label: 'Edits', value: 'EDIT' },
    { label: 'Permissions', value: 'PERMISSION_CHANGE' },
    { label: 'Creation', value: 'CREATE' },
    { label: 'Workspaces', value: 'WORKSPACE' },
    { label: 'Exports', value: 'EXPORT' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">Audit Trail & Activity Log</h1>
            <p className="text-xs text-[#78716C]">Real-time history of edits, permission shifts, and workspace events</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-[#E7E5E4] shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity log..."
            className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#A8A29E] mr-1 shrink-0" />
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === opt.value
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#57534E] hover:bg-[#F4F0EA]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#78716C]">Loading audit records...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 text-center my-6">
          <Activity className="w-10 h-10 text-[#A8A29E] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#1C1917] mb-1">No matching activity records</h3>
          <p className="text-xs text-[#78716C]">Try adjusting your search criteria or active filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E5E4] rounded-2xl divide-y divide-[#F5F5F4] shadow-xs overflow-hidden">
          {filteredActivities.map((act) => (
            <div key={act.id} className="p-5 hover:bg-[#FAF8F5] transition-colors flex items-start gap-4">
              {/* Type Badge Icon */}
              <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] flex items-center justify-center shrink-0 mt-0.5">
                {getTypeIcon(act.type)}
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-[#1C1917]">{act.actor.name}</span>
                  <span className="text-xs text-[#78716C] font-mono">• {act.actor.email}</span>
                  {getTypeBadge(act.type)}
                </div>

                <p className="text-xs font-medium text-[#44403C] mb-1">{act.details}</p>

                <div className="flex items-center gap-2 text-[11px] text-[#78716C]">
                  <span className="font-semibold text-[#1C1917] inline-flex items-center gap-1">
                    {act.target.title}
                  </span>
                  <span>•</span>
                  <span>{act.timeAgo}</span>
                  <span className="text-[#A8A29E]">({act.timestamp})</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
