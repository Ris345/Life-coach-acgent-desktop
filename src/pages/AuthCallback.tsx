import { useEffect, useState } from 'react';

export function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    async function handleCallback() {
      try {
        // Parse the OAuth callback from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          
          // Send error to backend
          try {
            const state = urlParams.get('state');
            if (state) {
              await fetch('http://127.0.0.1:14200/api/oauth/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error, state }),
              });
            }
          } catch (err) {
            console.error('Failed to send error to backend:', err);
          }
          
          // Try to close window after a delay
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              // Window might not be closable
            }
          }, 2000);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state');
          return;
        }

        // Send OAuth result to backend so the desktop app can pick it up
        try {
          await fetch('http://127.0.0.1:14200/api/oauth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
          });
        } catch (err) {
          console.error('Failed to send OAuth result to backend:', err);
          // Fallback: also try localStorage
          localStorage.setItem('oauth_complete', JSON.stringify({ code, state }));
        }

        setStatus('success');
        setMessage('Authentication successful! You can close this window.');

        // Try to close the window after showing success
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            // Window might not be closable (some browsers block this)
            // That's OK - user can close manually
          }
        }, 1500);
      } catch (err) {
        console.error('Callback handling error:', err);
        setStatus('error');
        setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    handleCallback();
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
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ marginBottom: '1rem' }}>Processing authentication...</h1>
            <p style={{ color: '#888' }}>Please wait while we complete your sign-in.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ marginBottom: '1rem', color: '#4ade80' }}>Success!</h1>
            <p style={{ color: '#888' }}>{message}</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>
              This window will close automatically, or you can close it manually.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{ marginBottom: '1rem', color: '#ef4444' }}>Error</h1>
            <p style={{ color: '#888' }}>{message}</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>
              Please close this window and try again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

