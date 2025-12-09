from typing import Any, Dict, List
from agents.base import BaseAgent
from services.openai_service import get_openai_service
from services.database_service import get_database_service
import json
from datetime import date

class ProbabilityAgent(BaseAgent):
    """
    Agent responsible for calculating the probability of goal success.
    Analyzes user metrics against goal requirements using OpenAI.
    """
    
    def __init__(self):
        super().__init__("ProbabilityAgent")
        self.current_probability = 0.0
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
        Calculate probability based on metrics and goal.
        
        Args:
            input_data: Dict with 'goal_analysis', 'user_metrics', 'tab_analysis', 'user_id'
        """
        if not isinstance(input_data, dict):
            return self._get_placeholder_response()
        
        user_id = input_data.get("user_id")
        goal_analysis = input_data.get("goal_analysis", {})
        user_metrics = input_data.get("user_metrics", {})
        tab_analysis = input_data.get("tab_analysis", {})
        context_switches = input_data.get("context_switches", 0)
        
        if not self.openai:
            print("⚠️ OpenAI not available, returning placeholder data")
            return self._get_placeholder_response()
        
        try:
            # Fetch historical stats
            history = []
            if user_id:
                history = self.db.get_daily_stats(user_id, days=7)
            
            # Format user metrics for the prompt
            metrics_summary = self._format_metrics(user_metrics)
            goal_summary = self._format_goal(goal_analysis)
            tab_summary = self._format_tab_analysis(tab_analysis) if tab_analysis else "No tab data available."
            history_summary = self._format_history(history)
            
            prompt = f"""You are an expert in goal achievement analysis and behavioral psychology. 

Analyze the likelihood of success for this user's goal based on their current activity patterns and recent history.

GOAL INFORMATION:
{goal_summary}

USER ACTIVITY METRICS (TODAY):
{metrics_summary}

CHROME TAB ANALYSIS (TODAY):
{tab_summary}

CONTEXT SWITCHES (TODAY): {context_switches}

HISTORICAL PERFORMANCE (LAST 7 DAYS):
{history_summary}

IMPORTANT CONTEXT:
- The metrics above are what the system has automated tracked.
- If data seems sparse, it means the user hasn't been active on the computer, or the tracking just started.
- DO NOT assume the user is "doing nothing" if the tracked time is low; simply state that based on *tracked* activity, the data is limited.
- Do not invent or hallucinate activities not listed.

Based on this information, calculate:
1. A probability score (0.0 to 1.0) representing likelihood of success for the goal: "{goal_summary}"
2. Key positive factors that increase success probability (focus on activities relevant to the goal)
3. Key negative factors or challenges that decrease success probability (focus on distractions and lack of productive activity)
4. A clear, actionable explanation of the assessment specific to this goal
5. A trend assessment (improving, declining, stable) based on history

Consider:
- Time spent on relevant sites and activities for this specific goal is highly positive
- Time spent on learning and skill development is positive
- Time spent on entertainment sites is negative
- High context switching during work hours is negative
- Consistent daily activity is positive
- Upward trend in probability is positive

Return your response as a JSON object with this structure:
{{
    "score": 0.75,
    "explanation": "A short, 2-sentence summary of the assessment.",
    "positive_factors": ["Concise factor 1", "Concise factor 2"],
    "negative_factors": ["Concise challenge 1", "Concise challenge 2"],
    "confidence": "high/medium/low",
    "trend": "improving/declining/stable"
}}"""

            response = await self.openai.generate_structured_content(prompt, temperature=0.5)
            
            # Store the probability
            self.current_probability = response.get("score", 0.5)
            
            # Save to daily stats if user_id is present
            if user_id:
                # Calculate minutes for stats
                focus_minutes = 0
                distraction_minutes = 0
                if tab_analysis:
                     # Calculate using the same logic as format, or simplistic if raw
                     if isinstance(tab_analysis, dict) and any("total_seconds" in v for v in tab_analysis.values() if isinstance(v, dict)):
                         # Re-analyze just for stats saving (inefficient but safe)
                         from utils.analysis import analyze_tab_usage
                         analyzed = analyze_tab_usage(tab_analysis)
                         focus_minutes = int(analyzed["productive_time"] / 60)
                         distraction_minutes = int(analyzed["distraction_time"] / 60)
                     else: 
                        focus_minutes = int((tab_analysis.get("job_search_time", 0) + tab_analysis.get("learning_time", 0)) / 60)
                        distraction_minutes = int(tab_analysis.get("entertainment_time", 0) / 60)
                
                stats = {
                    "goal_id": goal_analysis.get("id") if goal_analysis else None,
                    "success_probability": int(self.current_probability * 100),
                    "focus_minutes": focus_minutes,
                    "distraction_minutes": distraction_minutes,
                    "deep_work_blocks": 0 # TODO: Calculate this
                }
                self.db.save_daily_stats(user_id, stats)
            
            return response
            
        except Exception as e:
            print(f"❌ Error calculating probability with OpenAI: {e}")
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
        
        # Use simple formatting since input is now likely already analyzed or raw
        # If it's raw usage dict:
        from utils.analysis import analyze_tab_usage
        if isinstance(tab_analysis, dict) and any("total_seconds" in v for v in tab_analysis.values() if isinstance(v, dict)):
             # It's raw data, analyze it first
             analyzed = analyze_tab_usage(tab_analysis)
             job_time = analyzed["productive_time"] / 60
             distraction_time = analyzed["distraction_time"] / 60
             total_time = analyzed["total_time"] / 60
        else:
             # Fallback or already analyzed data structure
             job_time = tab_analysis.get("job_search_time", 0) / 60
             distraction_time = tab_analysis.get("entertainment_time", 0) / 60
             total_time = tab_analysis.get("total_time", 0) / 60
        
        return f"""Productive time: {job_time:.1f} minutes
Distraction time: {distraction_time:.1f} minutes
Total browsing time: {total_time:.1f} minutes"""

    def _format_history(self, history: List[Dict]) -> str:
        """Format historical stats for the prompt."""
        if not history:
            return "No historical data available."
        
        lines = []
        for day in history:
            date_str = day.get("date", "Unknown")
            prob = day.get("success_probability", 0)
            focus = day.get("focus_minutes", 0)
            distract = day.get("distraction_minutes", 0)
            lines.append(f"- {date_str}: Probability {prob}%, Focus {focus}m, Distraction {distract}m")
        
        return "\n".join(lines)
    def _get_placeholder_response(self) -> Dict:
        """Fallback response if Gemini is unavailable."""
        return {
            "score": 0.5,
            "explanation": "Insufficient data to calculate accurate probability. Please continue tracking your activities.",
            "positive_factors": ["Goal is clearly defined"],
            "negative_factors": ["Limited activity data available"],
            "confidence": "low",
            "trend": "stable"
        }
