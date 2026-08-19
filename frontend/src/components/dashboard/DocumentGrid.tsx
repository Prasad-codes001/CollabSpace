import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import type { DocumentItem } from '../../types/document';

interface DocumentGridProps {
  documents: DocumentItem[];
  viewMode: 'grid' | 'list';
  isTrashed?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  onOpen: (doc: DocumentItem) => void;
  onStar: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onNewDoc?: () => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents, viewMode, isTrashed = false,
  emptyTitle = 'No documents found',
  emptyDesc = 'Create a new document to get started.',
  onOpen, onStar, onRename, onDelete, onRestore, onNewDoc
}) => {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F4F0EA] border border-[#E7E5E4] flex items-center justify-center">
          <FileText className="w-8 h-8 text-[#A8A29E]" />
        </div>
        <div>
          <p className="text-base font-semibold text-[#1C1917]">{emptyTitle}</p>
          <p className="text-sm text-[#78716C] mt-1">{emptyDesc}</p>
        </div>
        {!isTrashed && onNewDoc && (
          <button
            onClick={onNewDoc}
            className="inline-flex items-center gap-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors mt-2"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            Create your first document
          </button>
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {/* Column Headers */}
        <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#A8A29E]">
          <div className="w-9 shrink-0" />
          <span className="flex-1">Title</span>
          <span className="hidden sm:block w-20 text-right">Format</span>
          <span className="hidden md:block w-24 text-right">Collaborators</span>
          <span className="w-8" />
          <span className="w-8" />
        </div>
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            viewMode="list"
            isTrashed={isTrashed}
            onOpen={onOpen}
            onStar={onStar}
            onRename={onRename}
            onDelete={onDelete}
            onRestore={onRestore}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {documents.map(doc => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          viewMode="grid"
          isTrashed={isTrashed}
          onOpen={onOpen}
          onStar={onStar}
          onRename={onRename}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
};
