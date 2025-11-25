# Browser Tab Tracking - Implementation Guide

## Current State

Right now, we only track **which browser app** is active (e.g., "Safari", "Chrome"), but **not which specific tab/URL** is open.

## Why We Need Tab Tracking

- **Safari/Chrome** could be showing:
  - YouTube (distraction) ❌
  - AWS docs (focus) ✅
  - Stack Overflow (focus) ✅
  - Instagram (distraction) ❌

Without tab tracking, we can't distinguish between these!

## Solution: Browser Extension

The best approach is to build a **browser extension** that:
1. Detects active tab changes
2. Gets the current URL
3. Sends it to the desktop app via HTTP

## Architecture

```
┌─────────────────────────────────┐
│   Browser Extension             │
│   (Chrome/Firefox/Safari)       │
│                                 │
│   - Listens to tab changes      │
│   - Gets current URL            │
│   - POSTs to localhost:14200    │
└──────────────┬──────────────────┘
               │ HTTP POST
               │ { "url": "https://..." }
               ▼
┌─────────────────────────────────┐
│   Desktop App (FastAPI)         │
│   /browser_tab endpoint         │
│                                 │
│   - Receives URL                │
│   - Categorizes using profile   │
│   - Updates behavior tracker    │
└─────────────────────────────────┘
```

## Implementation Steps

### 1. Create Browser Extension

**For Chrome/Edge:**
- `manifest.json` - Extension config
- `background.js` - Listens to tab changes
- `content.js` - (Optional) Injected into pages

**For Safari:**
- More restricted, requires App Store approval
- Uses Safari App Extension format

### 2. Extension Code (Chrome Example)

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "LifeOS Tab Tracker",
  "version": "1.0.0",
  "permissions": [
    "tabs",
    "activeTab"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "host_permissions": [
    "http://127.0.0.1:14200/*"
  ]
}
```

**background.js:**
```javascript
// Listen to tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      sendUrlToDesktopApp(tab.url);
    }
  });
});

// Listen to URL changes in active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    sendUrlToDesktopApp(changeInfo.url);
  }
});

function sendUrlToDesktopApp(url) {
  fetch('http://127.0.0.1:14200/browser_tab', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: url })
  }).catch(err => {
    // Desktop app might not be running
    console.log('Desktop app not available');
  });
}
```

### 3. Backend Endpoint (Already Prepared!)

We already have the infrastructure:

**`python-backend/behavior/browser.py`** - URL classification
**`python-backend/main.py`** - Needs `/browser_tab` endpoint

### 4. Add Backend Endpoint

Add to `main.py`:

```python
@app.post("/browser_tab")
@app.options("/browser_tab")
async def receive_browser_tab(request: dict):
    """
    Receive browser tab URL from extension.
    
    Args:
        request: {"url": "https://..."}
    
    Returns:
        {"status": "ok", "category": "focus|distraction|neutral"}
    """
    try:
        url = request.get("url")
        if not url:
            return {"status": "error", "message": "URL required"}
        
        # Get current profile
        profile = behavior_tracker.current_profile
        
        # Classify URL
        from behavior.browser import classify_tab
        category = classify_tab(url, profile)
        
        # Update tracker with browser tab activity
        # Use a special identifier like "Browser: youtube.com"
        domain = url.split('/')[2] if '/' in url else url
        browser_app_name = f"Browser: {domain}"
        
        # Record as if it's an app switch
        behavior_tracker.record_activity(browser_app_name)
        
        return {
            "status": "ok",
            "category": category,
            "url": url
        }
    except Exception as e:
        print(f"Error in /browser_tab endpoint: {e}")
        return {"status": "error", "message": str(e)}
```

### 5. Update Categorizer

The `classify_tab()` function in `behavior/browser.py` already uses:
- Profile's `allowed_domains` list
- Profile's `keywords` list
- Distraction domain patterns

## Alternative Approaches (Less Reliable)

### Option 1: Accessibility API (macOS)
- Can sometimes read window titles
- Window titles may include tab titles
- Not always reliable
- Requires accessibility permissions

### Option 2: Screen Scraping
- OCR to read tab titles
- Too resource intensive
- Privacy concerns
- Not practical

### Option 3: Browser Native Messaging
- Chrome/Edge support this
- Still requires extension
- More complex setup

## Recommended Approach

**Build a browser extension** because:
- ✅ Most reliable
- ✅ Works across browsers (with browser-specific versions)
- ✅ Can get exact URLs
- ✅ Low overhead
- ✅ Privacy-friendly (runs locally)

## Implementation Priority

1. **Chrome Extension** (easiest, most users)
2. **Firefox Extension** (similar to Chrome)
3. **Safari Extension** (more restricted, requires App Store)

## Next Steps

1. Create extension folder: `browser-extension/`
2. Build Chrome extension first
3. Add `/browser_tab` endpoint to FastAPI
4. Test with real browser usage
5. Package extension for distribution

The infrastructure is already in place - we just need to build the extension and add the endpoint!

