/**
 * LifeOS Browser Extension - Background Service Worker
 * Tracks active browser tabs and sends URLs to the LifeOS desktop app
 */

const DESKTOP_APP_URL = 'http://127.0.0.1:14200/browser_tab';
let lastSentUrl = null;
let retryCount = 0;
const MAX_RETRIES = 3;

/**
 * Send URL to desktop app
 */
async function sendUrlToDesktopApp(url) {
  // Don't send if it's the same URL (avoid spam)
  if (url === lastSentUrl) {
    return;
  }

  try {
    const response = await fetch(DESKTOP_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url }),
      // Short timeout - desktop app might not be running
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('LifeOS: Tab tracked', url, '->', data.category);
      lastSentUrl = url;
      retryCount = 0;
    } else {
      console.warn('LifeOS: Desktop app returned error:', response.status);
    }
  } catch (error) {
    // Desktop app might not be running - that's okay
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      // Network error - desktop app not available
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log('LifeOS: Desktop app not available, will retry...');
      }
    } else {
      console.error('LifeOS: Error sending tab URL:', error);
    }
  }
}

/**
 * Get current active tab URL
 */
async function getActiveTabUrl() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].url) {
      // Filter out chrome:// and extension:// URLs
      const url = tabs[0].url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
  } catch (error) {
    console.error('LifeOS: Error getting active tab:', error);
  }
  return null;
}

/**
 * Listen to tab activation (user switches tabs)
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      await sendUrlToDesktopApp(tab.url);
    }
  } catch (error) {
    console.error('LifeOS: Error on tab activation:', error);
  }
});

/**
 * Listen to URL changes in tabs (user navigates)
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when URL changes and tab is active
  if (changeInfo.url && tab.active) {
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      await sendUrlToDesktopApp(tab.url);
    }
  }
});

/**
 * Send current tab URL on extension startup
 */
chrome.runtime.onStartup.addListener(async () => {
  const url = await getActiveTabUrl();
  if (url) {
    await sendUrlToDesktopApp(url);
  }
});

/**
 * Send current tab URL when extension is installed/enabled
 */
chrome.runtime.onInstalled.addListener(async () => {
  const url = await getActiveTabUrl();
  if (url) {
    await sendUrlToDesktopApp(url);
  }
});

// Periodically check active tab (fallback in case events are missed)
setInterval(async () => {
  const url = await getActiveTabUrl();
  if (url && url !== lastSentUrl) {
    await sendUrlToDesktopApp(url);
  }
}, 5000); // Check every 5 seconds

