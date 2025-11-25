"""
Browser tab classification (placeholder for future browser extension support).
"""

from typing import Dict, Optional


def classify_tab(url: str, profile: Optional[Dict] = None) -> str:
    """
    Classify a browser tab URL into focus, neutral, or distraction.
    
    This is a placeholder for future browser extension integration.
    The browser extension will POST {"url": "..."} to /browser_tab endpoint.
    
    Args:
        url: Browser tab URL
        profile: Optional profile dictionary from goal mapper
        
    Returns:
        "focus", "neutral", or "distraction"
    """
    if not url:
        return "neutral"
    
    url_lower = url.lower()
    
    # Profile-based classification (if profile provided)
    if profile:
        allowed_domains = profile.get("allowed_domains", [])
        keywords = profile.get("keywords", [])
        distraction_apps = profile.get("distraction_apps", [])
        
        # Check if URL matches allowed domains
        for domain in allowed_domains:
            if domain in url_lower:
                return "focus"
        
        # Check if URL matches distraction patterns
        for app in distraction_apps:
            if app in url_lower:
                return "distraction"
        
        # Check keywords
        for keyword in keywords:
            if keyword in url_lower:
                return "focus"
    
    # Default classification based on common patterns
    distraction_domains = [
        "youtube.com", "youtu.be",
        "instagram.com", "tiktok.com",
        "twitter.com", "x.com",
        "facebook.com", "reddit.com",
        "netflix.com", "hulu.com",
        "twitch.tv",
    ]
    
    for domain in distraction_domains:
        if domain in url_lower:
            return "distraction"
    
    # Default to neutral for unknown URLs
    return "neutral"

