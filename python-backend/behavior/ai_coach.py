"""
AI Coaching module - generates personalized insights and recommendations using Ollama.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json


class AICoach:
    """
    Generates AI-powered coaching insights and recommendations.
    Uses Ollama for local LLM inference (privacy-friendly).
    """
    
    def __init__(self, ollama_base_url: str = "http://localhost:11434"):
        """
        Initialize AI Coach.
        
        Args:
            ollama_base_url: Base URL for Ollama API (default: localhost:11434)
        """
        self.ollama_base_url = ollama_base_url
        self.model = "llama3.2"  # Default model, can be changed
        self._ollama_available = None
    
    def _check_ollama_available(self) -> bool:
        """Check if Ollama is available."""
        if self._ollama_available is not None:
            return self._ollama_available
        
        try:
            import requests
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=2)
            self._ollama_available = response.status_code == 200
            return self._ollama_available
        except:
            self._ollama_available = False
            return False
    
    def _call_ollama(self, prompt: str, model: Optional[str] = None) -> Optional[str]:
        """
        Call Ollama API to generate text.
        
        Args:
            prompt: The prompt to send to the model
            model: Model name (defaults to self.model)
            
        Returns:
            Generated text or None if error
        """
        if not self._check_ollama_available():
            return None
        
        try:
            import requests
            
            model_name = model or self.model
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": model_name,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                print(f"Ollama API error: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            return None
    
    def generate_weekly_report(
        self,
        goal: str,
        focus_time_minutes: float,
        distraction_time_minutes: float,
        longest_streak_minutes: float,
        productive_apps: List[Dict[str, any]],
        distracting_apps: List[Dict[str, any]],
        daily_completions: int,
        total_days: int = 7
    ) -> Dict[str, str]:
        """
        Generate a weekly AI coaching report.
        
        Args:
            goal: User's goal
            focus_time_minutes: Total focus time this week
            distraction_time_minutes: Total distraction time this week
            longest_streak_minutes: Longest focus streak
            productive_apps: List of productive apps with time
            distracting_apps: List of distracting apps with time
            daily_completions: Number of days goal was completed
            total_days: Total days tracked (default: 7)
            
        Returns:
            Dictionary with report sections
        """
        # Build context for AI
        context = f"""
Goal: {goal}
Focus Time: {focus_time_minutes:.1f} minutes ({focus_time_minutes/60:.1f} hours)
Distraction Time: {distraction_time_minutes:.1f} minutes
Longest Streak: {longest_streak_minutes:.1f} minutes
Days Completed: {daily_completions}/{total_days}

Top Productive Apps:
{chr(10).join([f"- {app['app_name']}: {app['total_minutes']:.1f} min" for app in productive_apps[:5]])}

Top Distracting Apps:
{chr(10).join([f"- {app['app_name']}: {app['total_minutes']:.1f} min" for app in distracting_apps[:5]])}
"""
        
        prompt = f"""You are a life coach analyzing someone's productivity data. Be encouraging, specific, and actionable.

{context}

Generate a brief weekly report with:
1. A celebration of wins (2-3 sentences)
2. Key insights about their patterns (2-3 sentences)
3. One specific recommendation for improvement (1-2 sentences)
4. Motivation for next week (1 sentence)

Keep it concise, friendly, and focused on helping them achieve their goal: "{goal}"

Format as JSON:
{{
  "celebration": "...",
  "insights": "...",
  "recommendation": "...",
  "motivation": "..."
}}
"""
        
        response = self._call_ollama(prompt)
        
        if response:
            try:
                # Try to extract JSON from response
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    report = json.loads(json_str)
                    return report
            except:
                pass
            
            # Fallback: return as plain text
            return {
                "celebration": "Great work this week!",
                "insights": response[:200] + "..." if len(response) > 200 else response,
                "recommendation": "Keep up the momentum!",
                "motivation": "You're making progress toward your goal!"
            }
        
        # Fallback if Ollama not available
        return self._generate_fallback_report(
            goal, focus_time_minutes, distraction_time_minutes,
            longest_streak_minutes, daily_completions, total_days
        )
    
    def _generate_fallback_report(
        self,
        goal: str,
        focus_time_minutes: float,
        distraction_time_minutes: float,
        longest_streak_minutes: float,
        daily_completions: int,
        total_days: int
    ) -> Dict[str, str]:
        """Generate a simple fallback report without AI."""
        completion_rate = (daily_completions / total_days * 100) if total_days > 0 else 0
        
        celebration = f"🎉 You completed your goal {daily_completions} out of {total_days} days this week!"
        if longest_streak_minutes >= 30:
            celebration += f" Your longest focus streak was {longest_streak_minutes:.0f} minutes - amazing!"
        
        insights = f"You focused for {focus_time_minutes/60:.1f} hours this week."
        if distraction_time_minutes > 0:
            focus_ratio = focus_time_minutes / (focus_time_minutes + distraction_time_minutes) * 100
            insights += f" {focus_ratio:.0f}% of your tracked time was focused on '{goal}'."
        
        recommendation = "Try to maintain consistency - even 30 minutes daily adds up!"
        if completion_rate < 50:
            recommendation = "Focus on building a daily habit. Start with smaller goals if needed."
        elif completion_rate >= 80:
            recommendation = "You're doing great! Consider increasing your daily goal slightly."
        
        motivation = f"Keep pushing toward '{goal}' - you've got this! 💪"
        
        return {
            "celebration": celebration,
            "insights": insights,
            "recommendation": recommendation,
            "motivation": motivation
        }
    
    def generate_drift_nudge(self, goal: str, distraction_app: str, focus_time_before: float) -> Optional[str]:
        """
        Generate a personalized nudge when user drifts.
        
        Args:
            goal: User's goal
            distraction_app: App they switched to
            focus_time_before: Focus time before drift
            
        Returns:
            Personalized nudge message or None
        """
        if not self._check_ollama_available():
            return None
        
        prompt = f"""Generate a brief, encouraging nudge (1 sentence, max 100 characters) for someone who:
- Goal: "{goal}"
- Just switched to: {distraction_app}
- Was focused for: {focus_time_before:.0f} minutes

Be friendly, not judgmental. Help them refocus on their goal.

Just return the nudge text, nothing else:"""
        
        response = self._call_ollama(prompt)
        if response:
            # Clean up response
            response = response.strip().strip('"').strip("'")
            if len(response) <= 150:  # Reasonable length
                return response
        
        return None

