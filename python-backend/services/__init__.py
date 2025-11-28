"""
Services package initialization.
"""

from services.user_service import (
    get_user,
    get_user_by_email,
    create_user,
    update_user,
    delete_user,
    list_users,
)
from services.analytics_service import (
    init_analytics_table,
    create_analytics_event,
    get_analytics_event,
    get_analytics_events_by_user,
    get_analytics_events_by_session,
    get_analytics_stats,
)

__all__ = [
    "get_user",
    "get_user_by_email",
    "create_user",
    "update_user",
    "delete_user",
    "list_users",
    "init_analytics_table",
    "create_analytics_event",
    "get_analytics_event",
    "get_analytics_events_by_user",
    "get_analytics_events_by_session",
    "get_analytics_stats",
]


