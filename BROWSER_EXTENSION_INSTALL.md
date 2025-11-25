# 🌐 Browser Extension Installation Guide

## Quick Install (Chrome/Edge)

1. **Open Extensions Page:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. **Enable Developer Mode:**
   - Toggle switch in top-right corner

3. **Load Extension:**
   - Click "Load unpacked"
   - Navigate to: `/Users/admin/Projects/life-coach-agent/browser-extension`
   - Select the folder

4. **Verify Installation:**
   - Extension should appear in your extensions list
   - Icon should be visible in browser toolbar

5. **Test It:**
   - Open a new tab (YouTube, AWS docs, etc.)
   - Check backend logs - should see "Browser tab tracked"
   - Check desktop app - should show browser activity

## What It Does

- **Tracks active browser tabs** automatically
- **Sends URLs to desktop app** via HTTP
- **Categorizes sites** (focus/distraction) based on your goal
- **Works in background** - no interaction needed

## Troubleshooting

**Extension not tracking:**
- Make sure desktop app backend is running (port 14200)
- Check browser console for errors (F12 → Console)
- Verify extension is enabled

**Desktop app not receiving:**
- Check backend logs for errors
- Verify CORS is enabled (should be `allow_origins=["*"]`)
- Test manually: `curl -X POST http://127.0.0.1:14200/browser_tab -H "Content-Type: application/json" -d '{"url":"https://youtube.com"}'`

## Files

- `manifest.json` - Extension configuration
- `background.js` - Tab tracking logic
- `README.md` - Detailed documentation

## Next Steps

After installing:
1. Set a goal in the desktop app
2. Browse normally
3. Watch the desktop app track your browser activity
4. See focus/distraction time update in real-time!

