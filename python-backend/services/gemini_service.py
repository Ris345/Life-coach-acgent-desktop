"""
Gemini Service - Centralized service for interacting with Google's Gemini API.
Provides reusable methods for all agents to call Gemini LLMs.
"""

import os
import google.generativeai as genai
from typing import Optional, Dict, Any, List
import json
from dotenv import load_dotenv

# Load environment variables
# Get the absolute path to the project root (one level up from python-backend)
current_dir = os.path.dirname(os.path.abspath(__file__)) # services/
backend_dir = os.path.dirname(current_dir) # python-backend/
project_root = os.path.dirname(backend_dir) # life-coach-agent/
env_path = os.path.join(project_root, '.env')

print(f"📂 Loading .env from: {env_path}")
load_dotenv(env_path)

# Debug print
if os.getenv("GEMINI_API_KEY"):
    print("✅ GEMINI_API_KEY found in environment")
else:
    print("❌ GEMINI_API_KEY NOT found in environment")

class GeminiService:
    """
    Centralized service for Gemini API interactions.
    Handles configuration, error handling, and provides reusable methods.
    """
    
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        """
        Initialize the Gemini service.
        
        Args:
            model_name: The Gemini model to use (default: gemini-2.5-flash)
        """
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Configure the API
        genai.configure(api_key=self.api_key)
        
        # Initialize the model
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)
        
        # Safety settings (optional - adjust as needed)
        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
        ]
    
    async def generate_content(
        self, 
        prompt: str,
        temperature: float = 0.7,
        max_output_tokens: Optional[int] = None
    ) -> str:
        """
        Generate content using Gemini.
        
        Args:
            prompt: The prompt to send to Gemini
            temperature: Controls randomness (0.0 - 1.0)
            max_output_tokens: Maximum tokens in response
        
        Returns:
            Generated text response
        """
        try:
            generation_config = {
                "temperature": temperature,
            }
            if max_output_tokens:
                generation_config["max_output_tokens"] = max_output_tokens
            
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=self.safety_settings
            )
            
            return response.text
        except Exception as e:
            print(f"Error generating content with Gemini: {e}")
            raise
    
    async def generate_structured_content(
        self,
        prompt: str,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate structured JSON content using Gemini.
        Automatically appends instruction to return JSON.
        
        Args:
            prompt: The prompt to send to Gemini
            temperature: Controls randomness (0.0 - 1.0)
        
        Returns:
            Parsed JSON response as dictionary
        """
        # Append JSON instruction to prompt
        json_prompt = f"{prompt}\n\nIMPORTANT: Return your response as valid JSON only, with no additional text or markdown formatting."
        
        try:
            response_text = await self.generate_content(json_prompt, temperature)
            
            # Try to extract JSON from response (in case it's wrapped in markdown)
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            # Parse JSON
            return json.loads(response_text.strip())
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON from Gemini response: {e}")
            print(f"Response was: {response_text}")
            raise
        except Exception as e:
            if "429" in str(e):
                print(f"⚠️ Gemini API Quota Exceeded (429). Using fallback data.")
                # Check if this is a strategy generation request
                if "strategy" in prompt.lower() or "plan" in prompt.lower():
                    return self._get_fallback_strategy()
                # Check if this is a probability request
                elif "probability" in prompt.lower() or "chance" in prompt.lower():
                    return self._get_fallback_probability()
            
            print(f"Error generating structured content: {e}")
            raise

    def _get_fallback_strategy(self) -> Dict[str, Any]:
        """Return a realistic fallback strategy when API is rate limited."""
        return {
            "overview": "⚠️ API Quota Exceeded. Showing example plan for 'Learn Python'. This is a comprehensive roadmap designed to take you from beginner to job-ready.",
            "weekly_plan": [
                {
                    "week": 1,
                    "theme": "Python Basics & Setup",
                    "days": [
                        {"day": 1, "focus": "Environment Setup", "tasks": [{"task": "Install Python & VS Code", "type": "setup", "estimated_minutes": 30}, {"task": "Run 'Hello World'", "type": "coding", "estimated_minutes": 15}]},
                        {"day": 2, "focus": "Variables & Data Types", "tasks": [{"task": "Learn strings, integers, floats", "type": "learning", "estimated_minutes": 45}, {"task": "Practice type conversion", "type": "coding", "estimated_minutes": 30}]},
                        {"day": 3, "focus": "Control Flow", "tasks": [{"task": "If/Else statements", "type": "learning", "estimated_minutes": 45}, {"task": "Build a simple calculator", "type": "project", "estimated_minutes": 60}]}
                    ]
                },
                {
                    "week": 2,
                    "theme": "Data Structures",
                    "days": [
                        {"day": 1, "focus": "Lists & Tuples", "tasks": [{"task": "List methods (append, pop)", "type": "learning", "estimated_minutes": 45}, {"task": "Solve 3 list problems", "type": "coding", "estimated_minutes": 45}]},
                        {"day": 2, "focus": "Dictionaries", "tasks": [{"task": "Key-value pairs", "type": "learning", "estimated_minutes": 45}, {"task": "Build a contact book", "type": "project", "estimated_minutes": 60}]}
                    ]
                }
            ]
        }

    def _get_fallback_probability(self) -> Dict[str, Any]:
        """Return a realistic fallback probability when API is rate limited."""
        return {
            "score": 0.75,
            "explanation": "⚠️ API Quota Exceeded. Based on your recent high focus time and consistent activity, you have a strong chance of success. Keep up the momentum!"
        }


# Global instance (singleton pattern)
_gemini_service: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    """
    Get or create the global Gemini service instance.
    
    Returns:
        GeminiService instance
    """
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
