# 🤖 AI Coaching Setup Guide

## Overview

The AI coaching layer uses **Ollama** for local, privacy-friendly AI insights. No data leaves your computer!

## Installation

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
# OR download from https://ollama.ai
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai

### 2. Start Ollama

```bash
ollama serve
```

This starts Ollama on `http://localhost:11434`

### 3. Download a Model

```bash
# Recommended: llama3.2 (small, fast, good quality)
ollama pull llama3.2

# OR use a larger model for better quality:
ollama pull llama3.1:8b
ollama pull mistral
```

### 4. Test It

```bash
curl http://localhost:11434/api/tags
```

Should return list of available models.

## How It Works

### Weekly Reports

The AI coach analyzes your week and generates:
- **Celebration**: Wins and achievements
- **Insights**: Patterns and observations
- **Recommendation**: Actionable advice
- **Motivation**: Encouragement for next week

### Example Report

```json
{
  "celebration": "🎉 You completed your goal 5 out of 7 days! Your longest focus streak was 45 minutes - amazing!",
  "insights": "You focused for 8.5 hours this week. 75% of your tracked time was focused on 'Study AWS'.",
  "recommendation": "You're doing great! Consider scheduling focus time in the morning when you're most productive.",
  "motivation": "Keep pushing toward 'Study AWS' - you've got this! 💪"
}
```

## API Endpoint

**GET `/weekly_report`**

Returns AI-generated weekly coaching report.

**Response:**
```json
{
  "status": "ok",
  "report": {
    "celebration": "...",
    "insights": "...",
    "recommendation": "...",
    "motivation": "..."
  },
  "ollama_available": true
}
```

## Fallback Mode

If Ollama is not available, the system uses **rule-based fallback** reports:
- Still provides insights
- Based on your data
- No AI required

## Customization

### Change Model

Edit `python-backend/behavior/ai_coach.py`:
```python
self.model = "llama3.1:8b"  # Use larger model
```

### Change Ollama URL

```python
ai_coach = AICoach(ollama_base_url="http://localhost:11434")
```

## Testing

```bash
# Test Ollama is running
curl http://localhost:11434/api/tags

# Test AI coach
cd python-backend
source venv/bin/activate
python -c "from behavior.ai_coach import AICoach; c = AICoach(); print('Available:', c._check_ollama_available())"

# Test weekly report endpoint
curl http://127.0.0.1:14200/weekly_report
```

## Privacy

✅ **100% Local** - All AI processing happens on your machine
✅ **No Data Sent** - Nothing goes to external servers
✅ **Optional** - Works without AI (fallback mode)

## Next Steps

1. Install Ollama
2. Download a model
3. Start Ollama server
4. Test the weekly report endpoint
5. Integrate into UI (show report in dashboard)

The AI coaching is ready to use! 🚀

