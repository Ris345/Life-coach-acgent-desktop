from typing import Dict, Any
from services.database_service import get_database_service

class GamificationService:
    """
    Service to handle gamification logic:
    - XP Gain/Loss
    - Level Calculations
    - Notifications for Level Ups
    """
    
    def __init__(self):
        self.db = get_database_service()
        
    def add_xp(self, user_id: str, amount: int, reason: str) -> Dict[str, Any]:
        """
        Add XP to user.
        Returns result with level up status.
        """
        result = self.db.update_xp(user_id, amount)
        
        # Log event
        self.db.log_event(
            user_id, 
            None, 
            "XP_GAIN", 
            f"Gained {amount} XP for {reason}. New Total: {result['xp']}"
        )
        
        return {
            "success": True,
            "xp_gained": amount,
            "new_total_xp": result["xp"],
            "new_level": result["level"],
            "leveled_up": result["leveled_up"],
            "message": f"+{amount} XP: {reason}"
        }

    def deduct_xp(self, user_id: str, amount: int, reason: str) -> Dict[str, Any]:
        """
        Deduct XP from user (penalty).
        """
        result = self.db.update_xp(user_id, -amount)
        
        # Log event
        self.db.log_event(
            user_id, 
            None, 
            "XP_LOSS", 
            f"Lost {amount} XP for {reason}. New Total: {result['xp']}"
        )
        
        return {
            "success": True,
            "xp_lost": amount,
            "new_total_xp": result["xp"],
            "new_level": result["level"],
            "leveled_up": False, # Cannot level up on loss
            "message": f"-{amount} XP: {reason}"
        }

# Singleton
_gamification_service = None

def get_gamification_service():
    global _gamification_service
    if _gamification_service is None:
        _gamification_service = GamificationService()
    return _gamification_service
