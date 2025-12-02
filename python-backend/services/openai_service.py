"""
OpenAI Service - Centralized service for interacting with OpenAI API.
Provides reusable methods for all agents to call OpenAI LLMs.
"""

import os
import json
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load environment variables
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
env_path = os.path.join(project_root, '.env')

load_dotenv(env_path)

class OpenAIService:
    """
    Centralized service for OpenAI API interactions.
    Handles configuration, error handling, and provides reusable methods.
    """
    
    def __init__(self, model_name: str = "gpt-4o"):
        """
        Initialize the OpenAI service.
        
        Args:
            model_name: The OpenAI model to use (default: gpt-4o)
        """
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("⚠️ OPENAI_API_KEY not found in environment variables")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model_name = model_name
    
    async def generate_content(
        self, 
        prompt: str,
        temperature: float = 0.7,
        max_output_tokens: Optional[int] = None
    ) -> str:
        """
        Generate content using OpenAI.
        
        Args:
            prompt: The prompt to send to OpenAI
            temperature: Controls randomness (0.0 - 1.0)
            max_output_tokens: Maximum tokens in response
        
        Returns:
            Generated text response
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_output_tokens
            )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating content with OpenAI: {e}")
            raise
    
    async def generate_structured_content(
        self,
        prompt: str,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate structured JSON content using OpenAI.
        Automatically appends instruction to return JSON.
        
        Args:
            prompt: The prompt to send to OpenAI
            temperature: Controls randomness (0.0 - 1.0)
        
        Returns:
            Parsed JSON response as dictionary
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error generating structured content with OpenAI: {e}")
            raise

# Global instance (singleton pattern)
_openai_service: Optional[OpenAIService] = None

def get_openai_service() -> OpenAIService:
    """
    Get or create the global OpenAI service instance.
    
    Returns:
        OpenAIService instance
    """
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service
