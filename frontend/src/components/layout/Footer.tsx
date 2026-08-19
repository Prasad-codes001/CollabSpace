import React from 'react';
import { Layers, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F4F0EA] border-t border-[#E7E5E4] py-16 text-[#57534E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-serif-editorial text-xl font-bold tracking-tight text-[#1C1917]">
                Collab<span className="text-[#D97706]">Space</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#78716C] max-w-sm">
              The Real-Time Collaborative Document Workspace for teams that value writing clarity, controlled co-authoring locks, and thoughtful context.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E7E5E4] text-[#44403C]">
                <Shield className="w-3.5 h-3.5 text-[#D97706]" /> Enterprise Grade Block Locking
              </span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="font-semibold text-[#1C1917] text-sm uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-[#1C1917] transition-colors">Block Locking</a></li>
              <li><a href="#features" className="hover:text-[#1C1917] transition-colors">Document Canvas</a></li>
              <li><a href="#features" className="hover:text-[#1C1917] transition-colors">Real-time Presence</a></li>
              <li><a href="#features" className="hover:text-[#1C1917] transition-colors">Context Chat</a></li>
              <li><a href="#security" className="hover:text-[#1C1917] transition-colors">Role Permissions</a></li>
            </ul>
          </div>

          {/* Column 2: Workspaces */}
          <div>
            <h4 className="font-semibold text-[#1C1917] text-sm uppercase tracking-wider mb-4">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Product Teams</a></li>
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Engineering Guilds</a></li>
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Executive Specs</a></li>
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Remote Collaboration</a></li>
            </ul>
          </div>

          {/* Column 3: Resource */}
          <div>
            <h4 className="font-semibold text-[#1C1917] text-sm uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#1C1917] transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#D6D3D1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>© {new Date().getFullYear()} CollabSpace Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted for thoughtful documentation & collaboration.
          </p>
        </div>
      </div>
    </footer>
  );
};
