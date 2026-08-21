import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Activity, Info, UserPlus, Crown, Shield, User as UserIcon, Trash2, Plus } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { documentService } from '../../services/documentService';
import { activityService } from '../../services/activityService';
import { useAuth } from '../../context/AuthContext';
import { InviteMemberModal } from './InviteMemberModal';
import { DocumentGrid } from '../dashboard/DocumentGrid';
import { NewDocModal } from '../dashboard/NewDocModal';
import type { Workspace, WorkspaceMember } from '../../types/workspace';
import type { DocumentItem } from '../../types/document';
import type { ActivityItem } from '../../types/activity';

interface WorkspaceDetailProps {
  workspace: Workspace;
  onBack: () => void;
  onOpenDoc: (doc: DocumentItem) => void;
  onDelete?: () => void;
}

type WsTab = 'overview' | 'documents' | 'members' | 'activity';

const ROLE_BADGE: Record<WorkspaceMember['role'], { label: string; icon: React.ElementType; color: string }> = {
  OWNER: { label: 'Owner', icon: Crown, color: 'bg-[#FEF3C7] text-[#92400E]' },
  EDITOR: { label: 'Editor', icon: Shield, color: 'bg-[#EDE9FE] text-[#5B21B6]' },
  VIEWER: { label: 'Viewer', icon: UserIcon, color: 'bg-[#DCFCE7] text-[#14532D]' },
};

export const WorkspaceDetail: React.FC<WorkspaceDetailProps> = ({ workspace, onBack, onOpenDoc, onDelete }) => {
  const { user } = useAuth();
  const isOwner = user?.id === workspace.ownerId;
  const [activeTab, setActiveTab] = useState<WsTab>('overview');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [wsDocs, setWsDocs] = useState<DocumentItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      workspaceService.getWorkspaceMembers(workspace.id),
      documentService.getWorkspaceDocuments(workspace.id),
      activityService.getActivities(),
    ]).then(([m, docs, acts]) => {
      setMembers(m);
      setWsDocs(docs);
      // Filter activities to those related to this workspace's documents
      const wsDocIds = new Set(docs.map(d => d.id));
      setActivities(acts.filter(a =>
        (a.target.type === 'workspace' && a.target.id === workspace.id) ||
        (a.target.type === 'document' && wsDocIds.has(a.target.id))
      ));
    }).finally(() => setLoading(false));
  }, [workspace.id]);

  const handleInvite = async (email: string, role: WorkspaceMember['role']) => {
    try {
      await workspaceService.inviteMember(workspace.id, email, role);
      const updatedMembers = await workspaceService.getWorkspaceMembers(workspace.id);
      setMembers(updatedMembers);
      setActionError('Invitation sent successfully');
      setTimeout(() => setActionError(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to invite member');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      onDelete?.();
    } catch (err) {
      setActionError('Failed to delete workspace');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCreateDoc = async (title: string, type: DocumentItem['type']) => {
    try {
      const doc = await documentService.createDocument(title, type, workspace.id);
      setNewDocOpen(false);
      // Refresh workspace documents using workspace filter
      const docs = await documentService.getWorkspaceDocuments(workspace.id);
      setWsDocs(docs);
      // Open the new document in editor
      onOpenDoc(doc);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to create document');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await workspaceService.removeMember(workspace.id, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to remove member');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleWsDocStar = async (id: string) => {
    await documentService.toggleStar(id);
    const docs = await documentService.getDocuments();
    setWsDocs(docs.filter(d => d.workspaceId === workspace.id));
  };

  const handleWsDocDelete = async (id: string) => {
    await documentService.deleteDocument(id);
    const docs = await documentService.getDocuments();
    setWsDocs(docs.filter(d => d.workspaceId === workspace.id));
  };

  const tabs: { id: WsTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'documents', label: `Documents (${wsDocs.length})`, icon: FileText },
    { id: 'members', label: `Members (${members.length})`, icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-[#FAF8F5]/80 backdrop-blur-md border-b border-[#E7E5E4] px-6 py-4 sticky top-0 z-30">
        <button onClick={onBack} className="flex items-center gap-2 text-xs text-[#57534E] hover:text-[#1C1917] transition-colors mb-3 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Workspaces
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">{workspace.name}</h1>
            <p className="text-xs text-[#78716C] mt-0.5">{workspace.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold px-4 py-2 rounded-xl border border-[#FECACA] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setInviteOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-[#D97706]" />
                  Invite Member
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 border-b border-[#E7E5E4] -mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#D97706] text-[#1C1917]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-6 sm:p-8 max-w-6xl w-full mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-[#E7E5E4]/60 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 shadow-editorial space-y-5">
                  <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917]">About This Workspace</h3>
                  <p className="text-sm text-[#57534E] leading-relaxed">{workspace.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F5F5F4]">
                    <div><p className="text-xs text-[#78716C]">Owner</p><p className="text-sm font-semibold text-[#1C1917] mt-0.5">{members.find(m => m.role === 'OWNER')?.name || 'Unknown'}</p></div>
                    <div><p className="text-xs text-[#78716C]">Created</p><p className="text-sm font-semibold text-[#1C1917] mt-0.5">{workspace.createdAt}</p></div>
                    <div><p className="text-xs text-[#78716C]">Documents</p><p className="text-sm font-semibold text-[#1C1917] mt-0.5">{wsDocs.length}</p></div>
                    <div><p className="text-xs text-[#78716C]">Members</p><p className="text-sm font-semibold text-[#1C1917] mt-0.5">{members.length}</p></div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 shadow-editorial">
                  <h3 className="font-semibold text-sm text-[#1C1917] mb-4">Recent Members</h3>
                  <div className="space-y-3">
                    {members.slice(0, 4).map(m => (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#F4F0EA] border border-[#E7E5E4] flex items-center justify-center text-xs font-bold text-[#1C1917]">
                          {m.name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-semibold text-[#1C1917] truncate">{m.name}</p>
                          <p className="text-[10px] text-[#78716C]">{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917]">
                    Documents <span className="font-normal text-base text-[#57534E]">({wsDocs.length})</span>
                  </h3>
                  <button
                    onClick={() => setNewDocOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#D97706]" />
                    Create Document
                  </button>
                </div>
                <DocumentGrid
                  documents={wsDocs}
                  viewMode="grid"
                  emptyTitle="No documents in this workspace"
                  emptyDesc="Create a document and assign it to this workspace."
                  onOpen={onOpenDoc}
                  onStar={handleWsDocStar}
                  onRename={() => {}}
                  onDelete={handleWsDocDelete}
                />
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-editorial overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F5F5F4] flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-[#1C1917]">{members.length} Members</h3>
                  {isOwner && (
                    <button
                      onClick={() => setInviteOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#D97706] hover:text-[#B45309]"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#F5F5F4]">
                  {members.map(m => {
                    const badge = ROLE_BADGE[m.role];
                    const BadgeIcon = badge.icon;
                    return (
                      <div key={m.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-[#FAF8F5] transition-colors">
                        <div className="w-9 h-9 rounded-full bg-[#F4F0EA] border border-[#E7E5E4] flex items-center justify-center text-sm font-bold text-[#1C1917] shrink-0">
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1C1917] truncate">{m.name}</p>
                          <p className="text-xs text-[#78716C]">{m.email}</p>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </div>
                        <p className="text-[11px] text-[#A8A29E] hidden sm:block">{m.joinedAt}</p>
                        {isOwner && m.id !== workspace.ownerId && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-8 h-8 text-[#A8A29E] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#1C1917]">No activity yet</p>
                    <p className="text-xs text-[#78716C] mt-1">Activity for this workspace will appear here.</p>
                  </div>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl px-5 py-4 flex items-center gap-4 shadow-editorial hover:shadow-editorial-hover transition-all">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: activity.actor.color }}
                      >
                        {activity.actor.name[0]}
                      </div>
                      <p className="text-sm text-[#44403C] flex-1">
                        <span className="font-semibold text-[#1C1917]">{activity.actor.name}</span>
                        {' '}{activity.details}{' '}
                        {activity.target.title && <span className="font-semibold text-[#D97706]">{activity.target.title}</span>}
                      </p>
                      <span className="text-[11px] text-[#A8A29E] font-mono shrink-0">{activity.timeAgo}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <InviteMemberModal
        isOpen={inviteOpen}
        workspaceName={workspace.name}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      <NewDocModal
        isOpen={newDocOpen}
        onClose={() => setNewDocOpen(false)}
        onCreate={handleCreateDoc}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917] mb-2">Delete Workspace</h3>
            <p className="text-sm text-[#57534E] mb-6">
              Are you sure you want to delete <span className="font-semibold">"{workspace.name}"</span>? This action cannot be undone and all workspace documents will be removed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[#57534E] bg-[#F4F0EA] hover:bg-[#E7E5E4] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#FEF2F2] text-[#DC2626] p-4 rounded-xl shadow-2xl border border-[#FECACA] flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <p className="flex-1 text-xs font-medium">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-[#DC2626]/60 hover:text-[#DC2626] text-sm font-bold">×</button>
        </div>
      )}
    </div>
  );
};
