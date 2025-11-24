import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'email';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORE_KEY = 'user_session';

// Initialize store - Store needs to be created with await
const initStore = async (): Promise<Store> => {
  try {
    const store = await Store.load('.auth.dat');
    return store;
  } catch (error) {
    console.error('Failed to initialize store:', error);
    throw error;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storeInstance = await initStore();
      const session = await storeInstance.get<User>(STORE_KEY);
      if (session) {
        setUser(session);
        console.log('✅ Loaded user session:', session.email);
      } else {
        console.log('ℹ️ No saved session found');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async (userData: User) => {
    try {
      const storeInstance = await initStore();
      await storeInstance.set(STORE_KEY, userData);
      await storeInstance.save();
      setUser(userData);
      console.log('✅ Saved user session:', userData.email);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Vite loads .env files at startup - check if it's loaded
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET; // Optional, for desktop apps
      const allEnvVars = import.meta.env;
      
      console.log('🔍 Environment Variables Check:', {
        hasClientId: !!clientId,
        clientIdValue: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
        clientIdLength: clientId?.length,
        hasClientSecret: !!clientSecret,
        isPlaceholder: clientId === 'your_google_client_id_here',
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD,
        // Show all VITE_ prefixed vars for debugging
        viteVars: Object.keys(allEnvVars).filter(key => key.startsWith('VITE_'))
      });
      
      if (!clientId || clientId === 'your_google_client_id_here' || clientId.trim() === '') {
        const errorMsg = 
          '❌ Google Client ID not loaded from .env file!\n\n' +
          'Troubleshooting steps:\n' +
          '1. Make sure .env file exists in project root (same folder as package.json)\n' +
          '2. Check .env file contains: VITE_GOOGLE_CLIENT_ID=your_actual_client_id\n' +
          '3. RESTART the dev server (stop and run "npm run tauri:dev" again)\n' +
          '4. Vite only loads .env files when it starts, not during runtime\n\n' +
          `Current value: ${clientId || 'undefined'}\n` +
          `Mode: ${import.meta.env.MODE}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Google Client ID loaded successfully:', clientId.substring(0, 30) + '...');

      // Generate a random state for security
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store state temporarily to verify callback
      const storeInstance = await initStore();
      await storeInstance.set('oauth_state', state);
      await storeInstance.save();

      // Build OAuth URL
      // For desktop apps, use http://localhost or http://127.0.0.1 as redirect URI
      // Google allows this for "Desktop app" type OAuth clients
      // Try 127.0.0.1 first as it's more reliable for desktop apps
      const redirectUri = 'http://127.0.0.1';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

      // Open OAuth in external browser
      console.log('Opening OAuth URL:', authUrl);
      try {
        await invoke('open_url', { url: authUrl });
        console.log('✅ Successfully invoked open_url command');
      } catch (error) {
        console.error('❌ Failed to open URL via Tauri command:', error);
        // Fallback: try opening with window.open (works in Tauri webview)
        try {
          const newWindow = window.open(authUrl, '_blank');
          if (!newWindow) {
            throw new Error('Popup blocked. Please allow popups and try again.');
          }
          console.log('✅ Opened URL via window.open');
        } catch (fallbackError) {
          console.error('❌ Failed to open URL via window.open:', fallbackError);
          throw new Error('Failed to open browser. Please check your browser settings or manually visit: ' + authUrl);
        }
      }

      // Wait a moment for browser to open
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show instructions to user
      const instructions = 
        'A browser window should have opened for Google sign-in.\n\n' +
        'Steps:\n' +
        '1. Sign in with your Google account\n' +
        '2. Grant permissions\n' +
        '3. You\'ll be redirected to a page (might show "This site can\'t be reached" - that\'s OK!)\n' +
        '4. The URL in your browser will look like:\n' +
        '   http://localhost/?code=XXXXX&state=YYYYY\n\n' +
        '5. Copy the ENTIRE URL from your browser address bar\n' +
        '6. Paste it in the next prompt';
      
      const userConfirmed = window.confirm(instructions);

      if (!userConfirmed) {
        setIsLoading(false);
        return;
      }

      // Prompt user to paste the full redirect URL
      const redirectUrl = window.prompt(
        'Please paste the FULL redirect URL from your browser address bar:\n\n' +
        'It should look like:\n' +
        'http://127.0.0.1/?code=4/0AeanS...&state=abc123...\n\n' +
        'OR\n' +
        'http://localhost/?code=4/0AeanS...&state=abc123...\n\n' +
        'Note: The page might show "This site can\'t be reached" - that\'s OK!\n' +
        'Just copy the URL from the address bar.\n\n' +
        'Paste the complete URL here:'
      );

      if (!redirectUrl || redirectUrl.trim() === '') {
        throw new Error('No redirect URL provided');
      }

      // Parse the code from the URL
      // Desktop apps redirect to http://localhost/?code=...&state=...
      let code: string | null = null;
      let returnedState: string | null = null;
      
      try {
        const url = new URL(redirectUrl);
        code = url.searchParams.get('code');
        returnedState = url.searchParams.get('state');
      } catch (urlError) {
        // If URL parsing fails, try to extract code manually using regex
        console.warn('URL parsing failed, trying regex extraction:', urlError);
        const codeMatch = redirectUrl.match(/[?&]code=([^&]+)/);
        const stateMatch = redirectUrl.match(/[?&]state=([^&]+)/);
        
        if (codeMatch) {
          code = decodeURIComponent(codeMatch[1]);
        }
        if (stateMatch) {
          returnedState = decodeURIComponent(stateMatch[1]);
        }
      }
      
      // Verify state matches
      if (returnedState) {
        try {
          const storeInstance = await initStore();
          const storedState = await storeInstance.get<string>('oauth_state');
          if (storedState && returnedState !== storedState) {
            throw new Error('State mismatch. Please try signing in again.');
          }
          console.log('✅ OAuth state verified');
        } catch (stateError) {
          console.warn('⚠️ Could not verify OAuth state, continuing anyway:', stateError);
        }
      }

      if (!code || code.trim() === '') {
        throw new Error('No authorization code found in the URL');
      }
      
      console.log('✅ Extracted authorization code');

      // Exchange authorization code for access token
      // For desktop apps registered as "installed", we can use client_secret if available
      // Some desktop apps require it, others don't - try with it first
      const tokenParams: Record<string, string> = {
        code: code.trim(),
        client_id: clientId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };
      
      // Include client_secret if available (some desktop app configs require it)
      if (clientSecret) {
        tokenParams.client_secret = clientSecret;
        console.log('✅ Using client_secret for token exchange');
      } else {
        console.log('ℹ️ No client_secret - using desktop app flow without it');
      }
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenParams),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        let errorMessage = 'Failed to exchange authorization code for token.';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'invalid_client') {
            errorMessage = 'OAuth client configuration error. Your Google OAuth app might be configured as "Web application" instead of "Desktop app". Desktop apps registered as "Web application" require a backend server for token exchange.';
          } else if (errorData.error_description) {
            errorMessage = `OAuth error: ${errorData.error_description}`;
          }
        } catch (e) {
          // If parsing fails, use the raw error text
          errorMessage = `Token exchange failed: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('No access token received from Google');
      }

      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user information from Google');
      }

      const userInfo = await userInfoResponse.json();

      // Create user session
      const googleUser: User = {
        id: userInfo.id || `google_${Date.now()}`,
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        picture: userInfo.picture,
        provider: 'google',
      };

      await saveSession(googleUser);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, _password: string) => {
    try {
      setIsLoading(true);
      
      // In production, this would call your backend API
      // For now, we'll create a simple session
      const mockUser: User = {
        id: `email_${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        provider: 'email',
      };

      await saveSession(mockUser);
    } catch (error) {
      console.error('Email sign-in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const storeInstance = await initStore();
      await storeInstance.delete(STORE_KEY);
      await storeInstance.save();
      setUser(null);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

