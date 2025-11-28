"""
Analytics Models for SQLite
Defines analytics event data structures and validation.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4


class AnalyticsEvent(BaseModel):
    """Analytics event model matching SQLite analytics_events table."""
    id: UUID
    user_id: Optional[UUID] = None
    session_id: Optional[str] = None
    event_type: str
    route: Optional[str] = None
    element_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsEventCreate(BaseModel):
    """Model for creating a new analytics event."""
    user_id: Optional[str] = None  # String UUID from frontend
    session_id: Optional[str] = None
    event_type: str
    route: Optional[str] = None
    element_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> dict:
        """Convert to dictionary for database insertion."""
        data = {
            "id": str(uuid4()),
            "event_type": self.event_type,
            "route": self.route,
            "element_id": self.element_id,
            "metadata": self.metadata or {},
        }
        
        # Add user_id or session_id (but not both)
        if self.user_id:
            data["user_id"] = self.user_id
        if self.session_id:
            data["session_id"] = self.session_id
        
        return data


class AnalyticsEventResponse(BaseModel):
    """Response model for analytics event creation."""
    status: str
    message: str


