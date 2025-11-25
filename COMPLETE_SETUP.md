# 🚀 Complete Setup Guide - LifeOS MVP

## ✅ What's Been Built

You now have a **complete, production-ready LifeOS MVP** with:

1. ✅ **Data Persistence** - Saves to `~/.lifeos/data.json`
2. ✅ **Browser Extension** - Ready to install
3. ✅ **AI Coaching** - Ollama integration (optional)
4. ✅ **Weekly Reports** - AI-powered insights
5. ✅ **Beautiful UI** - Connected, flowing design

## 🎯 Quick Start

### 1. Start the App

```bash
# Terminal 1: Backend
cd python-backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
npm run tauri:dev
```

### 2. Install Browser Extension (Optional but Recommended)

**Chrome/Edge:**
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `browser-extension/` folder

**Test:**
- Open YouTube → Should track as distraction
- Open AWS docs → Should track as focus

### 3. Set Up AI Coaching (Optional)

**Install Ollama:**
```bash
brew install ollama  # macOS
# OR download from https://ollama.ai
```

**Start Ollama:**
```bash
ollama serve
```

**Download Model:**
```bash
ollama pull llama3.2
```

**Test:**
```bash
curl http://127.0.0.1:14200/weekly_report
```

## 📁 Data Storage

Your data is saved to: `~/.lifeos/data.json`

**What's saved:**
- All activity events
- Current goal and profile
- App usage statistics
- Streaks and progress
- Session state

**Auto-saves:**
- Every 30 seconds during active tracking
- On app shutdown
- On goal changes

## 🧪 Test the Complete Flow

1. **Set a goal:** "Study AWS"
2. **Use Cursor** for 10+ minutes
   - Should see: Focus time increase
   - Should see: Streak nudge + notification
3. **Switch to YouTube**
   - Should see: Drift nudge + notification
4. **Complete 60 min focus**
   - Should see: Day auto-marks complete
   - Should see: Progress tracker update
5. **Check weekly report**
   - Should see: AI-generated insights (if Ollama running)
   - Or: Fallback report (if Ollama not running)

## 🎨 UI Features

- **Hero Section:** Goal + Live Activity
- **Metrics Dashboard:** Focus time, streaks, app switches
- **Progress Tracker:** Weekly/monthly progress with auto-completion
- **AI Weekly Report:** Personalized coaching insights
- **Nudge Banner:** Real-time coaching messages
- **macOS Notifications:** System notifications for nudges

## 🔧 Configuration

### Change Data Location

Edit `python-backend/behavior/persistence.py`:
```python
self.data_dir = Path("/custom/path")
```

### Change AI Model

Edit `python-backend/behavior/ai_coach.py`:
```python
self.model = "llama3.1:8b"  # Use larger model
```

### Disable Persistence

Edit `python-backend/main.py`:
```python
behavior_tracker = BehaviorTracker(enable_persistence=False)
```

## 🐛 Troubleshooting

**Data not persisting:**
- Check `~/.lifeos/data.json` exists
- Check file permissions
- Check backend logs for errors

**Browser extension not working:**
- Verify backend is running on port 14200
- Check browser console for errors
- Test endpoint: `curl -X POST http://127.0.0.1:14200/browser_tab -H "Content-Type: application/json" -d '{"url":"https://youtube.com"}'`

**AI reports not generating:**
- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Check model is downloaded: `ollama list`
- Falls back to rule-based reports if Ollama unavailable

## 📊 What's Next

You're ready to:
1. ✅ Use the app daily
2. ✅ Track your productivity
3. ✅ Get AI coaching insights
4. ✅ Build better habits

**Future enhancements:**
- Historical analytics
- Goal templates
- Focus sessions (Pomodoro)
- Team features
- Premium features

## 🎉 You're All Set!

Your LifeOS MVP is **complete and ready to use**. Everything is connected:
- Goals → Tracking → Progress → AI Coaching

Start using it and watch your productivity improve! 🚀

