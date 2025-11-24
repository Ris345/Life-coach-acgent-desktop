# Debugging White Screen Issue

## Quick Checks

### 1. Check Browser Console
In the Tauri window:
- **macOS**: Right-click → Inspect Element, or `Cmd + Option + I`
- **Windows/Linux**: Right-click → Inspect, or `F12`

Look for:
- Red error messages
- Console logs (should see "React app mounted successfully" and "App mounted...")
- Network errors (check if `/activity` endpoint is being called)

### 2. Verify Backend is Running
```bash
curl http://127.0.0.1:14200/health
curl http://127.0.0.1:14200/activity
```

### 3. Check Vite Server
```bash
curl http://localhost:14201
```

### 4. Common Issues & Fixes

#### Issue: CORS Error
**Symptom**: Console shows "CORS policy" error
**Fix**: Backend CORS is configured, but check if Python backend is running

#### Issue: Network Error
**Symptom**: "Failed to fetch" in console
**Fix**: 
```bash
# Start Python backend
cd python-backend
python3 main.py
```

#### Issue: React Not Mounting
**Symptom**: No console logs at all
**Fix**: Check if `index.html` has `<div id="root"></div>`

#### Issue: CSS Not Loading
**Symptom**: Content shows but unstyled
**Fix**: Check browser console for CSS loading errors

### 5. Manual Test

Open browser console and run:
```javascript
// Check if React mounted
document.getElementById('root').innerHTML

// Check if styles loaded
getComputedStyle(document.body).backgroundColor

// Test backend connection
fetch('http://127.0.0.1:14200/activity').then(r => r.json()).then(console.log)
```

### 6. Restart Everything

```bash
# Kill all processes
pkill -f "vite|tauri|python.*main.py"

# Restart
cd python-backend && python3 main.py &
cd .. && npm run tauri:dev
```



