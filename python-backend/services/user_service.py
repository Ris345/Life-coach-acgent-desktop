"""
User Service - Supabase Operations
All user-related database operations go through Supabase Postgres.
"""

from typing import Optional, List
from uuid import UUID
from db.supabase_client import get_supabase_client
from models.user import User, UserCreate, UserUpdate


def get_user(user_id: UUID) -> Optional[User]:
    """
    Get a user by ID from Supabase.
    Returns None if user not found or Supabase not configured.
    """
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        result = supabase.table("users").select("*").eq("id", str(user_id)).execute()
        if result.data:
            return User(**result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        return None


def get_user_by_email(email: str) -> Optional[User]:
    """
    Get a user by email from Supabase.
    Returns None if user not found or Supabase not configured.
    """
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        result = supabase.table("users").select("*").eq("email", email).execute()
        if result.data:
            return User(**result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching user by email {email}: {e}")
        return None


def create_user(user_data: UserCreate) -> Optional[User]:
    """
    Create a new user in Supabase.
    Returns the created user or None if creation fails.
    """
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        result = supabase.table("users").insert(user_data.model_dump(mode='json')).execute()
        if result.data:
            return User(**result.data[0])
        return None
    except Exception as e:
        print(f"Error creating user: {e}")
        return None


def update_user(user_id: UUID, user_data: UserUpdate) -> Optional[User]:
    """
    Update a user in Supabase.
    Returns the updated user or None if update fails.
    """
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        # Only update fields that are provided
        update_data = user_data.model_dump(exclude_unset=True)
        if not update_data:
            return get_user(user_id)
        
        result = supabase.table("users").update(update_data).eq("id", str(user_id)).execute()
        if result.data:
            return User(**result.data[0])
        return None
    except Exception as e:
        print(f"Error updating user {user_id}: {e}")
        return None


def delete_user(user_id: UUID) -> bool:
    """
    Delete a user from Supabase.
    Returns True if successful, False otherwise.
    """
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        result = supabase.table("users").delete().eq("id", str(user_id)).execute()
        return True
    except Exception as e:
        print(f"Error deleting user {user_id}: {e}")
        return False


def list_users(limit: int = 100, offset: int = 0) -> List[User]:
    """
    List users from Supabase.
    Returns empty list if Supabase not configured or on error.
    """
    supabase = get_supabase_client()
    if not supabase:
        return []
    
    try:
        result = supabase.table("users").select("*").limit(limit).offset(offset).execute()
        return [User(**row) for row in result.data]
    except Exception as e:
        print(f"Error listing users: {e}")
        return []


