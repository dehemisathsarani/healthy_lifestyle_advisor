import asyncio
from app.security.ai_agent import SecurityAIAgent
from dotenv import load_dotenv

async def test_security_agent():
    # Load environment variables
    load_dotenv()
    
    # Initialize the agent
    agent = SecurityAIAgent()
    
    # Test security profile analysis
    security_profile = {
        "privacy_level": "high",
        "data_sharing": {
            "share_with_doctors": True,
            "share_with_coaches": False,
            "share_anonymous_data": True
        },
        "access_history": [
            {"timestamp": "2025-08-28T10:00:00", "action": "login"},
            {"timestamp": "2025-08-28T10:15:00", "action": "view_health_data"}
        ]
    }
    
    usage_patterns = {
        "login_times": ["morning", "evening"],
        "data_access_patterns": ["weekly_report", "diet_tracking"]
    }
    
    try:
        # Test security analysis
        security_result = await agent.analyze_security_profile(
            security_profile,
            usage_patterns
        )
        print("\nSecurity Analysis Result:")
        print(f"Risk Level: {security_result.risk_level}")
        print(f"Findings: {security_result.findings}")
        print(f"Recommendations: {security_result.recommendations}")
        
        # Test health data analysis
        health_data = {
            "diet": {
                "calories": 2000,
                "macros": {"protein": 150, "carbs": 200, "fats": 70}
            },
            "fitness": {
                "workout_type": "strength",
                "duration_minutes": 45,
                "calories_burned": 300
            },
            "mental_health": {
                "mood_score": 8,
                "stress_level": 3
            }
        }
        
        privacy_settings = {
            "share_detailed_data": False,
            "anonymize_data": True
        }
        
        data_result = await agent.analyze_health_data(
            health_data,
            privacy_settings
        )
        print("\nHealth Data Analysis Result:")
        print(f"Pattern Type: {data_result.pattern_type}")
        print(f"Description: {data_result.description}")
        print(f"Impact: {data_result.impact}")
        print(f"Suggested Actions: {data_result.suggested_actions}")
        
        # Test comprehensive privacy report
        report = await agent.generate_privacy_report(
            user_data={"login_history": [], "access_patterns": []},
            security_profile=security_profile,
            health_data=health_data
        )
        print("\nPrivacy Report:")
        print(f"Privacy Score: {report['privacy_score']}")
        print(f"Security Analysis: {report['security_analysis']}")
        print(f"Data Analysis: {report['data_analysis']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_security_agent())
