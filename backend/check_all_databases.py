#!/usr/bin/env python3
"""
Check all databases in MongoDB instance
"""

import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_databases():
    print("🔍 CHECKING ALL MONGODB DATABASES")
    print("=" * 50)
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        
        # List all databases
        databases = await client.list_database_names()
        print(f"📊 Found {len(databases)} databases:")
        
        for db_name in databases:
            print(f"\n🗄️ Database: {db_name}")
            db = client[db_name]
            collections = await db.list_collection_names()
            print(f"   📁 Collections: {len(collections)}")
            
            if len(collections) > 10:  # Likely the one with health data
                print("   🏥 This might contain health data! Collections:")
                for col in collections[:10]:  # Show first 10
                    try:
                        count = await db[col].count_documents({})
                        print(f"      - {col}: {count} documents")
                    except Exception as e:
                        print(f"      - {col}: Error counting - {e}")
                
                if len(collections) > 10:
                    print(f"      ... and {len(collections) - 10} more collections")
            else:
                for col in collections:
                    try:
                        count = await db[col].count_documents({})
                        print(f"      - {col}: {count} documents")
                    except Exception as e:
                        print(f"      - {col}: Error counting - {e}")
        
        print(f"\n🎯 ANALYSIS:")
        print("=" * 50)
        
        # Find database with most collections (likely the health data)
        max_collections = 0
        health_db_name = None
        
        for db_name in databases:
            if db_name not in ['admin', 'local', 'config']:
                db = client[db_name]
                collections = await db.list_collection_names()
                if len(collections) > max_collections:
                    max_collections = len(collections)
                    health_db_name = db_name
        
        if health_db_name and max_collections > 5:
            print(f"🏥 Primary Health Database: {health_db_name}")
            print(f"📊 Collections: {max_collections}")
            print(f"💡 This is likely where your real health data is stored!")
            
            # Show sample from health database
            db = client[health_db_name]
            collections = await db.list_collection_names()
            
            print(f"\n📋 Sample collections from {health_db_name}:")
            health_keywords = ['user', 'profile', 'diet', 'fitness', 'meal', 'workout', 'nutrition']
            
            for col in collections[:15]:  # Show first 15
                has_health_keyword = any(keyword in col.lower() for keyword in health_keywords)
                emoji = "🏥" if has_health_keyword else "📁"
                try:
                    count = await db[col].count_documents({})
                    print(f"   {emoji} {col}: {count} docs")
                except:
                    print(f"   {emoji} {col}: Error")
        else:
            print("❌ No obvious health database found")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error checking databases: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_all_databases())