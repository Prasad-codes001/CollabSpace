import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('CollabSpace crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 font-sans-ui">
          <div className="max-w-md w-full bg-white border border-[#E7E5E4] rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mb-5">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
              Something went wrong
            </h1>
            <p className="text-xs text-[#78716C] mt-2">
              The page hit an unexpected error. Your work is safe — just reload to continue.
            </p>
            <p className="text-[11px] text-[#A8A29E] font-mono mt-3 break-words">
              {this.state.message}
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 w-full px-4 py-2.5 text-xs font-semibold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] rounded-xl transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}