import React from 'react';
import { FolderPlus, UserPlus, Zap, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: FolderPlus,
      title: 'Organize in Workspaces',
      description: 'Create dedicated team workspaces, initialize blank docs, or upload Markdown, PDF, and DOCX files effortlessly.',
      badge: 'Document Hub'
    },
    {
      number: '02',
      icon: UserPlus,
      title: 'Invite & Set Roles',
      description: 'Bring teammates into shared documents with controlled Owner, Editor, or Viewer granular permission levels.',
      badge: 'Granular Access'
    },
    {
      number: '03',
      icon: Zap,
      title: 'Edit & Chat in Real Time',
      description: 'Co-author without destructive overwrite conflicts using block-level locks and embedded side-panel team chat.',
      badge: 'Zero Conflict'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#F4F0EA]/60 border-y border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] font-semibold">
            Simple & Thoughtful Workflow
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917] tracking-tight">
            How CollabSpace Works
          </h2>
          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed">
            Designed to keep team thoughts structured and writing fluid from initial idea to published document.
          </p>
        </div>

        {/* 3 Steps Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E7E5E4] shadow-editorial hover:shadow-editorial-hover transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Background Step Number Watermark */}
                <span className="absolute top-4 right-6 text-5xl font-serif-editorial font-bold text-[#FAF8F5] group-hover:text-[#F4F0EA] transition-colors select-none">
                  {step.number}
                </span>

                <div className="relative z-10 space-y-6">
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-xs group-hover:bg-[#292524] transition-colors">
                      <Icon className="w-6 h-6 text-[#D97706]" />
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#78716C] border border-[#E7E5E4]">
                      {step.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917] mb-2.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#F5F5F4] flex items-center text-xs font-semibold text-[#1C1917] group-hover:text-[#D97706] transition-colors">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
