import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  FolderKanban, 
  FileText, 
  HardDrive, 
  Search, 
  UserPlus,
  Lock,
  BarChart3,
  X
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ListSkeleton } from '../ui/States';
import { useAuth } from '../../context/AuthContext';
import type { OrgMember, OrgStats, SecurityConfig, SystemRole, MemberStatus } from '../../types/admin';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [security, setSecurity] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Active sub tab
  const [subTab, setSubTab] = useState<'members' | 'security' | 'analytics'>('members');
  const [memberSearch, setMemberSearch] = useState('');

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<SystemRole>('MEMBER');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminService.getStats(),
      adminService.getMembers(),
      adminService.getSecurityConfig()
    ]).then(([s, m, sec]) => {
      setStats(s);
      setMembers(m);
      setSecurity(sec);
      setLoading(false);
    }).catch((err) => {
      setActionError(err?.message || 'Failed to load admin data');
      setLoading(false);
    });
  }, []);

  const handleRoleChange = async (id: string, newRole: SystemRole) => {
    try {
      await adminService.updateMemberRole(id, newRole);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update role');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: MemberStatus) => {
    const nextStatus: MemberStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await adminService.updateMemberStatus(id, nextStatus);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: nextStatus } : m));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update status');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.includes('@')) return;
    try {
      const newMember = await adminService.inviteMember(inviteEmail, inviteRole);
      setMembers([newMember, ...members]);
      setInviteEmail('');
      setInviteModalOpen(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to invite member');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleSecurityToggle = async (key: keyof SecurityConfig, val: any) => {
    if (!security) return;
    try {
      const updated = await adminService.updateSecurityConfig({ [key]: val });
      setSecurity(updated);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update security setting');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (loading || !stats || !security) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#E7E5E4]/60 animate-pulse" />
          ))}
        </div>
        <ListSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Admin Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">Organization Admin Console</h1>
            <p className="text-xs text-[#78716C]">Manage team access, security policies, and workspace usage</p>
          </div>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invite Team Member
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#78716C]">Total Members</span>
            <Users className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <p className="text-2xl font-bold text-[#1C1917]">{stats.totalMembers}</p>
          <p className="text-[11px] text-[#78716C] mt-1 font-medium">Registered users</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#78716C]">Active Workspaces</span>
            <FolderKanban className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-2xl font-bold text-[#1C1917]">{stats.activeWorkspaces}</p>
          <p className="text-[11px] text-[#78716C] mt-1 font-medium">Team collaboration hubs</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#78716C]">Total Documents</span>
            <FileText className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-bold text-[#1C1917]">{stats.totalDocuments}</p>
          <p className="text-[11px] text-[#78716C] mt-1 font-medium">Across all team spaces</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#78716C]">Storage Used</span>
            <HardDrive className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl font-bold text-[#1C1917]">{stats.storageUsedGB} GB <span className="text-xs font-normal text-[#A8A29E]">/ {stats.storageLimitGB} GB</span></p>
          <div className="w-full h-1.5 bg-[#F4F0EA] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${(stats.storageUsedGB / stats.storageLimitGB) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#E7E5E4] mb-6 gap-8">
        {[
          { id: 'members', label: 'Members & Roles', icon: Users },
          { id: 'security', label: 'Security & Authentication', icon: Lock },
          { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
        ].map(t => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`pb-3 text-xs font-bold inline-flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-[#1C1917] text-[#1C1917]'
                  : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: MEMBERS & ROLES ─── */}
      {subTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7E5E4]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search team members by name or email..."
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
              />
            </div>
            <span className="text-xs text-[#78716C] font-semibold">{filteredMembers.length} members shown</span>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E7E5E4] text-[11px] uppercase tracking-wider text-[#78716C] font-bold">
                  <th className="py-3.5 px-6">Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {filteredMembers.map(m => (
                  <tr key={m.id} className="hover:bg-[#FAF8F5] transition-colors text-xs">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ backgroundColor: m.avatarColor || '#3B82F6' }}
                        >
                          {m.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1C1917]">{m.name}</p>
                          <p className="text-[#78716C] text-[11px]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as SystemRole)}
                        className="bg-[#FAF8F5] border border-[#E7E5E4] text-xs font-semibold text-[#1C1917] px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      {m.status === 'ACTIVE' && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#047857]">Active</span>}
                      {m.status === 'INVITED' && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#D97706]">Invited</span>}
                      {m.status === 'SUSPENDED' && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#DC2626]">Suspended</span>}
                    </td>
                    <td className="py-4 px-4 text-[#78716C]">{m.joinedAt}</td>
                    <td className="py-4 px-4 text-[#78716C]">{m.lastActive}</td>
                    <td className="py-4 px-6 text-right">
                      {m.id !== user?.id && (
                        <button
                          onClick={() => handleStatusToggle(m.id, m.status)}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                            m.status === 'SUSPENDED'
                              ? 'border-[#10B981] text-[#047857] hover:bg-[#10B981]/10'
                              : 'border-[#EF4444] text-[#DC2626] hover:bg-[#EF4444]/10'
                          }`}
                        >
                          {m.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SECURITY & AUTHENTICATION ─── */}
      {subTab === 'security' && (
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917] mb-1">Security Policies</h3>
            <p className="text-xs text-[#78716C]">Configure organization authentication requirements and sharing permissions</p>
          </div>

          <div className="space-y-4 divide-y divide-[#F5F5F4]">
            {/* 2FA Toggle */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-[#78716C]">Require all team members to authenticate using an authenticator app</p>
              </div>
              <button
                onClick={() => handleSecurityToggle('requireTwoFactor', !security.requireTwoFactor)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${security.requireTwoFactor ? 'bg-[#10B981]' : 'bg-[#E7E5E4]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${security.requireTwoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Public Link Sharing Toggle */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">Allow External Public Document Links</p>
                <p className="text-xs text-[#78716C]">Permit document owners to enable "Anyone with link can view"</p>
              </div>
              <button
                onClick={() => handleSecurityToggle('allowPublicLinks', !security.allowPublicLinks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${security.allowPublicLinks ? 'bg-[#10B981]' : 'bg-[#E7E5E4]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${security.allowPublicLinks ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* SSO Provider Selection */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">Single Sign-On (SSO) Provider</p>
                <p className="text-xs text-[#78716C]">Enforce enterprise identity provider for team logins</p>
              </div>
              <select
                value={security.ssoProvider}
                onChange={e => handleSecurityToggle('ssoProvider', e.target.value)}
                className="bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl px-3 py-2 text-xs font-semibold text-[#1C1917] outline-none"
              >
                <option value="GOOGLE">Google Workspace SSO</option>
                <option value="OKTA">Okta Enterprise</option>
                <option value="DISABLED">Disabled (Standard Passwords)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: USAGE ANALYTICS ─── */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-xs">
            <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917] mb-4">Storage & Activity Analytics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1C1917] mb-1">
                  <span>Document Storage Usage</span>
                  <span>{stats.storageUsedGB} GB / {stats.storageLimitGB} GB</span>
                </div>
                <div className="w-full h-3 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E7E5E4]">
                  <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${stats.storageLimitGB > 0 ? (stats.storageUsedGB / stats.storageLimitGB * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F5F5F4]">
              <h3 className="font-serif-editorial text-lg font-bold text-[#1C1917]">Invite Team Member</h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@organization.com"
                  className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl px-4 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-1">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as SystemRole)}
                  className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                >
                  <option value="MEMBER">Member — Full collaborative workspace access</option>
                  <option value="ADMIN">Admin — Full organization & security management</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F5F5F4]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#57534E] bg-[#F4F0EA] hover:bg-[#E7E5E4] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#292524] rounded-xl shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#FEF2F2] text-[#DC2626] p-4 rounded-xl shadow-2xl border border-[#FECACA] flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <p className="flex-1 text-xs font-medium">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-[#DC2626]/60 hover:text-[#DC2626]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
