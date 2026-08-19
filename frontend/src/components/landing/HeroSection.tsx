import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DocumentCanvasPreview } from './DocumentCanvasPreview';

interface HeroSectionProps {
  parallaxOffset?: { x: number; y: number };
  onStartCollaborating?: () => void;
  onExploreWorkspace?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  parallaxOffset = { x: 0, y: 0 },
  onStartCollaborating,
  onExploreWorkspace
}) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Parallax Background Decorative Orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#F59E0B]/10 via-[#F3EAD8]/40 to-transparent rounded-full blur-3xl pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(calc(-50% + ${parallaxOffset.x * -25}px), calc(-50% + ${parallaxOffset.y * -25}px), 0)`
        }}
      ></div>

      <div
        className="absolute top-1/3 right-10 w-72 h-72 bg-[#E0E7FF]/30 rounded-full blur-2xl pointer-events-none transition-transform duration-300 ease-out hidden lg:block"
        style={{
          transform: `translate3d(${parallaxOffset.x * 18}px, ${parallaxOffset.y * 18}px, 0)`
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Top Product Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F0EA] border border-[#E7E5E4] text-xs font-semibold text-[#44403C] mb-8 shadow-2xs hover:border-[#D6D3D1] transition-colors cursor-default">
          <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Introducing CollabSpace v1.0 — Controlled Block Locking</span>
        </div>

        {/* Hero Main Headline */}
        <h1 className="font-serif-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1C1917] max-w-4xl mx-auto leading-[1.1] mb-6">
          Create together. <br className="hidden sm:block" />
          <span className="italic font-normal text-[#44403C]">Work together.</span> <br />
          In one shared space.
        </h1>

        {/* Supporting Subhead */}
        <p className="text-lg sm:text-xl text-[#57534E] max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          CollabSpace brings your documents, collaboration, conversations, and teams together in one real-time workspace.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onStartCollaborating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-base px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C1917]"
          >
            <span>Start Collaborating</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D97706]" />
          </button>

          <a
            href="#how-it-works"
            onClick={onExploreWorkspace}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F4F0EA] hover:bg-[#E7E5E4] text-[#1C1917] font-semibold text-base px-6 py-3.5 rounded-xl border border-[#E7E5E4] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
          >
            <span>Explore Workspace</span>
          </a>
        </div>

        {/* Hero Visual Showcase — Live Editor Canvas */}
        <div className="pt-4">
          <DocumentCanvasPreview parallaxOffset={parallaxOffset} />
        </div>
      </div>
    </section>
  );
};
