# LifeOS - AI Productivity Agent

LifeOS is an intelligent desktop companion that helps you stay focused, achieve your goals, and maintain a healthy flow state.

## Features

- **🎯 Goal Strategy Engine**: Breaks down large goals into actionable weekly plans.
- **🧠 AI Morning Briefing**: Generates personalized daily plans based on your performance.
- **🛡️ Flow State Guard**: Detects distractions and actively nudges you back to focus.
- **🎮 Gamification**: Earn XP and level up by maintaining focus and completing tasks.
- **📊 Real-time Analytics**: Tracks app usage, context switches, and focus time.

## Installation

1. **Prerequisites**:
   - Node.js (v18+)
   - Python 3.10+
   - Rust (for Tauri build)

2. **Setup**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/lifeos.git
   cd lifeos

   # Install dependencies
   npm install

   # Setup Python backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configuration**:
   - Create a `.env` file in the root directory.
   - Add your OpenAI API Key: `OPENAI_API_KEY=sk-...`
   - Add Supabase credentials (optional for cloud sync).

## Running Locally

1. **Start the Backend**:
   ```bash
   # In a separate terminal
   source venv/bin/activate
   python3 python-backend/main.py
   ```

2. **Start the App**:
   ```bash
   npm run tauri:dev
   ```

## Building for Production

Run the deployment script to build a standalone application:

```bash
chmod +x deploy.sh
./deploy.sh
```

The binary will be available in `src-tauri/target/release/bundle/macos/`.

## Architecture

- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Python (FastAPI), SQLite (Local Analytics), Supabase (User Data)
- **Desktop Shell**: Tauri (Rust)
- **AI**: OpenAI GPT-4o

## License

MIT
