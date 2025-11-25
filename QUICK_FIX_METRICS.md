# Quick Fix: Metrics Showing 0s

## The Problem

You're seeing 0s because the backend needs to be running AND tracking your activity. The behavior engine exists, but it needs to be actively running.

## The Solution (3 Steps)

### Step 1: Start the Backend

**In Terminal 1:**
```bash
cd python-backend
source venv/bin/activate
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:14200
```

**Keep this terminal open!** The backend must stay running.

### Step 2: Start the Frontend

**In Terminal 2:**
```bash
npm run tauri:dev
```

### Step 3: Verify It's Working

1. **Check the browser console** (F12 → Console tab)
   - You should see logs like:
     - `✅ Activity: Cursor Category: ok`
     - `📊 Stats: { polls: 5, focus: 0.2m, streak: 0.1m }`

2. **Wait 10-20 seconds**
   - Metrics should start showing numbers
   - Focus time should increase if you're using Cursor
   - Activities count should increment

3. **If still showing 0s:**
   - Check if window detection works:
     ```bash
     curl http://127.0.0.1:14200/activity
     ```
   - Should return your active app name
   - If it returns `null`, grant accessibility permissions (macOS)

## Why This Happens

The behavior engine tracks activity **in real-time** as you use apps. It needs:
1. ✅ Backend running (to track activity)
2. ✅ Frontend polling (to get stats)
3. ✅ Window detection working (to see what app you're using)

All three must be working together.

## Quick Test

Run this to verify everything works:

```bash
cd python-backend
source venv/bin/activate
python test_endpoints.py
```

This will:
- Check if backend is running
- Generate some test data
- Show current stats

If this works but UI still shows 0s, the issue is in the frontend connection.

## Still Not Working?

See `DEBUG_METRICS.md` for detailed troubleshooting.

