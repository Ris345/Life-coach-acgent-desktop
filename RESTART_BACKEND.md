# 🔄 Restart Backend to See AI Changes

## The Issue
The backend server is running with old code. You need to restart it to see the AI Goal Execution Engine.

## How to Restart

### Option 1: If backend is running in a terminal
1. Go to the terminal where the backend is running
2. Press `Ctrl+C` to stop it
3. Run: `cd python-backend && source venv/bin/activate && python main.py`

### Option 2: Kill and restart
```bash
# Kill the old backend
pkill -f "python.*main.py"

# Start the new backend
cd python-backend
source venv/bin/activate
python main.py
```

## What You Should See After Restart

1. **When you set a goal**, check the backend terminal - you should see:
   ```
   🎯 Setting goal: study AWS for 1 hour daily
   ✅ Parsed goal: {'category': 'learning', 'topic': 'AWS', ...}
   ✅ Mapped to profile: AWS Study
   ✅ Goal set successfully
   ```

2. **In the UI**, you should see:
   - Goal Progress percentage
   - Goal Alignment bar
   - AI Coaching Report section
   - Goal-aware nudges

3. **Test the AI parser**:
   ```bash
   curl -X POST http://127.0.0.1:14200/goal \
     -H "Content-Type: application/json" \
     -d '{"goal": "study AWS for 1 hour daily", "daily_goal_minutes": 60}'
   ```
   
   Should return `parsed_goal` with AI-parsed data.

## Verify It's Working

After restarting, set a goal in the UI and check:
- Backend logs show AI parsing
- UI shows goal alignment metrics
- AI Coaching Report appears

