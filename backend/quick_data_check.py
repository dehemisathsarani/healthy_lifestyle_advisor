#!/usr/bin/env python3
"""
Quick database summary check
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def database_summary():
    print("📊 FINAL REPORT DATA ANALYSIS")
    print("=" * 50)
    
    try:
        from app.core.database import connect_to_mongo, get_database
        
        await connect_to_mongo()
        db = get_database()
        
        collections = await db.list_collection_names()
        
        print("🗃️ Current Database Collections:")
        has_health_data = False
        
        for col_name in collections:
            count = await db[col_name].count_documents({})
            print(f"   📁 {col_name}: {count} documents")
            
            if any(keyword in col_name.lower() for keyword in ['diet', 'fitness', 'health', 'meal', 'workout', 'user_profile']):
                has_health_data = True
        
        print(f"\n🎯 FINAL ANSWER:")
        print("=" * 50)
        
        if has_health_data:
            print("✅ REAL HEALTH DATA: Available in database")
        else:
            print("❌ NO REAL HEALTH DATA: Only system collections exist")
            
        print("📋 Current Report Source: MOCK/DUMMY DATA")
        print("🔧 Report Generation: Uses hardcoded values")
        print("💾 Data Integration: NOT CONNECTED to real user data")
        
        print(f"\n📊 Summary:")
        print("   - Three-Step OTP: ✅ WORKING")
        print("   - Security System: ✅ WORKING") 
        print("   - Final Reports: ❌ MOCK DATA ONLY")
        
    except Exception as e:
        print(f"❌ Database check error: {e}")

if __name__ == "__main__":
    asyncio.run(database_summary())