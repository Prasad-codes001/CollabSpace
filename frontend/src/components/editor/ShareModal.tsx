import React, { useState } from 'react';
import { X, Link as LinkIcon, Globe, Lock, Check } from 'lucide-react';
import type { DocumentItem, Collaborator } from '../../types/document';

interface ShareModalProps {
  isOpen: boolean;
  document: DocumentItem;
  currentUserId: string;
  isOwner: boolean;
  onClose: () => void;
  onUpdateAccess: (isPublic: boolean) => void;
  onInvite: (email: string, role: Collaborator['role']) => void;
  onUpdateRole: (collaboratorId: string, role: Collaborator['role']) => void;
  onRemove: (collaboratorId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen, document: doc, currentUserId, isOwner, onClose, onUpdateAccess, onInvite, onUpdateRole, onRemove
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Collaborator['role']>('VIEWER');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/d/${doc.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.includes('@')) return;
    onInvite(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('VIEWER');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F5F5F4] flex items-center justify-between">
          <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">Share Document</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite Section — only the document owner can invite */}
          {isOwner && (
            <form onSubmit={handleInviteSubmit} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Add people via email..."
                  className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl px-4 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Collaborator['role'])}
                className="bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#1C1917] appearance-none"
              >
                <option value="VIEWER">Viewer — Read only</option>
                <option value="EDITOR">Editor — Can edit</option>
              </select>
              <button
                type="submit"
                disabled={!inviteEmail}
                className="px-5 py-2.5 text-sm font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] disabled:opacity-50 rounded-xl shadow-xs transition-colors"
              >
                Invite
              </button>
            </form>
          )}

          {/* Collaborators List */}
          <div>
            <h4 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mb-3">People with access</h4>
            <div className="space-y-3">
              {doc.collaborators.map(c => (
                <div key={c.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-white text-xs font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">
                        {c.name} {c.id === currentUserId && <span className="text-[#A8A29E] font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        {c.email}
                      </p>
                    </div>
                  </div>
                  
                  {isOwner ? (
                    c.role === 'OWNER' ? (
                      <span className="text-xs font-semibold text-[#78716C] px-3">Owner</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={c.role}
                          onChange={(e) => onUpdateRole(c.id, e.target.value as Collaborator['role'])}
                          className="bg-transparent text-xs font-semibold text-[#57534E] hover:text-[#1C1917] hover:bg-[#F4F0EA] px-2 py-1 rounded cursor-pointer appearance-none outline-none"
                        >
                          <option value="EDITOR">Editor — Can edit</option>
                          <option value="VIEWER">Viewer — Read only</option>
                        </select>
                        <button
                          onClick={() => onRemove(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#A8A29E] hover:text-[#DC2626] transition-all"
                          title="Remove access"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-xs font-semibold text-[#57534E] px-3">
                      {c.role === 'OWNER' ? 'Owner' : c.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: General Access & Copy Link */}
        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#F5F5F4]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E7E5E4] flex items-center justify-center shrink-0">
                {doc.isPublic ? <Globe className="w-4 h-4 text-[#10B981]" /> : <Lock className="w-4 h-4 text-[#A8A29E]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">General Access</p>
                <select
                  value={doc.isPublic ? 'public' : 'restricted'}
                  onChange={(e) => onUpdateAccess(e.target.value === 'public')}
                  className="bg-transparent text-xs text-[#57534E] font-medium mt-0.5 outline-none cursor-pointer appearance-none hover:text-[#1C1917]"
                >
                  <option value="restricted">Restricted — Only added people can open</option>
                  <option value="public">Anyone with the link — Can view</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E7E5E4]/50">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1C1917] bg-[#FFFFFF] border border-[#E7E5E4] hover:bg-[#F4F0EA] rounded-xl shadow-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <LinkIcon className="w-4 h-4 text-[#78716C]" />}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
