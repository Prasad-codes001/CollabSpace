import React, { useState, useEffect } from 'react';
import { Plus, FolderKanban, Users, FileText } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import type { Workspace } from '../../types/workspace';

interface WorkspaceListProps {
  onOpenWorkspace: (ws: Workspace) => void;
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({ onOpenWorkspace }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    workspaceService.getWorkspaces().then(data => {
      setWorkspaces(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (name: string, description: string) => {
    const newWs = await workspaceService.createWorkspace(name, description);
    setWorkspaces(prev => [newWs, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-[#E7E5E4]/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">Workspaces</h2>
          <p className="text-xs text-[#78716C] mt-0.5">Organized shared spaces for your team's documents</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          New Workspace
        </button>
      </div>

      {/* Workspace Cards */}
      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F4F0EA] border border-[#E7E5E4] flex items-center justify-center">
            <FolderKanban className="w-8 h-8 text-[#A8A29E]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#1C1917]">No workspaces yet</p>
            <p className="text-sm text-[#78716C] mt-1">Create a workspace to organize your team's documents.</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold px-5 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            Create first workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => onOpenWorkspace(ws)}
              className="group bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 text-left shadow-editorial hover:shadow-editorial-hover hover:border-[#D6D3D1] transition-all duration-200 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#1C1917] flex items-center justify-center group-hover:bg-[#292524] transition-colors">
                  <FolderKanban className="w-5 h-5 text-[#D97706]" />
                </div>
                <span className="text-[10px] font-mono text-[#A8A29E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E7E5E4]">
                  {ws.createdAt}
                </span>
              </div>

              {/* Info */}
              <div>
                <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917] group-hover:text-[#D97706] transition-colors leading-tight">
                  {ws.name}
                </h3>
                <p className="text-xs text-[#57534E] mt-1 line-clamp-2">{ws.description}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-2 border-t border-[#F5F5F4]">
                <span className="text-xs text-[#78716C] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#A8A29E]" />
                  {ws.documentsCount} docs
                </span>
                <span className="text-xs text-[#78716C] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#A8A29E]" />
                  {ws.membersCount} members
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};
