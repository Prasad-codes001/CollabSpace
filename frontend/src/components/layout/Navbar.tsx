import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onStartCollaborating?: () => void;
  onLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartCollaborating, onLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E7E5E4]/80 py-3.5 shadow-sm'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-md group-hover:bg-[#292524] transition-colors">
              <Layers className="w-5 h-5 text-[#FAF8F5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-editorial text-xl font-bold tracking-tight text-[#1C1917]">
                Collab<span className="text-[#D97706]">Space</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-mono text-[#78716C] -mt-1 font-semibold">
                Workspace
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#44403C]">
            <a
              href="#product"
              className="hover:text-[#1C1917] transition-colors hover:underline underline-offset-4 decoration-[#D97706]"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#1C1917] transition-colors hover:underline underline-offset-4 decoration-[#D97706]"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="hover:text-[#1C1917] transition-colors hover:underline underline-offset-4 decoration-[#D97706]"
            >
              Features
            </a>
            <a
              href="#security"
              className="hover:text-[#1C1917] transition-colors hover:underline underline-offset-4 decoration-[#D97706]"
            >
              Permissions & Security
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={onLogin}
              className="text-sm font-semibold text-[#44403C] hover:text-[#1C1917] px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
            >
              Sign In
            </button>
            <button
              onClick={onStartCollaborating}
              className="group inline-flex items-center gap-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] text-sm font-semibold px-4.5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C1917]"
            >
              <span>Start Collaborating</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#44403C] hover:text-[#1C1917] hover:bg-[#F4F0EA] transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-[#E7E5E4] px-6 pt-4 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 font-medium text-[#44403C]">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1C1917]"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1C1917]"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1C1917]"
            >
              Features
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1C1917]"
            >
              Permissions & Security
            </a>
          </div>
          <div className="pt-4 border-t border-[#E7E5E4] flex flex-col space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin?.();
              }}
              className="w-full text-center py-2.5 font-semibold text-[#1C1917] border border-[#D6D3D1] rounded-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStartCollaborating?.();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#1C1917] text-[#FAF8F5] py-2.5 rounded-lg font-semibold shadow-sm"
            >
              <span>Start Collaborating</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
