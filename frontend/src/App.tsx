import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FullPageLoader } from './components/ui/States';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/landing/HeroSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { RealTimeCollabSection } from './components/landing/RealTimeCollabSection';
import { WorkspaceFeatureSection } from './components/landing/WorkspaceFeatureSection';
import { CommunicationSection } from './components/landing/CommunicationSection';
import { SecuritySection } from './components/landing/SecuritySection';
import { FinalCTASection } from './components/landing/FinalCTASection';
import { BookAuthModal } from './components/auth/BookAuthModal';
import { Sidebar } from './components/dashboard/Sidebar';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { WorkspaceList } from './components/workspace/WorkspaceList';
import { WorkspaceDetail } from './components/workspace/WorkspaceDetail';
import { DocumentEditor } from './components/editor/DocumentEditor';
import { documentService } from './services/documentService';
import { useMouseParallax } from './hooks/useMouseParallax';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Sparkles, X } from 'lucide-react';
import type { DashboardTab } from './components/dashboard/Sidebar';
import type { Workspace } from './types/workspace';
import type { DocumentItem } from './types/document';

const PENDING_DOC_KEY = 'collabspace_pending_doc';

function parseInviteDocId(): string | null {
  const m = window.location.pathname.match(/^\/(?:d|invite)\/([a-f0-9]{24})/i);
  return m ? m[1] : null;
}

function AppContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const parallaxOffset = useMouseParallax(0.8);

  // Landing / Auth
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [toast, setToast] = useState<string | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  // Invite link handling: remember a document that was opened via /d/:id or
  // /invite/:id so it can be granted + opened once the user is authenticated.
  const [pendingDocId, setPendingDocId] = useState<string | null>(() => {
    const fromUrl = parseInviteDocId();
    if (fromUrl) {
      localStorage.setItem(PENDING_DOC_KEY, fromUrl);
      window.history.replaceState({}, '', '/');
      return fromUrl;
    }
    return localStorage.getItem(PENDING_DOC_KEY);
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const openDocumentById = async (docId: string) => {
    try {
      // Grant the user access via the link (idempotent), then load the doc.
      await documentService.joinDocument(docId);
      const fullDoc = await documentService.getDocumentById(docId);
      if (!fullDoc) throw new Error('Document not found');
      setActiveDoc(fullDoc);
      setActiveTab('home');
      localStorage.removeItem(PENDING_DOC_KEY);
    } catch (err: any) {
      showToast(err?.message || 'Could not open the shared document');
      localStorage.removeItem(PENDING_DOC_KEY);
    }
  };

  // After login, continue processing a pending invite link.
  useEffect(() => {
    if (isAuthenticated && pendingDocId && !activeDoc) {
      const id = pendingDocId;
      setPendingDocId(null);
      openDocumentById(id);
    }
  }, [isAuthenticated, pendingDocId, activeDoc]);

  // Show full-screen loader while session is being restored
  if (isLoading) {
    return <FullPageLoader message="Restoring your session..." />;
  }

  // ──────────────────────────────────────────────
  // AUTHENTICATED DASHBOARD VIEW
  // ──────────────────────────────────────────────
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-[#FAF8F5] overflow-hidden font-sans-ui">
        {/* Accessibility: Skip to main content */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setActiveWorkspace(null);
            setActiveDoc(null);
          }}
          onNewDoc={() => setNewDocOpen(true)}
          onLogout={() => {
            logout();
            setActiveTab('home');
          }}
          onLogoClick={() => {
            setActiveTab('home');
            setActiveWorkspace(null);
            setActiveDoc(null);
          }}
        />

        {/* Main Content Area — scrollable */}
        <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#FAF8F5]" role="main">
          {/* Document Editor View */}
          {activeDoc ? (
            <DocumentEditor
              document={activeDoc}
              onBack={() => setActiveDoc(null)}
            />
          ) : (
            <>
              {/* Workspace View */}
              {activeTab === 'workspaces' && !activeWorkspace && (
                <WorkspaceList
                  onOpenWorkspace={(ws) => setActiveWorkspace(ws)}
                />
              )}

              {activeTab === 'workspaces' && activeWorkspace && (
                <WorkspaceDetail
                  workspace={activeWorkspace}
                  onBack={() => setActiveWorkspace(null)}
                  onOpenDoc={(doc) => setActiveDoc(doc)}
                  onDelete={() => { setActiveWorkspace(null); }}
                />
              )}

              {/* Dashboard View (all other tabs) */}
              {activeTab !== 'workspaces' && (
                <UserDashboard
                  activeTab={activeTab}
                  onOpenDoc={(doc) => setActiveDoc(doc)}
                  newDocModalOpen={newDocOpen}
                  uploadDocModalOpen={uploadOpen}
                  onOpenNewDoc={() => setNewDocOpen(true)}
                  onCloseNewDoc={() => setNewDocOpen(false)}
                  onTabChange={setActiveTab}
                />
              )}
            </>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#1C1917] text-[#FAF8F5] p-4 rounded-xl shadow-2xl border border-[#44403C] flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-7 h-7 rounded-lg bg-[#D97706] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="flex-1 text-xs leading-relaxed text-[#D6D3D1]">{toast}</p>
            <button onClick={() => setToast(null)} className="text-[#78716C] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // PUBLIC LANDING PAGE
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans-ui selection:bg-[#F3EAD8]">
      <Navbar
        onStartCollaborating={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
        onLogin={() => { setAuthMode('login'); setAuthModalOpen(true); }}
      />

      <main className="flex-grow">
        <HeroSection
          parallaxOffset={parallaxOffset}
          onStartCollaborating={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
          onExploreWorkspace={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
        />
        <HowItWorksSection />
        <RealTimeCollabSection />
        <WorkspaceFeatureSection />
        <CommunicationSection />
        <SecuritySection />
        <FinalCTASection onStartCollaborating={() => { setAuthMode('signup'); setAuthModalOpen(true); }} />
      </main>

      <Footer />

      <BookAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onAuthSuccess={() => showToast('Welcome to CollabSpace!')}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#1C1917] text-[#FAF8F5] p-4 rounded-xl shadow-2xl border border-[#44403C] flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-7 h-7 rounded-lg bg-[#D97706] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <p className="flex-1 text-xs text-[#D6D3D1]">{toast}</p>
          <button onClick={() => setToast(null)} className="text-[#78716C] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
