"""
AI Goal Interpreter - Converts natural language goals into structured data.
Uses Ollama (local LLM) when available, falls back to rule-based parsing.
"""

import json
import re
from typing import Dict, Optional, List
import requests


def parse_goal_with_ai(goal_text: str) -> Dict:
    """
    Parse a natural language goal into structured JSON.
    
    Uses Ollama if available, otherwise falls back to rule-based parsing.
    
    Args:
        goal_text: User's goal in natural language (e.g., "study AWS for 1 hour daily")
        
    Returns:
        Dictionary with:
            - category: "learning", "coding", "health", "content_creation", etc.
            - topic: Main subject (e.g., "AWS", "React", "gym")
            - target_daily_minutes: Target minutes per day
            - weekly_target_days: Target days per week (default 5)
            - focus_apps: List of recommended focus apps
            - distraction_apps: List of distraction apps to avoid
            - timeframe: "daily", "weekly", etc.
    """
    # Try Ollama first
    parsed = _parse_with_ollama(goal_text)
    if parsed:
        return parsed
    
    # Fall back to rule-based parsing
    return _parse_rule_based(goal_text)


def _parse_with_ollama(goal_text: str) -> Optional[Dict]:
    """
    Use Ollama to parse the goal.
    """
    try:
        # Check if Ollama is available
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code != 200:
            return None
    except:
        return None
    
    # Prepare prompt for Ollama
    prompt = f"""Parse this productivity goal into structured JSON:

Goal: "{goal_text}"

Extract:
1. category: one of "learning", "coding", "health", "content_creation", "work", "other"
2. topic: the main subject (e.g., "AWS", "React", "gym", "writing")
3. target_daily_minutes: number of minutes per day (extract from "1 hour", "30 minutes", etc.)
4. weekly_target_days: number of days per week (default 5)
5. focus_apps: list of apps that would help achieve this goal
6. distraction_apps: list of apps that would distract from this goal
7. timeframe: "daily" or "weekly"

Return ONLY valid JSON, no markdown, no explanation.

Example output:
{{
  "category": "learning",
  "topic": "AWS",
  "target_daily_minutes": 60,
  "weekly_target_days": 5,
  "focus_apps": ["Chrome", "Udemy", "Notion"],
  "distraction_apps": ["YouTube", "X", "TikTok"],
  "timeframe": "daily"
}}"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 300
                }
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get("response", "")
            
            # Extract JSON from response (might have markdown code blocks)
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                # Validate and normalize
                return _normalize_parsed_goal(parsed)
    except Exception as e:
        print(f"Ollama parsing failed: {e}")
    
    return None


def _parse_rule_based(goal_text: str) -> Dict:
    """
    Rule-based goal parsing as fallback.
    """
    goal_lower = goal_text.lower()
    
    # Extract time duration
    target_minutes = 60  # default
    if "1 hour" in goal_lower or "60 minutes" in goal_lower:
        target_minutes = 60
    elif "30 minutes" in goal_lower or "half hour" in goal_lower:
        target_minutes = 30
    elif "2 hours" in goal_lower or "120 minutes" in goal_lower:
        target_minutes = 120
    elif "45 minutes" in goal_lower:
        target_minutes = 45
    else:
        # Try to extract number
        time_match = re.search(r'(\d+)\s*(?:min|minute|hour|hr)', goal_lower)
        if time_match:
            num = int(time_match.group(1))
            if "hour" in goal_lower or "hr" in goal_lower:
                target_minutes = num * 60
            else:
                target_minutes = num
    
    # Determine category and topic
    category = "other"
    topic = goal_text.split()[0] if goal_text.split() else "goal"
    
    if any(word in goal_lower for word in ["study", "learn", "course", "tutorial", "read"]):
        category = "learning"
        # Extract topic
        topic_match = re.search(r'(?:study|learn|course|tutorial|read)\s+([a-z]+)', goal_lower)
        if topic_match:
            topic = topic_match.group(1).title()
    elif any(word in goal_lower for word in ["code", "programming", "build", "develop"]):
        category = "coding"
        topic_match = re.search(r'(?:code|build|develop)\s+([a-z]+)', goal_lower)
        if topic_match:
            topic = topic_match.group(1).title()
    elif any(word in goal_lower for word in ["gym", "exercise", "workout", "fitness"]):
        category = "health"
        topic = "Fitness"
    elif any(word in goal_lower for word in ["write", "blog", "content", "article"]):
        category = "content_creation"
        topic = "Writing"
    
    # Extract topic from common patterns
    if category == "learning":
        # Look for specific topics
        topics = ["aws", "react", "python", "javascript", "typescript", "docker", "kubernetes"]
        for t in topics:
            if t in goal_lower:
                topic = t.upper() if t in ["aws", "docker", "kubernetes"] else t.title()
                break
    
    # Determine focus and distraction apps based on category
    focus_apps, distraction_apps = _get_apps_by_category(category, topic)
    
    # Determine timeframe
    timeframe = "daily"
    if "weekly" in goal_lower:
        timeframe = "weekly"
    
    # Weekly target days
    weekly_target_days = 5
    if "every day" in goal_lower or "daily" in goal_lower:
        weekly_target_days = 7
    elif "weekday" in goal_lower:
        weekly_target_days = 5
    
    return {
        "category": category,
        "topic": topic,
        "target_daily_minutes": target_minutes,
        "weekly_target_days": weekly_target_days,
        "focus_apps": focus_apps,
        "distraction_apps": distraction_apps,
        "timeframe": timeframe
    }


def _get_apps_by_category(category: str, topic: str) -> tuple[List[str], List[str]]:
    """
    Get recommended focus and distraction apps based on category.
    """
    focus_apps = []
    distraction_apps = ["YouTube", "TikTok", "Instagram", "X", "Twitter", "Facebook", "Netflix"]
    
    if category == "learning":
        focus_apps = ["Chrome", "Safari", "Udemy", "Coursera", "Notion", "Obsidian", "VSCode", "Cursor"]
        if "aws" in topic.lower():
            focus_apps.extend(["Chrome", "Terminal"])
    elif category == "coding":
        focus_apps = ["VSCode", "Cursor", "Xcode", "PyCharm", "Terminal", "iTerm", "Chrome", "GitHub"]
    elif category == "content_creation":
        focus_apps = ["Notion", "Obsidian", "VSCode", "Cursor", "Chrome", "Safari"]
    elif category == "health":
        focus_apps = ["Safari", "Chrome"]  # For workout videos/tracking
    else:
        focus_apps = ["Chrome", "Safari", "Notion"]
    
    return focus_apps, distraction_apps


def _normalize_parsed_goal(parsed: Dict) -> Dict:
    """
    Normalize and validate parsed goal data.
    """
    return {
        "category": parsed.get("category", "other"),
        "topic": parsed.get("topic", "goal"),
        "target_daily_minutes": int(parsed.get("target_daily_minutes", 60)),
        "weekly_target_days": int(parsed.get("weekly_target_days", 5)),
        "focus_apps": parsed.get("focus_apps", []),
        "distraction_apps": parsed.get("distraction_apps", []),
        "timeframe": parsed.get("timeframe", "daily")
    }

