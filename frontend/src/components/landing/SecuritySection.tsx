import React from 'react';
import { Eye, Edit3, Crown, CheckCircle2 } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const roles = [
    {
      title: 'Owner',
      icon: Crown,
      color: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
      badge: 'Full Control',
      permissions: [
        'Manage collaborators & access permissions',
        'Delete or transfer document ownership',
        'Full real-time edit & block locking',
        'Access activity logs & version history'
      ]
    },
    {
      title: 'Editor',
      icon: Edit3,
      color: 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]',
      badge: 'Active Co-authoring',
      permissions: [
        'Real-time content creation & block locks',
        'Participate in context side-chat',
        'Add & resolve inline block comments',
        'Export documents to PDF or Markdown'
      ]
    },
    {
      title: 'Viewer',
      icon: Eye,
      color: 'bg-[#E0F2FE] text-[#0284C7] border-[#7DD3FC]',
      badge: 'Read Only',
      permissions: [
        'Read latest real-time document state',
        'View active collaborator cursors',
        'Participate in chat (if permitted)',
        'Cannot edit or acquire block locks'
      ]
    }
  ];

  return (
    <section id="security" className="py-24 bg-[#F4F0EA]/60 border-y border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] font-semibold">
            Granular Governance
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917] tracking-tight">
            Role-based Document Security
          </h2>
          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed">
            Ensure private team thoughts stay secure with explicit Owner, Editor, and Viewer permission tiers.
          </p>
        </div>

        {/* Roles 3-Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E7E5E4] shadow-editorial flex flex-col justify-between text-left space-y-6"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${role.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#78716C] border border-[#E7E5E4]">
                      {role.badge}
                    </span>
                  </div>

                  <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
                    {role.title}
                  </h3>

                  {/* Bullet List */}
                  <ul className="space-y-3 text-xs sm:text-sm text-[#57534E]">
                    {role.permissions.map((p, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
