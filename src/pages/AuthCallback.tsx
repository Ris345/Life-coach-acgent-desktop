import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallback() {
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    // Parse the OAuth callback from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      alert(`Authentication failed: ${error}`);
      window.close();
      return;
    }

    if (code && state) {
      // TODO: Exchange code for token and get user info
      // For now, we'll just close the window
      console.log('Authorization code received:', code);
      alert('Authentication successful! You can close this window.');
      window.close();
    }
  }, []);

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
      <div style={{ textAlign: 'center' }}>
        <h1>Processing authentication...</h1>
        <p>Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
}

