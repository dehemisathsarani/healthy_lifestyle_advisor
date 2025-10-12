#!/usr/bin/env python3
"""
Port 8005 Binding Error Fix Script
Provides multiple solutions to resolve the "Address already in use" error
"""

import subprocess
import sys
import time
import psutil
import socket

def check_port_usage(port):
    """Check if a port is in use and by which process"""
    try:
        for conn in psutil.net_connections():
            if conn.laddr.port == port:
                try:
                    process = psutil.Process(conn.pid)
                    return {
                        'pid': conn.pid,
                        'name': process.name(),
                        'cmdline': ' '.join(process.cmdline()) if process.cmdline() else 'N/A'
                    }
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    return {'pid': conn.pid, 'name': 'Unknown', 'cmdline': 'Access Denied'}
        return None
    except Exception as e:
        print(f"Error checking port usage: {e}")
        return None

def kill_process_on_port(port):
    """Kill the process using the specified port"""
    usage = check_port_usage(port)
    if usage:
        try:
            process = psutil.Process(usage['pid'])
            process.terminate()
            process.wait(timeout=5)
            print(f"✅ Successfully terminated process {usage['pid']} ({usage['name']})")
            return True
        except psutil.TimeoutExpired:
            try:
                process.kill()
                print(f"✅ Force killed process {usage['pid']} ({usage['name']})")
                return True
            except Exception as e:
                print(f"❌ Failed to kill process: {e}")
                return False
        except Exception as e:
            print(f"❌ Error terminating process: {e}")
            return False
    else:
        print(f"✅ Port {port} is already free")
        return True

def find_free_port(start_port=8006, max_attempts=100):
    """Find the next available port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

def main():
    print("🔧 Port 8005 Binding Error Fix")
    print("=" * 50)
    
    # Check current port usage
    print("📊 Checking port 8005 usage...")
    usage = check_port_usage(8005)
    
    if usage:
        print(f"⚠️  Port 8005 is being used by:")
        print(f"   PID: {usage['pid']}")
        print(f"   Process: {usage['name']}")
        print(f"   Command: {usage['cmdline'][:100]}...")
        
        print("\n🎯 Solutions Available:")
        print("1. Kill the existing process (Recommended)")
        print("2. Use a different port")
        print("3. Check if it's a duplicate backend instance")
        
        choice = input("\nChoose solution (1/2/3): ").strip()
        
        if choice == "1":
            print(f"\n🔄 Terminating process {usage['pid']}...")
            if kill_process_on_port(8005):
                print("✅ Port 8005 is now free!")
                print("You can now start your backend with: python backend/main.py")
            else:
                print("❌ Failed to free port 8005")
                
        elif choice == "2":
            free_port = find_free_port()
            if free_port:
                print(f"\n✅ Found free port: {free_port}")
                print(f"Update your backend configuration to use port {free_port}")
                print(f"Example: uvicorn.run(app, host='127.0.0.1', port={free_port})")
            else:
                print("❌ No free ports found in range 8006-8106")
                
        elif choice == "3":
            print("\n🔍 Process Analysis:")
            if 'python' in usage['name'].lower():
                if 'main.py' in usage['cmdline'] or 'backend' in usage['cmdline']:
                    print("✅ This appears to be your backend already running!")
                    print("💡 Solution: Just use the existing backend instance")
                    print("   No need to start another one.")
                else:
                    print("⚠️  This is a different Python process")
                    print("   You may want to kill it and restart your backend")
            else:
                print("⚠️  Non-Python process using port 8005")
                print("   You may want to kill it or use a different port")
    else:
        print("✅ Port 8005 is free and ready to use!")
        print("You can start your backend with: python backend/main.py")

    print("\n" + "=" * 50)
    print("🎉 Port binding issue resolution complete!")

if __name__ == "__main__":
    main()