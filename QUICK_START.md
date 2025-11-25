# Quick Start Guide - Running the Life Coach Agent

## Prerequisites Check ✅
- Python 3.14.0 ✅
- Node.js v24.10.0 ✅
- Rust 1.90.0 ✅

## Step-by-Step Setup

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
cd python-backend
pip install -r requirements.txt
cd ..
```

### 3. Create Environment File (Optional for Basic Testing)
The app can run without full OAuth/Supabase setup, but you'll need a `.env` file for Google OAuth to work.

Create `.env` in the project root:
```env
# Optional - Only needed for Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here

# Optional - Only needed for Supabase database features
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: You can test the app with email sign-in (mock) even without these!

### 4. Run the Application
```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server (port 3000)
- Launch the Tauri desktop window
- Automatically start the Python backend (port 14200)

## What You'll See

1. **Login Screen**: 
   - "Continue with Google" button (requires OAuth setup)
   - "Continue with Email" button (works without setup - mock auth)

2. **Dashboard** (after signing in):
   - Goal input form
   - Metrics overview (currently shows mock data)
   - Goal tracker calendar

3. **Backend Activity**:
   - Python backend runs on port 14200
   - Monitors active windows/apps
   - Provides system metrics

## Testing Without Full Setup

You can test the UI without Google OAuth or Supabase:

1. Click "Continue with Email" on login
2. Enter any email and password
3. You'll be signed in with a mock session
4. You can test the goal tracking UI (data won't persist to database)

## Troubleshooting

### Port 3000 already in use
```bash
npm run kill-port
# Then run tauri:dev again
```

### Python backend not starting
- Check if port 14200 is free: `lsof -i :14200`
- Check Python dependencies: `pip install -r python-backend/requirements.txt`

### Window monitoring not working (macOS)
- Grant accessibility permissions:
  - System Settings → Privacy & Security → Accessibility
  - Add Terminal/your IDE to allowed apps

### Tauri build errors
- Make sure Rust is up to date: `rustup update`
- Check Tauri CLI: `cargo install tauri-cli --locked`

## Next Steps

Once running, you can:
1. Test the UI components
2. See activity monitoring in console (backend logs)
3. Set up Google OAuth for real authentication
4. Set up Supabase for database persistence

