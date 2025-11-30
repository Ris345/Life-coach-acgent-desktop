from typing import Any, Dict
from agents.base import BaseAgent
from services.gemini_service import get_gemini_service
import json

class ProbabilityAgent(BaseAgent):
    """
    Agent responsible for calculating the probability of goal success.
    Analyzes user metrics against goal requirements using Gemini.
    """
    
    def __init__(self):
        super().__init__("ProbabilityAgent")
        self.current_probability = 0.0
        self.gemini = None

    async def start(self):
        """Initialize Gemini service on start."""
        await super().start()
        try:
            self.gemini = get_gemini_service()
            print(f"✅ {self.name} initialized with Gemini")
        except Exception as e:
            print(f"⚠️ Warning: {self.name} could not initialize Gemini: {e}")

    async def process(self, input_data: Any) -> Any:
        """
        Calculate probability based on metrics and goal.
        
        Args:
            input_data: Dict with 'goal_analysis', 'user_metrics', and optionally 'tab_analysis'
        """
        if not isinstance(input_data, dict):
            return self._get_placeholder_response()
        
        goal_analysis = input_data.get("goal_analysis", {})
        user_metrics = input_data.get("user_metrics", {})
        tab_analysis = input_data.get("tab_analysis", {})
        context_switches = input_data.get("context_switches", 0)
        
        if not self.gemini:
            print("⚠️ Gemini not available, returning placeholder data")
            return self._get_placeholder_response()
        
        try:
            # Format user metrics for the prompt
            metrics_summary = self._format_metrics(user_metrics)
            goal_summary = self._format_goal(goal_analysis)
            tab_summary = self._format_tab_analysis(tab_analysis) if tab_analysis else "No tab data available."
            
            prompt = f"""You are an expert in goal achievement analysis and behavioral psychology. 

Analyze the likelihood of success for this user's goal based on their current activity patterns.

GOAL INFORMATION:
{goal_summary}

USER ACTIVITY METRICS:
{metrics_summary}


CHROME TAB ANALYSIS:
{tab_summary}

CONTEXT SWITCHES: {context_switches}

Based on this information, calculate:
1. A probability score (0.0 to 1.0) representing likelihood of success for the goal: "{goal_summary}"
2. Key positive factors that increase success probability (focus on activities relevant to the goal)
3. Key negative factors or challenges that decrease success probability (focus on distractions and lack of productive activity)
4. A clear, actionable explanation of the assessment specific to this goal

Consider:
- Time spent on relevant sites and activities for this specific goal is highly positive
- Time spent on learning and skill development is positive
- Time spent on entertainment sites is negative
- High context switching during work hours is negative
- Consistent daily activity is positive

Return your response as a JSON object with this structure:
{{
    "score": 0.75,
    "explanation": "Overall assessment...",
    "positive_factors": ["factor1", "factor2", ...],
    "negative_factors": ["challenge1", "challenge2", ...],
    "confidence": "high/medium/low"
}}"""

            response = await self.gemini.generate_structured_content(prompt, temperature=0.5)
            
            # Store the probability
            self.current_probability = response.get("score", 0.5)
            
            return response
            
        except Exception as e:
            print(f"❌ Error calculating probability with Gemini: {e}")
            return self._get_placeholder_response()
    
    def _format_metrics(self, metrics: Dict) -> str:
        """Format user metrics for the prompt."""
        if not metrics:
            return "No activity data available yet."
        
        lines = []
        for app, data in metrics.items():
            visits = data.get("visits", 0)
            time_seconds = data.get("total_seconds", 0)
            time_minutes = time_seconds / 60
            lines.append(f"- {app}: {visits} sessions, {time_minutes:.1f} minutes total")
        
        return "\n".join(lines) if lines else "No activity data available yet."
    
    def _format_goal(self, goal_analysis: Dict) -> str:
        """Format goal analysis for the prompt."""
        if not goal_analysis:
            return "No goal information available."
        
        goal = goal_analysis.get("goal", "Unknown goal")
        skills = goal_analysis.get("skills", [])
        weeks = goal_analysis.get("estimated_weeks", "Unknown")
        
        return f"""Goal: {goal}
Required Skills: {', '.join(skills)}
Estimated Timeline: {weeks} weeks"""
    
    def _format_tab_analysis(self, tab_analysis: Dict) -> str:
        """Format tab analysis for the prompt."""
        if not tab_analysis:
            return "No tab analysis available."
        
        job_time = tab_analysis.get("job_search_time", 0) / 60  # Convert to minutes
        learning_time = tab_analysis.get("learning_time", 0) / 60
        entertainment_time = tab_analysis.get("entertainment_time", 0) / 60
        total_time = tab_analysis.get("total_time", 0) / 60
        productive_ratio = tab_analysis.get("productive_ratio", 0)
        
        return f"""Time on job search sites: {job_time:.1f} minutes
Time on learning platforms: {learning_time:.1f} minutes
Time on entertainment sites: {entertainment_time:.1f} minutes
Total browsing time: {total_time:.1f} minutes
Productive time ratio: {productive_ratio:.1%}"""
    
    def _get_placeholder_response(self) -> Dict:
        """Fallback response if Gemini is unavailable."""
        return {
            "score": 0.5,
            "explanation": "Insufficient data to calculate accurate probability. Please continue tracking your activities.",
            "positive_factors": ["Goal is clearly defined"],
            "negative_factors": ["Limited activity data available"],
            "confidence": "low"
        }
