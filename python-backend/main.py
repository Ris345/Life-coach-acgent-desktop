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
from typing import Optional
import uvicorn

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

# CORS configuration - strict policy allowing only localhost:14200
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:14200",
        "http://127.0.0.1:14200",
        "tauri://localhost",
        "http://localhost:*",
        "http://127.0.0.1:*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ActivityResponse(BaseModel):
    """Response model for activity endpoint."""
    active_window: Optional[str] = None
    platform: str
    status: str


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


@app.get("/activity", response_model=ActivityResponse)
async def get_activity():
    """
    Get the current activity (active window/application).
    This endpoint is polled by the frontend every 1 second.
    """
    active_window = get_active_window()
    
    return ActivityResponse(
        active_window=active_window,
        platform=platform.system(),
        status="ok"
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


if __name__ == "__main__":
    # Run on port 14200 as specified
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=14200,
        log_level="info"
    )
