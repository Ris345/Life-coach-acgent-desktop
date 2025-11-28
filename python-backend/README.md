# LifeOS Backend - FastAPI

## Architecture

This backend uses **two separate data stores**:

1. **Supabase (Postgres)** - For user accounts and auth-related data
   - All user operations go through `services/user_service.py`
   - Uses Supabase client from `db/supabase_client.py`

2. **SQLite (Local)** - For analytics/metrics events
   - All analytics operations go through `services/analytics_service.py`
   - Uses SQLite connection from `db/sqlite_client.py`
   - Database file: `analytics.db` (in backend directory)

## Project Structure

```
python-backend/
├── db/                    # Database clients
│   ├── __init__.py
│   ├── config.py          # Configuration (env vars, paths)
│   ├── supabase_client.py  # Supabase client for users
│   └── sqlite_client.py    # SQLite client for analytics
├── models/                 # Data models
│   ├── __init__.py
│   ├── user.py            # User models (Supabase)
│   └── analytics.py       # Analytics models (SQLite)
├── services/              # Business logic
│   ├── __init__.py
│   ├── user_service.py    # User operations (Supabase)
│   └── analytics_service.py # Analytics operations (SQLite)
├── main.py                 # FastAPI app and endpoints
└── requirements.txt       # Dependencies
```

## Environment Variables

Create a `.env` file in the backend directory (or set system environment variables):

```bash
# Supabase Configuration (for user data)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here  # Optional

# SQLite is automatically configured (no env vars needed)
# Database file: python-backend/analytics.db
```

## Installation

```bash
cd python-backend
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --host 127.0.0.1 --port 14200
```

## API Endpoints

### System Endpoints
- `GET /health` - Health check
- `GET /activity` - Get current active window
- `GET /metrics` - Get system metrics (CPU, memory, disk)
- `GET /usage` - Get application usage data
- `GET /usage/counts` - Get simplified usage counts
- `POST /usage/reset` - Reset usage tracking

### Analytics Endpoints (SQLite)
- `POST /api/analytics/events` - Track analytics event

### User Endpoints (Supabase)
- User endpoints would be added here using `services/user_service.py`

## Database Separation

### Supabase (Users)
- **Purpose**: User accounts, authentication, user profiles
- **Location**: Cloud (Supabase Postgres)
- **Client**: `db/supabase_client.py`
- **Service**: `services/user_service.py`
- **Models**: `models/user.py`

### SQLite (Analytics)
- **Purpose**: Analytics events, metrics, tracking data
- **Location**: Local file (`analytics.db`)
- **Client**: `db/sqlite_client.py`
- **Service**: `services/analytics_service.py`
- **Models**: `models/analytics.py`

## Key Principles

1. **Clear Separation**: User operations NEVER touch SQLite, analytics operations NEVER touch Supabase
2. **Service Layer**: All database operations go through service modules
3. **Models**: Pydantic models for validation and type safety
4. **Error Handling**: Graceful degradation - analytics failures don't block requests

## Development

### Adding New User Operations

1. Add function to `services/user_service.py`
2. Use `get_supabase_client()` from `db/supabase_client.py`
3. Use models from `models/user.py`

### Adding New Analytics Operations

1. Add function to `services/analytics_service.py`
2. Use `get_sqlite_cursor()` from `db/sqlite_client.py`
3. Use models from `models/analytics.py`

## Notes

- SQLite database is created automatically on first use
- Supabase client is initialized on startup if credentials are available
- Analytics operations are fire-and-forget (never block the UI)
- All database connections are managed through the client modules


