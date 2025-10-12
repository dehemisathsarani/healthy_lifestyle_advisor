#!/usr/bin/env python3
"""
Start the enhanced backend server for frontend testing
"""

import subprocess
import sys
import os

def start_backend_server():
    """Start the FastAPI backend server"""
    print("🚀 Starting Enhanced Three-Step OTP Backend Server")
    print("=" * 50)
    
    backend_dir = os.path.join(os.path.dirname(__file__))
    
    try:
        print("📍 Starting server on http://127.0.0.1:8000")
        print("📚 API Documentation: http://127.0.0.1:8000/docs")
        print("🔄 Auto-reload enabled for development")
        print()
        print("🌟 Enhanced Features Available:")
        print("   ✅ Three-step OTP workflow")
        print("   ✅ Email validation")
        print("   ✅ Enhanced email templates")
        print("   ✅ Better error handling")
        print("   ✅ Improved user experience")
        print()
        print("Press CTRL+C to stop the server...")
        print("-" * 50)
        
        # Start the server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "127.0.0.1", 
            "--port", "8000", 
            "--reload",
            "--log-level", "info"
        ], cwd=backend_dir, check=True)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    start_backend_server()