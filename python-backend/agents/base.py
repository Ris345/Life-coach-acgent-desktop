from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class BaseAgent(ABC):
    """
    Abstract base class for all agents in the system.
    """
    
    def __init__(self, name: str):
        self.name = name
        self.is_running = False

    @abstractmethod
    async def process(self, input_data: Any) -> Any:
        """
        Process input data and return result.
        Must be implemented by subclasses.
        """
        pass

    async def start(self):
        """Start the agent's background tasks if any."""
        self.is_running = True
        print(f"✅ {self.name} started")

    async def stop(self):
        """Stop the agent."""
        self.is_running = False
        print(f"🛑 {self.name} stopped")
