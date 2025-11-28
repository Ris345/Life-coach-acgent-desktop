"""
SQLite Client for Analytics Data
Handles all analytics-related database operations via local SQLite.
"""

import sqlite3
from typing import Optional
from pathlib import Path
from contextlib import contextmanager
from db.config import get_sqlite_path

# Global SQLite connection pool (single connection for simplicity)
_sqlite_conn: Optional[sqlite3.Connection] = None
_sqlite_path: str = get_sqlite_path()


def get_sqlite_connection() -> sqlite3.Connection:
    """
    Get or create SQLite connection.
    Creates the database file if it doesn't exist.
    """
    global _sqlite_conn
    
    if _sqlite_conn is not None:
        return _sqlite_conn
    
    # Ensure directory exists
    db_path = Path(_sqlite_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        _sqlite_conn = sqlite3.connect(
            _sqlite_path,
            check_same_thread=False,  # Allow use from multiple threads
            timeout=10.0  # Wait up to 10 seconds for lock
        )
        # Enable foreign keys
        _sqlite_conn.execute("PRAGMA foreign_keys = ON")
        # Use row factory for dict-like access
        _sqlite_conn.row_factory = sqlite3.Row
        print(f"✅ SQLite client initialized: {_sqlite_path}")
        return _sqlite_conn
    except Exception as e:
        print(f"Error initializing SQLite client: {e}")
        raise


@contextmanager
def get_sqlite_cursor():
    """
    Context manager for SQLite cursor.
    Automatically commits on success, rolls back on error.
    """
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()


def close_sqlite_connection():
    """Close SQLite connection (useful for cleanup)."""
    global _sqlite_conn
    if _sqlite_conn:
        _sqlite_conn.close()
        _sqlite_conn = None
        print("SQLite connection closed")


def reset_sqlite_client():
    """Reset the SQLite client (useful for testing)."""
    close_sqlite_connection()


