"""
Supabase Client for User Data
Handles all user-related database operations via Supabase Postgres.
"""

from typing import Optional
from supabase import create_client, Client
from db.config import get_supabase_config, is_supabase_configured

# Global Supabase client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Get or create Supabase client instance.
    Returns None if Supabase is not configured.
    """
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    if not is_supabase_configured():
        print("Warning: Supabase not configured. User operations will fail.")
        return None
    
    try:
        config = get_supabase_config()
        _supabase_client = create_client(
            config["url"],
            config["service_role_key"]  # Use service role for backend operations
        )
        print("✅ Supabase client initialized")
        return _supabase_client
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return None


def reset_supabase_client():
    """Reset the Supabase client (useful for testing)."""
    global _supabase_client
    _supabase_client = None


