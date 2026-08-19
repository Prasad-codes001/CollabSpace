import React, { useState } from 'react';
import { Lock, Unlock, Users, Sparkles } from 'lucide-react';

interface DocumentCanvasPreviewProps {
  parallaxOffset?: { x: number; y: number };
}

export const DocumentCanvasPreview: React.FC<DocumentCanvasPreviewProps> = ({
  parallaxOffset = { x: 0, y: 0 }
}) => {
  // State for interactive lock simulation
  const [activeLockUser, setActiveLockUser] = useState<'Alex' | 'Sarah' | 'None'>('Alex');

  return (
    <div
      className="relative max-w-4xl mx-auto transition-transform duration-200 ease-out"
      style={{
        transform: `translate3d(${parallaxOffset.x * 12}px, ${parallaxOffset.y * 12}px, 0)`
      }}
    >
      {/* Outer Glow / Shadow Accent */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#D97706]/10 via-[#4F46E5]/10 to-[#D97706]/10 rounded-2xl blur-xl opacity-70"></div>

      {/* Editor Frame Container */}
      <div className="relative bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-editorial overflow-hidden">
        {/* Top Window Bar */}
        <div className="bg-[#FAF8F5] border-b border-[#E7E5E4] px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          {/* Left: Window Controls & Title */}
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]/60"></div>
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60"></div>
              <div className="w-3 h-3 rounded-full bg-[#10B981]/60"></div>
            </div>
            <span className="text-xs text-[#78716C]">/</span>
            <span className="text-xs font-semibold text-[#1C1917] truncate max-w-[200px] sm:max-w-xs">
              Product Strategy & Vision 2026
            </span>
            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-[#10B981]/10 text-[#047857] font-medium">
              Live Saved
            </span>
          </div>

          {/* Right: Active Collaborator Stack */}
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2 items-center">
              <div className="relative group">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
                  alt="Elena"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white"></span>
              </div>
              <div className="relative group">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&h=80&q=80"
                  alt="Alex"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white"></span>
              </div>
              <div className="relative group">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&h=80&q=80"
                  alt="Sarah"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white"></span>
              </div>
            </div>

            <div className="h-4 w-px bg-[#E7E5E4]"></div>

            <button className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#1C1917] text-[#FAF8F5]">
              <Users className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Toolbar Sub-header */}
        <div className="bg-[#FFFFFF] border-b border-[#F5F5F4] px-6 py-2 flex items-center justify-between text-xs text-[#78716C] overflow-x-auto">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-[#1C1917]">Heading 1</span>
            <span className="font-mono">Plus Jakarta Sans</span>
            <span>16px</span>
            <span className="font-bold cursor-pointer hover:text-[#1C1917]">B</span>
            <span className="italic cursor-pointer hover:text-[#1C1917]">I</span>
            <span className="underline cursor-pointer hover:text-[#1C1917]">U</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-[#A8A29E]">
            <span>1,420 words</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#D97706] font-sans font-medium">
              <Sparkles className="w-3 h-3" /> Lock Sync Active
            </span>
          </div>
        </div>

        {/* Document Editor Body Canvas */}
        <div className="p-6 sm:p-10 md:p-14 space-y-6 text-left relative bg-[#FFFFFF] min-h-[420px]">
          {/* Document Header Title */}
          <div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              CollabSpace Architecture & Block Lock Specification
            </h1>
            <p className="text-xs text-[#A8A29E] mt-1 font-mono">
              Created by Elena Rostova • Last edited 2 mins ago
            </p>
          </div>

          {/* Block 1: Unlocked Heading & Intro */}
          <div className="relative group p-3 -mx-3 rounded-lg hover:bg-[#FAF8F5]/70 transition-colors border border-transparent">
            <p className="text-sm sm:text-base leading-relaxed text-[#44403C]">
              Traditional real-time editors often result in destructive text collisions when multiple teammates edit the same line simultaneously. CollabSpace solves this through <strong className="text-[#1C1917]">Granular Block-Level Locks</strong>.
            </p>
          </div>

          {/* Block 2: LOCKED BLOCK DEMO */}
          <div
            className={`relative p-4 rounded-xl transition-all duration-300 border ${
              activeLockUser === 'Alex'
                ? 'bg-[#ECFDF5] border-[#10B981]/40 shadow-sm ring-1 ring-[#10B981]/20'
                : activeLockUser === 'Sarah'
                ? 'bg-[#FEF3C7] border-[#F59E0B]/40 shadow-sm'
                : 'bg-[#FAF8F5] border-[#E7E5E4]'
            }`}
          >
            {/* Lock Badge */}
            <div className="flex items-center justify-between mb-2">
              {activeLockUser === 'Alex' && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981] text-white shadow-xs animate-in fade-in duration-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Alex Morgan is actively editing this block</span>
                </div>
              )}
              {activeLockUser === 'Sarah' && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F59E0B] text-white shadow-xs animate-in fade-in duration-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sarah Chen has locked this section</span>
                </div>
              )}
              {activeLockUser === 'None' && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E7E5E4] text-[#57534E]">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Block Unlocked (Click to edit)</span>
                </div>
              )}

              <span className="text-[11px] font-mono text-[#78716C] hidden sm:inline">
                Block #BLK-092
              </span>
            </div>

            {/* Block Text Content */}
            <p className="text-sm sm:text-base leading-relaxed text-[#1C1917] font-medium">
              "While Alex refines the system performance criteria in this block, other team members can simultaneously edit any paragraph above or below without disruption or edit conflict."
            </p>

            {/* Simulated Live Cursor Indicator overlay */}
            {activeLockUser === 'Alex' && (
              <div className="absolute -bottom-3 right-8 flex items-center space-x-1 bg-[#10B981] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md animate-cursor-float">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                <span>Alex's Cursor</span>
              </div>
            )}
          </div>

          {/* Block 3: Callout Block */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              <strong className="text-[#1C1917]">Non-blocking Collaboration:</strong> Notice how the rest of the document remains 100% interactive for all collaborators.
            </div>
          </div>

          {/* Interactive Simulation Controls Bar */}
          <div className="mt-8 pt-4 border-t border-[#F5F5F4] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5]/80 p-3 rounded-lg">
            <span className="text-xs font-semibold text-[#57534E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D97706]" /> Test Live Block Lock Simulation:
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveLockUser('Alex')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  activeLockUser === 'Alex'
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'bg-[#E7E5E4] text-[#44403C] hover:bg-[#D6D3D1]'
                }`}
              >
                Alex Editing
              </button>
              <button
                onClick={() => setActiveLockUser('Sarah')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  activeLockUser === 'Sarah'
                    ? 'bg-[#F59E0B] text-white shadow-xs'
                    : 'bg-[#E7E5E4] text-[#44403C] hover:bg-[#D6D3D1]'
                }`}
              >
                Sarah Editing
              </button>
              <button
                onClick={() => setActiveLockUser('None')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  activeLockUser === 'None'
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'bg-[#E7E5E4] text-[#44403C] hover:bg-[#D6D3D1]'
                }`}
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
