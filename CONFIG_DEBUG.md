# Tauri Configuration Debug Guide

## Config File Location
```
/Users/rishavacharya/Desktop/Lifecoachagent_desktop/src-tauri/tauri.conf.json
```

## Key Configuration Points

### 1. Build Configuration
```json
"build": {
  "beforeDevCommand": "npm run dev",    // Starts Vite
  "devUrl": "http://localhost:14201",   // URL Tauri loads in dev mode
  "beforeBuildCommand": "npm run build",
  "frontendDist": "../dist"             // Production build directory
}
```

**Important**: In Tauri v2, `devUrl` is automatically used in dev mode. Don't set `url` in window config during development.

### 2. Window Configuration
```json
"windows": [
  {
    "label": "main",        // Required: window identifier
    "title": "LifeOS",
    "width": 1200,
    "height": 800,
    "resizable": true
    // NO "url" field in dev mode - uses devUrl automatically
  }
]
```

### 3. Security Configuration
```json
"security": {
  "csp": null,                          // Disable CSP
  "dangerousDisableAssetCspModification": true  // Allow asset loading
}
```

## Common Issues

### Issue: Window shows blank/white screen
**Possible causes:**
1. `devUrl` doesn't match Vite port
2. Vite server not running when Tauri starts
3. Window has explicit `url` field conflicting with `devUrl`
4. CSP blocking content (should be `null`)

### Issue: Window loads wrong URL
**Check:**
- `devUrl` in `build` section
- Vite port in `vite.config.ts` (should match `devUrl` port)
- No `url` field in window config during dev

### Issue: Vite starts but Tauri doesn't load it
**Fix:**
- Ensure `beforeDevCommand` runs `npm run dev`
- Wait for "VITE ready" message before Tauri window opens
- Check terminal for Vite startup errors

## Verification Commands

```bash
# Check if config is valid JSON
cat src-tauri/tauri.conf.json | python3 -m json.tool

# Check Vite port
grep -A 3 "server:" vite.config.ts

# Check devUrl matches
grep "devUrl" src-tauri/tauri.conf.json
```

## Tauri v2 Dev Mode Flow

1. `beforeDevCommand` runs → starts Vite on port 14201
2. Tauri reads `devUrl` → `http://localhost:14201`
3. Window opens and navigates to `devUrl`
4. Vite serves React app from that URL

If any step fails, you get a white screen.



