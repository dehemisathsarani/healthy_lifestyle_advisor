#!/usr/bin/env python3
"""
Comprehensive database investigation for real health data
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def investigate_real_data():
    print("🔍 INVESTIGATING REAL HEALTH DATA IN DATABASE")
    print("=" * 60)
    
    try:
        from app.core.database import connect_to_mongo, get_database
        
        await connect_to_mongo()
        db = get_database()
        
        collections = await db.list_collection_names()
        
        print(f"📊 Found {len(collections)} total collections:")
        print("=" * 60)
        
        health_collections = {}
        system_collections = {}
        
        for col_name in collections:
            count = await db[col_name].count_documents({})
            
            # Check if collection has data
            if count > 0:
                sample = await db[col_name].find_one()
                sample_keys = list(sample.keys()) if sample else []
                
                # Categorize collections
                health_indicators = ['diet', 'fitness', 'health', 'meal', 'workout', 'nutrition', 'user', 'profile', 'exercise', 'calorie', 'weight', 'bmi']
                is_health_related = any(indicator in col_name.lower() for indicator in health_indicators)
                
                if is_health_related or any(indicator in str(sample_keys).lower() for indicator in health_indicators):
                    health_collections[col_name] = {
                        'count': count,
                        'sample_keys': sample_keys,
                        'sample_data': sample
                    }
                    print(f"🏥 HEALTH DATA: {col_name}")
                    print(f"   📄 Documents: {count}")
                    print(f"   🔑 Keys: {sample_keys}")
                    print()
                else:
                    system_collections[col_name] = count
                    print(f"🔧 System: {col_name} ({count} docs)")
        
        print("\n" + "=" * 60)
        print("🎯 REAL HEALTH DATA ANALYSIS")
        print("=" * 60)
        
        if health_collections:
            print(f"✅ FOUND {len(health_collections)} HEALTH DATA COLLECTIONS:")
            
            for col_name, data in health_collections.items():
                print(f"\n📋 {col_name}:")
                print(f"   📊 Records: {data['count']}")
                print(f"   🗂️ Structure: {data['sample_keys']}")
                
                # Show sample data for key collections
                if data['count'] > 0:
                    sample = data['sample_data']
                    print(f"   📝 Sample data preview:")
                    for key, value in list(sample.items())[:5]:  # Show first 5 fields
                        if key != '_id':
                            print(f"      {key}: {value}")
            
            print(f"\n💡 INTEGRATION PLAN:")
            print("   1. Identify user identification method (email, user_id)")
            print("   2. Create aggregation queries for health reports")
            print("   3. Replace mock data in backend routes")
            print("   4. Update frontend to handle real data structure")
            
        else:
            print("❌ No health-related collections found")
            print("📋 All collections appear to be system/metadata")
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Collections: {len(collections)}")
        print(f"   Health Collections: {len(health_collections)}")
        print(f"   System Collections: {len(system_collections)}")
        
        return health_collections
        
    except Exception as e:
        print(f"❌ Error investigating database: {e}")
        import traceback
        traceback.print_exc()
        return {}

if __name__ == "__main__":
    asyncio.run(investigate_real_data())