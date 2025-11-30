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
load_dotenv()

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
            print(f"Error generating structured content: {e}")
            raise


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
