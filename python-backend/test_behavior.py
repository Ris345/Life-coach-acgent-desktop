"""
Quick test script for behavior tracking.
Run this to verify the behavior engine works.
"""

from behavior import BehaviorTracker, WindowCategorizer
from datetime import datetime

def test_categorizer():
    """Test window categorization."""
    print("Testing Window Categorizer...")
    categorizer = WindowCategorizer()
    
    test_cases = [
        ("Cursor", "focus"),
        ("Visual Studio Code", "focus"),
        ("YouTube", "distraction"),
        ("Instagram", "distraction"),
        ("Finder", "neutral"),
        ("Safari", "neutral"),
    ]
    
    for window, expected in test_cases:
        result = categorizer.categorize(window)
        status = "✅" if result == expected else "❌"
        print(f"  {status} {window} -> {result} (expected: {expected})")
    
    print()

def test_tracker():
    """Test behavior tracker."""
    print("Testing Behavior Tracker...")
    tracker = BehaviorTracker()
    
    # Simulate some activity
    now = datetime.now()
    tracker.record_activity("Cursor", now)
    tracker.record_activity("Cursor", now.replace(second=now.second + 5))
    tracker.record_activity("YouTube", now.replace(second=now.second + 10))
    tracker.record_activity("YouTube", now.replace(second=now.second + 15))
    tracker.record_activity("Cursor", now.replace(second=now.second + 20))
    
    # Get stats
    stats = tracker.get_stats()
    print(f"  Total polls: {stats.total_polls}")
    print(f"  Focus minutes: {stats.total_focus_minutes:.2f}")
    print(f"  Distraction minutes: {stats.total_distraction_minutes:.2f}")
    print(f"  App switches: {stats.app_switches}")
    print(f"  Current category: {stats.current_category}")
    print()
    
    # Get summary
    summary = tracker.get_daily_summary()
    print(f"  Daily Summary:")
    print(f"    Focus: {summary.total_focus_minutes:.2f} min")
    print(f"    Distraction: {summary.total_distraction_minutes:.2f} min")
    print(f"    Focus %: {summary.focus_percentage}%")
    print()

if __name__ == "__main__":
    print("=" * 50)
    print("Behavior Engine Test")
    print("=" * 50)
    print()
    
    test_categorizer()
    test_tracker()
    
    print("✅ All tests completed!")

