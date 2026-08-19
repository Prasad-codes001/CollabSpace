import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'general' | 'network' | 'notfound';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  type = 'general'
}) => {
  const icon = type === 'network'
    ? <WifiOff className="w-8 h-8 text-[#A8A29E]" />
    : <AlertTriangle className="w-8 h-8 text-[#D97706]" />;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#E7E5E4] flex items-center justify-center mb-4 shadow-xs">
        {icon}
      </div>
      <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917] mb-2">{title}</h3>
      <p className="text-xs text-[#78716C] max-w-xs leading-relaxed mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
};

// Skeleton card for document loading state
export const DocumentSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-[#E7E5E4] overflow-hidden shadow-xs">
        <div className="h-32 bg-[#F4F0EA]/80 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 w-3/4 bg-[#E7E5E4] rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-[#F4F0EA] rounded animate-pulse" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 w-12 bg-[#F4F0EA] rounded animate-pulse" />
            <div className="h-5 w-16 bg-[#F4F0EA] rounded animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Generic skeleton rows for tables/lists
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white border border-[#E7E5E4] rounded-2xl divide-y divide-[#F5F5F4] overflow-hidden shadow-xs">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-[#F4F0EA] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/3 bg-[#E7E5E4] rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-[#F4F0EA] rounded animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-[#F4F0EA] rounded animate-pulse" />
      </div>
    ))}
  </div>
);

// Full page loading spinner (e.g. for auth check)
export const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'Loading CollabSpace...' }) => (
  <div className="fixed inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center z-50">
    <div className="w-12 h-12 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-xs font-semibold text-[#78716C]">{message}</p>
  </div>
);

// Empty state for no results
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#E7E5E4] flex items-center justify-center mb-5 shadow-xs text-[#A8A29E]">
      {icon}
    </div>
    <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917] mb-2">{title}</h3>
    <p className="text-xs text-[#78716C] max-w-xs leading-relaxed mb-6">{description}</p>
    {action && action}
  </div>
);
