# Desktop App OAuth Configuration

## For Desktop Apps in Google Cloud Console

Since this is a **Desktop app**, you need to configure it differently than web apps.

## Step 1: Verify OAuth Client Type

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth client (use your Client ID from Google Cloud Console)
3. **Check the Application type** - it should say **"Desktop app"**

If it says "Web application", you have two options:
- **Option A**: Create a new OAuth client with type "Desktop app"
- **Option B**: Keep using it but add the redirect URI below

## Step 2: Add Authorized Redirect URIs

For Desktop apps, Google allows these redirect URIs:

### Option 1: localhost (Recommended)
```
http://localhost
```

### Option 2: 127.0.0.1
```
http://127.0.0.1
```

### Option 3: Custom Protocol (Advanced)
```
tauri://localhost
```

## Step 3: Add to Google Console

1. Click on your OAuth client to edit
2. Scroll to **"Authorized redirect URIs"**
3. Click **"+ ADD URI"**
4. Add: `http://localhost` (exactly as shown, no trailing slash)
5. Click **"SAVE"**

## Important Notes:

- ✅ Desktop apps can use `http://localhost` (no port, no path)
- ✅ This is different from web apps which need `http://localhost:3000/auth/callback`
- ✅ The redirect will go to `http://localhost/?code=...&state=...`
- ✅ Your browser might show "This site can't be reached" - that's normal!
- ✅ Just copy the URL from the address bar

## Current Code Configuration:

The app is now configured to use:
- **Redirect URI**: `http://localhost`
- **This matches desktop app OAuth requirements**

## After Adding in Google Console:

1. Wait 10-30 seconds for changes to propagate
2. Try signing in again
3. When redirected, copy the URL from browser address bar (even if page shows error)
4. Paste it in the prompt

