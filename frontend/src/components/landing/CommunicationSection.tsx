import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

export const CommunicationSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Visual Chat Showcase */}
          <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 shadow-editorial space-y-6 text-left order-2 lg:order-1">
            <div className="flex items-center justify-between border-b border-[#F5F5F4] pb-4">
              <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D97706]" /> Document Context Chat
              </span>
              <span className="text-[11px] font-mono text-[#78716C]">#product-vision</span>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&h=60&q=80"
                  alt="Elena"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E5E4] space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-[#1C1917]">Elena Rostova</span>
                    <span className="text-[10px] text-[#A8A29E]">10:42 AM</span>
                  </div>
                  <p className="text-[#57534E]">
                    Should we include DOCX export support in the initial release or wait for Phase 16?
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=60&h=60&q=80"
                  alt="Alex"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="bg-[#F0FDF4] p-3 rounded-xl border border-[#BBF7D0] space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-[#166534]">Alex Morgan</span>
                    <span className="text-[10px] text-[#86EFAC]">10:44 AM</span>
                  </div>
                  <p className="text-[#14532D]">
                    Let's provide the export UI abstraction in Phase 15 first so users see the clear export options.
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input Mock */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F4]">
              <input
                type="text"
                readOnly
                value="Reply to thread..."
                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg px-3.5 py-2 text-xs text-[#78716C] focus:outline-none"
              />
              <button className="p-2 rounded-lg bg-[#1C1917] text-[#FAF8F5] shrink-0">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Text Description */}
          <div className="space-y-6 text-left order-1 lg:order-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] font-semibold">
              Integrated Context
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917] tracking-tight leading-tight">
              Keep conversations right where the work happens.
            </h2>
            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed">
              No more switching tabs between external chat apps and your doc. CollabSpace embeds real-time side-panel discussions directly alongside your document canvas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
