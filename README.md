# Life Coach Agent Desktop

A desktop application built with Tauri v2 (Rust + React + TypeScript) that runs a Python FastAPI backend as a sidecar process to monitor user activity and provide life coaching insights.

## Architecture

- **Frontend/Container**: Tauri v2 (Rust + React + TypeScript)
- **Backend (Sidecar)**: Python FastAPI server running on port 14200
- **Communication**: HTTP requests from React frontend to Python backend

## Quick Start

```bash
# 1. Install Python dependencies
cd python-backend
pip install -r requirements.txt

# 2. Start the Tauri app (it will automatically start the Python backend)
npm run tauri:dev
```

Alternatively, you can run the backend manually:

```bash
# Terminal 1: Start backend
cd python-backend
python main.py

# Terminal 2: Start Tauri frontend
npm run tauri:dev
```

## Project Structure

```
.
├── python-backend/          # Python FastAPI sidecar
│   ├── main.py              # FastAPI server with /health and /context endpoints
│   └── requirements.txt     # Python dependencies
├── src-tauri/               # Tauri Rust application
│   ├── src/
│   │   ├── main.rs          # Rust code that spawns Python process
│   │   └── build.rs         # Tauri build script
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
└── src/                     # React frontend
    ├── App.tsx              # Main React component
    ├── hooks/
    │   └── useAgent.ts      # Hook that polls backend API
    └── ...
```

## Python Backend

The Python backend (`python-backend/main.py`) provides:

- **GET /health**: Health check endpoint
- **GET /context**: Returns current active window/application
  - Uses `pygetwindow` on Windows
  - Uses `AppKit` (pyobjc) on macOS
  - Returns platform and status information

### Running Backend

The backend is automatically started by the Tauri app, but you can also run it manually:

```bash
cd python-backend
pip install -r requirements.txt
python main.py
```

## Rust Process Management

The Rust code in `src-tauri/src/main.rs`:

1. **Finds Python executable** (python3, python, or py)
2. **Spawns Python process** when Tauri app starts
3. **Logs stdout/stderr** from Python process for debugging
4. **Kills Python process** when Tauri window closes

### Key Features

- Automatic Python executable detection
- Process stdout/stderr logging to Rust console
- Graceful shutdown on window close
- Error handling if Python backend fails to start

## React Frontend

- Modern UI with gradient design
- `useAgent` hook that polls `/context` every 2 seconds
- Displays current active window and platform info
- Error handling and loading states

## Development

### Prerequisites

- Python 3.10+
- Rust (latest stable)
- Node.js 18+
- Tauri CLI: `cargo install tauri-cli` or `npm install -g @tauri-apps/cli`

### Development Scripts

```bash
# Start Tauri app (automatically starts Python backend)
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Notes

- The Python backend runs on port **14200** to avoid conflicts
- CORS is configured to allow requests from `localhost` and Tauri's protocol
- The Rust process manager logs all Python output to help with debugging
- On macOS, you may need to grant accessibility permissions for window monitoring

## Troubleshooting

### Backend not starting
- Check if port 14200 is available: `lsof -i :14200`
- Check Python installation: `python3 --version`
- Ensure dependencies are installed: `pip install -r python-backend/requirements.txt`

### Window monitoring not working
- **macOS**: Grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility
- **Windows**: Ensure pygetwindow is installed: `pip install pygetwindow`
- **Linux**: Window monitoring requires additional setup (xdotool or similar)

### Tauri build errors
- Ensure Rust is installed: `rustc --version`
- Ensure Tauri CLI is installed
- Check `src-tauri/Cargo.toml` for correct dependencies
