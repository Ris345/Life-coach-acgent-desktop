import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuthCallback } from './pages/AuthCallback';
import { useEffect, useState } from 'react';
import { trackPageView } from './utils/analytics';

function AppContent() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth();
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

  // OAuth completion is now handled in AuthContext by polling the backend
  // No need for localStorage listeners here

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

  // Show loading only if not authenticated (to avoid blocking dashboard)
  if (isLoading && !isAuthenticated) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#1a1d29',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If authenticated, show dashboard immediately
  if (isAuthenticated && user) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#1a1d29',
        color: '#ffffff',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠 Life Coach Agent</h1>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              Welcome, {user?.name || user?.email}!
            </p>
          </div>
          <button
            onClick={signOut}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            Sign Out
          </button>
        </div>

        <Dashboard />
      </div>
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
