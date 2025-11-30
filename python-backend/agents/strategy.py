from typing import Any, Dict, List
from agents.base import BaseAgent
from services.gemini_service import get_gemini_service

class SuccessStrategyAgent(BaseAgent):
    """
    Agent responsible for generating success strategies.
    Creates weekly plans and daily tasks using Gemini.
    """
    
    def __init__(self):
        super().__init__("SuccessStrategyAgent")
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
        Generate a strategy based on goal, probability, and user metrics.
        
        Args:
            input_data: Dict with 'goal_analysis', 'probability', and 'user_metrics'
        """
        if not isinstance(input_data, dict):
            return self._get_placeholder_response()
        
        goal_analysis = input_data.get("goal_analysis", {})
        probability = input_data.get("probability", {})
        user_metrics = input_data.get("user_metrics", {})
        
        if not self.gemini:
            print("⚠️ Gemini not available, returning placeholder data")
            return self._get_placeholder_response()
        
        try:
            # Format data for the prompt
            goal_summary = self._format_goal(goal_analysis)
            probability_summary = self._format_probability(probability)
            metrics_summary = self._format_metrics(user_metrics)
            
            prompt = f"""You are an expert productivity coach and strategy planner.

Create a detailed, actionable success strategy for this user.

GOAL INFORMATION:
{goal_summary}

SUCCESS PROBABILITY ASSESSMENT:
{probability_summary}

CURRENT ACTIVITY PATTERNS:
{metrics_summary}

Create a comprehensive strategy that includes:
1. A weekly plan with specific focus areas for each week
2. Daily task recommendations (what to do each day)
3. Specific recommendations to improve success probability
4. Time allocation suggestions based on current patterns

Return your response as a JSON object with this structure:
{{
    "weekly_plan": [
        {{"week": 1, "focus": "...", "goals": ["goal1", "goal2"]}},
        ...
    ],
    "daily_tasks": [
        {{"task": "...", "duration_minutes": 30, "priority": "high/medium/low"}},
        ...
    ],
    "recommendations": [
        {{"area": "...", "suggestion": "...", "impact": "high/medium/low"}},
        ...
    ],
    "time_allocation": {{
        "learning": 120,
        "practice": 90,
        "review": 30
    }}
}}"""

            response = await self.gemini.generate_structured_content(prompt, temperature=0.7)
            
            return response
            
        except Exception as e:
            print(f"❌ Error generating strategy with Gemini: {e}")
            return self._get_placeholder_response()
    
    def _format_goal(self, goal_analysis: Dict) -> str:
        """Format goal analysis for the prompt."""
        if not goal_analysis:
            return "No goal information available."
        
        goal = goal_analysis.get("goal", "Unknown goal")
        skills = goal_analysis.get("skills", [])
        milestones = goal_analysis.get("milestones", [])
        weeks = goal_analysis.get("estimated_weeks", "Unknown")
        
        return f"""Goal: {goal}
Required Skills: {', '.join(skills)}
Key Milestones: {', '.join(milestones)}
Timeline: {weeks} weeks"""
    
    def _format_probability(self, probability: Dict) -> str:
        """Format probability assessment for the prompt."""
        if not probability:
            return "No probability assessment available."
        
        score = probability.get("score", 0.5)
        explanation = probability.get("explanation", "")
        positive = probability.get("positive_factors", [])
        negative = probability.get("negative_factors", [])
        
        return f"""Success Probability: {score:.0%}
Assessment: {explanation}
Strengths: {', '.join(positive) if positive else 'None identified'}
Challenges: {', '.join(negative) if negative else 'None identified'}"""
    
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
    
    def _get_placeholder_response(self) -> Dict:
        """Fallback response if Gemini is unavailable."""
        return {
            "weekly_plan": [
                {"week": 1, "focus": "Getting started", "goals": ["Define objectives", "Set up environment"]}
            ],
            "daily_tasks": [
                {"task": "Review goal and create action plan", "duration_minutes": 30, "priority": "high"}
            ],
            "recommendations": [
                {"area": "Planning", "suggestion": "Break down goal into smaller tasks", "impact": "high"}
            ],
            "time_allocation": {
                "learning": 60,
                "practice": 30,
                "review": 15
            }
        }
