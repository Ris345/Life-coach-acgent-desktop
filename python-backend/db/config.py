"""
Database Configuration Module
Separates Supabase (Postgres) for users and SQLite for analytics.
"""

import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
env_path = PROJECT_ROOT / ".env"
load_dotenv(env_path)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Fallback: Use Anon Key if Service Role Key is missing (might limit functionality)
if not SUPABASE_SERVICE_ROLE_KEY:
    print("Warning: SUPABASE_SERVICE_ROLE_KEY not found. Falling back to ANON_KEY.")
    SUPABASE_SERVICE_ROLE_KEY = SUPABASE_ANON_KEY

# SQLite configuration
# Store analytics database in user home directory (same as DatabaseService)
SQLITE_DB_PATH = Path.home() / ".lifecoach" / "user_data.db"

# Ensure backend directory exists
BACKEND_DIR.mkdir(parents=True, exist_ok=True)


def get_supabase_config() -> dict:
    """Get Supabase configuration."""
    return {
        "url": SUPABASE_URL,
        "service_role_key": SUPABASE_SERVICE_ROLE_KEY,
        "anon_key": SUPABASE_ANON_KEY,
    }


def get_sqlite_path() -> str:
    """Get SQLite database file path."""
    return str(SQLITE_DB_PATH)


def is_supabase_configured() -> bool:
    """Check if Supabase is properly configured."""
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


