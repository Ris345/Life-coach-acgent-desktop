# Supabase Backend Setup Guide

This guide will help you set up Supabase as the backend for the Life Coach Agent Desktop app.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Life Coach Agent (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be provisioned

## 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL**: Copy this (e.g., `https://xxxxx.supabase.co`)
   - **anon public key**: Copy this (starts with `eyJ...`)

## 3. Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates:
- `users` table (for user metadata)
- `goals` table (for user goals)
- `goal_progress` table (for tracking daily progress)
- `metrics` table (for storing system metrics)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-updating timestamps

## 4. Configure Environment Variables

Add these to your `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth (existing)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important**: 
- Replace `your-project-id` with your actual Supabase project URL
- Replace `your-anon-key-here` with your actual anon public key
- Never commit `.env` to version control (it should be in `.gitignore`)

## 5. Verify Setup

The backend module is located at `src/lib/supabase.ts` and provides these functions:

### Goal Functions
- `createGoal(userId, data)` - Create a new goal
- `getGoals(userId)` - Get all goals for a user
- `getGoal(goalId, userId)` - Get a single goal
- `updateGoal(goalId, userId, data)` - Update a goal
- `deleteGoal(goalId, userId)` - Delete a goal

### Progress Functions
- `recordProgress(goalId, userId, data)` - Record progress for a date
- `getGoalProgress(goalId, userId)` - Get all progress for a goal
- `deleteProgress(goalId, userId, date)` - Delete progress entry

### Metrics Functions
- `recordMetric(userId, data)` - Record a metric
- `getMetrics(userId, options?)` - Get metrics with optional filters
- `getLatestMetric(userId, metricType)` - Get latest metric of a type

### User Functions
- `getOrCreateUser(userId, email)` - Get or create user record

## 6. Initialize Supabase in Your App

In your app initialization (e.g., in `App.tsx` or a context), call:

```typescript
import { initSupabase } from './lib/supabase';

// Initialize Supabase (call once at app startup)
initSupabase();

// If you have an auth token from Google OAuth:
// initSupabase(accessToken);
```

## 7. Row Level Security (RLS)

The schema includes RLS policies that ensure:
- Users can only see/modify their own data
- All queries are automatically filtered by `user_id`
- No user can access another user's goals or metrics

## 8. Testing the Connection

You can test the connection by importing and calling the functions:

```typescript
import { initSupabase, getGoals } from './lib/supabase';

// Initialize
initSupabase();

// Test (replace with actual userId)
try {
  const goals = await getGoals('user-id-here');
  console.log('Goals:', goals);
} catch (error) {
  console.error('Error:', error);
}
```

## Troubleshooting

### Error: "Missing Supabase credentials"
- Make sure `.env` file exists and has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after adding env variables
- Check that variable names start with `VITE_`

### Error: "Failed to fetch goals"
- Verify the schema was run successfully in Supabase SQL Editor
- Check that RLS policies are enabled (they should be from the schema)
- Verify your Supabase project URL and anon key are correct

### Error: "Goal not found or access denied"
- This usually means the goal doesn't exist or doesn't belong to the user
- Check that you're using the correct `userId` from your auth system

## Next Steps

1. Integrate Supabase functions into your Dashboard component
2. Replace mocked data with real database calls
3. Add error handling and loading states in your UI
4. Consider adding real-time subscriptions for live updates

