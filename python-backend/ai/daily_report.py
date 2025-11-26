"""
AI Daily Report Generator - Creates personalized coaching reports.
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
import requests


def generate_daily_report(tracker_data: Dict, goal_profile: Optional[Dict] = None) -> Dict:
    """
    Generate a daily coaching report using AI or rule-based logic.
    
    Args:
        tracker_data: Behavior tracker data including stats, events, etc.
        goal_profile: Goal profile dictionary
        
    Returns:
        Dictionary with:
            - celebration: Wins and achievements
            - insights: Key insights about behavior
            - recommendation: Actionable recommendations
            - motivation: Motivational message
    """
    # Try AI generation first
    report = _generate_with_ai(tracker_data, goal_profile)
    if report:
        return report
    
    # Fall back to rule-based generation
    return _generate_rule_based(tracker_data, goal_profile)


def _generate_with_ai(tracker_data: Dict, goal_profile: Optional[Dict]) -> Optional[Dict]:
    """
    Generate report using Ollama.
    """
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code != 200:
            return None
    except:
        return None
    
    # Build prompt
    stats = tracker_data.get("stats", {})
    goal = tracker_data.get("goal", "")
    goal_topic = goal_profile.get("topic", "") if goal_profile else ""
    
    prompt = f"""Generate a personalized daily productivity coaching report.

Goal: {goal}
Topic: {goal_topic}
Focus Time Today: {stats.get('total_focus_minutes', 0):.1f} minutes
Current Streak: {stats.get('current_streak_seconds', 0) / 60:.1f} minutes
Longest Streak: {stats.get('longest_focus_streak_seconds', 0) / 60:.1f} minutes
App Switches: {stats.get('app_switches', 0)}

Generate a report with 4 sections:
1. Celebration: Acknowledge wins and achievements (1-2 sentences)
2. Insights: Key behavioral insights (2-3 sentences)
3. Recommendation: Actionable advice for tomorrow (1-2 sentences)
4. Motivation: Encouraging message (1 sentence)

Return ONLY valid JSON:
{{
  "celebration": "...",
  "insights": "...",
  "recommendation": "...",
  "motivation": "..."
}}"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 400
                }
            },
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get("response", "")
            
            # Extract JSON
            import json
            import re
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
    except Exception as e:
        print(f"AI report generation failed: {e}")
    
    return None


def _generate_rule_based(tracker_data: Dict, goal_profile: Optional[Dict]) -> Dict:
    """
    Generate report using rule-based logic.
    """
    stats = tracker_data.get("stats", {})
    goal = tracker_data.get("goal", "")
    goal_topic = goal_profile.get("topic", "") if goal_profile else ""
    
    focus_minutes = stats.get("total_focus_minutes", 0)
    streak_minutes = stats.get("current_streak_seconds", 0) / 60.0
    longest_streak = stats.get("longest_focus_streak_seconds", 0) / 60.0
    app_switches = stats.get("app_switches", 0)
    
    # Celebration
    celebration_parts = []
    if focus_minutes >= 60:
        celebration_parts.append(f"You focused for {int(focus_minutes)} minutes today")
    if longest_streak >= 30:
        celebration_parts.append(f"your longest streak was {int(longest_streak)} minutes")
    
    if celebration_parts:
        celebration = f"Great work! {' and '.join(celebration_parts)}."
    else:
        celebration = "You're building momentum. Every minute of focus counts!"
    
    # Insights
    insights_parts = []
    if focus_minutes > 0:
        insights_parts.append(f"You spent {int(focus_minutes)} minutes in focused work")
    if app_switches > 50:
        insights_parts.append(f"you switched apps {app_switches} times - consider reducing context switching")
    elif app_switches < 20:
        insights_parts.append("you maintained good focus with minimal app switching")
    
    insights = ". ".join(insights_parts) + "." if insights_parts else "Keep tracking your progress to build better habits."
    
    # Recommendation
    if focus_minutes < 30:
        recommendation = "Try to build up to at least 30 minutes of focused work tomorrow. Start with shorter blocks."
    elif focus_minutes < 60:
        recommendation = "You're making progress! Aim for 60 minutes of focused work tomorrow."
    else:
        recommendation = "Excellent consistency! Consider maintaining this level or slightly increasing your goal."
    
    # Motivation
    if goal_topic:
        motivation = f"Keep pushing toward your {goal_topic} goal - you've got this!"
    elif goal:
        motivation = f"Stay focused on '{goal}' - consistency is key!"
    else:
        motivation = "Keep building your focus habits - every day counts!"
    
    return {
        "celebration": celebration,
        "insights": insights,
        "recommendation": recommendation,
        "motivation": motivation
    }

