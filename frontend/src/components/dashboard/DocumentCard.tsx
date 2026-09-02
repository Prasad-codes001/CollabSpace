import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Star, Trash2, MoreHorizontal, Edit3,
  Clock, ExternalLink, FileCode, File, RotateCcw
} from 'lucide-react';
import type { DocumentItem } from '../../types/document';
import { useAuth } from '../../context/AuthContext';

interface DocumentCardProps {
  doc: DocumentItem;
  viewMode: 'grid' | 'list';
  isTrashed?: boolean;
  onOpen: (doc: DocumentItem) => void;
  onStar: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

const TYPE_BADGE: Record<DocumentItem['type'], { label: string; color: string }> = {
  blank: { label: 'Canvas', color: 'bg-[#E7E5E4] text-[#44403C] dark:bg-[#332F2B] dark:text-[#D6D3D1]' },
  template: { label: 'Template', color: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#422006] dark:text-[#FDE68A]' },
  markdown: { label: 'Markdown', color: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E293B] dark:text-[#93C5FD]' },
  docx: { label: 'Word', color: 'bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#2E1065] dark:text-[#DDD6FE]' },
  pdf: { label: 'PDF', color: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#450A0A] dark:text-[#FCA5A5]' },
};

const DocIcon: React.FC<{ type: DocumentItem['type'] }> = ({ type }) => {
  if (type === 'markdown') return <FileCode className="w-5 h-5 text-[#3B82F6]" />;
  if (type === 'pdf') return <File className="w-5 h-5 text-[#DC2626]" />;
  if (type === 'docx') return <File className="w-5 h-5 text-[#2563EB]" />;
  if (type === 'template') return <FileText className="w-5 h-5 text-[#D97706]" />;
  return <FileText className="w-5 h-5 text-[#78716C] dark:text-[#A8A29E]" />;
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc, viewMode, isTrashed = false,
  onOpen, onStar, onRename, onDelete, onRestore
}) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const badge = TYPE_BADGE[doc.type];

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onlineCollabs = doc.collaborators.filter(c => c.isOnline && c.id !== user?.id);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] rounded-xl transition-colors group border border-transparent hover:border-[#E7E5E4] dark:hover:border-[#383430]">
        {/* Doc Icon */}
        <div className="w-9 h-9 rounded-lg bg-[#F4F0EA] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] flex items-center justify-center shrink-0">
          <DocIcon type={doc.type} />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => onOpen(doc)}>
          <p className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF8F5] truncate group-hover:text-[#D97706] transition-colors">
            {doc.title}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
            <span>{doc.ownerName}</span>
            {doc.myRole && doc.myRole !== 'OWNER' && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${doc.myRole === 'VIEWER' ? 'bg-[#DCFCE7] text-[#14532D] dark:bg-[#064E3B] dark:text-[#6EE7B7]' : 'bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#2E1065] dark:text-[#DDD6FE]'}`}>
                {doc.myRole === 'VIEWER' ? 'Viewer' : 'Editor'}
              </span>
            )}
            <span>•</span>
            <Clock className="w-3 h-3" />
            <span>{doc.updatedAt}</span>
          </div>
        </div>

        {/* Badge */}
        <span className={`hidden sm:inline text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${badge.color}`}>
          {badge.label}
        </span>

        {/* Collaborator Avatars */}
        <div className="hidden md:flex -space-x-1.5">
          {doc.collaborators.slice(0, 3).map(c => (
            <div
              key={c.id}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-[#181614] text-[9px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: c.color }}
              title={c.name}
            >
              {c.name[0]}
            </div>
          ))}
        </div>

        {/* Star */}
        {!isTrashed && (
          <button
            onClick={() => onStar(doc.id)}
            className={`p-1.5 rounded-lg transition-colors ${doc.isStarred ? 'text-[#F59E0B]' : 'text-[#D6D3D1] dark:text-[#57534E] hover:text-[#F59E0B]'}`}
            title={doc.isStarred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-[#F59E0B]' : ''}`} />
          </button>
        )}

        {/* Context Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-[#D6D3D1] dark:text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] hover:bg-[#E7E5E4] dark:hover:bg-[#2B2724] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <ContextMenu
              isTrashed={isTrashed}
              onOpen={() => { onOpen(doc); setMenuOpen(false); }}
              onRename={() => { onRename(doc.id); setMenuOpen(false); }}
              onStar={() => { onStar(doc.id); setMenuOpen(false); }}
              onDelete={() => { onDelete(doc.id); setMenuOpen(false); }}
              onRestore={() => { onRestore?.(doc.id); setMenuOpen(false); }}
            />
          )}
        </div>
      </div>
    );
  }

  // Grid Mode
  return (
    <div className="group bg-[#FFFFFF] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-2xl overflow-hidden shadow-editorial hover:shadow-editorial-hover transition-all duration-200 hover:border-[#D6D3D1] dark:hover:border-[#443E38] flex flex-col">
      {/* Card Header / Preview Area */}
      <div
        className="h-28 bg-[#FAF8F5] dark:bg-[#181614] border-b border-[#E7E5E4] dark:border-[#383430] p-4 flex flex-col justify-between cursor-pointer"
        onClick={() => onOpen(doc)}
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] shadow-xs flex items-center justify-center">
            <DocIcon type={doc.type} />
          </div>
          {doc.isStarred && <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />}
        </div>
        <div>
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="text-left cursor-pointer" onClick={() => onOpen(doc)}>
          <h4 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF8F5] line-clamp-2 group-hover:text-[#D97706] transition-colors leading-snug">
            {doc.title}
          </h4>
          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {doc.updatedAt}
            {doc.myRole && doc.myRole !== 'OWNER' && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${doc.myRole === 'VIEWER' ? 'bg-[#DCFCE7] text-[#14532D] dark:bg-[#064E3B] dark:text-[#6EE7B7]' : 'bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#2E1065] dark:text-[#DDD6FE]'}`}>
                {doc.myRole === 'VIEWER' ? 'Viewer' : 'Editor'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between">
          {/* Collaborator Stack */}
          <div className="flex -space-x-1.5 items-center">
            {doc.collaborators.slice(0, 3).map(c => (
              <div
                key={c.id}
                className="w-5 h-5 rounded-full border-2 border-white dark:border-[#221F1D] text-[8px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: c.color }}
                title={c.name}
              >
                {c.name[0]}
              </div>
            ))}
            {onlineCollabs.length > 0 && (
              <span className="ml-2 text-[10px] text-[#10B981] font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping inline-block" />
                Live
              </span>
            )}
          </div>

          {/* Context Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-[#D6D3D1] dark:text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] hover:bg-[#E7E5E4] dark:hover:bg-[#2B2724] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <ContextMenu
                isTrashed={isTrashed}
                onOpen={() => { onOpen(doc); setMenuOpen(false); }}
                onRename={() => { onRename(doc.id); setMenuOpen(false); }}
                onStar={() => { onStar(doc.id); setMenuOpen(false); }}
                onDelete={() => { onDelete(doc.id); setMenuOpen(false); }}
                onRestore={() => { onRestore?.(doc.id); setMenuOpen(false); }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Shared context menu
const ContextMenu: React.FC<{
  isTrashed: boolean;
  onOpen: () => void;
  onRename: () => void;
  onStar: () => void;
  onDelete: () => void;
  onRestore: () => void;
}> = ({ isTrashed, onOpen, onRename, onStar, onDelete, onRestore }) => (
  <div className="absolute right-0 bottom-8 z-20 bg-[#FFFFFF] dark:bg-[#262220] border border-[#E7E5E4] dark:border-[#383430] rounded-xl shadow-lg p-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-150">
    {!isTrashed ? (
      <>
        <MenuItem icon={ExternalLink} label="Open" onClick={onOpen} />
        <MenuItem icon={Edit3} label="Rename" onClick={onRename} />
        <MenuItem icon={Star} label="Star / Unstar" onClick={onStar} />
        <div className="my-1 border-t border-[#F5F5F4] dark:border-[#383430]" />
        <MenuItem icon={Trash2} label="Move to Trash" onClick={onDelete} danger />
      </>
    ) : (
      <>
        <MenuItem icon={RotateCcw} label="Restore" onClick={onRestore} />
        <MenuItem icon={Trash2} label="Delete Forever" onClick={onDelete} danger />
      </>
    )}
  </div>
);

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
      danger
        ? 'text-[#DC2626] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A]'
        : 'text-[#44403C] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#332F2B] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);
