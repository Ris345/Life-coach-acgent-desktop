# LifeOS Browser Extension

Browser extension to track active tabs and send URLs to the LifeOS desktop app.

## Installation

### Chrome/Edge (Chromium-based)

1. Open Chrome/Edge
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. Extension is now active!

### Firefox

1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select `manifest.json` from the `browser-extension` folder

### Safari

Safari extensions require:
- Xcode
- Safari App Extension format
- App Store submission (for distribution)

See Safari documentation for details.

## How It Works

1. Extension listens to tab changes
2. Gets current active tab URL
3. Sends URL to `http://127.0.0.1:14200/browser_tab`
4. Desktop app categorizes URL and tracks it

## Permissions

- `tabs` - To detect active tab
- `activeTab` - To read current tab URL
- `host_permissions` - To send data to localhost desktop app

## Privacy

- All data stays local (localhost)
- No external servers
- No data collection
- URLs only sent to your desktop app

## Troubleshooting

**Extension not tracking:**
- Make sure desktop app is running
- Check browser console for errors
- Verify extension is enabled

**Desktop app not receiving:**
- Check if backend is running on port 14200
- Verify CORS is enabled
- Check backend logs

## Development

To modify the extension:
1. Edit `background.js`
2. Go to `chrome://extensions/`
3. Click reload icon on the extension
4. Changes take effect immediately

