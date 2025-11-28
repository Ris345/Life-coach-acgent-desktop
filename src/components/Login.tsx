import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackButtonClick, trackPageView } from '../utils/analytics';

export function Login() {
  const { signInWithGoogle, signInWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Track page view on mount
  React.useEffect(() => {
    trackPageView('/login');
  }, []);

  const handleGoogleSignIn = async () => {
    trackButtonClick('google_sign_in_button');
    try {
      setError(null);
      console.log('🔄 Starting Google sign-in...');
      await signInWithGoogle();
      console.log('✅ Google sign-in completed');
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      // Also show alert for critical errors
      if (errorMessage.includes('not configured') || errorMessage.includes('Client ID')) {
        alert(errorMessage);
      }
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    trackButtonClick('email_submit_button');
    try {
      setError(null);
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with email');
    }
  };


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
      <div style={{
        background: '#252936',
        padding: '3rem',
        borderRadius: '1rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠 Life Coach Agent</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{
            background: '#ff4444',
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        {!showEmailForm ? (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#4285f4',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#444' }} />
              <span style={{ padding: '0 1rem', color: '#888', fontSize: '0.9rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#444' }} />
            </div>

            <button
              onClick={() => {
                trackButtonClick('email_sign_in_button');
                setShowEmailForm(true);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Continue with Email
            </button>
          </>
        ) : (
          <form onSubmit={handleEmailSignIn}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#ccc',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1d29',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#ccc',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1d29',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false);
                setEmail('');
                setPassword('');
                setError(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#888',
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              ← Back to sign in options
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

