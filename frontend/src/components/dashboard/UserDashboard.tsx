import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Star, Users, FileText } from 'lucide-react';
import { Header } from './Header';
import { DocumentGrid } from './DocumentGrid';
import { NewDocModal } from './NewDocModal';
import { ActivityFeed } from './ActivityFeed';
import { DocumentSkeleton } from '../ui/States';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../api/client';
import { UserAvatar } from '../ui/UserAvatar';
import type { DocumentItem } from '../../types/document';
import type { DashboardTab } from './Sidebar';

interface RenameModalProps {
  docId: string;
  currentTitle: string;
  onConfirm: (id: string, newTitle: string) => void;
  onClose: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ docId, currentTitle, onConfirm, onClose }) => {
  const [title, setTitle] = useState(currentTitle);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150">
        <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917] dark:text-[#FAF8F5] mb-4">Rename Document</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(docId, title)}
          autoFocus
          className="w-full bg-[#FAF8F5] dark:bg-[#181614] border border-[#E7E5E4] dark:border-[#383430] rounded-xl px-4 py-2 text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#1C1917] dark:focus:ring-[#D97706]"
        />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] bg-[#F4F0EA] dark:bg-[#2B2724] hover:bg-[#E7E5E4] dark:hover:bg-[#332F2B] rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onConfirm(docId, title)} className="px-4 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] dark:bg-[#D97706] hover:bg-[#292524] dark:hover:bg-[#B45309] rounded-lg transition-colors">Rename</button>
        </div>
      </div>
    </div>
  );
};

interface UserDashboardProps {
  activeTab: DashboardTab;
  onOpenDoc: (doc: DocumentItem) => void;
  newDocModalOpen: boolean;
  onOpenNewDoc: () => void;
  onCloseNewDoc: () => void;
  onTabChange: (tab: DashboardTab) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  activeTab, onOpenDoc,
  newDocModalOpen, onOpenNewDoc, onCloseNewDoc, onTabChange
}) => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [trashedDocs, setTrashedDocs] = useState<DocumentItem[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('updated');
  const [filterType, setFilterType] = useState('all');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarMsg(null);
    setAvatarSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await apiClient.upload<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        role: string;
      }>('/upload/avatar', formData);
      updateUser({ avatarUrl: result.avatarUrl ?? undefined });
      setAvatarMsg({ type: 'ok', text: 'Photo updated' });
    } catch (err: any) {
      setAvatarMsg({ type: 'err', text: err?.message || 'Failed to upload photo' });
    } finally {
      setAvatarSaving(false);
    }
  };
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showError = (err: any, fallback: string) => {
    setActionError(err?.message || fallback);
    setTimeout(() => setActionError(null), 4000);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Load documents
  useEffect(() => {
    setLoading(true);
    Promise.all([documentService.getDocuments(), documentService.getSharedDocuments(), documentService.getTrashedDocuments()])
      .then(([docs, shared, trashed]) => {
        setDocuments(docs);
        setSharedDocs(shared);
        setTrashedDocs(trashed);
      })
      .finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    const [docs, shared, trashed] = await Promise.all([documentService.getDocuments(), documentService.getSharedDocuments(), documentService.getTrashedDocuments()]);
    setDocuments(docs);
    setSharedDocs(shared);
    setTrashedDocs(trashed);
  };

  // Filter + search + sort
  const filteredDocs = useMemo(() => {
    let pool = activeTab === 'trash' ? trashedDocs
      : activeTab === 'starred' ? documents.filter(d => d.isStarred)
      : activeTab === 'shared' ? sharedDocs
      : activeTab === 'recent' ? [...documents].slice(0, 5)
      : documents;

    if (searchQuery) {
      pool = pool.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterType !== 'all') {
      pool = pool.filter(d => d.type === filterType);
    }
    if (sortBy === 'title') {
      pool = [...pool].sort((a, b) => a.title.localeCompare(b.title));
    }
    return pool;
  }, [documents, sharedDocs, trashedDocs, activeTab, searchQuery, filterType, sortBy]);

  // Handlers
  const handleCreateDoc = async (title: string, type: DocumentItem['type']) => {
    try {
      const newDoc = await documentService.createDocument(title, type);
      await reload();
      onOpenDoc(newDoc);
    } catch (err: any) {
      showError(err, 'Failed to create document');
    }
  };

  const handleStar = async (id: string) => {
    try {
      await documentService.toggleStar(id);
      await reload();
    } catch (err: any) {
      showError(err, 'Failed to update star');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'trash') {
        await documentService.deleteDocumentForever(id);
      } else {
        await documentService.deleteDocument(id);
      }
      await reload();
    } catch (err: any) {
      showError(err, 'Failed to delete document');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await documentService.restoreDocument(id);
      await reload();
    } catch (err: any) {
      showError(err, 'Failed to restore document');
    }
  };

  const handleRenameConfirm = async (id: string, newTitle: string) => {
    try {
      await documentService.renameDocument(id, newTitle);
      setRenameTarget(null);
      await reload();
    } catch (err: any) {
      showError(err, 'Failed to rename document');
    }
  };

  // Section title
  const SECTION_LABELS: Partial<Record<DashboardTab, string>> = {
    home: 'Home',
    'my-documents': 'My Documents',
    shared: 'Shared With Me',
    workspaces: 'Workspaces',
    activity: 'Activity Log',
    recent: 'Recently Edited',
    starred: 'Starred',
    trash: 'Trash',
    settings: 'Settings',
  };

  if (activeTab === 'settings') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#181614] transition-colors">
        <Header
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          viewMode={viewMode} onViewModeChange={setViewMode}
          sortBy={sortBy} onSortChange={setSortBy}
          filterType={filterType} onFilterChange={setFilterType}
        />
        <div className="flex-1 p-6 sm:p-10 max-w-2xl w-full mx-auto">
          <p className="font-serif-editorial text-2xl font-bold text-[#1C1917] dark:text-[#FAF8F5] mb-6">Settings</p>
          <div className="bg-white dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-2xl p-6 shadow-sm">
            <p className="font-semibold text-sm text-[#1C1917] dark:text-[#FAF8F5]">Profile</p>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-1 mb-5">Update your photo shown across CollabSpace.</p>
            <div className="flex items-center gap-6">
              <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="lg" />
              <div className="flex flex-col items-start gap-2">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarSaving}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] dark:bg-[#D97706] dark:hover:bg-[#B45309] rounded-lg disabled:opacity-50 transition-colors"
                >
                  {avatarSaving ? 'Uploading...' : 'Change Photo'}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {avatarMsg && (
                  <p className={`text-xs ${avatarMsg.type === 'ok' ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                    {avatarMsg.text}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-[#E7E5E4] dark:border-[#383430] space-y-1">
              <p className="text-xs text-[#78716C] dark:text-[#A8A29E]"><span className="font-semibold text-[#1C1917] dark:text-[#FAF8F5]">Email:</span> {user?.email}</p>
              <p className="text-xs text-[#78716C] dark:text-[#A8A29E]"><span className="font-semibold text-[#1C1917] dark:text-[#FAF8F5]">Role:</span> {user?.role || 'MEMBER'}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-2xl p-6 shadow-sm mt-6">
            <p className="font-semibold text-sm text-[#1C1917] dark:text-[#FAF8F5]">Appearance</p>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-1 mb-4">Choose how CollabSpace looks. Preference is saved and persists after refresh.</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF8F5]">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">{theme === 'dark' ? 'Easier on the eyes in low light' : 'Bright and clear for daytime work'}</p>
              </div>
              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-[#E7E5E4] dark:bg-[#D97706]"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'activity') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#181614] transition-colors">
        <Header
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          viewMode={viewMode} onViewModeChange={setViewMode}
          sortBy={sortBy} onSortChange={setSortBy}
          filterType={filterType} onFilterChange={setFilterType}
        />
        <div className="flex-1">
          <ActivityFeed />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#181614] transition-colors">
      <Header
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        viewMode={viewMode} onViewModeChange={setViewMode}
        sortBy={sortBy} onSortChange={setSortBy}
        filterType={filterType} onFilterChange={setFilterType}
      />

      <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">

        {/* Dashboard Home Welcome */}
        {activeTab === 'home' && (
          <div className="space-y-2" role="region" aria-label="Dashboard overview">
            <h1 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#FAF8F5] tracking-tight animate-fade-up">
              {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-sm text-[#57534E] dark:text-[#A8A29E] animate-fade-up" style={{ animationDelay: '60ms' }}>Continue where you left off — or start something new.</p>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 animate-stagger">
              {[
                { label: 'My Documents', icon: FileText, count: documents.length, tab: 'my-documents' as DashboardTab },
                { label: 'Shared Docs', icon: Users, count: sharedDocs.length, tab: 'shared' as DashboardTab },
                { label: 'Starred', icon: Star, count: documents.filter(d => d.isStarred).length, tab: 'starred' as DashboardTab },
                { label: 'Recently Edited', icon: Clock, count: Math.min(documents.length, 5), tab: 'recent' as DashboardTab },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <button
                    key={stat.tab}
                    onClick={() => onTabChange(stat.tab)}
                    aria-label={`${stat.count} ${stat.label}`}
                    className="bg-[#FFFFFF] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-2xl p-4 text-left hover:border-[#D6D3D1] dark:hover:border-[#443E38] hover:shadow-editorial-hover transition-all group"
                  >
                    <Icon className="w-5 h-5 text-[#D97706] mb-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                    <p className="text-xl font-bold text-[#1C1917] dark:text-[#FAF8F5]">{stat.count}</p>
                    <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">{stat.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Header */}
        {activeTab !== 'home' && (
          <div className="flex items-center justify-between">
            <h2 className="font-serif-editorial text-2xl font-bold text-[#1C1917] dark:text-[#FAF8F5]">
              {SECTION_LABELS[activeTab]}
            </h2>
            {activeTab === 'trash' && trashedDocs.length > 0 && (
              <span className="text-xs text-[#78716C] dark:text-[#A8A29E] bg-[#F4F0EA] dark:bg-[#221F1D] px-3 py-1 rounded-full border border-[#E7E5E4] dark:border-[#383430]">
                {trashedDocs.length} items
              </span>
            )}
          </div>
        )}

        {/* Document List/Grid */}
        {loading ? (
          <DocumentSkeleton count={6} />
        ) : (
          <DocumentGrid
            documents={filteredDocs}
            viewMode={viewMode}
            isTrashed={activeTab === 'trash'}
            emptyTitle={
              activeTab === 'trash' ? 'Trash is empty' :
              activeTab === 'starred' ? 'No starred documents' :
              activeTab === 'shared' ? 'Nothing shared with you yet' :
              'No documents found'
            }
            emptyDesc={
              activeTab === 'trash' ? 'Deleted documents will appear here.' :
              activeTab === 'starred' ? 'Star a document to access it quickly.' :
              activeTab === 'shared' ? 'Documents shared with you will appear here.' :
              'Create your first document to get started.'
            }
            onOpen={onOpenDoc}
            onStar={handleStar}
            onRename={(id) => {
              const doc = documents.find(d => d.id === id);
              if (doc) setRenameTarget({ id, title: doc.title });
            }}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onNewDoc={onOpenNewDoc}
          />
        )}
      </div>

      {/* Modals */}
      <NewDocModal
        isOpen={newDocModalOpen}
        onClose={onCloseNewDoc}
        onCreate={handleCreateDoc}
      />

      {renameTarget && (
        <RenameModal
          docId={renameTarget.id}
          currentTitle={renameTarget.title}
          onConfirm={handleRenameConfirm}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {/* Error Toast */}
      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#FEF2F2] dark:bg-[#450A0A] text-[#DC2626] dark:text-[#FCA5A5] p-4 rounded-xl shadow-2xl border border-[#FECACA] dark:border-[#7F1D1D] flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <p className="flex-1 text-xs font-medium">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-[#DC2626]/60 dark:text-[#FCA5A5]/60 hover:text-[#DC2626] dark:hover:text-[#FCA5A5] text-sm font-bold">×</button>
        </div>
      )}
    </div>
  );
};
