import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuthCallback } from './pages/AuthCallback';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Overlay } from './windows/Overlay';
import { AppLayout } from './components/layout/AppLayout';
import { GoalLibrary } from './components/GoalLibrary';
import { AgentAnalytics } from './components/AgentAnalytics';
import { Coaching } from './components/Coaching';
import { Settings } from './components/Settings';
import { useEffect, useState } from 'react';
import { trackPageView } from './utils/analytics';

function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  // Check if user has seen onboarding locally
  const [hasViewedOnboarding] = useState(() => localStorage.getItem('onboarding_flow_completed') === 'true');

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
    // Legacy DB onboarding check removed in favor of pre-login flow
    // if (!user.onboarding_completed) { return <Onboarding />; }

    const renderContent = () => {
      switch (currentPath) {
        case '/goals':
          return <GoalLibrary />;
        case '/analytics':
          return <AgentAnalytics />;
        case '/coaching':
          return <Coaching />;
        case '/settings':
          return <Settings />;
        default:
          return <Dashboard />;
      }
    };

    const handleNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    };

    return (
      <AppLayout currentPath={currentPath} onNavigate={handleNavigate}>
        {renderContent()}
      </AppLayout>
    );
  }

  // Show Pre-Login Onboarding if not viewed yet
  if (!hasViewedOnboarding) {
    return <OnboardingFlow onComplete={() => {
      // Mark as viewed for future sessions
      localStorage.setItem('onboarding_flow_completed', 'true');
      // We don't force update state here; OnboardingFlow handles transition to Login
      // Next time app loads, hasViewedOnboarding will be true
    }} />;
  }

  // Show login if not authenticated and onboarding viewed
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
