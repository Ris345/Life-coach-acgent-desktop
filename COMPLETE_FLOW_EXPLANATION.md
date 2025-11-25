# Complete Flow Explanation - How Metrics Work

## The Complete System

You have **3 components** working together:

1. **Python Backend** (port 14200) - Behavior tracking engine
2. **Rust/Tauri** - Desktop app container (starts Python backend)
3. **React Frontend** - UI that displays metrics

## How It Works (Step by Step)

### When You Start the App:

1. **Tauri starts** → Rust code runs
2. **Rust finds Python** → Looks for `python-backend/venv/bin/python3`
3. **Rust starts Python backend** → Runs `python main.py`
4. **Python backend starts** → FastAPI server on port 14200
5. **Behavior tracker initializes** → Empty state, ready to track
6. **React frontend loads** → Starts polling endpoints

### Every 2 Seconds (Real-Time Tracking):

```
┌─────────────────────────────────────────────────┐
│ 1. React polls /activity                        │
│    GET http://127.0.0.1:14200/activity          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. Python backend:                              │
│    - Detects active window (e.g., "Cursor")     │
│    - Records activity in tracker                │
│    - Returns window name                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. React polls /stats                           │
│    GET http://127.0.0.1:14200/stats             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. Python backend:                              │
│    - Calculates focus time                      │
│    - Updates streak                             │
│    - Returns statistics                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 5. React updates UI                             │
│    - Focus Time: 2.5m                           │
│    - Current Streak: 1.2m                       │
│    - Activities: 15                             │
└─────────────────────────────────────────────────┘
```

## Why You See 0s

If metrics show 0s, one of these is broken:

### Issue 1: Backend Not Running
**Check:** Look at terminal where you ran `npm run tauri:dev`
- Should see: `Python backend started successfully`
- Should see: `INFO: Uvicorn running on http://127.0.0.1:14200`

**Fix:** Backend should start automatically. If not:
```bash
cd python-backend
source venv/bin/activate
python main.py
```

### Issue 2: Window Detection Not Working
**Check:** Open browser console, look for:
- `✅ Activity: Cursor Category: ok` ← Good!
- `✅ Activity: null Category: ok` ← Bad! Window detection broken

**Fix (macOS):**
1. System Settings → Privacy & Security → Accessibility
2. Add Terminal (or your IDE) to allowed apps
3. Restart the app

### Issue 3: Frontend Can't Connect
**Check:** Browser console for errors:
- `Failed to fetch stats: ...` ← Connection issue
- CORS errors ← Backend CORS config

**Fix:** Verify backend is on port 14200:
```bash
curl http://127.0.0.1:14200/health
```

## Verification Checklist

Run through this checklist:

- [ ] Backend is running (check terminal output)
- [ ] Backend is on port 14200 (test with curl)
- [ ] Window detection works (check console logs)
- [ ] Frontend is polling (check console logs)
- [ ] Stats endpoint returns data (test with curl)
- [ ] Apps are being categorized (Cursor → focus)

## Quick Test Commands

```bash
# 1. Test backend health
curl http://127.0.0.1:14200/health

# 2. Test activity (should return your app name)
curl http://127.0.0.1:14200/activity

# 3. Poll activity 5 times to generate data
for i in {1..5}; do curl http://127.0.0.1:14200/activity; sleep 2; done

# 4. Check stats (should show numbers > 0)
curl http://127.0.0.1:14200/stats

# 5. Full endpoint test
cd python-backend
source venv/bin/activate
python test_endpoints.py
```

## Expected Console Output

When everything works, you should see in browser console:

```
✅ Activity: Cursor Category: ok
📊 Stats: { polls: 1, focus: 0.0m, streak: 0.0m, category: focus }
✅ Activity: Cursor Category: ok
📊 Stats: { polls: 2, focus: 0.0m, streak: 0.0m, category: focus }
✅ Activity: Cursor Category: ok
📊 Stats: { polls: 3, focus: 0.1m, streak: 0.1m, category: focus }
...
```

After 10-20 seconds:
```
📊 Stats: { polls: 10, focus: 0.3m, streak: 0.3m, category: focus }
📈 Summary: { focusPct: 100%, productiveApps: 1, distractingApps: 0 }
```

## The Behavior Engine IS Built

The engine exists and works. It's in:
- `python-backend/behavior/tracker.py` - Tracking logic
- `python-backend/behavior/categorizer.py` - App categorization
- `python-backend/main.py` - API endpoints

**It just needs to be running and tracking your activity.**

## Next Steps

1. **Start the app:** `npm run tauri:dev`
2. **Check console:** Look for activity logs
3. **Wait 20 seconds:** Let data accumulate
4. **Check metrics:** Should show increasing numbers

If still 0s after 20 seconds, see `DEBUG_METRICS.md` for detailed troubleshooting.

