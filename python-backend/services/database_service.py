"""
Database Service - Local SQLite database for storing user goals and metrics.
All data stays on user's machine for privacy and performance.
"""

import sqlite3
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import date, datetime

class DatabaseService:
    """
    Manages local SQLite database for user data.
    Database location: ~/.lifecoach/user_data.db
    """
    
    def __init__(self):
        # Create database in user's home directory
        app_dir = Path.home() / '.lifecoach'
        app_dir.mkdir(exist_ok=True)
        self.db_path = app_dir / 'user_data.db'
        self._init_database()
    
    def _init_database(self):
        """Create tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table 1: User Goals
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                goal_text TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_goals_active 
            ON user_goals(user_id, is_active)
        """)
        
        # Table 2: Application Usage
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS application_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                app_name TEXT NOT NULL,
                total_seconds INTEGER DEFAULT 0,
                visits INTEGER DEFAULT 0,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date DATE DEFAULT (date('now'))
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_app_usage_user_date 
            ON application_usage(user_id, date)
        """)
        
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_app_usage_unique 
            ON application_usage(user_id, app_name, date)
        """)
        
        # Table 3: Chrome Tabs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chrome_tabs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                url TEXT NOT NULL,
                title TEXT,
                total_time INTEGER DEFAULT 0,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date DATE DEFAULT (date('now'))
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chrome_tabs_user_date 
            ON chrome_tabs(user_id, date)
        """)
        
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_chrome_tabs_unique 
            ON chrome_tabs(user_id, url, date)
        """)
        
        # Table 4: Context Switches
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS context_switches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                count INTEGER DEFAULT 0,
                date DATE DEFAULT (date('now')),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_context_switches_unique 
            ON context_switches(user_id, date)
        """)
        
        # Table 5: Smart Nudge Settings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS smart_nudge_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                enabled BOOLEAN DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table 6: Nudge History
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nudge_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                goal_id INTEGER,
                nudge_level INTEGER,
                distractor_url TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_nudge_history_user 
            ON nudge_history(user_id, timestamp)
        """)
        
        conn.commit()
        conn.close()
        print(f"✅ Database initialized at {self.db_path}")
    
    # ==================== GOAL OPERATIONS ====================
    
    def save_goal(self, user_id: str, goal_text: str, timeframe: str) -> Dict:
        """Save new goal and deactivate previous ones."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Deactivate previous goals
            cursor.execute(
                "UPDATE user_goals SET is_active = 0 WHERE user_id = ?",
                (user_id,)
            )
            
            # Insert new goal
            cursor.execute(
                "INSERT INTO user_goals (user_id, goal_text, timeframe) VALUES (?, ?, ?)",
                (user_id, goal_text, timeframe)
            )
            
            goal_id = cursor.lastrowid
            conn.commit()
            
            return {
                "id": goal_id,
                "user_id": user_id,
                "goal_text": goal_text,
                "timeframe": timeframe
            }
        finally:
            conn.close()
    
    def get_current_goal(self, user_id: str) -> Optional[Dict]:
        """Get user's current active goal."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT * FROM user_goals WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
                (user_id,)
            )
            
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    # ==================== APP USAGE OPERATIONS ====================
    
    def upsert_app_usage(self, user_id: str, app_name: str, seconds: int, visits: int):
        """Update or insert app usage for today."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            today = date.today().isoformat()
            
            cursor.execute("""
                INSERT INTO application_usage (user_id, app_name, total_seconds, visits, date)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, app_name, date) DO UPDATE SET
                    total_seconds = total_seconds + excluded.total_seconds,
                    visits = visits + excluded.visits,
                    last_active = CURRENT_TIMESTAMP
            """, (user_id, app_name, seconds, visits, today))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_app_usage(self, user_id: str, days: int = 7) -> Dict:
        """Get app usage for last N days."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT app_name, SUM(total_seconds) as total_seconds, SUM(visits) as visits
                FROM application_usage
                WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
                GROUP BY app_name
            """, (user_id, days))
            
            rows = cursor.fetchall()
            
            result = {}
            for row in rows:
                result[row['app_name']] = {
                    'total_seconds': row['total_seconds'],
                    'visits': row['visits']
                }
            return result
        finally:
            conn.close()
    
    # ==================== CHROME TABS OPERATIONS ====================
    
    def upsert_chrome_tab(self, user_id: str, url: str, title: str, time_seconds: int):
        """Update or insert Chrome tab data for today."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            today = date.today().isoformat()
            
            cursor.execute("""
                INSERT INTO chrome_tabs (user_id, url, title, total_time, date)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, url, date) DO UPDATE SET
                    total_time = total_time + excluded.total_time,
                    title = excluded.title,
                    last_active = CURRENT_TIMESTAMP
            """, (user_id, url, title, time_seconds, today))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_chrome_tabs(self, user_id: str, days: int = 7) -> List[Dict]:
        """Get Chrome tabs for last N days."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT url, title, SUM(total_time) as total_time
                FROM chrome_tabs
                WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
                GROUP BY url, title
            """, (user_id, days))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    # ==================== CONTEXT SWITCHES OPERATIONS ====================
    
    def upsert_context_switches(self, user_id: str, count: int):
        """Update or insert context switches for today."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            today = date.today().isoformat()
            
            cursor.execute("""
                INSERT INTO context_switches (user_id, count, date)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, date) DO UPDATE SET
                    count = excluded.count,
                    updated_at = CURRENT_TIMESTAMP
            """, (user_id, count, today))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_context_switches(self, user_id: str, days: int = 7) -> int:
        """Get total context switches for last N days."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT SUM(count) as total
                FROM context_switches
                WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
            """, (user_id, days))
            
            row = cursor.fetchone()
            return row[0] if row[0] else 0
        finally:
            conn.close()
    
    # ==================== SMART NUDGE OPERATIONS ====================
    
    def get_nudge_settings(self, user_id: str) -> bool:
        """Get user's Smart Nudge enabled status."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT enabled FROM smart_nudge_settings WHERE user_id = ?",
                (user_id,)
            )
            
            row = cursor.fetchone()
            return bool(row[0]) if row else False
        finally:
            conn.close()
    
    def set_nudge_settings(self, user_id: str, enabled: bool):
        """Update user's Smart Nudge enabled status."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO smart_nudge_settings (user_id, enabled)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    enabled = excluded.enabled,
                    updated_at = CURRENT_TIMESTAMP
            """, (user_id, 1 if enabled else 0))
            
            conn.commit()
        finally:
            conn.close()
    
    def save_nudge_event(self, user_id: str, goal_id: Optional[int], level: int, distractor: str):
        """Save a nudge event to history."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO nudge_history (user_id, goal_id, nudge_level, distractor_url)
                VALUES (?, ?, ?, ?)
            """, (user_id, goal_id, level, distractor))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_last_nudge_time(self, user_id: str) -> Optional[datetime]:
        """Get timestamp of last nudge for user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT timestamp FROM nudge_history
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT 1
            """, (user_id,))
            
            row = cursor.fetchone()
            if row:
                return datetime.fromisoformat(row[0])
            return None
        finally:
            conn.close()


# Singleton instance
_db_service: Optional[DatabaseService] = None

def get_database_service() -> DatabaseService:
    """Get or create the global database service instance."""
    global _db_service
    if _db_service is None:
        _db_service = DatabaseService()
    return _db_service
