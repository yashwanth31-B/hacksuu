import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { GPSProvider } from './context/GPSContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { FirstTimeAdminSetup } from './components/FirstTimeAdminSetup.tsx';
import { Home } from './pages/Home.tsx';
import { ReportIssue } from './pages/ReportIssue.tsx';
import { PublicMap } from './pages/PublicMap.tsx';
import { TrackComplaint } from './pages/TrackComplaint.tsx';
import { TransparencyDashboard } from './pages/TransparencyDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { WorkerDashboard } from './pages/WorkerDashboard.tsx';
import { CitizenProfile } from './pages/CitizenProfile.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, setupStatus, checkingSetup } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
  };

  // 1. Loading Initial Setup State
  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-[#F9F6EE] flex flex-col items-center justify-center text-[#5C6E6A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E5A952] mb-3" />
        <span className="text-xs font-semibold tracking-widest uppercase text-[#1A2825]">Loading CivicFix V2...</span>
      </div>
    );
  }

  // 2. Mandatory First-Time Administrator Setup Gate (Section 4 & 5)
  if (setupStatus && !setupStatus.isConfigured) {
    return <FirstTimeAdminSetup />;
  }

  // Parse track id if in query or url
  const searchParams = new URLSearchParams(window.location.search);
  const initialTrackId =
    searchParams.get('id') ||
    (currentPath.startsWith('/complaint/') ? currentPath.replace('/complaint/', '') : '');

  // 3. Main Application Routing
  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] flex flex-col md:flex-row font-sans selection:bg-[#E5A952]/30">
      <Navbar currentPath={currentPath} navigate={navigate} />
      <AuthModal />

      <main className="flex-1 min-w-0 bg-[#F9F6EE] text-[#1A2825] min-h-screen">
        {currentPath === '/' && (
          user ? <Home navigate={navigate} /> : <LoginPage navigate={navigate} />
        )}
        {currentPath === '/home' && <Home navigate={navigate} />}
        {currentPath === '/report' && <ReportIssue navigate={navigate} />}
        {currentPath === '/map' && <PublicMap navigate={navigate} />}
        {(currentPath === '/track' || currentPath.startsWith('/complaint/')) && (
          <TrackComplaint navigate={navigate} initialComplaintNumber={initialTrackId} />
        )}
        {currentPath === '/transparency' && <TransparencyDashboard navigate={navigate} />}
        {currentPath === '/admin' && <AdminDashboard navigate={navigate} />}
        {currentPath === '/worker' && <WorkerDashboard navigate={navigate} />}
        {currentPath === '/profile' && <CitizenProfile navigate={navigate} />}
        {currentPath === '/login' && <LoginPage navigate={navigate} />}
        {(currentPath === '/signup' || currentPath === '/register') && <SignupPage navigate={navigate} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GPSProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </GPSProvider>
    </AuthProvider>
  );
}
