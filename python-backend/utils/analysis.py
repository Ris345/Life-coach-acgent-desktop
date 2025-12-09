"""
Analysis Utility Module
Provides shared logic for categorizing websites and apps into productivity buckets.
"""

from typing import Dict, List, Any

# Site Categories
PRODUCTIVE_SITES = {
    "job_search": ["linkedin.com", "indeed.com", "glassdoor.com", "monster.com", "wellfound.com"],
    "learning": ["leetcode.com", "coursera.org", "udemy.com", "hackerrank.com", 
                "stackoverflow.com", "github.com", "freecodecamp.org", "docs.python.org"],
    "productivity": ["notion.so", "todoist.com", "trello.com", "linear.app", "asana.com", "google.com/docs"]
}

DISTRACTOR_SITES = [
    "netflix.com", "youtube.com", "reddit.com",
    "twitter.com", "x.com", "instagram.com", 
    "facebook.com", "tiktok.com", "twitch.tv", "hulu.com", "disneyplus.com"
]

def categorize_url(url: str) -> str:
    """
    Categorize a URL into 'productive', 'distracting', or 'neutral'.
    """
    url_lower = url.lower()
    
    # Check distractors first
    for site in DISTRACTOR_SITES:
        if site in url_lower:
            return "distracting"
            
    # Check productive
    for category, sites in PRODUCTIVE_SITES.items():
        for site in sites:
            if site in url_lower:
                return "productive"
                
    return "neutral"

def analyze_tab_usage(tab_usage: Dict[str, Dict[str, Any]]) -> Dict[str, float]:
    """
    Analyze raw tab usage data and return aggregated time by category.
    
    Args:
        tab_usage: Dict {url: {total_seconds: float, ...}}
        
    Returns:
        Dict {
            "productive_time": float,
            "distraction_time": float,
            "neutral_time": float,
            "total_time": float
        }
    """
    analysis = {
        "productive_time": 0.0,
        "distraction_time": 0.0,
        "neutral_time": 0.0,
        "total_time": 0.0
    }
    
    for url, data in tab_usage.items():
        seconds = data.get("total_seconds", 0)
        category = categorize_url(url)
        
        if category == "productive":
            analysis["productive_time"] += seconds
        elif category == "distracting":
            analysis["distraction_time"] += seconds
        else:
            analysis["neutral_time"] += seconds
            
        analysis["total_time"] += seconds
        
    return analysis

def get_current_distractor(chrome_tabs: List[Dict[str, Any]]) -> str:
    """
    Identify if any currently open tab is a distractor.
    Returns the URL of the first found distractor, or None.
    """
    for tab in chrome_tabs:
        url = tab.get("url", "")
        if categorize_url(url) == "distracting":
            return url
    return None
