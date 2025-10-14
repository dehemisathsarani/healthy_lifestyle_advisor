"""
MongoDB Setup Script for Fitness Agent
This script helps you set up MongoDB for the fitness agent
"""
import subprocess
import sys
import time
import os
from pathlib import Path


def check_docker_availability():
    """Check if Docker is available and running"""
    try:
        result = subprocess.run(["docker", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ Docker found: {result.stdout.strip()}")
            return True
    except Exception as e:
        print(f"❌ Docker not available: {e}")
    return False


def start_mongodb_docker():
    """Start MongoDB using Docker"""
    print("🐳 Starting MongoDB with Docker...")
    
    try:
        # Check if container already exists
        result = subprocess.run(
            ["docker", "ps", "-a", "--filter", "name=mongodb-fitness", "--format", "{{.Names}}"],
            capture_output=True, text=True, timeout=10
        )
        
        if "mongodb-fitness" in result.stdout:
            print("📦 MongoDB container already exists, starting it...")
            subprocess.run(["docker", "start", "mongodb-fitness"], check=True)
        else:
            print("📦 Creating new MongoDB container...")
            subprocess.run([
                "docker", "run", "--name", "mongodb-fitness", 
                "-d", "-p", "27017:27017", 
                "-v", "mongodb_fitness_data:/data/db",
                "mongo:7.0"
            ], check=True)
        
        print("⏳ Waiting for MongoDB to start...")
        time.sleep(10)
        
        # Test connection
        result = subprocess.run(
            ["docker", "exec", "mongodb-fitness", "mongosh", "--eval", "db.runCommand('ping')"],
            capture_output=True, text=True, timeout=15
        )
        
        if result.returncode == 0:
            print("✅ MongoDB is running successfully!")
            return True
        else:
            print(f"❌ MongoDB health check failed: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start MongoDB: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def create_env_file():
    """Create .env file with MongoDB configuration"""
    env_content = """# Fitness Agent Database Configuration
USE_FILE_DATABASE=false
MONGODB_URL=mongodb://localhost:27017
DB_NAME=fitness_db
DEMO_MODE=false

# JWT Settings
JWT_SECRET_KEY=fitness_agent_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Settings
API_PREFIX=/api/v1

# Health Monitoring
WEARABLE_API_ENABLED=true
ANOMALY_DETECTION_ENABLED=true
ANOMALY_SENSITIVITY=medium
HEART_RATE_ALERT_THRESHOLD=120
RECOVERY_ADVICE_AUTO_REFRESH=true

# CORS Settings
CORS_ORIGINS=["*"]
"""
    
    with open(".env", "w") as f:
        f.write(env_content)
    
    print("✅ Created .env file with MongoDB configuration")


def test_fitness_agent_connection():
    """Test the fitness agent database connection"""
    print("🧪 Testing fitness agent database connection...")
    
    try:
        result = subprocess.run([
            sys.executable, "test_new_db_connection.py"
        ], capture_output=True, text=True, timeout=30)
        
        if "ALL TESTS SUCCESSFUL" in result.stdout:
            print("✅ Fitness agent database connection successful!")
            return True
        else:
            print("❌ Fitness agent test failed:")
            print(result.stdout)
            if result.stderr:
                print("Errors:", result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False


def main():
    """Main setup function"""
    print("🏋️ FITNESS AGENT MONGODB SETUP")
    print("=" * 50)
    
    # Step 1: Check Docker
    if not check_docker_availability():
        print("\n❌ Docker is required but not available.")
        print("Please install Docker Desktop or start Docker service.")
        print("Alternative: Use MongoDB Atlas (cloud) - see ATLAS_SETUP.md")
        return
    
    # Step 2: Start MongoDB
    if not start_mongodb_docker():
        print("\n❌ Failed to start MongoDB")
        return
    
    # Step 3: Create .env file
    create_env_file()
    
    # Step 4: Test connection
    if test_fitness_agent_connection():
        print("\n🎉 SETUP COMPLETE!")
        print("=" * 50)
        print("✅ MongoDB is running")
        print("✅ Fitness agent can connect to database")
        print("✅ All workout planner data will be stored in MongoDB")
        print("\n🚀 You can now start your fitness agent:")
        print("   python main.py")
        print("\n📊 MongoDB Management:")
        print("   - View data: docker exec -it mongodb-fitness mongosh")
        print("   - Stop MongoDB: docker stop mongodb-fitness")
        print("   - Start MongoDB: docker start mongodb-fitness")
    else:
        print("\n❌ Setup incomplete - please check errors above")


if __name__ == "__main__":
    main()