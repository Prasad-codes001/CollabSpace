import React, { useState } from 'react';
import { X, FolderKanban, AlignLeft } from 'lucide-react';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F4]">
          <div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">Create Workspace</h3>
            <p className="text-xs text-[#78716C] mt-0.5">Organize your team's documents in one place</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Workspace Name *</label>
            <div className="relative">
              <FolderKanban className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Product Team"
                autoFocus
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Description</label>
            <div className="relative">
              <AlignLeft className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={3}
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#57534E] bg-[#F4F0EA] hover:bg-[#E7E5E4] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] rounded-lg shadow-xs transition-colors">
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
