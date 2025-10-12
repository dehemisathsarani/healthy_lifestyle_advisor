#!/usr/bin/env python3
"""
Check database collections and real health data
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def check_database_content():
    print("🔍 Checking Database Content for Real Health Data")
    print("=" * 55)
    
    try:
        # Import database functions
        from app.core.database import connect_to_mongo, get_database
        
        # Connect to database
        await connect_to_mongo()
        db = get_database()
        print("✅ Database connected successfully")
        
        # List all collections
        collections = await db.list_collection_names()
        print(f"\n📊 Found {len(collections)} collections:")
        
        for col_name in collections:
            count = await db[col_name].count_documents({})
            print(f"\n📁 Collection: {col_name}")
            print(f"   📄 Documents: {count}")
            
            if count > 0:
                # Get sample document
                sample = await db[col_name].find_one()
                if sample:
                    print(f"   🔑 Sample keys: {list(sample.keys())}")
                    
                    # Check if this looks like health data
                    health_indicators = ['calories', 'meal', 'workout', 'fitness', 'diet', 'nutrition', 'mood', 'health', 'weight', 'exercise']
                    sample_str = str(sample).lower()
                    found_indicators = [indicator for indicator in health_indicators if indicator in sample_str]
                    
                    if found_indicators:
                        print(f"   🏥 Health data indicators found: {found_indicators}")
                        print("   📋 This appears to be REAL HEALTH DATA")
                    else:
                        print("   📋 This appears to be system/metadata")
        
        print(f"\n🎯 ANALYSIS RESULT:")
        print("=" * 55)
        
        # Check for specific health collections
        health_collections = []
        system_collections = []
        
        for col_name in collections:
            if any(keyword in col_name.lower() for keyword in ['diet', 'fitness', 'health', 'meal', 'workout', 'nutrition', 'user']):
                health_collections.append(col_name)
            else:
                system_collections.append(col_name)
        
        if health_collections:
            print(f"✅ REAL HEALTH DATA COLLECTIONS: {health_collections}")
        else:
            print("❌ NO REAL HEALTH DATA COLLECTIONS FOUND")
        
        if system_collections:
            print(f"🔧 System collections: {system_collections}")
        
        print(f"\n📊 CURRENT STATUS:")
        print("   - Three-step OTP workflow: ✅ Working with MOCK DATA")
        print("   - Real health data integration: ❌ NOT CONNECTED")
        
        if health_collections:
            print(f"\n💡 RECOMMENDATION:")
            print("   - Update backend routes to fetch real data from:", health_collections)
            print("   - Replace mock data with database queries")
            print("   - Create aggregation functions for health reports")
        else:
            print(f"\n💡 RECOMMENDATION:")
            print("   - Create health data collections (diet_entries, fitness_logs, user_profiles)")
            print("   - Add sample health data for testing")
            print("   - Integrate real data collection APIs")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_database_content())