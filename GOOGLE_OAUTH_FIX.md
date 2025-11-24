# Fix Google OAuth Redirect URI Error

## Error: `400: invalid_request` - redirect_uri mismatch

This error means the redirect URI in your code doesn't match what's configured in Google Cloud Console.

## Current Redirect URI in Code:

```
http://localhost:3000/auth/callback
```

## How to Fix:

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID (use your Client ID from Google Cloud Console)
3. Click on it to edit

### Step 2: Add Authorized Redirect URIs

In the OAuth client settings, find the **"Authorized redirect URIs"** section and add:

```
http://localhost:3000/auth/callback
```

**Important:** 
- Add it EXACTLY as shown above (no trailing slash)
- Make sure there are no spaces
- Case-sensitive (localhost, not Localhost)

### Step 3: Save Changes

Click **"Save"** at the bottom of the page.

### Step 4: Wait a Few Seconds

Google's changes can take a few seconds to propagate.

### Step 5: Try Again

Restart your app and try signing in again.

## Alternative: Use Custom Protocol (Better for Desktop Apps)

For desktop apps, you can also use a custom protocol:

1. **In Google Console**, add this redirect URI:
   ```
   tauri://localhost
   ```

2. **Update the code** to use:
   ```typescript
   const redirectUri = 'tauri://localhost';
   ```

This is more secure for desktop apps, but requires additional setup to handle the protocol.

## Quick Check:

After adding the redirect URI, verify:
- ✅ No typos
- ✅ No trailing slashes
- ✅ Matches exactly: `http://localhost:3000/auth/callback`
- ✅ Saved the changes in Google Console

