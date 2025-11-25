"""
Test the nudge engine with various scenarios.
"""

from behavior import BehaviorTracker, NudgeEngine
from datetime import datetime, timedelta

def test_nudge_engine():
    print("Testing Nudge Engine...")
    print("=" * 50)
    
    tracker = BehaviorTracker()
    nudge_engine = NudgeEngine()
    
    now = datetime.now()
    
    # Scenario 1: User starts focusing
    print("\n1. User opens Cursor (focus app)...")
    tracker.record_activity("Cursor", now)
    stats = tracker.get_stats()
    nudge = nudge_engine.get_nudge(
        current_category="focus",
        previous_category=None,
        current_streak_seconds=0,
        goal="Study AWS",
        focus_time_minutes=0,
        active_window="Cursor"
    )
    print(f"   Category: {stats.current_category}")
    print(f"   Nudge: {nudge or 'None'}")
    
    # Scenario 2: User builds a streak
    print("\n2. User continues focusing (5 minutes)...")
    tracker.record_activity("Cursor", now + timedelta(minutes=5))
    stats = tracker.get_stats()
    nudge = nudge_engine.get_nudge(
        current_category="focus",
        previous_category="focus",
        current_streak_seconds=300,  # 5 minutes
        goal="Study AWS",
        focus_time_minutes=5,
        active_window="Cursor"
    )
    print(f"   Streak: {stats.current_streak_seconds / 60:.1f} minutes")
    print(f"   Nudge: {nudge or 'None'}")
    
    # Scenario 3: User drifts to distraction
    print("\n3. User switches to YouTube (drift detected)...")
    previous_cat = tracker.get_previous_category()  # Get before recording
    tracker.record_activity("YouTube", now + timedelta(minutes=6))
    stats = tracker.get_stats()
    nudge = nudge_engine.get_nudge(
        current_category=stats.current_category or "distraction",
        previous_category=previous_cat,
        current_streak_seconds=stats.current_streak_seconds,
        goal="Study AWS",
        focus_time_minutes=stats.total_focus_minutes,
        active_window="YouTube"
    )
    print(f"   Previous category: {previous_cat}")
    print(f"   Current category: {stats.current_category}")
    print(f"   Nudge: {nudge or 'None'}")
    
    # Scenario 4: Long distraction session
    print("\n4. User stays on YouTube for 10+ minutes...")
    tracker.record_activity("YouTube", now + timedelta(minutes=16))
    stats = tracker.get_stats()
    nudge = nudge_engine.get_nudge(
        current_category="distraction",
        previous_category="distraction",
        current_streak_seconds=0,
        goal="Study AWS",
        focus_time_minutes=5,
        distraction_time_minutes=10,
        active_window="YouTube"
    )
    print(f"   Distraction time: 10+ minutes")
    print(f"   Nudge: {nudge or 'None'}")
    
    print("\n" + "=" * 50)
    print("✅ Nudge engine test complete!")

if __name__ == "__main__":
    test_nudge_engine()

