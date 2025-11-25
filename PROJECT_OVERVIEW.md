# Life Coach Agent - Complete Project Overview

## 🎯 What This Project Is

A **desktop life coaching application** that helps users:
- Set and track personal goals (daily, weekly, monthly)
- Monitor their computer activity and focus time
- Get insights into their productivity patterns
- Track progress toward their goals

## 🏗️ Architecture Overview

This is a **hybrid desktop application** with three main layers:

```
┌─────────────────────────────────────────┐
│   Frontend: React + TypeScript          │
│   (Tauri WebView)                       │
│   - UI Components                       │
│   - Authentication                      │
│   - Goal Management                     │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
               │ (localhost:14200)
┌──────────────▼──────────────────────────┐
│   Backend: Python FastAPI               │
│   (Sidecar Process)                     │
│   - Activity Monitoring                 │
│   - System Metrics                      │
│   - Window Tracking                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Container: Tauri (Rust)               │
│   - Process Management                  │
│   - Window Management                   │
│   - Native OS Integration               │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
life-coach-agent/
├── src/                          # React Frontend
│   ├── App.tsx                   # Main app component (auth routing)
│   ├── main.tsx                  # React entry point
│   ├── components/               # UI Components
│   │   ├── Dashboard.tsx         # Main dashboard (goal input, metrics, tracker)
│   │   ├── GoalInput.tsx         # Goal creation form
│   │   ├── GoalTracker.tsx       # Visual progress tracker (calendar view)
│   │   ├── MetricsOverview.tsx   # Metrics display cards
│   │   └── Login.tsx             # Authentication UI
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication state management
│   ├── hooks/
│   │   └── useAgent.ts           # Polls Python backend for activity data
│   ├── lib/
│   │   └── supabase.ts           # Supabase database client & functions
│   ├── types/
│   │   └── database.ts           # TypeScript types for DB schema
│   └── utils/
│       └── envCheck.ts           # Environment variable validation
│
├── python-backend/               # Python FastAPI Sidecar
│   ├── main.py                   # FastAPI server (port 14200)
│   └── requirements.txt          # Python dependencies
│
├── src-tauri/                    # Tauri Rust Application
│   ├── src/
│   │   └── main.rs               # Rust code (process management, window handling)
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── supabase/
│   └── schema.sql                # Database schema (PostgreSQL)
│
└── Configuration Files
    ├── package.json              # Node.js dependencies & scripts
    ├── vite.config.ts            # Vite build configuration
    └── tsconfig.json             # TypeScript configuration
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tauri v2** - Desktop app framework

### Backend
- **Python 3.10+** - Backend language
- **FastAPI** - Web framework
- **psutil** - System metrics
- **AppKit (macOS)** / **pygetwindow (Windows)** - Window monitoring

### Database
- **Supabase** - PostgreSQL database with:
  - Row Level Security (RLS)
  - Authentication (Google OAuth)
  - Real-time capabilities (not yet used)

### Container
- **Rust** - Tauri framework
- **Tauri Store Plugin** - Local storage for auth sessions

## 🔑 Key Features

### 1. Authentication System
- **Google OAuth** - Sign in with Google account
- **Email/Password** - Mock implementation (ready for backend)
- **Session Persistence** - Uses Tauri Store to save sessions locally
- **Auth Flow**: Opens browser → User signs in → Redirects to localhost → User pastes URL → App extracts token

**Location**: `src/contexts/AuthContext.tsx`

### 2. Goal Management
- **Create Goals** - Set goals with timeframes (day/week/month)
- **Track Progress** - Visual calendar tracker
- **Progress States** - On track / Off track per day
- **Database Integration** - Goals stored in Supabase

**Components**: 
- `GoalInput.tsx` - Goal creation form
- `GoalTracker.tsx` - Visual progress calendar
- `Dashboard.tsx` - Orchestrates goal management

**Database Functions**: `src/lib/supabase.ts` (createGoal, getGoals, updateGoal, deleteGoal)

### 3. Activity Monitoring
- **Active Window Tracking** - Monitors which app/window is active
- **System Metrics** - CPU, memory, disk usage
- **Real-time Polling** - Frontend polls backend every 2 seconds
- **Platform Support**:
  - macOS: Uses AppKit (NSWorkspace)
  - Windows: Uses pygetwindow
  - Linux: Not fully implemented

**Backend Endpoints**:
- `GET /health` - Health check
- `GET /activity` - Current active window
- `GET /metrics` - System metrics

**Frontend Hook**: `src/hooks/useAgent.ts` - Polls `/activity` endpoint

### 4. Metrics Dashboard
- **Focus Time** - Currently mocked (145 minutes)
- **Activity Count** - Currently mocked (12 activities)
- **Goal Overview** - Shows current active goal
- **Visual Cards** - Clean metric display

**Component**: `src/components/MetricsOverview.tsx`

## 🗄️ Database Schema

### Tables (Supabase PostgreSQL)

1. **users** - User metadata
   - `id` (UUID, references auth.users)
   - `email` (TEXT)
   - `created_at`, `updated_at`

2. **goals** - User goals
   - `id` (UUID)
   - `user_id` (UUID, FK to users)
   - `title` (TEXT)
   - `timeframe` (day/week/month)
   - `start_date`, `end_date` (DATE)
   - `created_at`, `updated_at`

3. **goal_progress** - Daily progress tracking
   - `id` (UUID)
   - `goal_id` (UUID, FK to goals)
   - `date` (DATE)
   - `status` (on_track/off_track)
   - `created_at`, `updated_at`
   - Unique constraint: (goal_id, date)

4. **metrics** - Flexible metrics storage
   - `id` (UUID)
   - `user_id` (UUID, FK to users)
   - `metric_type` (TEXT) - e.g., "focus_time", "activity_count"
   - `value` (NUMERIC)
   - `recorded_at` (TIMESTAMPTZ)
   - `metadata` (JSONB) - Flexible additional data

### Security
- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Policies enforce user_id matching auth.uid()

**Schema File**: `supabase/schema.sql`

## 🔄 Data Flow

### Authentication Flow
```
1. User clicks "Sign in with Google"
2. App opens browser with OAuth URL
3. User signs in → Google redirects to localhost
4. User copies redirect URL from browser
5. App extracts authorization code
6. App exchanges code for access token
7. App fetches user info from Google
8. App saves session to Tauri Store
9. User is authenticated
```

### Activity Monitoring Flow
```
1. Tauri app starts → Rust spawns Python process
2. Python FastAPI starts on port 14200
3. React app polls /activity every 2 seconds
4. Python backend queries OS for active window
5. Response sent back to React
6. React updates UI (currently not displayed)
```

### Goal Tracking Flow
```
1. User creates goal in Dashboard
2. GoalInput component calls onGoalSubmit
3. Dashboard stores goal in state (currently local)
4. GoalTracker displays calendar view
5. User clicks days to mark as "on track"
6. State updates (not yet persisted to DB)
```

**Note**: Goal persistence to Supabase is implemented but not yet connected to UI!

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **Python 3.10+**
- **Rust** (latest stable)
- **Tauri CLI**: `cargo install tauri-cli` or `npm install -g @tauri-apps/cli`

### Setup Steps

1. **Install Node dependencies**
   ```bash
   npm install
   ```

2. **Install Python dependencies**
   ```bash
   cd python-backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up environment variables**
   Create `.env` file in project root:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a Supabase project
   - Run `supabase/schema.sql` in SQL Editor
   - Get URL and anon key from Settings → API

5. **Set up Google OAuth**
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials (Desktop app type)
   - Add redirect URI: `http://127.0.0.1` or `http://localhost`
   - Copy Client ID and Secret to `.env`

6. **Run the app**
   ```bash
   npm run tauri:dev
   ```
   This will:
   - Start Vite dev server (port 3000)
   - Start Tauri app
   - Automatically spawn Python backend (port 14200)

## 📝 Current State & What's Missing

### ✅ What's Working
- [x] Tauri desktop app framework
- [x] React UI with authentication
- [x] Google OAuth flow (manual URL paste)
- [x] Python backend with activity monitoring
- [x] System metrics collection
- [x] Goal UI components (input, tracker, dashboard)
- [x] Supabase database schema
- [x] Database client functions (typed, ready to use)
- [x] Session persistence (Tauri Store)

### ⚠️ What's Partially Working
- [ ] Goal persistence - UI doesn't save to database yet
- [ ] Metrics display - Shows mocked data, not real metrics
- [ ] Activity display - Backend works, but UI doesn't show it
- [ ] Supabase integration - Client ready, but not connected to auth

### ❌ What's Missing
- [ ] Connect goal creation to Supabase
- [ ] Connect goal progress tracking to Supabase
- [ ] Display real activity data from backend
- [ ] Display real metrics from backend
- [ ] Connect Supabase auth to Google OAuth flow
- [ ] Real-time metrics collection and storage
- [ ] Goal completion analytics
- [ ] Activity-based insights
- [ ] Notifications/reminders

## 🎯 Where to Start Development

### Priority 1: Connect Goals to Database
**Files to modify**:
- `src/components/Dashboard.tsx` - Add Supabase calls
- `src/components/GoalInput.tsx` - Save to DB on submit
- `src/components/GoalTracker.tsx` - Load/save progress from DB

**What to do**:
1. Import Supabase functions from `src/lib/supabase.ts`
2. Replace local state with database calls
3. Load goals on Dashboard mount
4. Save goal progress when user clicks days

### Priority 2: Display Real Activity Data
**Files to modify**:
- `src/components/Dashboard.tsx` - Display activity from useAgent hook
- `src/hooks/useAgent.ts` - Already polling, just need to display

**What to do**:
1. Use `context` from `useAgent()` hook
2. Display active window name in UI
3. Show activity history/chart

### Priority 3: Connect Metrics to Backend
**Files to modify**:
- `src/components/MetricsOverview.tsx` - Fetch real metrics
- `python-backend/main.py` - Add metrics collection logic
- `src/lib/supabase.ts` - Store metrics in database

**What to do**:
1. Calculate focus time from activity data
2. Store metrics in Supabase
3. Display real metrics in dashboard

### Priority 4: Integrate Supabase Auth
**Files to modify**:
- `src/contexts/AuthContext.tsx` - Use Supabase auth instead of custom
- `src/lib/supabase.ts` - Initialize with Supabase auth

**What to do**:
1. Replace custom OAuth flow with Supabase Auth
2. Use Supabase session for database access
3. Simplify authentication code

## 🔍 Key Files to Understand

### For Frontend Development
- `src/App.tsx` - Main routing logic (auth vs dashboard)
- `src/components/Dashboard.tsx` - Main UI orchestrator
- `src/contexts/AuthContext.tsx` - Authentication state
- `src/lib/supabase.ts` - Database functions (ready to use!)

### For Backend Development
- `python-backend/main.py` - FastAPI endpoints
- `src/hooks/useAgent.ts` - How frontend calls backend

### For Tauri/Rust Development
- `src-tauri/src/main.rs` - Process management, window handling

### For Database
- `supabase/schema.sql` - Complete database schema
- `src/types/database.ts` - TypeScript types matching schema

## 🐛 Common Issues & Solutions

### Backend not starting
- Check Python installation: `python3 --version`
- Check port 14200 is free: `lsof -i :14200`
- Check dependencies: `pip install -r python-backend/requirements.txt`

### Window monitoring not working (macOS)
- Grant accessibility permissions: System Preferences → Security & Privacy → Privacy → Accessibility
- Add Terminal/IDE to allowed apps

### OAuth not working
- Check `.env` file exists and has correct values
- Restart dev server after changing `.env`
- Verify Google OAuth app is "Desktop app" type
- Check redirect URI matches exactly

### Supabase connection issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Check Supabase project is active
- Verify RLS policies are set up correctly

## 📚 Additional Documentation

The project includes several markdown files with specific guides:
- `GOOGLE_OAUTH_SETUP.md` - Detailed OAuth setup
- `SUPABASE_SETUP.md` - Database setup guide
- `DESKTOP_OAUTH_SETUP.md` - Desktop OAuth specifics
- Various debug guides for troubleshooting

## 🎨 UI Design

- **Color Scheme**: Dark theme (#1a1d29 background, #252936 cards)
- **Accent Colors**: Blue (#3b82f6), Green (#10b981)
- **Typography**: System fonts
- **Layout**: Responsive grid, centered max-width container
- **Components**: Inline styles (consider migrating to CSS modules or styled-components)

## 🔐 Security Considerations

- **OAuth State Verification** - Implemented in AuthContext
- **Row Level Security** - Database-level security in Supabase
- **Local Storage** - Sensitive data stored in Tauri Store (encrypted)
- **CORS** - Backend restricts origins to localhost
- **Environment Variables** - Secrets in `.env` (not committed)

---

**Last Updated**: Based on current codebase state
**Branch**: josh-dev

