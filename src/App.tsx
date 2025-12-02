import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './components/Onboarding';
import { Overlay } from './windows/Overlay';
import { AppLayout } from './components/layout/AppLayout';
import { GoalLibrary } from './components/GoalLibrary';
import { AgentAnalytics } from './components/AgentAnalytics';
import { useEffect, useState } from 'react';
import { trackPageView } from './utils/analytics';

function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log('🔍 Auth state:', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      isLoading
    });
  }, [isAuthenticated, user, isLoading]);

  // Handle route changes (for callback page)
  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    updatePath(); // Initial path
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  // Navigate away from callback page after authentication
  useEffect(() => {
    if (isAuthenticated && currentPath === '/auth/callback') {
      // Navigate to root after successful authentication
      window.history.replaceState({}, '', '/');
      setCurrentPath('/');
    }
  }, [isAuthenticated, currentPath]);

  // Track page view on mount and when route changes
  useEffect(() => {
    trackPageView();
  }, [isAuthenticated, currentPath]); // Track when auth state or route changes

  // Show callback page if on /auth/callback route
  if (currentPath === '/auth/callback') {
    return <AuthCallback />;
  }

  // Overlay Window Route
  if (currentPath === '/overlay') {
    return <Overlay />;
  }

  // Show loading only if not authenticated (to avoid blocking dashboard)
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 text-white flex items-center justify-center font-sans">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // If authenticated, check onboarding status
  if (isAuthenticated && user) {
    if (!user.onboarding_completed) {
      return <Onboarding />;
    }

    const renderContent = () => {
      switch (currentPath) {
        case '/goals':
          return <GoalLibrary />;
        case '/analytics':
          return <AgentAnalytics />;
        case '/coaching':
          return <div className="p-8 text-zinc-500">Coaching Coming Soon</div>;
        case '/settings':
          return <div className="p-8 text-zinc-500">Settings Coming Soon</div>;
        default:
          return <Dashboard />;
      }
    };

    return (
      <AppLayout>
        {renderContent()}
      </AppLayout>
    );
  }

  // Show login if not authenticated
  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
