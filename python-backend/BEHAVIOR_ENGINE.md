# Behavior Tracking Engine Documentation

## Overview

The Behavior Tracking Engine is the core intelligence system that powers the Life Coach Agent. It tracks user activity, categorizes apps, calculates focus streaks, and provides insights about productivity patterns.

## Architecture

```
python-backend/
├── behavior/
│   ├── __init__.py          # Module exports
│   ├── models.py            # Pydantic models (ActivityEvent, BehaviorStats, DailySummary)
│   ├── categorizer.py       # Window/app categorization logic
│   └── tracker.py           # Behavior tracking engine with streak logic
├── main.py                  # FastAPI server with integrated behavior tracker
└── test_behavior.py         # Test script
```

## Components

### 1. Models (`behavior/models.py`)

**ActivityEvent**: Represents a single activity event
- `timestamp`: When the event occurred
- `active_window`: Name of the active window/app
- `category`: "focus", "neutral", or "distraction"
- `duration_seconds`: Time spent in this window
- `streak_seconds`: Current streak duration
- `is_app_switch`: Whether this was an app switch

**BehaviorStats**: Current behavior statistics
- `total_focus_minutes`: Total time in focus category
- `total_distraction_minutes`: Total time in distraction category
- `total_neutral_minutes`: Total time in neutral category
- `total_polls`: Number of context polls
- `longest_focus_streak_seconds`: Longest continuous focus streak
- `current_streak_seconds`: Current streak duration
- `current_category`: Current category
- `app_switches`: Number of app switches

**DailySummary**: Daily summary with insights
- `date`: Date in YYYY-MM-DD format
- `total_focus_minutes`: Total focus time
- `total_distraction_minutes`: Total distraction time
- `longest_focus_streak_minutes`: Longest focus streak
- `top_distracting_apps`: Top 3 distracting apps
- `top_productive_apps`: Top 3 productive apps
- `focus_percentage`: Percentage of time in focus mode

### 2. Categorizer (`behavior/categorizer.py`)

Categorizes windows/apps into three categories:

**Focus Apps** (Productivity):
- Coding: Cursor, VSCode, PyCharm, IntelliJ, etc.
- Communication: Slack, Teams, Discord (work context)
- Design: Figma, Sketch, Adobe XD
- Note-taking: Notion, Obsidian, Roam
- Terminals: Terminal, iTerm, Alacritty

**Distraction Apps** (Entertainment):
- Social Media: YouTube, Instagram, TikTok, Twitter, Facebook, Reddit
- Streaming: Netflix, Hulu, Disney+
- Games: Steam, Epic Games, PlayStation, Xbox
- Entertainment: Twitch, Pinterest

**Neutral Apps** (System/Utility):
- System: Finder, Explorer, Settings
- Browsers: Safari, Chrome, Firefox (neutral by default)
- Utilities: Calendar, Mail, Messages

**Customization**: You can add custom keywords:
```python
categorizer.add_focus_keyword("my-custom-app")
categorizer.add_distraction_keyword("time-waster")
```

### 3. Tracker (`behavior/tracker.py`)

**BehaviorTracker**: Main tracking engine

**Key Features**:
- Records activity events with timestamps
- Detects app switches
- Calculates durations between polls
- Tracks focus streaks (resets on distraction)
- Maintains app usage statistics
- Provides statistics and summaries

**Streak Logic**:
- Streak continues if staying in same category
- Streak resets when category changes
- Tracks longest focus streak separately
- Current streak updates in real-time

**Methods**:
- `record_activity(window_title, timestamp)`: Record new activity
- `get_stats()`: Get current statistics
- `get_daily_summary()`: Get daily summary with top apps
- `get_recent_events(limit)`: Get recent activity log
- `reset()`: Reset all tracking data

## API Endpoints

### GET `/activity`
Get current active window and record activity in tracker.

**Response**:
```json
{
  "active_window": "Cursor",
  "platform": "Darwin",
  "status": "ok"
}
```

**Integration**: This endpoint is polled by the React frontend every 2 seconds. Each poll automatically records activity in the behavior tracker.

### GET `/behavior?limit=50`
Get recent behavior events (activity log).

**Query Parameters**:
- `limit` (optional): Maximum number of events to return (default: 50)

**Response**: Array of ActivityEvent objects
```json
[
  {
    "timestamp": "2024-01-15T10:30:00",
    "active_window": "Cursor",
    "category": "focus",
    "duration_seconds": 5.0,
    "streak_seconds": 120.0,
    "is_app_switch": false
  }
]
```

### GET `/stats`
Get current behavior statistics.

**Response**: BehaviorStats object
```json
{
  "total_focus_minutes": 45.5,
  "total_distraction_minutes": 12.3,
  "total_neutral_minutes": 8.2,
  "total_polls": 120,
  "longest_focus_streak_seconds": 1800.0,
  "current_streak_seconds": 300.0,
  "current_category": "focus",
  "app_switches": 15,
  "session_start": "2024-01-15T09:00:00"
}
```

### GET `/summary`
Get daily summary with top apps and insights.

**Response**: DailySummary object
```json
{
  "date": "2024-01-15",
  "total_focus_minutes": 45.5,
  "total_distraction_minutes": 12.3,
  "total_neutral_minutes": 8.2,
  "longest_focus_streak_minutes": 30.0,
  "top_distracting_apps": [
    {
      "app_name": "YouTube",
      "total_minutes": 8.5,
      "category": "distraction",
      "usage_count": 5
    }
  ],
  "top_productive_apps": [
    {
      "app_name": "Cursor",
      "total_minutes": 35.2,
      "category": "focus",
      "usage_count": 45
    }
  ],
  "total_app_switches": 15,
  "focus_percentage": 68.9
}
```

## Testing

### Test the Behavior Engine
```bash
cd python-backend
source venv/bin/activate
python test_behavior.py
```

### Test API Endpoints

1. **Start the server**:
```bash
cd python-backend
source venv/bin/activate
python main.py
```

2. **Test endpoints** (in another terminal):
```bash
# Health check
curl http://localhost:14200/health

# Get current activity (records in tracker)
curl http://localhost:14200/activity

# Get behavior log
curl http://localhost:14200/behavior?limit=10

# Get statistics
curl http://localhost:14200/stats

# Get daily summary
curl http://localhost:14200/summary
```

### Simulate Activity

Poll the `/activity` endpoint multiple times to simulate user activity:
```bash
# Poll 10 times (simulating 20 seconds of activity)
for i in {1..10}; do
  curl http://localhost:14200/activity
  sleep 2
done

# Then check stats
curl http://localhost:14200/stats
```

## Integration with Frontend

The React frontend (`src/hooks/useAgent.ts`) polls `/activity` every 2 seconds. This automatically feeds the behavior tracker.

To display behavior data in the UI:

1. **Update `useAgent.ts`** to also fetch stats:
```typescript
const statsResponse = await fetch("http://127.0.0.1:14200/stats");
const stats = await statsResponse.json();
```

2. **Update `Dashboard.tsx`** to use real stats:
```typescript
// Replace mocked metrics with real data
const focusTime = stats.total_focus_minutes;
const activityCount = stats.total_polls;
```

3. **Display streaks and insights**:
```typescript
const currentStreak = stats.current_streak_seconds / 60; // minutes
const longestStreak = stats.longest_focus_streak_seconds / 60; // minutes
```

## Future Enhancements

1. **Persistence**: Save behavior data to database (Supabase)
2. **AI Coaching**: Use behavior patterns to generate coaching insights
3. **Time-based Rules**: Different categorization rules for different times of day
4. **User Customization**: Allow users to customize app categories
5. **Historical Analysis**: Track patterns over days/weeks
6. **Goal Integration**: Link behavior tracking to user goals

## Error Handling

All endpoints include error handling:
- Errors are logged to console
- Endpoints return empty/default data on error
- Backend remains stable even if tracking fails
- Health check endpoint always works

## Performance

- **In-memory tracking**: Fast, no database overhead
- **Event limit**: Recent events only (configurable)
- **Efficient categorization**: Regex patterns compiled once
- **Minimal overhead**: ~1ms per activity record

## Notes

- Tracking starts when first activity is recorded
- Streaks reset when category changes
- Duration is capped at 5 minutes per poll (handles idle periods)
- App usage statistics are aggregated automatically
- All timestamps are in UTC

