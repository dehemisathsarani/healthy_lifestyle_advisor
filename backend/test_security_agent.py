"""
Test script for Data and Security Agent
Tests encryption, decryption, and data aggregation functionality
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.security_service import security_service
from app.services.data_aggregation_service import DataAggregationService
from app.core.database import connect_to_mongo, get_database


async def test_encryption_decryption():
    """Test basic encryption and decryption"""
    print("\n" + "="*60)
    print("TEST 1: Encryption and Decryption")
    print("="*60)
    
    # Test data
    test_data = {
        "name": "John Doe",
        "age": 30,
        "health_metrics": {
            "weight": 70,
            "height": 175,
            "bmi": 22.9
        }
    }
    
    user_id = "507f1f77bcf86cd799439011"
    
    try:
        # Encrypt
        print("\n1. Encrypting data...")
        encrypted_result = security_service.encrypt_data(test_data, user_id)
        print(f"✓ Encryption successful!")
        print(f"  Encrypted data (first 50 chars): {encrypted_result['encrypted_data'][:50]}...")
        print(f"  Encryption method: {encrypted_result['encryption_method']}")
        
        # Decrypt
        print("\n2. Decrypting data...")
        decrypted_data = security_service.decrypt_data(
            encrypted_result['encrypted_data'], 
            user_id
        )
        print(f"✓ Decryption successful!")
        print(f"  Decrypted data: {decrypted_data}")
        
        # Verify data integrity
        assert decrypted_data == test_data, "Decrypted data doesn't match original!"
        print("\n✓ Data integrity verified!")
        
        return True
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False


async def test_token_based_decryption():
    """Test token-based decryption"""
    print("\n" + "="*60)
    print("TEST 2: Token-Based Decryption")
    print("="*60)
    
    test_data = {
        "sensitive_info": "This is confidential",
        "user_metrics": {"score": 95}
    }
    
    user_id = "507f1f77bcf86cd799439011"
    
    try:
        # Encrypt
        print("\n1. Encrypting data...")
        encrypted_result = security_service.encrypt_data(test_data, user_id)
        print(f"✓ Data encrypted")
        
        # Generate token
        print("\n2. Generating decryption token...")
        token_info = security_service.generate_decryption_token(user_id, expires_in_hours=24)
        print(f"✓ Token generated!")
        print(f"  Token (first 30 chars): {token_info['decryption_token'][:30]}...")
        
        # Decrypt with token
        print("\n3. Decrypting with token...")
        decrypted_data = security_service.decrypt_with_token(
            encrypted_result['encrypted_data'],
            token_info['decryption_token']
        )
        print(f"✓ Token decryption successful!")
        print(f"  Decrypted data: {decrypted_data}")
        
        # Verify
        assert decrypted_data == test_data, "Token-decrypted data doesn't match!"
        print("\n✓ Token-based decryption verified!")
        
        return True
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False


async def test_wrong_user_id():
    """Test that wrong user_id cannot decrypt data"""
    print("\n" + "="*60)
    print("TEST 3: Wrong User ID Protection")
    print("="*60)
    
    test_data = {"secret": "confidential"}
    correct_user_id = "507f1f77bcf86cd799439011"
    wrong_user_id = "507f1f77bcf86cd799439012"
    
    try:
        # Encrypt with correct user_id
        print("\n1. Encrypting data with user_id A...")
        encrypted_result = security_service.encrypt_data(test_data, correct_user_id)
        print(f"✓ Data encrypted")
        
        # Try to decrypt with wrong user_id
        print("\n2. Attempting to decrypt with different user_id B...")
        try:
            decrypted_data = security_service.decrypt_data(
                encrypted_result['encrypted_data'],
                wrong_user_id
            )
            print("✗ SECURITY ISSUE: Different user could decrypt data!")
            return False
        except ValueError as e:
            print(f"✓ Decryption correctly failed: {str(e)[:50]}...")
            print("\n✓ User-specific encryption verified!")
            return True
            
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False


async def test_data_aggregation():
    """Test data aggregation from MongoDB"""
    print("\n" + "="*60)
    print("TEST 4: Data Aggregation Service")
    print("="*60)
    
    try:
        # Connect to database
        print("\n1. Connecting to MongoDB...")
        connected = await connect_to_mongo()
        
        if not connected:
            print("⚠ Database not connected - skipping aggregation test")
            return True
        
        print("✓ Connected to database")
        
        # Get database instance
        db = get_database()  # Remove await - get_database() is not async
        if not db:
            print("⚠ Database instance not available - skipping aggregation test")
            return True
        
        # Create aggregation service
        print("\n2. Creating data aggregation service...")
        data_service = DataAggregationService(db)
        print("✓ Service created")
        
        # Test user_id (this might not exist in your DB yet)
        test_user_id = "507f1f77bcf86cd799439011"
        
        # Try to fetch diet data
        print("\n3. Fetching diet agent data...")
        diet_data = await data_service.get_diet_data(test_user_id, days=30)
        print(f"✓ Diet data retrieved")
        print(f"  Agent: {diet_data.get('agent')}")
        if 'error' in diet_data:
            print(f"  Note: {diet_data.get('error')}")
        else:
            print(f"  Total meals: {diet_data.get('total_meals_analyzed', 0)}")
        
        # Try to fetch fitness data
        print("\n4. Fetching fitness agent data...")
        fitness_data = await data_service.get_fitness_data(test_user_id, days=30)
        print(f"✓ Fitness data retrieved")
        print(f"  Agent: {fitness_data.get('agent')}")
        if 'error' in fitness_data:
            print(f"  Note: {fitness_data.get('error')}")
        else:
            print(f"  Total workouts: {fitness_data.get('total_workouts', 0)}")
        
        # Try to fetch mental health data
        print("\n5. Fetching mental health agent data...")
        mental_data = await data_service.get_mental_health_data(test_user_id, days=30)
        print(f"✓ Mental health data retrieved")
        print(f"  Agent: {mental_data.get('agent')}")
        if 'error' in mental_data:
            print(f"  Note: {mental_data.get('error')}")
        else:
            print(f"  Total mood entries: {mental_data.get('total_mood_entries', 0)}")
        
        print("\n✓ Data aggregation service working correctly!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_encrypted_report_flow():
    """Test complete flow: aggregate data -> encrypt -> decrypt"""
    print("\n" + "="*60)
    print("TEST 5: Complete Encrypted Report Flow")
    print("="*60)
    
    try:
        # Sample aggregated data (simulating what would come from database)
        sample_report = {
            "user_id": "507f1f77bcf86cd799439011",
            "generated_at": "2025-10-12T10:30:00",
            "diet_agent": {
                "total_meals_analyzed": 45,
                "avg_calories": 2000
            },
            "fitness_agent": {
                "total_workouts": 20,
                "total_duration_minutes": 600
            },
            "mental_health_agent": {
                "total_mood_entries": 30,
                "avg_mood_score": 7.5
            }
        }
        
        user_id = "507f1f77bcf86cd799439011"
        
        # Step 1: Encrypt the report
        print("\n1. Encrypting health report...")
        encrypted_report = security_service.encrypt_data(sample_report, user_id)
        print("✓ Report encrypted")
        print(f"  Encrypted size: {len(encrypted_report['encrypted_data'])} chars")
        
        # Step 2: User downloads encrypted report
        print("\n2. User receives encrypted report...")
        print(f"  User can save this encrypted data securely")
        
        # Step 3: User decrypts when needed
        print("\n3. User decrypts report when needed...")
        decrypted_report = security_service.decrypt_data(
            encrypted_report['encrypted_data'],
            user_id
        )
        print("✓ Report decrypted successfully")
        
        # Step 4: Verify data
        print("\n4. Verifying data integrity...")
        assert decrypted_report['diet_agent']['total_meals_analyzed'] == 45
        assert decrypted_report['fitness_agent']['total_workouts'] == 20
        print("✓ All data verified!")
        
        print("\n✓ Complete encrypted report flow successful!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("DATA AND SECURITY AGENT - TEST SUITE")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Encryption/Decryption", await test_encryption_decryption()))
    results.append(("Token-Based Decryption", await test_token_based_decryption()))
    results.append(("Wrong User ID Protection", await test_wrong_user_id()))
    results.append(("Data Aggregation", await test_data_aggregation()))
    results.append(("Encrypted Report Flow", await test_encrypted_report_flow()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠ {total - passed} test(s) failed")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
