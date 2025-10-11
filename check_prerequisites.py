"""
Check all prerequisites for Diet Agent
"""
import sys
import subprocess
import socket

def check_port(port, service_name):
    """Check if a port is in use"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    
    if result == 0:
        print(f"✅ {service_name} is running on port {port}")
        return True
    else:
        print(f"❌ {service_name} is NOT running on port {port}")
        return False

def check_python_package(package_name):
    """Check if a Python package is installed"""
    try:
        __import__(package_name)
        print(f"✅ Python package '{package_name}' is installed")
        return True
    except ImportError:
        print(f"❌ Python package '{package_name}' is NOT installed")
        print(f"   Install with: pip install {package_name}")
        return False

def check_tesseract():
    """Check if Tesseract is installed and in PATH"""
    try:
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            print(f"✅ Tesseract is installed: {version}")
            return True
        else:
            print(f"❌ Tesseract command failed")
            return False
    except FileNotFoundError:
        print(f"❌ Tesseract is NOT installed or not in PATH")
        print(f"   Download from: https://github.com/UB-Mannheim/tesseract/wiki")
        return False
    except Exception as e:
        print(f"❌ Error checking Tesseract: {e}")
        return False

def check_mongodb_connection():
    """Check if MongoDB is accessible"""
    try:
        import pymongo
        # Use MongoDB Atlas URL
        MONGODB_URL = "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent"
        client = pymongo.MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        client.server_info()  # Will raise exception if cannot connect
        print(f"✅ MongoDB Atlas is accessible and responding")
        # List databases
        dbs = client.list_database_names()
        print(f"   Databases: {', '.join(dbs)}")
        return True
    except Exception as e:
        print(f"❌ MongoDB Atlas is NOT accessible: {e}")
        print(f"   Check your internet connection and MongoDB Atlas credentials")
        return False

print("="*70)
print("DIET AGENT PREREQUISITES CHECK")
print("="*70)
print()

results = {}

# Check Python version
print(f"📌 Python Version: {sys.version}")
print()

# Check services
print("📌 Checking Services...")
results['backend'] = check_port(8001, "Diet Agent Backend")
results['mongodb'] = check_port(27017, "MongoDB")
print()

# Check Python packages
print("📌 Checking Python Packages...")
packages = [
    'fastapi',
    'uvicorn',
    'pymongo',
    'motor',
    'ultralytics',
    'pytesseract',
    'cv2',  # opencv-python
    'PIL',  # pillow
    'requests'
]

for package in packages:
    pkg_name = package if package not in ['cv2', 'PIL'] else ('opencv-python' if package == 'cv2' else 'pillow')
    results[f'pkg_{package}'] = check_python_package(package)
print()

# Check Tesseract
print("📌 Checking Tesseract OCR...")
results['tesseract'] = check_tesseract()
print()

# Check MongoDB connection
print("📌 Checking MongoDB Connection...")
results['mongodb_conn'] = check_mongodb_connection()
print()

# Summary
print("="*70)
print("SUMMARY")
print("="*70)

total = len(results)
passed = sum(1 for v in results.values() if v)
percentage = (passed / total * 100) if total > 0 else 0

print(f"Total Checks: {total}")
print(f"Passed: {passed}")
print(f"Failed: {total - passed}")
print(f"Success Rate: {percentage:.0f}%")
print()

if percentage == 100:
    print("🎉 ALL PREREQUISITES MET!")
    print("   You can now run: python test_diet_features.py")
elif percentage >= 80:
    print("⚠️  ALMOST READY - Minor fixes needed")
    print("   Check the failed items above")
elif percentage >= 50:
    print("⚠️  PARTIALLY READY - Some setup required")
    print("   Focus on failed services first")
else:
    print("❌ SETUP REQUIRED - Multiple components missing")
    print("   Please install missing components")

print()
print("Next Steps:")
if not results.get('mongodb'):
    print("   1. Start MongoDB service")
if not results.get('backend'):
    print("   2. Start Diet Agent backend: python run_diet_backend.py")
if not results.get('tesseract'):
    print("   3. Install Tesseract OCR")
if not results.get('mongodb_conn'):
    print("   4. Verify MongoDB is accessible")
if passed == total:
    print("   1. Add test data: python add_test_nutrition_data.py")
    print("   2. Run tests: python test_diet_features.py")

print()
print("="*70)
