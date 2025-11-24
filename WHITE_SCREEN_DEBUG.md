# White Screen Debugging Guide

## Step 1: Restart Everything Clean

```bash
# Kill all processes
pkill -f "vite|tauri|node.*14201"

# Wait a moment
sleep 2

# Start fresh
cd ~/Desktop/Lifecoachagent_desktop
npm run tauri:dev
```

## Step 2: Open Developer Console

**In the Tauri window:**
- Right-click anywhere → "Inspect Element"
- OR press `Cmd + Option + I` (macOS)
- OR `F12` / `Ctrl + Shift + I`

## Step 3: Check Console Messages

You should see:
- ✅ "HTML loaded, waiting for React..."
- ✅ "React app mounted successfully"
- ✅ "App component rendering!"

If you see errors, note them down.

## Step 4: Check Network Tab

In DevTools, go to **Network** tab:
- Look for failed requests (red)
- Check if `main.tsx` is loading
- Check if `App.tsx` is loading

## Step 5: Check What's Actually Loading

In the console, type:
```javascript
// Check if root element exists
document.getElementById('root')

// Check what's in the root
document.getElementById('root').innerHTML

// Check if React is loaded
window.React

// Check current URL
window.location.href
```

## Step 6: Manual Test

Open in regular browser:
```bash
# Start Vite manually
npm run dev

# Then open in browser
open http://localhost:14201
```

If it works in browser but not in Tauri, it's a Tauri configuration issue.

## Step 7: Check Tauri Window URL

In Tauri DevTools console:
```javascript
window.location.href
```

Should show: `http://localhost:14201/`

If it shows something else, that's the problem.

## Common Issues

### Issue: "Failed to fetch" or Network Error
**Fix**: Vite server isn't running. Check terminal for Vite output.

### Issue: "Cannot find module"
**Fix**: TypeScript compilation error. Check terminal for errors.

### Issue: Blank page, no console logs
**Fix**: Tauri might not be loading the URL. Check `tauri.conf.json` `devUrl`.

### Issue: CSP Error
**Fix**: Content Security Policy blocking. Already set to `null` in config.

## Quick Fix: Try This

1. **Stop everything**: `pkill -f "vite|tauri"`
2. **Start Vite manually first**:
   ```bash
   npm run dev
   ```
   Wait until you see: `Local: http://localhost:14201/`
3. **In another terminal, start Tauri**:
   ```bash
   npm run tauri:dev
   ```

This ensures Vite is ready before Tauri tries to load it.



