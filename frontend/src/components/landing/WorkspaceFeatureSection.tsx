import React from 'react';
import { Folder, FileText, Upload, Star, Search, Filter } from 'lucide-react';

export const WorkspaceFeatureSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-[#F4F0EA]/50 border-t border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] font-semibold">
            Centralized Organization
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917] tracking-tight">
            Your team's collective brain, organized.
          </h2>
          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed">
            Keep every project specification, design doc, and meeting retrospective neatly structured in workspaces.
          </p>
        </div>

        {/* Workspace Feature Mock Card */}
        <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 sm:p-10 shadow-editorial max-w-5xl mx-auto">
          {/* Top Bar Filter Mock */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#F5F5F4] pb-6">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                readOnly
                value="Search documents..."
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg pl-9 pr-4 py-2 text-xs text-[#78716C] focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E7E5E4] text-[#44403C] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> All Types
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#1C1917] text-[#FAF8F5] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#D97706]" /> Upload Document
              </span>
            </div>
          </div>

          {/* Sample Document List */}
          <div className="divide-y divide-[#F5F5F4] text-left">
            {/* Doc item 1 */}
            <div className="py-4 flex items-center justify-between hover:bg-[#FAF8F5]/80 px-3 rounded-lg transition-colors">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#1C1917]/5 text-[#1C1917] flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-[#D97706]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-[#1C1917]">Product Strategy & Vision 2026</h4>
                    <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                  </div>
                  <p className="text-xs text-[#78716C]">Acme Product Team • Updated 10m ago by Elena</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#78716C] bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E7E5E4]">
                Interactive Canvas
              </span>
            </div>

            {/* Doc item 2 */}
            <div className="py-4 flex items-center justify-between hover:bg-[#FAF8F5]/80 px-3 rounded-lg transition-colors">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                  <Folder className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1C1917]">Engineering Architecture Specs</h4>
                  <p className="text-xs text-[#78716C]">Engineering Guild • 14 Documents • Updated 2h ago</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#78716C] bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E7E5E4]">
                Workspace Folder
              </span>
            </div>

            {/* Doc item 3 */}
            <div className="py-4 flex items-center justify-between hover:bg-[#FAF8F5]/80 px-3 rounded-lg transition-colors">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1C1917]">Q3 Design System Token Spec.md</h4>
                  <p className="text-xs text-[#78716C]">Design Systems • Imported Markdown • Updated 1d ago</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#78716C] bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E7E5E4]">
                Markdown
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
