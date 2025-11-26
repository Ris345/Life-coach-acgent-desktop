# LifeOS - AI-Powered Productivity Coach

A desktop application that helps you achieve your goals by tracking your behavior in real-time and providing AI-powered coaching insights.

## 🚀 Quick Start

```bash
# 1. Install Python dependencies
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Start the app
npm run tauri:dev
```

The app will automatically start the Python backend on port 14200.

## ✨ Features

### AI Goal Execution Engine
- **Natural Language Goals**: Just type "study AWS for 1 hour daily" and the AI understands
- **Real-Time Tracking**: Automatically tracks what you're doing every 2 seconds
- **Goal Alignment**: Shows how aligned your behavior is with your goals
- **Smart Nudges**: Gets notified when you drift from your goals (even when app is closed)
- **AI Coaching**: Weekly personalized reports with insights and recommendations

### How It Works

1. **Set a Goal**: Type your goal in natural language (e.g., "study AWS for 1 hour daily")
2. **AI Parses It**: Extracts category, topic, time requirements, and maps to a productivity profile
3. **Tracks Behavior**: Monitors active apps/windows and categorizes them (focus/distraction/neutral)
4. **Intervenes**: Sends nudges when you drift or celebrates milestones
5. **Coaches**: Generates weekly AI reports with personalized insights

## 📁 Project Structure

```
.
├── python-backend/          # FastAPI backend
│   ├── main.py              # API server
│   ├── behavior/            # Behavior tracking engine
│   │   ├── tracker.py       # Core tracking logic
│   │   ├── categorizer.py   # App categorization
│   │   ├── nudges.py        # Nudge generation
│   │   └── ai_coach.py      # AI coaching reports
│   ├── ai/                  # AI modules
│   │   ├── goal_parser.py   # Goal parsing (Ollama + rule-based)
│   │   └── daily_report.py  # Daily report generation
│   ├── profiles/            # Productivity profiles
│   │   ├── profiles.py      # Built-in profiles
│   │   └── profile_manager.py # Goal-to-profile mapping
│   └── nudges/              # Nudge engines
│       └── goal_nudges.py   # Goal-aware nudges
├── src-tauri/               # Tauri (Rust) app container
└── src/                     # React frontend
    ├── components/
    │   ├── Dashboard.tsx    # Main dashboard
    │   ├── GoalTracker.tsx  # Progress tracker
    │   └── MetricsOverview.tsx
    └── hooks/
        └── useAgent.ts      # Backend API hook
```

## 🎯 API Endpoints

### Core Endpoints
- `GET /activity` - Get current activity and behavior data (polled every 2s)
- `POST /goal` - Set a goal (triggers AI parsing and profile mapping)
- `GET /stats` - Get behavior statistics
- `GET /summary` - Get daily summary with top apps
- `GET /weekly_report` - Get AI coaching report
- `GET /report` - Get daily AI report

### Example: Setting a Goal

```bash
curl -X POST http://127.0.0.1:14200/goal \
  -H "Content-Type: application/json" \
  -d '{"goal": "study AWS for 1 hour daily", "daily_goal_minutes": 60}'
```

## 🔧 Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- Rust (latest stable)
- Tauri CLI: `npm install -g @tauri-apps/cli`

### Running Backend Manually

```bash
cd python-backend
source venv/bin/activate
python main.py
```

### Running Frontend Only

```bash
npm run tauri:dev
```

## 🧠 AI Features

### Goal Parser
- Uses Ollama (local LLM) if available, falls back to rule-based parsing
- Extracts: category, topic, target time, focus/distraction apps
- Example: "study AWS for 1 hour daily" → learning category, AWS topic, 60 min/day

### Goal Alignment Tracking
- Tracks time spent in goal-aligned apps
- Calculates alignment percentage (0-100%)
- Shows progress toward daily goal

### Smart Nudges
- Drift detection: "You drifted from 'Study AWS'. Want to refocus?"
- Streak milestones: "10-minute AWS streak. Building momentum."
- Progress updates: "You're 80% toward today's goal."
- Goal achieved: "Daily goal achieved — excellent consistency!"

### AI Coaching Reports
- Weekly personalized insights
- Celebrates wins and achievements
- Identifies patterns and distractions
- Provides actionable recommendations

## 📊 Data Persistence

Behavior data is automatically saved to:
- **macOS**: `~/Library/Application Support/LifeOS/data.json`
- **Windows**: `%APPDATA%\LifeOS\data.json`
- **Linux**: `~/.local/share/LifeOS/data.json`

Data persists across app restarts.

## 🔐 Privacy

- All processing is local (no cloud dependency)
- Optional Ollama integration for AI features (runs locally)
- No data sent to external servers
- Behavior data stored locally only

## 🐛 Troubleshooting

### Backend not starting
- Check port 14200: `lsof -i :14200`
- Ensure Python dependencies installed: `pip install -r requirements.txt`

### Window monitoring not working
- **macOS**: Grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility
- **Windows**: Install pygetwindow: `pip install pygetwindow`

### AI features not working
- Ollama is optional - app works with rule-based fallback
- To enable AI: Install Ollama and run `ollama pull llama3.1`

## 🏗️ Architecture Overview

### Backend (Python FastAPI)
- **Behavior Tracking**: Monitors active windows/apps every 2 seconds
- **AI Goal Parser**: Converts natural language goals to structured data
- **Goal Alignment**: Tracks how well behavior matches goals
- **Nudge Engine**: Generates contextual interventions
- **AI Coach**: Produces personalized weekly reports

### Frontend (React + TypeScript)
- **Dashboard**: Main UI with goal tracking and metrics
- **Real-Time Updates**: Polls backend every 2 seconds
- **Goal Progress**: Visual progress bars and alignment indicators
- **AI Reports**: Displays coaching insights

### Data Flow
1. User sets goal → AI parses → Profile created
2. Backend tracks activity → Categorizes apps → Updates metrics
3. Nudge engine checks conditions → Sends notifications
4. Weekly AI report generated → Displayed in UI

## 📚 Additional Documentation

- `PRODUCT_OVERVIEW.md` - Product vision, flow, and monetization strategy
