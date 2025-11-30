from typing import Any, Dict, List
from agents.base import BaseAgent
from services.gemini_service import get_gemini_service

class ResearchAgent(BaseAgent):
    """
    Agent responsible for researching and breaking down user goals.
    Uses Gemini LLM to understand requirements and create roadmaps.
    """
    
    def __init__(self):
        super().__init__("ResearchAgent")
        self.current_goal = None
        self.roadmap = None
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
        Process a new goal.
        Input: "I want to be a backend developer"
        Output: Structured breakdown of skills and tasks.
        """
        if isinstance(input_data, str):
            return await self.analyze_goal(input_data)
        return None

    async def analyze_goal(self, goal_text: str) -> Dict[str, Any]:
        """
        Analyze the goal using Gemini LLM.
        """
        print(f"🔍 Researching goal: {goal_text}")
        self.current_goal = goal_text
        
        if not self.gemini:
            print("⚠️ Gemini not available, returning placeholder data")
            return self._get_placeholder_response(goal_text)
        
        try:
            prompt = f"""You are a career and goal planning expert. Analyze the following user goal and provide a detailed breakdown.

User Goal: "{goal_text}"

Please analyze this goal and provide:
1. A list of key skills needed to achieve this goal
2. Major milestones or phases in the journey
3. An estimated timeline in weeks
4. Any prerequisites or foundational knowledge required

Return your response as a JSON object with this structure:
{{
    "goal": "the original goal",
    "skills": ["skill1", "skill2", ...],
    "milestones": ["milestone1", "milestone2", ...],
    "estimated_weeks": number,
    "prerequisites": ["prereq1", "prereq2", ...]
}}"""

            response = await self.gemini.generate_structured_content(prompt, temperature=0.7)
            
            # Store the roadmap
            self.roadmap = response
            
            return response
            
        except Exception as e:
            print(f"❌ Error analyzing goal with Gemini: {e}")
            return self._get_placeholder_response(goal_text)
    
    def _get_placeholder_response(self, goal_text: str) -> Dict[str, Any]:
        """Fallback response if Gemini is unavailable."""
        return {
            "goal": goal_text,
            "skills": ["Research required skills", "Create learning plan"],
            "milestones": ["Define clear objectives", "Break down into steps"],
            "estimated_weeks": 12,
            "prerequisites": ["Motivation", "Time commitment"]
        }
