import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackButtonClick, trackPageView } from '../utils/analytics';

export function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      if (errorMessage.includes('not configured') || errorMessage.includes('Client ID')) {
        alert(errorMessage);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    trackButtonClick(isSignUp ? 'email_sign_up_button' : 'email_sign_in_button');
    try {
      setError(null);
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      if (isSignUp && !name) {
        setError('Please enter your name');
        return;
      }

      if (isSignUp) {
        const result = await signUpWithEmail(email, password, name);
        if (!result.session) {
          setShowConfirmation(true);
        }
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      const message = (err.message || err.error_description || JSON.stringify(err)).toLowerCase();

      if (message.includes("email not confirmed") || message.includes("email address not confirmed")) {
        setShowConfirmation(true);
        return;
      }

      if (message.includes("user already registered")) {
        setError("Account already exists. Please sign in.");
        setIsSignUp(false);
        return;
      }

      if (message.includes("invalid login credentials")) {
        setError("Invalid email or password.");
        return;
      }

      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex items-center justify-center font-sans">
      <div className="bg-zinc-900 p-12 rounded-2xl max-w-md w-full shadow-2xl border border-zinc-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🧠 Life Coach Agent</h1>
          <p className="text-zinc-400 text-sm">
            {showConfirmation ? 'Check your email' : (isSignUp ? 'Create an account to get started' : 'Sign in to continue')}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {showConfirmation ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✉️</div>
            <p className="mb-6 text-zinc-300 leading-relaxed">
              We've sent a confirmation link to <strong className="text-white">{email}</strong>.<br />
              Please check your inbox to verify your account.
            </p>

            <button
              onClick={async () => {
                try {
                  setError(null);
                  await signInWithEmail(email, password);
                } catch (err: any) {
                  const message = err.message || err.error_description || JSON.stringify(err);
                  if (message.includes("Email not confirmed") || message.includes("email not confirmed")) {
                    setError("Email still not confirmed. Please check your inbox.");
                  } else {
                    setError(message);
                    setShowConfirmation(false);
                  }
                }
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors mb-4"
            >
              I've verified my email
            </button>

            <button
              onClick={() => {
                setShowConfirmation(false);
                setIsSignUp(false);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : !showEmailForm ? (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-[#4285f4] hover:bg-[#3367d6] text-white rounded-lg font-medium transition-colors mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-zinc-700" />
              <span className="px-4 text-zinc-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-zinc-700" />
            </div>

            <button
              onClick={() => {
                trackButtonClick('email_sign_in_button');
                setShowEmailForm(true);
              }}
              className="w-full py-3 bg-transparent border border-zinc-700 hover:border-zinc-500 text-white rounded-lg font-medium transition-colors"
            >
              Continue with Email
            </button>
          </>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block mb-2 text-sm text-zinc-400">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required={isSignUp}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false);
                  setEmail('');
                  setPassword('');
                  setName('');
                  setError(null);
                  setIsSignUp(false);
                }}
                className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

