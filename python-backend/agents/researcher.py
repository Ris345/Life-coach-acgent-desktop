from typing import Any, Dict, List
from agents.base import BaseAgent
from services.openai_service import get_openai_service

class ResearchAgent(BaseAgent):
    """
    Agent responsible for researching and breaking down user goals.
    Uses OpenAI LLM to understand requirements and create roadmaps.
    """
    
    def __init__(self):
        super().__init__("ResearchAgent")
        self.current_goal = None
        self.roadmap = None
        self.openai = None

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
        Process a new goal.
        Input: "I want to be a backend developer"
        Output: Structured breakdown of skills and tasks.
        """
        if isinstance(input_data, str):
            return await self.analyze_goal(input_data)
        return None

    async def analyze_goal(self, goal_text: str) -> Dict[str, Any]:
        """
        Analyze the goal using OpenAI LLM.
        """
        print(f"🔍 Researching goal: {goal_text}")
        self.current_goal = goal_text
        
        if not self.openai:
            print("⚠️ OpenAI not available, returning placeholder data")
            return self._get_placeholder_response(goal_text)
        
        try:
            prompt = f"""You are a career and goal planning expert. Analyze the following user goal and provide a detailed breakdown.

User Goal: "{goal_text}"

Provide a structured analysis including:
1. Core skills required
2. Key milestones
3. Estimated timeline (in weeks)
4. Potential challenges

Return your response as a JSON object with this structure:
{{
    "goal": "{goal_text}",
    "skills": ["skill1", "skill2", ...],
    "milestones": ["milestone1", "milestone2", ...],
    "estimated_weeks": 12,
    "challenges": ["challenge1", "challenge2", ...]
}}"""

            response = await self.openai.generate_structured_content(prompt, temperature=0.7)
            
            self.roadmap = response
            return response
            
        except Exception as e:
            print(f"❌ Error analyzing goal with OpenAI: {e}")
            return self._get_placeholder_response(goal_text)
    
    def _get_placeholder_response(self, goal_text: str) -> Dict:
        """Fallback response if OpenAI is unavailable."""
        return {
            "goal": goal_text,
            "skills": ["Planning", "Execution", "Review"],
            "milestones": ["Start", "Middle", "End"],
            "estimated_weeks": 4,
            "challenges": ["Time management", "Consistency"]
        }
