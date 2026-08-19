import React, { useState } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import type { WorkspaceMember } from '../../types/workspace';

interface InviteMemberModalProps {
  isOpen: boolean;
  workspaceName: string;
  onClose: () => void;
  onInvite: (email: string, role: WorkspaceMember['role']) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen, workspaceName, onClose, onInvite
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceMember['role']>('VIEWER');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onInvite(email, role);
    setEmail('');
    setRole('VIEWER');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F4]">
          <div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">Invite Member</h3>
            <p className="text-xs text-[#78716C] mt-0.5">Invite someone to <span className="font-semibold text-[#1C1917]">{workspaceName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="teammate@company.com"
                autoFocus
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
              />
            </div>
            {error && <p className="text-xs text-[#DC2626] mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Role</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as WorkspaceMember['role'])}
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] appearance-none cursor-pointer"
              >
                <option value="EDITOR">Editor — Can view and edit documents</option>
                <option value="VIEWER">Viewer — Can view documents</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#57534E] bg-[#F4F0EA] hover:bg-[#E7E5E4] rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] rounded-lg shadow-xs">
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
