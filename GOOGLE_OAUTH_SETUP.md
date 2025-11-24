# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, etc.)
   - Add your email to test users
   - Save and continue through the scopes and test users screens

## Step 2: Create OAuth 2.0 Client ID

1. In **Credentials** page, click **Create Credentials** > **OAuth client ID**
2. Choose **Desktop app** as the application type
3. Name it (e.g., "Life Coach Agent Desktop")
4. Click **Create**
5. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

## Step 3: Configure Redirect URI

1. In the OAuth client settings, add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `tauri://localhost` (for custom protocol, optional)

## Step 4: Update .env File

1. Open the `.env` file in the project root
2. Replace `your_google_client_id_here` with your actual Client ID:

```
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## Step 5: Restart the App

After updating the `.env` file, restart the development server:

```bash
npm run tauri:dev
```

## How It Works

1. User clicks "Continue with Google"
2. A browser window opens with Google sign-in
3. User signs in and grants permissions
4. Google redirects to `http://localhost:3000/auth/callback` with an authorization code
5. The app exchanges the code for user information
6. User session is saved securely

## Troubleshooting

- **"Google Client ID not configured"**: Make sure `.env` file exists and has the correct Client ID
- **Redirect URI mismatch**: Ensure the redirect URI in Google Console matches `http://localhost:3000/auth/callback`
- **CORS errors**: Make sure you've added the redirect URI to authorized redirect URIs in Google Console

