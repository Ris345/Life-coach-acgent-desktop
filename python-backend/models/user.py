"""
User Models for Supabase (Postgres)
Defines user-related data structures and validation.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class User(BaseModel):
    """User model matching Supabase users table."""
    id: UUID
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Model for creating a new user."""
    id: UUID
    email: EmailStr
    name: Optional[str] = None


class UserUpdate(BaseModel):
    """Model for updating user information."""
    name: Optional[str] = None
    picture: Optional[str] = None


