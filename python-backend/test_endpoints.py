"""
Quick test to verify endpoints are working.
Run this while the backend is running.
"""

import requests
import time

BASE_URL = "http://127.0.0.1:14200"

def test_endpoints():
    print("Testing Behavior Tracking Endpoints...")
    print("=" * 50)
    
    # Test health
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=2)
        print(f"✅ /health: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"❌ /health failed: {e}")
        print("   Make sure the backend is running: python main.py")
        return
    
    # Test activity (records in tracker)
    print("\nPolling /activity 3 times to generate data...")
    for i in range(3):
        try:
            resp = requests.get(f"{BASE_URL}/activity", timeout=2)
            data = resp.json()
            print(f"  Poll {i+1}: {data.get('active_window', 'None')} - {data.get('status')}")
            time.sleep(1)
        except Exception as e:
            print(f"  ❌ Poll {i+1} failed: {e}")
    
    # Test stats
    print("\n📊 Checking /stats...")
    try:
        resp = requests.get(f"{BASE_URL}/stats", timeout=2)
        stats = resp.json()
        print(f"  Total polls: {stats.get('total_polls', 0)}")
        print(f"  Focus minutes: {stats.get('total_focus_minutes', 0):.2f}")
        print(f"  Current streak: {stats.get('current_streak_seconds', 0):.1f}s")
        print(f"  Current category: {stats.get('current_category', 'None')}")
        if stats.get('total_polls', 0) == 0:
            print("  ⚠️  No polls recorded - window detection might not be working")
    except Exception as e:
        print(f"  ❌ /stats failed: {e}")
    
    # Test summary
    print("\n📈 Checking /summary...")
    try:
        resp = requests.get(f"{BASE_URL}/summary", timeout=2)
        summary = resp.json()
        print(f"  Focus %: {summary.get('focus_percentage', 0)}%")
        print(f"  Top productive apps: {len(summary.get('top_productive_apps', []))}")
        print(f"  Top distracting apps: {len(summary.get('top_distracting_apps', []))}")
    except Exception as e:
        print(f"  ❌ /summary failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Endpoint test complete!")

if __name__ == "__main__":
    test_endpoints()

