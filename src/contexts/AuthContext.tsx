import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google" | "email";
  supabaseUserId?: string; // Supabase user ID from backend
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORE_KEY = "user_session";

async function initStore() {
  return await Store.load(".auth.dat");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const store = await initStore();
      const saved = await store.get<User>(STORE_KEY);
      if (saved) setUser(saved);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSession(u: User) {
    const store = await initStore();
    await store.set(STORE_KEY, u);
    await store.save();
    // Set user state - this will trigger re-render and show Dashboard
    setUser(u);
    setIsLoading(false); // Explicitly set loading to false
    console.log("✅ User session saved:", u.email);
    console.log("✅ User state updated, isAuthenticated:", true);
  }

  // ------------------------------------------------------------
  // GOOGLE SIGN-IN FLOW
  // ------------------------------------------------------------
  async function signInWithGoogle() {
    console.log("🚀 Starting Google Sign-In...");
    try {
      setIsLoading(true);

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
      // Use the local Python backend as the redirect URI
      const redirectUri = "http://127.0.0.1:14200/api/oauth/callback";

      if (!clientId || !clientSecret) {
        throw new Error("Google OAuth client ID/secret missing from .env");
      }

      // 1. Create OAuth state & save it
      const state = Math.random().toString(36).substring(2);
      console.log("📦 Initializing store for state...");
      const store = await initStore();
      await store.set("oauth_state", state);
      await store.save();
      console.log("✅ State saved");

      // 2. Build Google Auth URL
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `state=${state}&` +
        `access_type=offline&prompt=consent`;

      // 3. Open Google's login page
      console.log("🌐 Opening auth URL...");
      await invoke("open_url", { url: authUrl });

      // 4. Poll for the callback code
      console.log("⏳ Waiting for Google Sign-In callback...");

      let code: string | null = null;
      let attempts = 0;
      const maxAttempts = 60; // 1 minute timeout (checking every 1s)

      while (!code && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        try {
          const checkRes = await fetch(`http://127.0.0.1:14200/api/oauth/check/${state}`);
          const checkData = await checkRes.json();

          if (checkData.status === "ready") {
            code = checkData.code;
            console.log("✅ Received OAuth code from backend");
          } else if (checkData.status === "error") {
            throw new Error(checkData.error);
          } else if (checkData.status === "expired") {
            throw new Error("Authentication timed out");
          }
        } catch (err) {
          // Ignore network errors during polling (backend might be restarting)
          console.log("Polling error (retrying):", err);
        }
      }

      if (!code) {
        throw new Error("Authentication timed out. Please try again.");
      }

      // 5. Exchange code for tokens
      console.log("🔄 Exchanging code for tokens...");
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenJson.error_description);

      const accessToken = tokenJson.access_token;
      console.log("✅ Access token received");

      // 6. Fetch user info
      console.log("👤 Fetching user info...");
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const googleUser = await userInfoRes.json();
      console.log("✅ User info received:", googleUser.email);

      // 7. Login/Create user in desktop app backend (Supabase)
      console.log("🔐 Logging user into desktop app backend...");
      const backendLoginRes = await fetch("http://127.0.0.1:14200/api/auth/google/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
        }),
      });

      if (!backendLoginRes.ok) {
        const errorText = await backendLoginRes.text();
        console.error("Failed to login user in backend:", errorText);
        throw new Error("Failed to login user in desktop app. Please try again.");
      }

      const backendUser = await backendLoginRes.json();
      console.log("✅ User logged into desktop app backend:", backendUser.message);

      const normalized: User = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        provider: "google",
        supabaseUserId: backendUser.user?.id, // Store Supabase user ID
      };

      console.log("💾 Saving session...");
      await saveSession(normalized);
      console.log("✅ Google authentication successful, user session saved");

      // Clear the OAuth state from backend
      try {
        await fetch(`http://127.0.0.1:14200/api/oauth/clear/${state}`, { method: 'DELETE' });
      } catch (e) {
        // Ignore cleanup errors
      }

      // Ensure loading is cleared and user state is set
      console.log("🏁 Finishing login process...");
      setIsLoading(false);
    } catch (err) {
      console.error("Google login failed:", err);
      setIsLoading(false);
      throw err;
    }
  }

  async function signInWithEmail(email: string, _password: string) {
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
  }

  async function signOut() {
    const store = await initStore();
    await store.delete(STORE_KEY);
    await store.save();
    setUser(null);
  }

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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}