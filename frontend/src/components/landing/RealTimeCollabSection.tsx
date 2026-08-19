import React from 'react';
import { Lock, Users, Sparkles, Check, X, MousePointer2 } from 'lucide-react';

export const RealTimeCollabSection: React.FC = () => {
  return (
    <section id="product" className="py-24 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text & Features List */}
          <div className="space-y-8 text-left">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#D97706]/10 text-[#D97706]">
                <Sparkles className="w-3.5 h-3.5" /> Controlled Co-authoring
              </span>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917] tracking-tight leading-tight">
                Real-time collaboration without the editing chaos.
              </h2>
              <p className="text-base sm:text-lg text-[#57534E] leading-relaxed">
                Ever had a teammate overwrite your sentence mid-thought? CollabSpace introduces <strong className="text-[#1C1917]">Controlled Block Locks</strong> so everyone works together in harmony.
              </p>
            </div>

            {/* Comparison Highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E5E4] shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1C1917] text-sm mb-1">
                    Granular Block Locks
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    When someone clicks into a paragraph or heading block, that specific node is temporarily locked for editing. The rest of the document remains open.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E5E4] shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center shrink-0 mt-0.5">
                  <MousePointer2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1C1917] text-sm mb-1">
                    Live Cursor & Presence Badges
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    See exactly who is online, where their cursor is positioned, and what section they are actively working on in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Graphic Comparison Card */}
          <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 shadow-editorial relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between border-b border-[#F5F5F4] pb-4">
              <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D97706]" /> Live Document Session
              </span>
              <span className="text-xs text-[#10B981] font-mono font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
                3 Active Syncing
              </span>
            </div>

            {/* Interactive Block Locking Comparison Breakdown */}
            <div className="space-y-4 text-left">
              {/* Conventional Editors (Bad) */}
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#991B1B]">
                  <span className="flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Traditional Real-Time Editors
                  </span>
                  <span className="text-[10px] font-mono uppercase">Collision Risk</span>
                </div>
                <p className="text-xs text-[#7F1D1D] leading-normal italic">
                  "Text jumps, characters get deleted, and two users try to rewrite line 14 at the exact same second."
                </p>
              </div>

              {/* CollabSpace Block Locking (Good) */}
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#6EE7B7]/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#065F46]">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981]" /> CollabSpace Block Locking
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#10B981]/20 px-2 py-0.5 rounded text-[#047857]">
                    Zero Conflict
                  </span>
                </div>

                <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#A7F3D0] shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#10B981]">
                    <Lock className="w-3.5 h-3.5" /> Alex Morgan (Editing Paragraph 2)
                  </div>
                  <p className="text-xs text-[#374151] font-mono bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB]">
                    "CollabSpace guarantees smooth synchronization."
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    ✓ You can edit Paragraph 1 or 3 without waiting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
