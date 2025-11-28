"""
Analytics Service - SQLite Operations
All analytics-related database operations go through local SQLite.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from db.sqlite_client import get_sqlite_cursor
from models.analytics import AnalyticsEvent, AnalyticsEventCreate


def init_analytics_table():
    """
    Initialize the analytics_events table in SQLite.
    Creates the table if it doesn't exist.
    """
    with get_sqlite_cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analytics_events (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                session_id TEXT,
                event_type TEXT NOT NULL,
                route TEXT,
                element_id TEXT,
                metadata TEXT,  -- JSON stored as TEXT
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        
        # Create indexes for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_user_id 
            ON analytics_events(user_id) 
            WHERE user_id IS NOT NULL
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_session_id 
            ON analytics_events(session_id) 
            WHERE session_id IS NOT NULL
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
            ON analytics_events(event_type)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_route 
            ON analytics_events(route) 
            WHERE route IS NOT NULL
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
            ON analytics_events(created_at DESC)
        """)


def create_analytics_event(event_data: AnalyticsEventCreate) -> bool:
    """
    Create a new analytics event in SQLite.
    Returns True if successful, False otherwise.
    """
    try:
        # Convert to dict for insertion
        data = event_data.to_dict()
        
        # Convert metadata to JSON string
        import json
        metadata_json = json.dumps(data.get("metadata", {}))
        
        with get_sqlite_cursor() as cursor:
            cursor.execute("""
                INSERT INTO analytics_events 
                (id, user_id, session_id, event_type, route, element_id, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                data.get("id"),
                data.get("user_id"),
                data.get("session_id"),
                data.get("event_type"),
                data.get("route"),
                data.get("element_id"),
                metadata_json,
            ))
        
        return True
    except Exception as e:
        print(f"Error creating analytics event: {e}")
        return False


def get_analytics_event(event_id: UUID) -> Optional[AnalyticsEvent]:
    """
    Get an analytics event by ID from SQLite.
    Returns None if event not found or on error.
    """
    try:
        import json
        
        with get_sqlite_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM analytics_events WHERE id = ?
            """, (str(event_id),))
            
            row = cursor.fetchone()
            if row:
                # Convert row to dict
                data = dict(row)
                # Parse metadata JSON
                data["metadata"] = json.loads(data["metadata"] or "{}")
                # Parse datetime
                data["created_at"] = datetime.fromisoformat(data["created_at"])
                # Convert user_id to UUID if present
                if data["user_id"]:
                    data["user_id"] = UUID(data["user_id"])
                
                return AnalyticsEvent(**data)
        return None
    except Exception as e:
        print(f"Error fetching analytics event {event_id}: {e}")
        return None


def get_analytics_events_by_user(user_id: UUID, limit: int = 100) -> List[AnalyticsEvent]:
    """
    Get analytics events for a specific user from SQLite.
    Returns empty list if no events found or on error.
    """
    try:
        import json
        
        with get_sqlite_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM analytics_events 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (str(user_id), limit))
            
            rows = cursor.fetchall()
            events = []
            for row in rows:
                data = dict(row)
                data["metadata"] = json.loads(data["metadata"] or "{}")
                data["created_at"] = datetime.fromisoformat(data["created_at"])
                if data["user_id"]:
                    data["user_id"] = UUID(data["user_id"])
                events.append(AnalyticsEvent(**data))
            
            return events
    except Exception as e:
        print(f"Error fetching analytics events for user {user_id}: {e}")
        return []


def get_analytics_events_by_session(session_id: str, limit: int = 100) -> List[AnalyticsEvent]:
    """
    Get analytics events for a specific session from SQLite.
    Returns empty list if no events found or on error.
    """
    try:
        import json
        
        with get_sqlite_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM analytics_events 
                WHERE session_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (session_id, limit))
            
            rows = cursor.fetchall()
            events = []
            for row in rows:
                data = dict(row)
                data["metadata"] = json.loads(data["metadata"] or "{}")
                data["created_at"] = datetime.fromisoformat(data["created_at"])
                if data["user_id"]:
                    data["user_id"] = UUID(data["user_id"])
                events.append(AnalyticsEvent(**data))
            
            return events
    except Exception as e:
        print(f"Error fetching analytics events for session {session_id}: {e}")
        return []


def get_analytics_stats(event_type: Optional[str] = None, route: Optional[str] = None) -> Dict[str, Any]:
    """
    Get analytics statistics from SQLite.
    Returns aggregated stats.
    """
    try:
        with get_sqlite_cursor() as cursor:
            # Build query based on filters
            query = "SELECT COUNT(*) as total FROM analytics_events WHERE 1=1"
            params = []
            
            if event_type:
                query += " AND event_type = ?"
                params.append(event_type)
            
            if route:
                query += " AND route = ?"
                params.append(route)
            
            cursor.execute(query, params)
            total = cursor.fetchone()["total"]
            
            return {
                "total_events": total,
                "event_type": event_type,
                "route": route,
            }
    except Exception as e:
        print(f"Error fetching analytics stats: {e}")
        return {"total_events": 0}


