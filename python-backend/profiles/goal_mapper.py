"""
Goal → Profile Mapping Engine
Maps user goals to the best-fit profile using keyword matching and similarity.
"""

from typing import Dict, List, Optional
import re
from .profiles import PROFILE_DEFINITIONS, get_profile


class GoalMapper:
    """
    Maps user goals to profiles using keyword matching and similarity scoring.
    """
    
    def __init__(self):
        self.profiles = PROFILE_DEFINITIONS
    
    def map_goal_to_profile(self, goal: str) -> Dict:
        """
        Map a goal string to the best-fit profile.
        
        Args:
            goal: User's goal text (e.g., "study aws", "coding session")
            
        Returns:
            Enriched profile dictionary with:
            - chosen_profile: Profile name
            - profile_data: Full profile definition
            - goal_keywords: Extracted keywords from goal
            - focus_apps: List of focus apps
            - distraction_apps: List of distraction apps
            - neutral_apps: List of neutral apps
            - keywords: Profile keywords + goal keywords
            - allowed_domains: For future browser extension
        """
        goal_lower = goal.lower()
        
        # Score each profile based on keyword matches
        profile_scores = {}
        
        for profile_name, profile_data in self.profiles.items():
            if profile_name == "custom":
                continue  # Skip custom, use as fallback
            
            score = 0
            
            # Check goal examples
            for example in profile_data.get("goal_examples", []):
                if example.lower() in goal_lower:
                    score += 10
            
            # Check keywords
            for keyword in profile_data.get("keywords", []):
                if keyword.lower() in goal_lower:
                    score += 5
            
            # Check profile name
            profile_name_words = profile_name.replace("_", " ").split()
            for word in profile_name_words:
                if word in goal_lower:
                    score += 3
            
            profile_scores[profile_name] = score
        
        # Find best match
        best_profile = max(profile_scores.items(), key=lambda x: x[1])
        
        # Use best profile if score > 0, otherwise use deep_work as default
        if best_profile[1] > 0:
            chosen_profile_name = best_profile[0]
        else:
            chosen_profile_name = "deep_work"  # Default profile
        
        profile_data = get_profile(chosen_profile_name)
        if not profile_data:
            profile_data = get_profile("deep_work")
        
        # Extract keywords from goal
        goal_keywords = self._extract_goal_keywords(goal)
        
        # Merge profile keywords with goal keywords
        merged_keywords = list(set(profile_data.get("keywords", []) + goal_keywords))
        
        # Build allowed domains (for future browser extension)
        allowed_domains = self._build_allowed_domains(profile_data, goal_keywords)
        
        return {
            "chosen_profile": chosen_profile_name,
            "profile_name": profile_data.get("profile_name", chosen_profile_name),
            "profile_data": profile_data,
            "goal_keywords": goal_keywords,
            "focus_apps": profile_data.get("focus_apps", []),
            "distraction_apps": profile_data.get("distraction_apps", []),
            "neutral_apps": profile_data.get("neutral_apps", []),
            "keywords": merged_keywords,
            "allowed_domains": allowed_domains,
        }
    
    def _extract_goal_keywords(self, goal: str) -> List[str]:
        """
        Extract relevant keywords from goal text.
        
        Args:
            goal: Goal text
            
        Returns:
            List of extracted keywords
        """
        goal_lower = goal.lower()
        keywords = []
        
        # Common technology/domain keywords
        tech_keywords = [
            "aws", "amazon web services", "ec2", "s3", "lambda", "rds",
            "python", "javascript", "typescript", "java", "react", "vue",
            "coding", "programming", "development", "dev",
            "learn", "study", "practice", "build",
        ]
        
        for keyword in tech_keywords:
            if keyword in goal_lower:
                keywords.append(keyword)
        
        # Extract meaningful words (length > 3, not common words)
        common_words = {"the", "a", "an", "and", "or", "to", "for", "on", "in", "at", "is", "are", "was", "were"}
        words = re.findall(r'\b\w+\b', goal_lower)
        for word in words:
            if len(word) > 3 and word not in common_words:
                keywords.append(word)
        
        return list(set(keywords))  # Remove duplicates
    
    def _build_allowed_domains(self, profile_data: Dict, goal_keywords: List[str]) -> List[str]:
        """
        Build list of allowed domains for browser extension (future use).
        
        Args:
            profile_data: Profile definition
            goal_keywords: Extracted goal keywords
            
        Returns:
            List of allowed domains
        """
        domains = []
        
        # Add domains based on keywords
        keyword_to_domain = {
            "aws": ["aws.amazon.com", "docs.aws.amazon.com"],
            "python": ["python.org", "docs.python.org", "pypi.org"],
            "javascript": ["developer.mozilla.org", "nodejs.org"],
            "react": ["react.dev", "reactjs.org"],
            "github": ["github.com"],
        }
        
        for keyword in goal_keywords:
            if keyword in keyword_to_domain:
                domains.extend(keyword_to_domain[keyword])
        
        # Add common development domains
        domains.extend([
            "stackoverflow.com",
            "github.com",
            "gitlab.com",
            "developer.mozilla.org",
            "w3schools.com",
        ])
        
        return list(set(domains))  # Remove duplicates


# Global instance
_goal_mapper = GoalMapper()


def map_goal_to_profile(goal: str) -> Dict:
    """
    Convenience function to map goal to profile.
    
    Args:
        goal: User's goal text
        
    Returns:
        Enriched profile dictionary
    """
    return _goal_mapper.map_goal_to_profile(goal)

