import React, { useState, useEffect } from 'react';
import { X, Layers, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface BookAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onAuthSuccess: () => void;
}

export const BookAuthModal: React.FC<BookAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleMode = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
      setIsFlipping(false);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Outer Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-[#FAF8F5]/10 text-white hover:bg-[#FAF8F5]/20 transition-colors focus:outline-none"
        aria-label="Close authentication modal"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 2.5D Physical Book Container */}
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] border border-[#E7E5E4] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[540px] border-l-8 border-l-[#D97706]">
        {/* Left Book Spine Shadow */}
        <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 via-black/5 to-transparent z-20 pointer-events-none -translate-x-1/2"></div>

        {/* Bookmark Ribbon Detail */}
        <div className="absolute top-0 left-12 w-5 h-16 bg-[#D97706] shadow-sm z-30 flex items-end justify-center pb-1 clip-ribbon hidden sm:flex">
          <Bookmark className="w-3.5 h-3.5 text-white fill-white" />
        </div>

        {/* LEFT BOOK PAGE — Editorial Welcome */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 bg-[#F4F0EA] border-b md:border-b-0 md:border-r border-[#E7E5E4] flex flex-col justify-between relative overflow-hidden text-left">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-serif-editorial text-lg font-bold tracking-tight text-[#1C1917]">
                Collab<span className="text-[#D97706]">Space</span>
              </span>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight">
                Welcome to CollabSpace
              </h2>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Your shared space for ideas, documents, and real-time collaboration.
              </p>
            </div>

            {/* Feature Highlights on Book Leaf */}
            <div className="space-y-3 pt-4 border-t border-[#E7E5E4] text-xs text-[#44403C]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Controlled block-level editing locks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Real-time presence & multi-cursor indicators</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Document context chat & granular roles</span>
              </div>
            </div>
          </div>

          <div className="pt-8 relative z-10 text-[11px] font-mono text-[#78716C] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>CollabSpace Document Platform</span>
          </div>
        </div>

        {/* RIGHT BOOK PAGE — Form Container with 2.5D Flip Effect */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 bg-[#FFFFFF] flex flex-col justify-center relative">
          <div
            className={`transition-all duration-300 transform ${
              isFlipping ? 'opacity-0 scale-95 rotate-y-90' : 'opacity-100 scale-100 rotate-y-0'
            }`}
          >
            {mode === 'login' ? (
              <LoginForm
                onSwitchToSignup={handleToggleMode}
                onSuccess={() => {
                  onAuthSuccess();
                  onClose();
                }}
              />
            ) : (
              <SignupForm
                onSwitchToLogin={handleToggleMode}
                onSuccess={() => {
                  onAuthSuccess();
                  onClose();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
