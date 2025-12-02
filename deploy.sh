#!/bin/bash

# LifeOS Deployment Script

echo "🚀 Starting LifeOS Deployment..."

# 1. Check dependencies
echo "📦 Checking dependencies..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm could not be found. Please install Node.js."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ python3 could not be found. Please install Python."
    exit 1
fi

# 2. Install Frontend Dependencies
echo "📥 Installing frontend dependencies..."
npm install

# 3. Setup Python Backend
echo "🐍 Setting up Python backend..."
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "   Installing backend requirements..."
pip install fastapi uvicorn psutil openai python-dotenv supabase

# 4. Build Frontend
echo "🏗️  Building frontend..."
npm run build

# 5. Build Tauri App
echo "🖥️  Building Tauri app..."
npm run tauri build

echo "✅ Deployment Build Complete!"
echo "   The application binary is located in src-tauri/target/release/bundle/macos/"
