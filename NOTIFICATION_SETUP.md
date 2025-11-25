# Notification Setup Guide

## How Notifications Work

Your LifeOS app sends **native system notifications** (notification banners) that appear even when the app is:
- Minimized
- In the background
- Not visible
- On another desktop/space

## Current Implementation

### macOS (Your System)
- Uses `osascript` to send notifications via macOS Notification Center
- Appears as a **notification banner** in the top-right corner
- Makes a sound (default system sound)
- Works even when app is closed/minimized

### How It Works

1. **Backend generates nudge** (e.g., "🔥 10-minute streak!")
2. **Frontend receives nudge** in `/activity` response
3. **Frontend calls Tauri command** `notify_user`
4. **Tauri runs osascript** to send macOS notification
5. **Notification appears** as system banner

## Testing Notifications

### 1. Enable Notifications (macOS)

**System Settings:**
1. Open **System Settings** → **Notifications**
2. Find **LifeOS** (or your app name)
3. Enable:
   - ✅ Allow Notifications
   - ✅ Lock Screen
   - ✅ Notification Center
   - ✅ Banners (or Alerts)

### 2. Test Notification

**Trigger a nudge:**
1. Set a goal: "Study AWS"
2. Use Cursor for 10+ minutes
3. You should see: "🔥 10-minute streak!" notification

**Or trigger drift:**
1. Use Cursor (focus app)
2. Switch to YouTube
3. You should see: "⚠️ You drifted from your goal..." notification

### 3. Verify It Works

**Check if notification appears:**
- Should appear in top-right corner (macOS)
- Should make a sound
- Should appear even if app is minimized
- Should appear in Notification Center

## Troubleshooting

### Notifications Not Appearing?

**1. Check macOS Notification Settings:**
```bash
# Open Notification settings
open "x-apple.systempreferences:com.apple.preference.notifications"
```

**2. Check if osascript works:**
```bash
osascript -e 'display notification "Test" with title "LifeOS"'
```

**3. Check app permissions:**
- System Settings → Privacy & Security → Notifications
- Make sure your app is allowed

**4. Check console logs:**
- Look for "📬 Notification sent:" in browser console
- Look for errors in Tauri console

### Notification Appears But No Sound?

**macOS Settings:**
1. System Settings → Notifications
2. Find your app
3. Enable "Play sound for notifications"

### Notification Doesn't Appear When App Minimized?

**This should work automatically**, but if not:
- Make sure the Tauri app process is still running
- Check that backend is still running
- Verify notifications are enabled in System Settings

## Notification Types

### Positive Notifications (Green):
- 🔥 Streak milestones
- 💪 Deep focus achievements
- 🚀 Amazing streaks
- ✅ Goal alignment
- 🎉 Goal completion

### Warning Notifications (Red):
- ⚠️ Drift detected
- ⏰ Long distraction

## Customization

### Change Notification Sound:
Edit `src-tauri/src/main.rs`:
```rust
sound name \"Glass\"  // or "Basso", "Blow", "Bottle", etc.
```

### Change Notification Title:
Edit `src/hooks/useAgent.ts`:
```typescript
title: "Your Custom Title"
```

### Disable Notifications:
Comment out in `src/hooks/useAgent.ts`:
```typescript
// if (activityData.nudge) {
//   await invoke("notify_user", ...);
// }
```

## Advanced: Notification Actions

For future enhancement, you could add:
- Click notification → Opens app
- Action buttons → "Refocus" / "Dismiss"
- Rich notifications with images

This requires more complex setup with notification actions.

## Current Status

✅ **Notifications are working!**
- System notifications via Tauri
- Appears even when app is minimized
- macOS Notification Center integration
- Sound enabled

Just make sure macOS notification permissions are enabled for your app!

