import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, Clock, Plus, Loader2 } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { blocksToHtml } from '../../utils/document';
import type { Editor } from '@tiptap/react';

interface DocumentVersion {
  id: string;
  timestamp: string;
  date: string;
  authorName: string;
  authorColor: string;
  isCurrent?: boolean;
}

interface VersionHistoryProps {
  docId: string;
  editor: Editor | null;
  onClose: () => void;
  onRestore: (versionId: string) => void;
  selectedVersionId: string;
  onSelectVersion: (versionId: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

function formatVersionDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

  let date: string;
  if (diffDays === 0) date = 'Today';
  else if (diffDays === 1) date = 'Yesterday';
  else date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return { date, time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  docId, editor, onClose, onRestore, selectedVersionId, onSelectVersion
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadVersions = async () => {
    try {
      const data = await documentService.listVersions(docId);
      const mapped: DocumentVersion[] = (data || []).map((v: any, i: number) => {
        const { date, time } = formatVersionDate(v.createdAt);
        const author = v.editedBy;
        return {
          id: v._id || v.id,
          timestamp: time,
          date,
          authorName: author?.name || 'Unknown',
          authorColor: COLORS[i % COLORS.length],
        };
      });
      setVersions([
        { id: 'v_curr', timestamp: 'Now', date: 'Current', authorName: '', authorColor: '#10B981', isCurrent: true },
        ...mapped,
      ]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadVersions(); }, [docId]);

  const handleCreateVersion = async () => {
    setCreating(true);
    try {
      await documentService.createVersion(docId);
      await loadVersions();
    } catch {}
    setCreating(false);
  };

  const handleSelectVersion = async (versionId: string) => {
    onSelectVersion(versionId);
    if (versionId === 'v_curr' || !editor) return;

    try {
      const version = await documentService.getVersion(docId, versionId);
      if (version && version.content) {
        const html = blocksToHtml(Array.isArray(version.content) ? version.content : []);
        editor.commands.setContent(html, { emitUpdate: false });
      }
    } catch {}
  };

  return (
    <div className="w-80 bg-[#FFFFFF] border-l border-[#E7E5E4] flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-[#F5F5F4] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[#1C1917]">
          <History className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-semibold text-sm">Version History</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateVersion}
            disabled={creating}
            className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors"
            title="Save current version"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#FAF8F5]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          versions.map((version, index) => {
            const isSelected = selectedVersionId === version.id;
            const showDateHeader = index === 0 || versions[index - 1].date !== version.date;

            return (
              <React.Fragment key={version.id}>
                {showDateHeader && (
                  <div className="px-3 pt-4 pb-2">
                    <h4 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">{version.date}</h4>
                  </div>
                )}
                <div
                  onClick={() => handleSelectVersion(version.id)}
                  className={`p-3 mx-2 rounded-xl cursor-pointer transition-all border ${
                    isSelected ? 'bg-[#FFFFFF] border-[#D97706] shadow-sm' : 'bg-transparent border-transparent hover:bg-[#F4F0EA]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D97706]' : 'text-[#A8A29E]'}`} />
                        <span className={`text-sm font-semibold ${isSelected ? 'text-[#1C1917]' : 'text-[#57534E]'}`}>
                          {version.timestamp}
                        </span>
                        {version.isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#10B981]/10 text-[#047857] uppercase tracking-wider">Current</span>
                        )}
                      </div>
                      {!version.isCurrent && (
                        <div className="flex items-center gap-2 ml-5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-xs" style={{ backgroundColor: version.authorColor }}>
                            {version.authorName[0]}
                          </div>
                          <span className="text-xs text-[#78716C]">{version.authorName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && !version.isCurrent && (
                    <div className="mt-4 ml-5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRestore(version.id); }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore this version
                      </button>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
