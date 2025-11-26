"""
Window/app categorization logic with profile-based classification.
"""

import re
from typing import Dict, List, Optional


class WindowCategorizer:
    """
    Categorizes windows/apps into focus, neutral, or distraction categories.
    """
    
    def __init__(self):
        # Focus apps - productivity and coding tools
        self.focus_keywords = [
            "cursor", "vscode", "visual studio code", "code",
            "pycharm", "intellij", "webstorm", "idea",
            "sublime", "atom", "vim", "neovim", "emacs",
            "xcode", "android studio", "studio",
            "terminal", "iterm", "alacritty", "kitty",
            "notion", "obsidian", "roam", "logseq",
            "slack", "teams", "discord",  # Communication for work
            "figma", "sketch", "adobe xd",  # Design tools
            "jupyter", "notebook", "colab",
            "github desktop", "gitkraken", "sourcetree",
        ]
        
        # Distraction apps - entertainment and social media
        self.distraction_keywords = [
            "youtube", "youtu.be",
            "instagram", "insta",
            "tiktok", "tiktok.com",
            "twitter", "x.com", "twitter.com",
            "facebook", "fb.com",
            "reddit", "redd.it",
            "netflix", "hulu", "disney+", "disney plus",
            "spotify", "apple music",  # Can be distraction if not background
            "twitch", "twitch.tv",
            "pinterest", "pinterest.com",
            "snapchat", "snap",
            "discord",  # Can be distraction if not work-related
            "games", "steam", "epic games",
            "playstation", "xbox",
        ]
        
        # Neutral apps - system and utility apps
        self.neutral_keywords = [
            "finder", "explorer", "file manager",
            "settings", "preferences", "system preferences",
            "activity monitor", "task manager",
            "calendar", "mail", "messages",  # Can be work or personal
            "safari", "chrome", "firefox", "edge",  # Browsers are neutral by default
            "lifeos", "life-os", "life coach", "lifecoach",  # LifeOS app itself
            "lifecoachagent", "life-coach-agent", "lifecoachagent-desktop",  # Alternative app names
        ]
        
        # Compile regex patterns for faster matching
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns for keyword matching."""
        self.focus_patterns = [re.compile(keyword, re.IGNORECASE) for keyword in self.focus_keywords]
        self.distraction_patterns = [re.compile(keyword, re.IGNORECASE) for keyword in self.distraction_keywords]
        self.neutral_patterns = [re.compile(keyword, re.IGNORECASE) for keyword in self.neutral_keywords]
    
    def categorize(self, window_title: str, goal_profile: Optional[Dict] = None) -> str:
        """
        Categorize a window/app into focus, neutral, or distraction.
        Uses profile-based classification with keyword matching.
        
        Args:
            window_title: The title or name of the active window/app
            goal_profile: Optional profile dictionary from goal mapper
            
        Returns:
            "focus", "neutral", or "distraction"
        """
        if not window_title:
            return "neutral"
        
        window_lower = window_title.lower()
        
        # Always categorize LifeOS app itself as neutral (it's the tracking app)
        if any(keyword in window_lower for keyword in [
            "lifeos", "life-os", "life coach", "lifecoach", 
            "lifecoachagent", "life-coach-agent", "lifecoachagent-desktop"
        ]):
            return "neutral"
        
        # Profile-based classification (if profile provided)
        if goal_profile:
            focus_apps = goal_profile.get("focus_apps", [])
            distraction_apps = goal_profile.get("distraction_apps", [])
            neutral_apps = goal_profile.get("neutral_apps", [])
            keywords = goal_profile.get("keywords", [])
            
            # Check focus apps
            for app in focus_apps:
                if app.lower() in window_lower:
                    return "focus"
            
            # Check distraction apps
            for app in distraction_apps:
                if app.lower() in window_lower:
                    return "distraction"
            
            # Check neutral apps
            for app in neutral_apps:
                if app.lower() in window_lower:
                    return "neutral"
            
            # Check keywords (for future browser tab support)
            for keyword in keywords:
                if keyword.lower() in window_lower:
                    return "focus"
        
        # Fallback to default categorization
        # Check for focus apps first (highest priority)
        for pattern in self.focus_patterns:
            if pattern.search(window_lower):
                return "focus"
        
        # Check for distraction apps (second priority)
        for pattern in self.distraction_patterns:
            if pattern.search(window_lower):
                return "distraction"
        
        # Check for neutral apps (third priority)
        for pattern in self.neutral_patterns:
            if pattern.search(window_lower):
                return "neutral"
        
        # Default to neutral for unknown apps
        return "neutral"
    
    
    def add_focus_keyword(self, keyword: str):
        """Add a custom focus keyword."""
        self.focus_keywords.append(keyword.lower())
        self.focus_patterns.append(re.compile(keyword, re.IGNORECASE))
    
    def add_distraction_keyword(self, keyword: str):
        """Add a custom distraction keyword."""
        self.distraction_keywords.append(keyword.lower())
        self.distraction_patterns.append(re.compile(keyword, re.IGNORECASE))

