"""
Built-in profile definitions for different work/study contexts.
"""

from typing import Dict, List, Optional

PROFILE_DEFINITIONS: Dict[str, Dict] = {
    "deep_work": {
        "profile_name": "Deep Work",
        "focus_apps": [
            "cursor", "vscode", "visual studio code", "code",
            "pycharm", "intellij", "webstorm", "idea",
            "sublime", "atom", "vim", "neovim", "emacs",
            "xcode", "android studio", "studio",
            "terminal", "iterm", "alacritty", "kitty", "warp",
            "notion", "obsidian", "roam", "logseq",
            "jupyter", "notebook", "colab",
            "github desktop", "gitkraken", "sourcetree",
        ],
        "distraction_apps": [
            "youtube", "youtu.be",
            "instagram", "insta",
            "tiktok", "tiktok.com",
            "twitter", "x.com", "twitter.com",
            "facebook", "fb.com",
            "reddit", "redd.it",
            "netflix", "hulu", "disney+", "disney plus",
            "spotify", "apple music",
            "twitch", "twitch.tv",
            "pinterest", "pinterest.com",
            "snapchat", "snap",
            "discord",
            "games", "steam", "epic games",
            "playstation", "xbox",
        ],
        "neutral_apps": [
            "finder", "explorer", "file manager",
            "settings", "preferences", "system preferences",
            "activity monitor", "task manager",
            "calendar", "mail", "messages",
            "safari", "chrome", "firefox", "edge",
        ],
        "keywords": [
            "code", "programming", "development", "coding",
            "documentation", "api", "library", "framework",
            "algorithm", "data structure", "debug", "test",
        ],
        "goal_examples": [
            "deep work session",
            "focused coding",
            "intensive study",
            "concentration time",
        ],
    },
    "aws_study": {
        "profile_name": "AWS Study",
        "focus_apps": [
            "cursor", "vscode", "visual studio code",
            "terminal", "iterm", "alacritty", "kitty",
            "notion", "obsidian", "roam",
            "jupyter", "notebook",
            "github desktop", "gitkraken",
        ],
        "distraction_apps": [
            "youtube", "youtu.be",
            "instagram", "tiktok", "twitter", "facebook",
            "reddit", "netflix", "hulu",
            "spotify", "twitch",
            "games", "steam",
        ],
        "neutral_apps": [
            "finder", "explorer",
            "settings", "preferences",
            "calendar", "mail", "messages",
            "safari", "chrome", "firefox", "edge",
        ],
        "keywords": [
            "aws", "amazon web services",
            "ec2", "s3", "lambda", "rds", "dynamodb",
            "cloudformation", "iam", "vpc", "route53",
            "cloudwatch", "sns", "sqs", "api gateway",
            "certification", "exam", "practice",
        ],
        "goal_examples": [
            "study aws",
            "learn aws",
            "aws certification",
            "aws practice",
        ],
    },
    "coding": {
        "profile_name": "Coding",
        "focus_apps": [
            "cursor", "vscode", "visual studio code", "code",
            "pycharm", "intellij", "webstorm", "idea",
            "sublime", "atom", "vim", "neovim", "emacs",
            "xcode", "android studio", "studio",
            "terminal", "iterm", "alacritty", "kitty", "warp",
            "github desktop", "gitkraken", "sourcetree",
            "postman", "insomnia", "datagrip", "dbeaver",
            "tableplus", "sequel ace",
        ],
        "distraction_apps": [
            "youtube", "youtu.be",
            "instagram", "tiktok", "twitter", "facebook",
            "reddit", "netflix", "hulu",
            "spotify", "twitch",
            "games", "steam",
        ],
        "neutral_apps": [
            "finder", "explorer",
            "settings", "preferences",
            "calendar", "mail", "messages",
            "safari", "chrome", "firefox", "edge",
            "slack", "teams", "discord",
        ],
        "keywords": [
            "code", "programming", "development", "coding",
            "javascript", "python", "typescript", "java",
            "react", "vue", "angular", "node",
            "git", "github", "commit", "pull request",
            "debug", "test", "deploy",
        ],
        "goal_examples": [
            "coding",
            "programming",
            "development",
            "build project",
        ],
    },
    "writing": {
        "profile_name": "Writing",
        "focus_apps": [
            "notion", "obsidian", "roam", "logseq",
            "pages", "microsoft word", "google docs",
            "scrivener", "ulysses", "bear",
            "typora", "markdown",
        ],
        "distraction_apps": [
            "youtube", "youtu.be",
            "instagram", "tiktok", "twitter", "facebook",
            "reddit", "netflix", "hulu",
            "spotify", "twitch",
            "games", "steam",
        ],
        "neutral_apps": [
            "finder", "explorer",
            "settings", "preferences",
            "calendar", "mail", "messages",
            "safari", "chrome", "firefox", "edge",
        ],
        "keywords": [
            "write", "writing", "article", "blog",
            "essay", "document", "draft", "edit",
            "publish", "content", "copy",
        ],
        "goal_examples": [
            "writing",
            "write article",
            "blog post",
            "documentation",
        ],
    },
    "job_search": {
        "profile_name": "Job Search",
        "focus_apps": [
            "safari", "chrome", "firefox", "edge",
            "notion", "obsidian",
            "pages", "microsoft word", "google docs",
            "mail", "messages",
            "calendar",
        ],
        "distraction_apps": [
            "youtube", "youtu.be",
            "instagram", "tiktok", "twitter", "facebook",
            "reddit", "netflix", "hulu",
            "spotify", "twitch",
            "games", "steam",
        ],
        "neutral_apps": [
            "finder", "explorer",
            "settings", "preferences",
            "activity monitor", "task manager",
        ],
        "keywords": [
            "linkedin", "indeed", "glassdoor", "monster",
            "resume", "cv", "cover letter", "application",
            "interview", "job", "position", "career",
        ],
        "goal_examples": [
            "job search",
            "find job",
            "apply for jobs",
            "job applications",
        ],
    },
    "custom": {
        "profile_name": "Custom",
        "focus_apps": [],
        "distraction_apps": [],
        "neutral_apps": [],
        "keywords": [],
        "goal_examples": [],
    },
}


def get_profile(profile_name: str) -> Optional[Dict]:
    """
    Get a profile definition by name.
    
    Args:
        profile_name: Name of the profile (e.g., "deep_work", "aws_study")
        
    Returns:
        Profile dictionary or None if not found
    """
    return PROFILE_DEFINITIONS.get(profile_name.lower())


def list_profiles() -> List[str]:
    """
    List all available profile names.
    
    Returns:
        List of profile names
    """
    return list(PROFILE_DEFINITIONS.keys())

