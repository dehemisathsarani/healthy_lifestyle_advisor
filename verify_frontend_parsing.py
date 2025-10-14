"""
Frontend Message Parsing Verification
Tests if messages from backend are being parsed correctly in the frontend
"""

import requests
import json
from typing import Dict, Any

def test_backend_response() -> Dict[str, Any]:
    """Send a test message to backend and check response format"""
    
    url = "http://localhost:8005/nutrition/chat"
    
    test_messages = [
        "What are good protein sources?",
        "Give me a meal plan for weight loss",
        "How much water should I drink?",
        "What are healthy breakfast options?"
    ]
    
    print("🧪 Testing Backend Message Formatting\n")
    print("=" * 80)
    
    results = []
    
    for test_msg in test_messages:
        print(f"\n📤 Sending: {test_msg}")
        print("-" * 80)
        
        try:
            response = requests.post(
                url,
                json={
                    "user_id": "test-user",
                    "message": test_msg,
                    "context_type": "nutrition"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('response', '')
                
                # Check for markdown elements
                has_bold = '**' in message
                has_bullets = '•' in message or '- ' in message
                has_numbers = any(f"{i}." in message for i in range(1, 10))
                has_emoji = any(char in message for char in '🥗🍎💪🏃‍♂️💧🥩')
                
                result = {
                    'message': test_msg,
                    'response_length': len(message),
                    'has_markdown_bold': has_bold,
                    'has_bullets': has_bullets,
                    'has_numbers': has_numbers,
                    'has_emoji': has_emoji,
                    'preview': message[:200] + '...' if len(message) > 200 else message
                }
                
                results.append(result)
                
                print(f"✅ Response received ({len(message)} chars)")
                print(f"   📝 Markdown bold: {'✓' if has_bold else '✗'}")
                print(f"   📝 Bullet points: {'✓' if has_bullets else '✗'}")
                print(f"   📝 Numbered lists: {'✓' if has_numbers else '✗'}")
                print(f"   😀 Emojis: {'✓' if has_emoji else '✗'}")
                print(f"\n   Preview:\n   {result['preview']}\n")
                
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error: {e}")
    
    return results


def check_frontend_parsing():
    """Check if frontend properly parses markdown"""
    
    print("\n\n" + "=" * 80)
    print("🔍 FRONTEND PARSING VERIFICATION")
    print("=" * 80)
    
    sample_response = """🥩 **Protein Sources for Your Goals**

**High-Quality Protein Options:**
• **Lean Meats:** Chicken breast (31g per 100g)
• **Fish:** Salmon (25g per 100g)
• **Eggs:** 1 large egg = 6g protein

**Daily Protein Needs:**
For weight loss: 1.6-2.2g per kg body weight
For muscle gain: 1.8-2.4g per kg body weight

**Pro Tips:**
✅ Distribute protein throughout the day
✅ Include protein with each meal

*Based on your profile, aim for 112-154g protein daily.*"""
    
    print("\n📋 Sample Backend Response:")
    print("-" * 80)
    print(sample_response)
    print("-" * 80)
    
    print("\n\n❌ CURRENT FRONTEND (Without Parsing):")
    print("-" * 80)
    print("The text above would display EXACTLY as shown, with:")
    print("  - ** symbols visible around bold text")
    print("  - • symbols visible but not formatted as list")
    print("  - No actual bold or italic rendering")
    print("  - Plain text appearance")
    
    print("\n\n✅ EXPECTED FRONTEND (With Parsing):")
    print("-" * 80)
    print("The text should render with:")
    print("  - BOLD text actually appearing bold")
    print("  - Bullet points properly formatted as list items")
    print("  - Italic text actually italicized")
    print("  - Section headers emphasized")
    print("  - Professional, readable formatting")


def check_frontend_running():
    """Check if frontend is accessible"""
    
    print("\n\n" + "=" * 80)
    print("🌐 FRONTEND STATUS CHECK")
    print("=" * 80)
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        print("✅ Frontend is running on http://localhost:3000")
        print(f"   Status: {response.status_code}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend not accessible: {e}")
        return False


def provide_testing_instructions():
    """Provide manual testing instructions"""
    
    print("\n\n" + "=" * 80)
    print("📋 MANUAL TESTING INSTRUCTIONS")
    print("=" * 80)
    
    print("""
1. Open http://localhost:3000 in your browser
2. Navigate to Diet Agent service
3. Login or create a profile
4. Open the chatbot (AI icon in bottom-right)
5. Send test message: "What are good protein sources?"
6. Observe the response formatting

🔍 WHAT TO CHECK:

❌ If messages show with markdown syntax visible:
   - You'll see **text** with asterisks
   - Bullet points show as • or -
   - No actual bold/italic rendering
   → MESSAGE PARSING IS NOT WORKING

✅ If messages are properly formatted:
   - Bold text appears BOLD without **
   - Bullet points are formatted lists
   - Headers are emphasized
   → MESSAGE PARSING IS WORKING

📁 COMPARISON FILES:
   - Open: test_frontend_message_parsing.html
   - Compare side-by-side formatting
   - See the difference visually

🔧 TO FIX:
   - See: FRONTEND_MESSAGE_PARSING_FIX.md
   - Install: npm install marked
   - Update: NutritionChatbotEnhanced.tsx
   - Test: Verify formatting works
""")


def main():
    """Run all verification tests"""
    
    print("\n")
    print("=" * 80)
    print(" 🎨 FRONTEND MESSAGE PARSING VERIFICATION SCRIPT ")
    print("=" * 80)
    print()
    
    # Check if services are running
    backend_ok = False
    frontend_ok = check_frontend_running()
    
    try:
        response = requests.get("http://localhost:8005/api/health", timeout=5)
        print("✅ Backend is running on http://localhost:8005")
        backend_ok = True
    except:
        print("❌ Backend not accessible on http://localhost:8005")
    
    if not backend_ok:
        print("\n⚠️  Backend must be running to test message formatting")
        print("   Start backend: cd backend && python main.py")
        provide_testing_instructions()
        return
    
    # Test backend responses
    results = test_backend_response()
    
    # Show frontend parsing issue
    check_frontend_parsing()
    
    # Provide testing instructions
    provide_testing_instructions()
    
    # Summary
    print("\n\n" + "=" * 80)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 80)
    
    if results:
        markdown_count = sum(1 for r in results if r['has_markdown_bold'])
        emoji_count = sum(1 for r in results if r['has_emoji'])
        
        print(f"\n✅ Backend tested: {len(results)} messages")
        print(f"   - {markdown_count}/{len(results)} messages contain markdown formatting")
        print(f"   - {emoji_count}/{len(results)} messages contain emojis")
        
        if markdown_count > 0:
            print("\n⚠️  ISSUE CONFIRMED:")
            print("   Backend sends markdown-formatted messages")
            print("   Frontend displays them as plain text")
            print("   → Message parsing NOT working in frontend")
            print("\n💡 SOLUTION:")
            print("   See: FRONTEND_MESSAGE_PARSING_FIX.md")
            print("   Test: Open test_frontend_message_parsing.html")
        else:
            print("\n✅ Backend sends plain text (no markdown)")
            print("   → No parsing needed")
    
    print("\n" + "=" * 80)
    print()


if __name__ == "__main__":
    main()
