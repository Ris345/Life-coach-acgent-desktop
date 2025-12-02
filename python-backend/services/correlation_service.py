import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any
from db.sqlite_client import get_sqlite_cursor

class CorrelationService:
    def __init__(self):
        pass

    def get_app_focus_correlations(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Analyzes the relationship between app usage and focus scores over the last N days.
        Returns a list of apps with their correlation score (-1.0 to 1.0) and impact description.
        """
        # 1. Fetch Daily Stats (Focus Score)
        daily_stats = self._get_daily_data(user_id, days)
        if len(daily_stats) < 2:
            return [] # Need at least 2 days for correlation

        # Map date -> focus_score
        daily_scores = {row['date']: row['focus_score'] for row in daily_stats}
        valid_dates = set(daily_scores.keys())

        # 2. Fetch App Usage
        app_usage = self._get_app_usage_data(user_id, days)
        
        # Organize by App -> [daily_durations] aligned with valid_dates
        # We need two aligned vectors for each app: [usage_minutes], [focus_scores]
        
        app_vectors = {} # {app_name: {'usage': [], 'scores': []}}
        
        # Initialize vectors
        sorted_dates = sorted(list(valid_dates))
        
        # Pre-fill with 0s
        for row in app_usage:
            app = row['app_name']
            if app not in app_vectors:
                app_vectors[app] = {
                    'usage': [0.0] * len(sorted_dates),
                    'scores': [daily_scores[d] for d in sorted_dates]
                }
            
            # Find index of this date
            if row['date'] in sorted_dates:
                idx = sorted_dates.index(row['date'])
                app_vectors[app]['usage'][idx] = row['total_seconds'] / 60.0 # Convert to minutes

        # 3. Calculate Correlations
        results = []
        for app, vectors in app_vectors.items():
            usage = vectors['usage']
            scores = vectors['scores']
            
            # Skip if app was rarely used (e.g. only once) to avoid noise
            if sum(1 for u in usage if u > 0) < 2:
                continue
                
            correlation = self._calculate_pearson(usage, scores)
            
            if correlation is not None:
                # Determine impact
                impact = "Neutral"
                if correlation > 0.3: impact = "Positive"
                if correlation > 0.6: impact = "High Positive"
                if correlation < -0.3: impact = "Negative"
                if correlation < -0.6: impact = "High Negative"
                
                avg_usage = sum(usage) / len(usage)
                
                results.append({
                    "app": app,
                    "correlation": round(correlation, 2),
                    "impact": impact,
                    "usage_avg": f"{int(avg_usage)}m"
                })

        # Sort by absolute correlation (most significant first)
        results.sort(key=lambda x: abs(x['correlation']), reverse=True)
        return results[:10] # Top 10

    def _get_daily_data(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Fetches daily focus stats from SQLite."""
        try:
            with get_sqlite_cursor() as cursor:
                start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
                
                # Use success_probability if available, else calculate from minutes
                cursor.execute("""
                    SELECT date, 
                           COALESCE(success_probability / 100.0, 
                                    focus_minutes * 1.0 / NULLIF(focus_minutes + distraction_minutes, 0),
                                    0.5) as focus_score
                    FROM daily_stats 
                    WHERE user_id = ? AND date >= ?
                    ORDER BY date ASC
                """, (user_id, start_date))
                
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching daily data: {e}")
            return []

    def _get_app_usage_data(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Fetches app usage grouped by date."""
        try:
            with get_sqlite_cursor() as cursor:
                start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
                
                cursor.execute("""
                    SELECT date, app_name, total_seconds
                    FROM application_usage
                    WHERE user_id = ? AND date >= ?
                """, (user_id, start_date))
                
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching app usage: {e}")
            return []

    def _calculate_pearson(self, x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient."""
        n = len(x)
        if n != len(y) or n < 2:
            return 0.0
            
        sum_x = sum(x)
        sum_y = sum(y)
        sum_x_sq = sum(xi*xi for xi in x)
        sum_y_sq = sum(yi*yi for yi in y)
        sum_xy = sum(xi*yi for xi, yi in zip(x, y))
        
        numerator = n * sum_xy - sum_x * sum_y
        denominator = ((n * sum_x_sq - sum_x**2) * (n * sum_y_sq - sum_y**2)) ** 0.5
        
        if denominator == 0:
            return 0.0
            
        return numerator / denominator

    def seed_mock_data(self, user_id: str):
        """Generates 7 days of realistic mock data for immediate value."""
        print(f"🌱 Seeding mock data for user {user_id}...")
        try:
            with get_sqlite_cursor() as cursor:
                # Check if data exists
                cursor.execute("SELECT COUNT(*) FROM daily_stats WHERE user_id = ?", (user_id,))
                if cursor.fetchone()[0] > 2:
                    print("Data already exists, skipping seed.")
                    return

                import random
                apps = ["VS Code", "Slack", "Chrome", "Spotify", "Terminal", "Zoom"]
                
                for i in range(7):
                    date_str = (datetime.now() - timedelta(days=7-i)).strftime('%Y-%m-%d')
                    
                    # 1. Generate Daily Stats
                    # Randomize focus score (0.3 to 0.9)
                    focus_score = random.uniform(0.3, 0.9)
                    focus_min = int(480 * focus_score) # 8 hours work day
                    distraction_min = int(480 * (1 - focus_score))
                    
                    cursor.execute("""
                        INSERT OR IGNORE INTO daily_stats 
                        (date, user_id, success_probability, focus_minutes, distraction_minutes)
                        VALUES (?, ?, ?, ?, ?)
                    """, (date_str, user_id, int(focus_score * 100), focus_min, distraction_min))
                    
                    # 2. Generate App Usage
                    # Correlate VS Code with high focus, Slack with low focus
                    for app in apps:
                        duration = 0
                        if app == "VS Code":
                            duration = int(random.uniform(120, 300) * (focus_score + 0.2)) # More usage on good days
                        elif app == "Slack":
                            duration = int(random.uniform(30, 120) * (1.5 - focus_score)) # More usage on bad days
                        else:
                            duration = int(random.uniform(10, 60))
                            
                        cursor.execute("""
                            INSERT OR IGNORE INTO application_usage
                            (user_id, app_name, total_seconds, date)
                            VALUES (?, ?, ?, ?)
                        """, (user_id, app, duration * 60, date_str))
                        
            print("✅ Mock data seeded successfully.")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error seeding mock data: {e}")
