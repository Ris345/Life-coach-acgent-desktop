"""
Morning Briefing Agent - Generates a daily summary and strategy.

Analyzes yesterday's performance and generates a personalized briefing for the user.
"""

from typing import Any, Dict, Optional
from datetime import datetime, timedelta
from agents.base import BaseAgent
from services.openai_service import get_openai_service
from services.database_service import get_database_service

class MorningBriefingAgent(BaseAgent):
    """
    Agent that generates a daily morning briefing.
    """
    
    def __init__(self):
        super().__init__("MorningBriefingAgent")
        self.openai = None
        self.db = get_database_service()

    async def start(self):
        """Initialize OpenAI service on start."""
        await super().start()
        try:
            self.openai = get_openai_service()
            print(f"✅ {self.name} initialized with OpenAI")
        except Exception as e:
            print(f"⚠️ Warning: {self.name} could not initialize OpenAI: {e}")

    async def process(self, input_data: Any) -> Any:
        """
        Generate morning briefing.
        
        Input: {
            "user_id": str,
            "goal": dict
        }
        """
        user_id = input_data.get("user_id")
        goal = input_data.get("goal")
        
        if not self.openai:
            return self._get_placeholder_response()
            
        # Get real metrics
        yesterday_metrics = self._get_yesterday_metrics(user_id)
        user_stats = self.db.get_user_stats(user_id)
        
        try:
            prompt = f"""You are an elite productivity coach. Generate a "Morning Briefing" for your client.

CLIENT PROFILE:
- Current Goal: {goal.get('goal_text', 'Improve productivity') if goal else 'Improve productivity'}
- Level: {user_stats.get('level', 1)} (XP: {user_stats.get('xp', 0)})

YESTERDAY'S PERFORMANCE:
- Focus Time: {yesterday_metrics.get('focus_minutes', 0)} minutes
- Distractions: {yesterday_metrics.get('distraction_minutes', 0)} minutes lost
- Success Rate: {yesterday_metrics.get('success_rate', 0)}%

Generate a JSON response with:
1. "greeting": A short, motivating greeting acknowledging their level/status.
2. "summary": 1-2 sentences analyzing yesterday's performance. Be specific but encouraging.
3. "focus_areas": List of 3 specific, actionable things to focus on today to reach their goal.
4. "quote": A short, relevant inspirational quote.

Tone: Professional, encouraging, elite but empathetic. Not robotic.

JSON Structure:
{{
    "greeting": "Good morning...",
    "summary": "Yesterday you...",
    "focus_areas": ["Task 1", "Task 2", "Task 3"],
    "quote": "..."
}}"""

            response = await self.openai.generate_structured_content(prompt, temperature=0.7)
            return response
            
        except Exception as e:
            print(f"❌ Error generating briefing: {e}")
            return self._get_placeholder_response()
    
    def _get_yesterday_metrics(self, user_id: str) -> Dict:
        """
        Get metrics for yesterday from the database.
        """
        try:
            # Get stats for the last 2 days to find yesterday
            stats = self.db.get_daily_stats(user_id, days=2)
            
            # Find yesterday's entry
            yesterday_str = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            for entry in stats:
                if entry.get('date') == yesterday_str:
                    return entry
            
            # If no data for yesterday, return empty/defaults
            return {
                "focus_minutes": 0,
                "distraction_minutes": 0,
                "success_rate": 0
            }
            
        except Exception as e:
            print(f"Error fetching yesterday's metrics: {e}")
            return {}

    def _get_placeholder_response(self) -> Dict:
        return {
            "greeting": "Good morning! Ready to conquer the day?",
            "summary": "We're just starting to track your progress. Let's make today count.",
            "focus_areas": ["Set a clear goal", "Track your time", "Take regular breaks"],
            "quote": "The secret of getting ahead is getting started."
        }
