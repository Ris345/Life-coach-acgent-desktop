/**
 * Analytics Tracking Utility
 * 
 * Fire-and-forget analytics tracking that never blocks the UI.
 * Tracks page views, button clicks, and custom events.
 */

// Generate or retrieve session ID (for anonymous users)
function getSessionId(): string {
  const storageKey = 'analytics_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    // Generate a simple session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// Get current route (for Tauri/React app)
function getCurrentRoute(): string {
  // For Tauri apps, we can use window.location or a router
  if (typeof window !== 'undefined') {
    return window.location.pathname || '/';
  }
  return '/';
}

// Get user ID from auth context (if available)
function getUserId(): string | null {
  // Try to get from localStorage or auth context
  try {
    const authData = localStorage.getItem('auth_user');
    if (authData) {
      const user = JSON.parse(authData);
      return user?.id || null;
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

interface TrackEventOptions {
  eventType: 'page_view' | 'button_click' | 'route_change' | 'custom';
  route?: string;
  elementId?: string; // Button ID, element ID, or event name
  metadata?: Record<string, any>; // Additional data (no sensitive info)
}

/**
 * Track an analytics event.
 * Fire-and-forget: never blocks UI, errors are silently handled.
 * 
 * @param options - Event tracking options
 */
export function trackEvent(options: TrackEventOptions): void {
  // Don't track in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_ANALYTICS) {
    return;
  }

  try {
    const userId = getUserId();
    const sessionId = userId ? undefined : getSessionId();
    const route = options.route || getCurrentRoute();

    // Prepare payload (keep it small)
    const payload = {
      user_id: userId || undefined,
      session_id: sessionId,
      event_type: options.eventType,
      route: route,
      element_id: options.elementId,
      metadata: options.metadata || {},
    };

    // Remove undefined values to keep payload small
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });

    // Fire-and-forget: use fetch with no await, no error handling that blocks
    fetch('http://127.0.0.1:14200/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Don't wait for response
      keepalive: true, // Keep request alive even if page unloads
    }).catch(() => {
      // Silently ignore errors - analytics should never break the app
    });
  } catch (error) {
    // Silently ignore all errors
    // Analytics should never break the application
  }
}

/**
 * Track a page view.
 * Call this when the route changes.
 * 
 * @param route - Optional route path (defaults to current route)
 */
export function trackPageView(route?: string): void {
  trackEvent({
    eventType: 'page_view',
    route: route || getCurrentRoute(),
  });
}

/**
 * Track a button click.
 * 
 * @param elementId - Button ID, element ID, or descriptive name
 * @param metadata - Optional additional data
 */
export function trackButtonClick(
  elementId: string,
  metadata?: Record<string, any>
): void {
  trackEvent({
    eventType: 'button_click',
    elementId: elementId,
    metadata: metadata,
  });
}

/**
 * Track a route change.
 * 
 * @param fromRoute - Previous route
 * @param toRoute - New route
 */
export function trackRouteChange(fromRoute: string, toRoute: string): void {
  trackEvent({
    eventType: 'route_change',
    route: toRoute,
    metadata: {
      from_route: fromRoute,
    },
  });
}

/**
 * Track a custom event.
 * 
 * @param eventName - Custom event name (will be prefixed with 'custom_')
 * @param metadata - Optional additional data
 */
export function trackCustomEvent(
  eventName: string,
  metadata?: Record<string, any>
): void {
  trackEvent({
    eventType: 'custom',
    elementId: eventName,
    metadata: metadata,
  });
}



