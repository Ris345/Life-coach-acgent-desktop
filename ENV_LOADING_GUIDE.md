# How .env File Loading Works in Vite

## Important: Vite loads .env files at STARTUP, not runtime!

### How It Works:

1. **Vite reads `.env` files when the dev server STARTS**
2. **Only variables prefixed with `VITE_` are exposed to your code**
3. **You access them via `import.meta.env.VITE_GOOGLE_CLIENT_ID`**
4. **Changes to `.env` require RESTARTING the dev server**

## Your Current Setup:

✅ **`.env` file exists** at: `/Users/rishavacharya/Desktop/Lifecoachagent_desktop/.env`

✅ **Contains:**
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

✅ **Vite config** has `envPrefix: ["VITE_", "TAURI_"]` - correct!

## The Problem:

If the `.env` file was created or modified **AFTER** you started `npm run tauri:dev`, Vite won't see the changes until you restart.

## Solution:

1. **Stop the dev server** (Ctrl+C in the terminal running `npm run tauri:dev`)
2. **Verify `.env` file** has the correct Client ID
3. **Restart the dev server**: `npm run tauri:dev`

## How to Verify .env is Loading:

When you click "Continue with Google", check the browser console (Cmd+Option+I). You should see:

```
🔍 Environment Variables Check: {
  hasClientId: true,
  clientIdValue: "your-client-id-prefix...",
  clientIdLength: 72,
  ...
}
```

If you see `hasClientId: false` or `clientIdValue: "NOT SET"`, then:
- The `.env` file wasn't loaded
- You need to restart the dev server
- Or the variable name is wrong (must be `VITE_GOOGLE_CLIENT_ID`)

## Debugging Steps:

1. **Check `.env` file exists and has correct format:**
   ```bash
   cat .env
   ```

2. **Verify it's in the project root** (same folder as `package.json`)

3. **Check for typos:**
   - Must be `VITE_GOOGLE_CLIENT_ID` (not `GOOGLE_CLIENT_ID`)
   - No spaces around the `=`
   - No quotes needed (unless the value has spaces)

4. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run tauri:dev
   ```

5. **Check console logs** when clicking "Continue with Google"

## Common Issues:

- ❌ **Created `.env` after starting server** → Restart required
- ❌ **Wrong variable name** → Must start with `VITE_`
- ❌ **`.env` in wrong location** → Must be in project root
- ❌ **Spaces in `.env` file** → `VITE_GOOGLE_CLIENT_ID = value` (wrong) vs `VITE_GOOGLE_CLIENT_ID=value` (correct)

