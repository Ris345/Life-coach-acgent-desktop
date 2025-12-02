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
        
        # Table 1: Users (New in v2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                name TEXT,
                tier TEXT DEFAULT 'free',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                privacy_consent_version TEXT,
                privacy_consent_date TIMESTAMP
            )
        """)

        # Table 2: User Goals
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL, -- Foreign key to users(id) technically, but we keep it loose for now
                goal_text TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                strategy TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        # Migration: Add strategy column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE user_goals ADD COLUMN strategy TEXT")
        except sqlite3.OperationalError:
            pass # Column already exists
        
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

        # Table 7: Daily Stats (New in v2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_stats (
                date DATE NOT NULL,
                user_id TEXT NOT NULL,
                goal_id INTEGER,
                success_probability INTEGER,
                focus_minutes INTEGER DEFAULT 0,
                distraction_minutes INTEGER DEFAULT 0,
                deep_work_blocks INTEGER DEFAULT 0,
                PRIMARY KEY (date, user_id)
            )
        """)

        # Table 8: Events (New in v2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                goal_id INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                type TEXT NOT NULL,
                metadata TEXT
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_user_time 
            ON events(user_id, timestamp)
        """)

        # Table 9: AI Reports (New in v2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                date DATE DEFAULT (date('now')),
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Migrations for user_goals
        try:
            cursor.execute("ALTER TABLE user_goals ADD COLUMN category TEXT")
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute("ALTER TABLE user_goals ADD COLUMN target_minutes_per_day INTEGER")
        except sqlite3.OperationalError:
            pass
        
        # Table 10: User Stats (Gamification)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id TEXT PRIMARY KEY,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                total_flow_minutes INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        print(f"✅ Database initialized at {self.db_path}")

    # ==================== USER OPERATIONS ====================

    def create_user(self, user_id: str, email: str = None, name: str = None) -> Dict:
        """Create a new user or return existing."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO users (id, email, name)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    email = COALESCE(excluded.email, email),
                    name = COALESCE(excluded.name, name)
            """, (user_id, email, name))
            
            conn.commit()
            return self.get_user(user_id)
        finally:
            conn.close()

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user profile."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def update_user_privacy_consent(self, user_id: str, version: str, consented: bool):
        """Update user privacy consent."""
        if not consented:
            return # We don't store non-consent? Or maybe we do. For now, only positive consent.
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE users 
                SET privacy_consent_version = ?, privacy_consent_date = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (version, user_id))
            conn.commit()
        finally:
            conn.close()

    # ... (existing methods) ...

    # ==================== GAMIFICATION OPERATIONS ====================

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user's gamification stats (XP, Level)."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM user_stats WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            
            if row:
                return dict(row)
            else:
                # Initialize if not exists
                self.init_user_stats(user_id)
                return {"user_id": user_id, "xp": 0, "level": 1, "total_flow_minutes": 0}
        finally:
            conn.close()

    def init_user_stats(self, user_id: str):
        """Initialize stats for a new user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)",
                (user_id,)
            )
            conn.commit()
        finally:
            conn.close()

    def update_xp(self, user_id: str, xp_change: int) -> Dict:
        """
        Update user XP and calculate level.
        Returns {new_xp, new_level, leveled_up}.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get current stats
            cursor.execute("SELECT xp, level FROM user_stats WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            
            if not row:
                self.init_user_stats(user_id)
                current_xp, current_level = 0, 1
            else:
                current_xp, current_level = row
            
            # Calculate new XP (prevent negative)
            new_xp = max(0, current_xp + xp_change)
            
            # Calculate new Level (Simple formula: Level = 1 + sqrt(XP / 100))
            # Level 1: 0-99 XP
            # Level 2: 100-399 XP
            # Level 3: 400-899 XP
            import math
            new_level = 1 + int(math.sqrt(new_xp / 100))
            
            leveled_up = new_level > current_level
            
            cursor.execute(
                "UPDATE user_stats SET xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                (new_xp, new_level, user_id)
            )
            conn.commit()
            
            return {
                "xp": new_xp,
                "level": new_level,
                "leveled_up": leveled_up,
                "xp_change": xp_change
            }
        finally:
            conn.close()
    
    # ==================== GOAL OPERATIONS ====================
    
    def save_goal(self, user_id: str, goal_text: str, timeframe: str, strategy: str = None, category: str = None, target_minutes: int = None) -> Dict:
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
                """INSERT INTO user_goals 
                   (user_id, goal_text, timeframe, strategy, category, target_minutes_per_day) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (user_id, goal_text, timeframe, strategy, category, target_minutes)
            )
            
            goal_id = cursor.lastrowid
            conn.commit()
            
            return {
                "id": goal_id,
                "user_id": user_id,
                "goal_text": goal_text,
                "timeframe": timeframe,
                "strategy": strategy,
                "category": category,
                "target_minutes_per_day": target_minutes
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

    def get_user_goals(self, user_id: str) -> List[Dict]:
        """Get all goals for a user, ordered by date."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    def set_active_goal(self, user_id: str, goal_id: int) -> bool:
        """Set a specific goal as active and deactivate others."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Verify goal belongs to user
            cursor.execute("SELECT id FROM user_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
            if not cursor.fetchone():
                return False
            
            # Deactivate all
            cursor.execute("UPDATE user_goals SET is_active = 0 WHERE user_id = ?", (user_id,))
            
            # Activate target
            cursor.execute("UPDATE user_goals SET is_active = 1 WHERE id = ?", (goal_id,))
            
            conn.commit()
            return True
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
            
            # Also log as a generic event
            self.log_event(user_id, goal_id, "NUDGE_SENT", f"Level {level} - {distractor}")
            
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

    # ==================== V2 OPERATIONS (STATS & EVENTS) ====================

    def save_daily_stats(self, user_id: str, stats: Dict):
        """Save or update daily stats."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            today = date.today().isoformat()
            
            cursor.execute("""
                INSERT INTO daily_stats (
                    date, user_id, goal_id, success_probability, 
                    focus_minutes, distraction_minutes, deep_work_blocks
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, user_id) DO UPDATE SET
                    success_probability = COALESCE(excluded.success_probability, daily_stats.success_probability),
                    goal_id = COALESCE(excluded.goal_id, daily_stats.goal_id),
                    focus_minutes = excluded.focus_minutes,
                    distraction_minutes = excluded.distraction_minutes,
                    deep_work_blocks = excluded.deep_work_blocks
            """, (
                today, user_id, stats.get('goal_id'), stats.get('success_probability'),
                stats.get('focus_minutes', 0), stats.get('distraction_minutes', 0),
                stats.get('deep_work_blocks', 0)
            ))
            
            conn.commit()
        finally:
            conn.close()
            
    def get_daily_stats(self, user_id: str, days: int = 7) -> List[Dict]:
        """Get daily stats for charting."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM daily_stats
                WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
                ORDER BY date ASC
            """, (user_id, days))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
            
    def log_event(self, user_id: str, goal_id: Optional[int], event_type: str, metadata: str = None):
        """Log a granular event."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO events (user_id, goal_id, type, metadata)
                VALUES (?, ?, ?, ?)
            """, (user_id, goal_id, event_type, metadata))
            conn.commit()
        finally:
            conn.close()

    def get_recent_logs(self, user_id: str = None, limit: int = 50) -> List[Dict]:
        """Get recent activity logs."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            query = "SELECT * FROM events"
            params = []
            
            if user_id:
                query += " WHERE user_id = ?"
                params.append(user_id)
                
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, tuple(params))
            
            rows = cursor.fetchall()
            logs = []
            for row in rows:
                # Map DB fields to frontend format
                # Frontend expects: id, type, message, timestamp
                # DB has: id, user_id, goal_id, timestamp, type, metadata
                
                # Map type: URL_VISIT -> app, CONTEXT_SWITCH -> system/app?
                # Actually, frontend handles: system, focus, nudge, app
                
                log_type = "system"
                message = row["metadata"] or ""
                
                if row["type"] == "URL_VISIT":
                    log_type = "app"
                    # Parse metadata json if possible
                    try:
                        import json
                        meta = json.loads(row["metadata"])
                        message = f"Visited {meta.get('url')}"
                    except:
                        pass
                elif row["type"] == "CONTEXT_SWITCH":
                    log_type = "app"
                    message = f"Switched to {row['metadata']}"
                elif row["type"] == "NUDGE_SHOWN":
                    log_type = "nudge"
                    message = "Smart Nudge Triggered"
                elif row["type"] == "NUDGE_SENT":
                    log_type = "nudge"
                
                # Ensure timestamp is treated as UTC by appending 'Z' if missing
                timestamp = row["timestamp"]
                if timestamp and not timestamp.endswith("Z"):
                    timestamp += "Z"

                logs.append({
                    "id": str(row["id"]),
                    "type": log_type,
                    "message": message,
                    "timestamp": timestamp
                })
                
            return logs
        except Exception as e:
            print(f"Error fetching logs: {e}")
            return []
        finally:
            conn.close()
            
    def save_ai_report(self, user_id: str, report_type: str, content: str):
        """Save an AI generated report."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO ai_reports (user_id, type, content)
                VALUES (?, ?, ?)
            """, (user_id, report_type, content))
            conn.commit()
        finally:
            conn.close()
            
    def get_latest_report(self, user_id: str, report_type: str) -> Optional[Dict]:
        """Get the most recent report of a specific type."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM ai_reports
                WHERE user_id = ? AND type = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id, report_type))
            
            row = cursor.fetchone()
            return dict(row) if row else None
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
