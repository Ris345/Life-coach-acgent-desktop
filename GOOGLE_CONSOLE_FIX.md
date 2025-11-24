# Fix Google Console Redirect URI

## Current Issue:
Google is blocking even though `http://localhost` is configured.

## Solution: Add BOTH redirect URIs

Google desktop apps sometimes need BOTH redirect URIs configured:

### Step 1: Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### Step 2: Edit Your OAuth Client
Find your OAuth client ID (from your Google Cloud Console)
Click to edit.

### Step 3: Add BOTH Redirect URIs

In "Authorized redirect URIs", add BOTH:

```
http://localhost
http://127.0.0.1
```

**Important:**
- Add them as TWO separate entries
- No trailing slashes
- No ports
- No paths
- Exactly as shown above

### Step 4: Save and Wait
- Click "SAVE"
- Wait 30-60 seconds for changes to propagate

### Step 5: Update .env (Optional - for client_secret)

If you want to use client_secret (which can help with token exchange), add to `.env`:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

Then restart the dev server.

## Why Both?

- `http://localhost` - Some systems resolve to this
- `http://127.0.0.1` - More explicit, often more reliable for desktop apps
- Having both ensures it works regardless of how the browser resolves localhost

## Current Code Configuration:

The app now uses: `http://127.0.0.1` as the redirect URI (more reliable for desktop apps).

Make sure this is in your Google Console!

