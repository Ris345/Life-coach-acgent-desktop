# White Screen Diagnostic Guide

## Step 1: Verify Vite is Running

Open a terminal and run:
```bash
curl http://127.0.0.1:3000
```

If this fails, Vite is not running. Start it with:
```bash
npm run dev
```

Wait until you see: `Local: http://127.0.0.1:3000/`

## Step 2: Open Tauri DevTools

When the Tauri app window opens:
1. Right-click anywhere in the window
2. Select "Inspect Element" (or press Cmd+Option+I on macOS)
3. This opens the Developer Tools

## Step 3: Check Console Tab

Look for these messages in order:
- ✅ "=== HTML SCRIPT LOADED ==="
- ✅ "🔵 main.tsx module script started executing"
- ✅ "=== MAIN.TSX LOADED ==="
- ✅ "App component rendering!"

**If you see NONE of these:**
- The HTML isn't loading at all
- Check the Network tab for failed requests
- Verify `devUrl` in `tauri.conf.json` matches Vite port

**If you see "HTML SCRIPT LOADED" but nothing else:**
- The module script isn't loading
- Check Network tab for `/src/main.tsx` request
- Look for red errors in Console

## Step 4: Check Network Tab

In DevTools, go to the **Network** tab:
1. Look for `/src/main.tsx` in the list
2. Check its status:
   - **200 (OK)**: File loaded successfully
   - **404 (Not Found)**: File path is wrong
   - **Failed/Blocked**: Network or CORS issue
   - **No request**: Script tag isn't executing

## Step 5: Check Current URL

In the Console tab, type:
```javascript
window.location.href
```

**Expected:** `http://127.0.0.1:3000/` or `http://127.0.0.1:3000/index.html`

**If it shows something else:**
- Tauri is loading the wrong URL
- Check `devUrl` in `tauri.conf.json`

## Step 6: Check Root Element

In the Console tab, type:
```javascript
document.getElementById('root')
```

**Expected:** Should return the root element

**If it returns `null`:**
- HTML structure is broken
- Check `index.html` file

## Step 7: Check if React is Available

In the Console tab, type:
```javascript
window.React
```

**Expected:** Should return React object (if module loaded)

**If it returns `undefined`:**
- React module hasn't loaded yet
- Check for import errors

## Step 8: Manual Browser Test

1. Start Vite: `npm run dev`
2. Open browser: `open http://127.0.0.1:3000`
3. Check if it works in regular browser

**If it works in browser but not Tauri:**
- Tauri configuration issue
- Check `tauri.conf.json` settings
- Check security/CSP settings

**If it doesn't work in browser either:**
- Frontend code issue
- Check Vite console for errors
- Check TypeScript compilation errors

## Common Issues & Solutions

### Issue: Completely white screen, no console logs
**Cause:** HTML isn't loading at all
**Solution:**
- Check if Vite is running
- Verify `devUrl` in `tauri.conf.json`
- Check terminal for Tauri errors

### Issue: Console shows "HTML SCRIPT LOADED" but nothing else
**Cause:** Module script isn't loading
**Solution:**
- Check Network tab for `/src/main.tsx` request
- Verify file exists at `src/main.tsx`
- Check for TypeScript compilation errors

### Issue: Module loads but React doesn't mount
**Cause:** React mounting error
**Solution:**
- Check Console for React errors
- Verify `App.tsx` exists and exports correctly
- Check for import errors in `main.tsx`

### Issue: Works in browser but not Tauri
**Cause:** Tauri-specific issue
**Solution:**
- Check `tauri.conf.json` security settings
- Verify CSP is set to `null`
- Check if `dangerousDisableAssetCspModification` is `true`

## Quick Test: Minimal HTML

If nothing works, try this minimal test:

1. Temporarily rename `index.html` to `index.html.backup`
2. Create a new `index.html` with just:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
  <style>
    body { background: #1a1d29; color: white; padding: 2rem; }
  </style>
</head>
<body>
  <h1>If you see this, HTML is loading!</h1>
  <script>
    console.log("Test script executed");
    document.body.innerHTML += "<p>JavaScript is working!</p>";
  </script>
</body>
</html>
```

3. Run `npm run tauri:dev`
4. If you see the test page, HTML loading works - the issue is with React/modules
5. If you still see white screen, the issue is with Tauri configuration

