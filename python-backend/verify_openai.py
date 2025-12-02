import asyncio
import os
import sys
from services.openai_service import get_openai_service

# Add the current directory to sys.path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_openai():
    print("🤖 Testing OpenAI Connection...")
    
    try:
        service = get_openai_service()
        if not service.api_key:
            print("❌ Error: OPENAI_API_KEY not found in environment variables.")
            print("   Please ensure it is set in your .env file.")
            return

        print(f"🔑 API Key found: {service.api_key[:8]}...")
        
        print("   Sending test request...")
        response = await service.generate_content("Say 'Hello from OpenAI!' if you can hear me.")
        
        print(f"✅ Success! Response: {response}")
        print("\n🎉 OpenAI integration is working correctly.")
        
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        print("   Please check your API key and internet connection.")

if __name__ == "__main__":
    asyncio.run(test_openai())
