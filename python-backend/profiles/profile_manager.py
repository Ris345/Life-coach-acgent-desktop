"""
Profile Manager - Maps parsed goals to productivity profiles.
Combines AI parsing with built-in profiles to create master profiles.
"""

from typing import Dict, Optional
from .profiles import PROFILE_DEFINITIONS, get_profile
from .goal_mapper import map_goal_to_profile as legacy_map_goal


def map_goal_to_profile(parsed_goal: Dict, original_goal_text: str = "") -> Dict:
    """
    Combine AI parsing + built-in profiles to create a master profile.
    
    Args:
        parsed_goal: Parsed goal from AI parser (contains category, topic, etc.)
        original_goal_text: Original goal text for fallback matching
        
    Returns:
        Master profile dictionary with:
            - profile_name: Name of the profile
            - focus_apps: List of focus apps
            - distraction_apps: List of distraction apps
            - neutral_apps: List of neutral apps
            - keywords: Keywords for categorization
            - goal_examples: Example goals
            - target_daily_minutes: Target minutes per day
            - weekly_target_days: Target days per week
            - category: Goal category
            - topic: Goal topic
    """
    # First, try to match with built-in profiles using legacy mapper
    legacy_profile = legacy_map_goal(original_goal_text or parsed_goal.get("topic", ""))
    
    # Start with parsed goal data
    master_profile = {
        "profile_name": legacy_profile.get("profile_name", f"{parsed_goal.get('topic', 'Custom')} Profile"),
        "category": parsed_goal.get("category", "other"),
        "topic": parsed_goal.get("topic", "goal"),
        "target_daily_minutes": parsed_goal.get("target_daily_minutes", 60),
        "weekly_target_days": parsed_goal.get("weekly_target_days", 5),
        "focus_apps": list(set(parsed_goal.get("focus_apps", []) + legacy_profile.get("focus_apps", []))),
        "distraction_apps": list(set(parsed_goal.get("distraction_apps", []) + legacy_profile.get("distraction_apps", []))),
        "neutral_apps": legacy_profile.get("neutral_apps", []),
        "keywords": _generate_keywords(parsed_goal, legacy_profile),
        "goal_examples": legacy_profile.get("goal_examples", [])
    }
    
    # Enhance with category-specific apps if needed
    master_profile = _enhance_with_category_apps(master_profile, parsed_goal)
    
    return master_profile


def _generate_keywords(parsed_goal: Dict, legacy_profile: Dict) -> list:
    """
    Generate keywords for categorization based on parsed goal and legacy profile.
    """
    keywords = set(legacy_profile.get("keywords", []))
    
    # Add topic as keyword
    topic = parsed_goal.get("topic", "").lower()
    if topic:
        keywords.add(topic)
        # Add variations
        if "aws" in topic:
            keywords.update(["aws", "amazon web services", "cloud"])
        elif "react" in topic:
            keywords.update(["react", "reactjs", "frontend"])
        elif "python" in topic:
            keywords.update(["python", "py"])
    
    # Add category keywords
    category = parsed_goal.get("category", "")
    if category == "learning":
        keywords.update(["study", "learn", "course", "tutorial"])
    elif category == "coding":
        keywords.update(["code", "programming", "develop", "build"])
    
    return list(keywords)


def _enhance_with_category_apps(profile: Dict, parsed_goal: Dict) -> Dict:
    """
    Enhance profile with category-specific apps.
    """
    category = parsed_goal.get("category", "")
    topic = parsed_goal.get("topic", "").lower()
    
    # Add domain-specific apps
    if category == "learning" and "aws" in topic:
        profile["focus_apps"].extend(["AWS Console", "AWS CLI", "Terminal"])
        profile["keywords"].extend(["aws.amazon.com", "aws docs"])
    
    # Remove duplicates
    profile["focus_apps"] = list(set(profile["focus_apps"]))
    profile["distraction_apps"] = list(set(profile["distraction_apps"]))
    
    return profile

