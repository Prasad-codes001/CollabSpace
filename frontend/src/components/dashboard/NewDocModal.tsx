import React, { useState, useRef } from 'react';
import { X, FileText, FileCode, File, Sparkles, Check } from 'lucide-react';
import type { DocumentItem } from '../../types/document';

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, type: DocumentItem['type']) => void;
}

const DOC_TYPES = [
  { id: 'blank', label: 'Blank Document', icon: FileText, desc: 'Start from a clean canvas', color: 'bg-[#1C1917] text-[#FAF8F5]' },
  { id: 'template', label: 'From Template', icon: Sparkles, desc: 'Pick a pre-structured layout', color: 'bg-[#D97706] text-white' },
  { id: 'markdown', label: 'Markdown File', icon: FileCode, desc: 'Import or write .md content', color: 'bg-[#3B82F6] text-white' },
  { id: 'docx', label: 'Word Document', icon: File, desc: 'Upload a .docx file', color: 'bg-[#2563EB] text-white' },
  { id: 'pdf', label: 'PDF Document', icon: File, desc: 'Upload a .pdf file', color: 'bg-[#DC2626] text-white' },
] as const;

export const NewDocModal: React.FC<NewDocModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentItem['type']>('blank');
  const titleRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate(title.trim() || 'Untitled Document', selectedType);
    setTitle('');
    setSelectedType('blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F4]">
          <div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">New Document</h3>
            <p className="text-xs text-[#78716C] mt-0.5">Choose a starting format for your document</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] hover:text-[#1C1917] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Document Title Input */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Document Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Untitled Document"
              autoFocus
              className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl px-4 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] font-medium"
            />
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-2">Document Type</label>
            <div className="grid grid-cols-1 gap-2">
              {DOC_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id as DocumentItem['type'])}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#1C1917] bg-[#FAF8F5] shadow-xs'
                        : 'border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-[#1C1917] block">{type.label}</span>
                      <span className="text-[10px] text-[#78716C]">{type.desc}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D97706] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-[#F5F5F4] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#57534E] bg-[#F4F0EA] hover:bg-[#E7E5E4] rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] rounded-lg shadow-xs transition-colors"
          >
            Create Document
          </button>
        </div>
      </div>
    </div>
  );
};
