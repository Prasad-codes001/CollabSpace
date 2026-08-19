import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface PermissionDeniedProps {
  requiredRole: string;
  onBack: () => void;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({ requiredRole, onBack }) => {
  return (
    <div className="flex-1 p-8 flex items-center justify-center min-h-[70vh]">
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 max-w-md w-full text-center shadow-editorial">
        <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 text-[#DC2626] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h2 className="font-serif-editorial text-2xl font-bold text-[#1C1917] mb-2">Access Restricted</h2>
        <p className="text-xs text-[#78716C] leading-relaxed mb-6">
          You do not have sufficient permissions to view this section. This module requires <span className="font-semibold text-[#1C1917]">{requiredRole}</span> privileges.
        </p>

        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
