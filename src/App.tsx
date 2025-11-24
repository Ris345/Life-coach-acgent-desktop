import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth();

  if (isLoading) {
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

  if (!isAuthenticated) {
    return <Login />;
  }

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
