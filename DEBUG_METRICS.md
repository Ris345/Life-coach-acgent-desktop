# Debug Guide: Metrics Not Showing

If you're seeing 0s for all metrics, follow these steps:

## Step 1: Verify Backend is Running

The Python backend MUST be running for metrics to work. Check:

```bash
# In python-backend directory
cd python-backend
source venv/bin/activate
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:14200
```

## Step 2: Test Backend Endpoints

In another terminal, test the endpoints:

```bash
cd python-backend
source venv/bin/activate
python test_endpoints.py
```

This will:
- Check if backend is running
- Poll /activity 3 times to generate data
- Show current stats
- Show summary

**Expected output:**
- Total polls: 3 (or more)
- Focus minutes: > 0 (if using Cursor/VSCode)
- Current category: "focus" (if using Cursor)

## Step 3: Check Window Detection

The backend needs to detect your active window. On macOS, this requires:

1. **Accessibility Permissions:**
   - System Settings → Privacy & Security → Accessibility
   - Add Terminal (or your IDE) to allowed apps
   - Restart the backend after granting permissions

2. **Test Window Detection:**
```bash
curl http://127.0.0.1:14200/activity
```

Should return:
```json
{
  "active_window": "Cursor",
  "platform": "Darwin",
  "status": "ok"
}
```

If `active_window` is `null`, window detection isn't working.

## Step 4: Check Frontend Console

Open browser DevTools (F12) and check Console tab. Look for:

- ✅ "Activity data received: ..." - Good, backend is connected
- ❌ "Failed to fetch stats: ..." - Backend connection issue
- ❌ CORS errors - Backend CORS config issue

## Step 5: Verify Data Flow

The flow should be:

1. **Frontend polls `/activity`** every 2 seconds
   - This records activity in the tracker
   - Returns current window

2. **Frontend polls `/stats`** every 2 seconds
   - Returns current statistics
   - Should show increasing numbers

3. **Frontend polls `/summary`** every ~10 seconds
   - Returns daily summary
   - Shows top apps

## Common Issues

### Issue 1: Backend Not Running
**Symptom:** All metrics show 0, console shows connection errors

**Fix:** Start the backend:
```bash
cd python-backend
source venv/bin/activate
python main.py
```

### Issue 2: Window Detection Not Working
**Symptom:** `active_window` is always `null`

**Fix:** 
- Grant accessibility permissions (macOS)
- Check if AppKit is installed: `pip install pyobjc`
- Restart backend after granting permissions

### Issue 3: No Data Accumulating
**Symptom:** Backend is running, but stats stay at 0

**Fix:**
- Make sure `/activity` is being called (check backend logs)
- Verify window detection is working
- Check if apps are being categorized correctly

### Issue 4: Frontend Can't Connect
**Symptom:** Console shows fetch errors

**Fix:**
- Verify backend is on port 14200
- Check CORS settings in main.py
- Try accessing http://127.0.0.1:14200/health in browser

## Quick Diagnostic Commands

```bash
# 1. Check if backend is running
curl http://127.0.0.1:14200/health

# 2. Test activity endpoint
curl http://127.0.0.1:14200/activity

# 3. Check stats
curl http://127.0.0.1:14200/stats

# 4. Check summary
curl http://127.0.0.1:14200/summary

# 5. Run full test
cd python-backend
source venv/bin/activate
python test_endpoints.py
```

## Expected Behavior

Once everything is working:

1. **Open Cursor** → Metrics should show:
   - Focus Time increasing
   - Current Streak growing
   - Activities incrementing
   - Current Activity: "Cursor [Focus]"

2. **Switch to YouTube** → Metrics should show:
   - Focus Time stops increasing
   - Streak resets to 0
   - Current Activity: "YouTube [Distraction]"

3. **Switch back to Cursor** → Metrics should show:
   - Focus Time resumes increasing
   - New streak starts
   - Current Activity: "Cursor [Focus]"

## Still Not Working?

1. Check backend logs for errors
2. Check browser console for errors
3. Verify all dependencies are installed
4. Try restarting both backend and frontend
5. Check if port 14200 is available: `lsof -i :14200`

