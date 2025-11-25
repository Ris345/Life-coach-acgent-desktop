"""
LifeOS - Python Sidecar Backend
FastAPI server that provides system metrics and activity monitoring.
"""

import sys
import platform
import psutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from pydantic import BaseModel
import uvicorn

# Import behavior tracking module
from behavior import BehaviorTracker, ActivityEvent, BehaviorStats, DailySummary, NudgeEngine
from behavior.ai_coach import AICoach
from profiles import map_goal_to_profile

# Platform-specific imports for window monitoring
if platform.system() == "Darwin":  # macOS
    try:
        from AppKit import NSWorkspace
        MAC_AVAILABLE = True
    except ImportError:
        MAC_AVAILABLE = False
        print("Warning: AppKit not available. Install pyobjc: pip install pyobjc")
elif platform.system() == "Windows":
    try:
        import pygetwindow as gw
        WINDOWS_AVAILABLE = True
    except ImportError:
        WINDOWS_AVAILABLE = False
        print("Warning: pygetwindow not available. Install: pip install pygetwindow")
else:
    # Linux - using xdotool or similar would require additional setup
    MAC_AVAILABLE = False
    WINDOWS_AVAILABLE = False
    print(f"Warning: Window monitoring not fully supported on {platform.system()}")

app = FastAPI(title="LifeOS Sidecar", version="1.0.0")

# CORS configuration - allow all origins for Tauri compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Tauri
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize behavior tracker and nudge engine (global instances)
behavior_tracker = BehaviorTracker(enable_persistence=True)
nudge_engine = NudgeEngine()
ai_coach = AICoach()  # AI coaching with Ollama (optional)

# Load saved state on startup
print("Loading saved tracking data...")
if behavior_tracker.load_state():
    print(f"✅ Loaded saved state from {behavior_tracker.persistence.get_data_path()}")
    stats = behavior_tracker.get_stats()
    print(f"   - {len(behavior_tracker.events)} events loaded")
    print(f"   - Focus time: {stats.total_focus_minutes:.1f} minutes")
    print(f"   - Current goal: {behavior_tracker.current_goal or 'None'}")
else:
    print("ℹ️  No saved state found, starting fresh")


class GoalRequest(BaseModel):
    """Request model for setting a goal."""
    goal: str
    daily_goal_minutes: int = 60


class ActivityResponse(BaseModel):
    """Response model for activity endpoint with enriched data."""
    active_window: Optional[str] = None
    platform: str
    status: str
    category: Optional[str] = None
    focus_time_seconds: float = 0.0
    distraction_time_seconds: float = 0.0
    current_streak_seconds: float = 0.0
    longest_streak_seconds: float = 0.0
    total_polls: int = 0
    productive_apps: Dict[str, float] = {}
    nudge: Optional[str] = None
    current_goal: Optional[str] = None
    profile: Optional[Dict] = None
    drift: bool = False
    daily_complete: bool = False
    weekly_progress: int = 0


class HealthResponse(BaseModel):
    """Response model for health endpoint."""
    status: str
    platform: str
    python_version: str


def get_active_window() -> Optional[str]:
    """
    Get the current active window title.
    Returns None if unable to determine.
    """
    try:
        if platform.system() == "Darwin" and MAC_AVAILABLE:
            # macOS approach using AppKit
            workspace = NSWorkspace.sharedWorkspace()
            active_app = workspace.activeApplication()
            app_name = active_app.get("NSApplicationName", "Unknown")
            return app_name
        elif platform.system() == "Windows" and WINDOWS_AVAILABLE:
            # Windows approach using pygetwindow
            active_window = gw.getActiveWindow()
            if active_window:
                return active_window.title
            return None
        else:
            # Fallback or unsupported platform
            return None
    except Exception as e:
        print(f"Error getting active window: {e}")
        return None


def get_system_metrics() -> dict:
    """Get system metrics using psutil."""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2),
        }
    except Exception as e:
        print(f"Error getting system metrics: {e}")
        return {}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to confirm the server is running."""
    return HealthResponse(
        status="healthy",
        platform=platform.system(),
        python_version=sys.version.split()[0]
    )


@app.post("/goal")
@app.options("/goal")
async def set_goal(request: GoalRequest):
    """
    Set a goal and map it to a profile.
    
    Args:
        request: GoalRequest with goal text and daily_goal_minutes
    
    Returns:
        Enriched profile dictionary
    """
    try:
        # Map goal to profile
        profile = map_goal_to_profile(request.goal)
        
        # Set goal and profile in tracker
        behavior_tracker.set_goal(request.goal, profile=profile, daily_goal_minutes=request.daily_goal_minutes)
        
        return {
            "goal": request.goal,
            "profile": profile,
            "daily_goal_minutes": request.daily_goal_minutes,
            "status": "ok"
        }
    except Exception as e:
        print(f"Error in /goal endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


@app.get("/activity", response_model=ActivityResponse)
@app.options("/activity")
async def get_activity(goal: Optional[str] = None):
    """
    Get the current activity (active window/application) with enriched data.
    This endpoint is polled by the frontend every 2 seconds.
    Also records activity in the behavior tracker and generates nudges.
    
    Args:
        goal: Optional goal text (if provided, updates goal/profile)
    """
    try:
        active_window = get_active_window()
        
        # Update goal/profile if provided
        if goal:
            profile = map_goal_to_profile(goal)
            behavior_tracker.set_goal(goal, profile=profile)
        
        # Record activity in behavior tracker
        previous_category = behavior_tracker.get_previous_category()
        if active_window:
            behavior_tracker.record_activity(active_window)
        
        # Get current stats
        stats = behavior_tracker.get_stats()
        
        # Check drift
        drift = previous_category == "focus" and stats.current_category in ["distraction", "neutral"]
        
        # Check daily completion
        daily_complete = behavior_tracker.check_daily_goal_completion()
        
        # Get weekly progress
        weekly_progress = behavior_tracker.get_weekly_progress()
        
        # Generate nudge
        nudge = nudge_engine.get_nudge(
            current_category=stats.current_category or "neutral",
            previous_category=previous_category,
            current_streak_seconds=stats.current_streak_seconds,
            goal=behavior_tracker.current_goal,
            goal_profile=behavior_tracker.current_profile,
            focus_time_minutes=stats.total_focus_minutes,
            distraction_time_minutes=stats.total_distraction_minutes,
            active_window=active_window,
            daily_complete=daily_complete
        )
        
        return ActivityResponse(
            active_window=active_window,
            platform=platform.system(),
            status="ok",
            category=stats.current_category,
            focus_time_seconds=stats.total_focus_minutes * 60.0,
            distraction_time_seconds=stats.total_distraction_minutes * 60.0,
            current_streak_seconds=stats.current_streak_seconds,
            longest_streak_seconds=stats.longest_focus_streak_seconds,
            total_polls=stats.total_polls,
            productive_apps=stats.productive_app_time_map,
            nudge=nudge,
            current_goal=behavior_tracker.current_goal,
            profile=behavior_tracker.current_profile,
            drift=drift,
            daily_complete=daily_complete,
            weekly_progress=weekly_progress
        )
    except Exception as e:
        print(f"Error in /activity endpoint: {e}")
        import traceback
        traceback.print_exc()
        return ActivityResponse(
            active_window=None,
            platform=platform.system(),
            status="error"
        )


@app.get("/metrics")
async def get_metrics():
    """
    Get system metrics (CPU, memory, disk).
    """
    metrics = get_system_metrics()
    return {
        "metrics": metrics,
        "platform": platform.system(),
        "status": "ok"
    }


# ============================================================================
# Behavior Tracking Endpoints
# ============================================================================

@app.get("/behavior", response_model=List[ActivityEvent])
async def get_behavior(limit: int = 50):
    """
    Get recent behavior events (activity log).
    
    Args:
        limit: Maximum number of events to return (default: 50)
    
    Returns:
        List of recent ActivityEvent objects
    """
    try:
        events = behavior_tracker.get_recent_events(limit=limit)
        return events
    except Exception as e:
        print(f"Error in /behavior endpoint: {e}")
        return []


@app.get("/stats", response_model=BehaviorStats)
@app.options("/stats")
async def get_stats():
    """
    Get current behavior statistics.
    
    Returns:
        BehaviorStats with focus time, distraction time, streaks, etc.
    """
    try:
        stats = behavior_tracker.get_stats()
        return stats
    except Exception as e:
        print(f"Error in /stats endpoint: {e}")
        import traceback
        traceback.print_exc()
        # Return empty stats on error
        return BehaviorStats()


@app.get("/weekly_report")
@app.options("/weekly_report")
async def get_weekly_report():
    """
    Generate AI-powered weekly coaching report.
    
    Returns:
        Weekly report with celebration, insights, recommendations, and motivation
    """
    try:
        stats = behavior_tracker.get_stats()
        summary = behavior_tracker.get_daily_summary()
        
        # Get weekly data (for now, using daily summary - can be enhanced)
        focus_time = stats.total_focus_minutes
        distraction_time = stats.total_distraction_minutes
        longest_streak = stats.longest_focus_streak_seconds / 60.0
        
        productive_apps = summary.top_productive_apps if summary else []
        distracting_apps = summary.top_distracting_apps if summary else []
        
        # Calculate daily completions (simplified - can be enhanced with historical data)
        daily_completions = 1 if behavior_tracker.check_daily_goal_completion() else 0
        
        # Generate AI report
        report = ai_coach.generate_weekly_report(
            goal=behavior_tracker.current_goal or "Your goal",
            focus_time_minutes=focus_time,
            distraction_time_minutes=distraction_time,
            longest_streak_minutes=longest_streak,
            productive_apps=productive_apps,
            distracting_apps=distracting_apps,
            daily_completions=daily_completions,
            total_days=7
        )
        
        return {
            "status": "ok",
            "report": report,
            "ollama_available": ai_coach._check_ollama_available(),
        }
    except Exception as e:
        print(f"Error generating weekly report: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "error": str(e),
            "report": None
        }


@app.get("/summary", response_model=DailySummary)
@app.options("/summary")
async def get_summary():
    """
    Get daily summary with top apps and statistics.
    
    Returns:
        DailySummary with daily statistics, top distracting apps, top productive apps
    """
    try:
        summary = behavior_tracker.get_daily_summary()
        return summary
    except Exception as e:
        print(f"Error in /summary endpoint: {e}")
        import traceback
        traceback.print_exc()
        # Return empty summary on error
        from datetime import datetime
        today = datetime.now().date().strftime("%Y-%m-%d")
        return DailySummary(date=today)


@app.get("/nudges")
@app.options("/nudges")
async def get_nudges(goal: Optional[str] = None):
    """
    Get current nudge based on behavior.
    
    Args:
        goal: Optional goal text for goal-aware nudges
    
    Returns:
        Nudge message or null
    """
    try:
        stats = behavior_tracker.get_stats()
        previous_category = behavior_tracker.get_previous_category()
        
        nudge = nudge_engine.get_nudge(
            current_category=stats.current_category or "neutral",
            previous_category=previous_category,
            current_streak_seconds=stats.current_streak_seconds,
            goal=goal or behavior_tracker.current_goal,
            focus_time_minutes=stats.total_focus_minutes,
            distraction_time_minutes=stats.total_distraction_minutes,
            active_window=behavior_tracker.current_window
        )
        
        return {"nudge": nudge}
    except Exception as e:
        print(f"Error in /nudges endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {"nudge": None}


class BrowserTabRequest(BaseModel):
    """Request model for browser tab tracking."""
    url: str


@app.post("/browser_tab")
@app.options("/browser_tab")
async def receive_browser_tab(request: BrowserTabRequest):
    """
    Receive browser tab URL from extension.
    This endpoint is called by the browser extension when the active tab changes.
    
    Args:
        request: BrowserTabRequest with URL
    
    Returns:
        {"status": "ok", "category": "focus|distraction|neutral", "url": "..."}
    """
    try:
        url = request.url
        if not url:
            return {"status": "error", "message": "URL required"}
        
        # Get current profile
        profile = behavior_tracker.current_profile
        
        # Classify URL using browser tab classifier
        from behavior.browser import classify_tab
        category = classify_tab(url, profile)
        
        # Extract domain from URL for display
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc or url.split('/')[0]
        except:
            domain = url.split('/')[0] if '/' in url else url
        
        # Create a browser app identifier (e.g., "Browser: youtube.com")
        browser_app_name = f"Browser: {domain}"
        
        # Record as activity (this will update the tracker)
        # The tracker will detect this as an app switch if different from current
        behavior_tracker.record_activity(browser_app_name)
        
        print(f"Browser tab tracked: {url} -> {category} (domain: {domain})")
        
        return {
            "status": "ok",
            "category": category,
            "url": url,
            "domain": domain
        }
    except Exception as e:
        print(f"Error in /browser_tab endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import atexit
    
    # Save state on shutdown
    def save_on_exit():
        print("\n💾 Saving tracking data before shutdown...")
        if behavior_tracker.save_state():
            print("✅ Data saved successfully")
        else:
            print("⚠️  Failed to save data")
    
    atexit.register(save_on_exit)
    
    # Run on port 14200 as specified
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=14200,
            log_level="info"
        )
    except KeyboardInterrupt:
        save_on_exit()
        raise
