"""
Data persistence module - saves and loads behavior tracking data.
"""

import json
import os
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime
from .models import ActivityEvent, BehaviorStats


class DataPersistence:
    """
    Handles saving and loading behavior tracking data to/from local JSON file.
    """
    
    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize persistence with data directory.
        
        Args:
            data_dir: Optional custom data directory. Defaults to ~/.lifeos/
        """
        if data_dir:
            self.data_dir = Path(data_dir)
        else:
            # Default: ~/.lifeos/
            home = Path.home()
            self.data_dir = home / ".lifeos"
        
        # Create data directory if it doesn't exist
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Data file path
        self.data_file = self.data_dir / "data.json"
    
    def save(self, data: Dict[str, Any]) -> bool:
        """
        Save tracking data to JSON file.
        
        Args:
            data: Dictionary containing tracking data to save
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add metadata
            save_data = {
                "version": "1.0",
                "last_saved": datetime.now().isoformat(),
                "data": data
            }
            
            # Write to file atomically (write to temp, then rename)
            temp_file = self.data_file.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(save_data, f, indent=2, default=str)
            
            # Atomic rename
            temp_file.replace(self.data_file)
            
            return True
        except Exception as e:
            print(f"Error saving data: {e}")
            return False
    
    def load(self) -> Optional[Dict[str, Any]]:
        """
        Load tracking data from JSON file.
        
        Returns:
            Dictionary containing tracking data, or None if file doesn't exist or error
        """
        try:
            if not self.data_file.exists():
                return None
            
            with open(self.data_file, 'r') as f:
                save_data = json.load(f)
            
            # Return the data portion
            return save_data.get("data")
        except Exception as e:
            print(f"Error loading data: {e}")
            return None
    
    def clear(self) -> bool:
        """
        Clear all saved data.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.data_file.exists():
                self.data_file.unlink()
            return True
        except Exception as e:
            print(f"Error clearing data: {e}")
            return False
    
    def get_data_path(self) -> str:
        """Get the path to the data file."""
        return str(self.data_file)

