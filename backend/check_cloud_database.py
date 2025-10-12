#!/usr/bin/env python3
"""
Check MongoDB Atlas cloud database for real health data
"""

import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_cloud_database():
    print("☁️ CHECKING MONGODB ATLAS CLOUD DATABASE")
    print("=" * 55)
    
    # Atlas connection string from aiservices
    cloud_uri = "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent"
    
    try:
        client = AsyncIOMotorClient(cloud_uri)
        
        # List all databases
        databases = await client.list_database_names()
        print(f"☁️ Cloud databases found: {databases}")
        
        # Check HealthAgent database
        db = client['HealthAgent']
        collections = await db.list_collection_names()
        
        print(f"\n🏥 HealthAgent Database Collections: {len(collections)}")
        print("=" * 55)
        
        if len(collections) > 30:  # This should be your 36 collections!
            print("🎉 FOUND THE REAL HEALTH DATA!")
            print(f"📊 Total Collections: {len(collections)}")
            
            # Categorize collections
            health_collections = []
            user_collections = []
            system_collections = []
            
            for col in collections:
                try:
                    count = await db[col].count_documents({})
                    
                    if any(keyword in col.lower() for keyword in ['user', 'profile']):
                        user_collections.append((col, count))
                        print(f"👤 USER DATA: {col} ({count} docs)")
                    elif any(keyword in col.lower() for keyword in ['diet', 'fitness', 'meal', 'workout', 'nutrition', 'health', 'calorie', 'exercise']):
                        health_collections.append((col, count))
                        print(f"🏥 HEALTH DATA: {col} ({count} docs)")
                    else:
                        system_collections.append((col, count))
                        print(f"🔧 SYSTEM: {col} ({count} docs)")
                        
                except Exception as e:
                    print(f"❌ Error checking {col}: {e}")
            
            print(f"\n📊 SUMMARY:")
            print(f"   👤 User Collections: {len(user_collections)}")
            print(f"   🏥 Health Data Collections: {len(health_collections)}")
            print(f"   🔧 System Collections: {len(system_collections)}")
            
            # Show sample data from key collections
            if health_collections:
                print(f"\n🔍 SAMPLE DATA FROM KEY COLLECTIONS:")
                print("=" * 55)
                
                for col_name, count in health_collections[:3]:  # Show first 3
                    if count > 0:
                        sample = await db[col_name].find_one()
                        if sample:
                            print(f"\n📋 {col_name} (Sample Record):")
                            sample_preview = {}
                            for key, value in sample.items():
                                if key != '_id':
                                    sample_preview[key] = value
                                if len(sample_preview) >= 5:  # Show first 5 fields
                                    break
                            
                            for key, value in sample_preview.items():
                                print(f"   {key}: {value}")
            
            print(f"\n💡 INTEGRATION PLAN:")
            print("   1. Update backend .env to use cloud database")
            print("   2. Create real data aggregation functions")
            print("   3. Replace mock data with real database queries")
            print("   4. Test with actual user data")
            
            return collections
            
        else:
            print("❌ Expected 36 collections but found fewer")
            for col in collections:
                try:
                    count = await db[col].count_documents({})
                    print(f"   📁 {col}: {count} docs")
                except:
                    print(f"   📁 {col}: Error")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error connecting to cloud database: {e}")
        print("💡 This might be due to network connectivity or credentials")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_cloud_database())