import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';

interface FinalCTASectionProps {
  onStartCollaborating?: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onStartCollaborating }) => {
  return (
    <section className="py-24 bg-[#1C1917] text-[#FAF8F5] relative overflow-hidden">
      {/* Subtle Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5]/10 text-[#FAF8F5] flex items-center justify-center mx-auto border border-[#FAF8F5]/20">
          <Layers className="w-6 h-6 text-[#D97706]" />
        </div>

        <h2 className="font-serif-editorial text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.15]">
          Ready to elevate how your team writes & collaborates?
        </h2>

        <p className="text-base sm:text-lg text-[#D6D3D1] max-w-xl mx-auto leading-relaxed">
          Join thousands of product creators, writers, and engineers building better documentation in CollabSpace.
        </p>

        <div className="pt-4">
          <button
            onClick={onStartCollaborating}
            className="inline-flex items-center gap-2.5 bg-[#FAF8F5] hover:bg-[#F4F0EA] text-[#1C1917] font-semibold text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FAF8F5]"
          >
            <span>Start Collaborating Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D97706]" />
          </button>
        </div>
      </div>
    </section>
  );
};
