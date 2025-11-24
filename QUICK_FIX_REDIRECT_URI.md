# Quick Fix: Redirect URI Error

## The Error:
```
Error 400: invalid_request
redirect_uri=http://localhost:3000/auth/callback
```

## The Problem:
The redirect URI `http://localhost:3000/auth/callback` is not authorized in your Google OAuth client.

## Quick Fix (2 minutes):

### Step 1: Open Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client
Look for your OAuth client in the list (use your Client ID from Google Cloud Console)
Click on it to edit.

### Step 3: Add Redirect URI
Scroll down to **"Authorized redirect URIs"** section.

Click **"+ ADD URI"** and enter:
```
http://localhost:3000/auth/callback
```

**IMPORTANT:**
- Copy it EXACTLY as shown (no trailing slash, no spaces)
- Make sure it's `localhost` (lowercase), not `Localhost`
- Make sure it's `http://` not `https://`

### Step 4: Save
Click **"SAVE"** at the bottom.

### Step 5: Wait 10-30 seconds
Google's changes need a moment to propagate.

### Step 6: Try Again
Click "Continue with Google" in your app again.

## Visual Guide:

In Google Console, you should see:
```
Authorized redirect URIs
┌─────────────────────────────────────────┐
│ http://localhost:3000/auth/callback    │  [X]
└─────────────────────────────────────────┘
[+ ADD URI]
```

## Still Not Working?

1. **Double-check the URI** - must match exactly
2. **Check if you have multiple OAuth clients** - make sure you're editing the right one
3. **Try clearing browser cache** - sometimes Google caches old configs
4. **Wait longer** - can take up to 5 minutes for changes to propagate

