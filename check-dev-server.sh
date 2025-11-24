#!/bin/bash

# Check if Vite dev server is running
PORT=3000
HOST="127.0.0.1"

echo "Checking if Vite dev server is running on http://${HOST}:${PORT}..."

if curl -s -f "http://${HOST}:${PORT}" > /dev/null 2>&1; then
    echo "✅ Vite dev server is running!"
    exit 0
else
    echo "❌ Vite dev server is NOT running"
    echo "   Start it with: npm run dev"
    exit 1
fi


