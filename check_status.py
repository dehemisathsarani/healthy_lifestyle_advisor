#!/usr/bin/env python3
"""
Project Status Checker - Verify what's running
"""
import requests
import subprocess
import sys

def check_port(port, service_name):
    """Check if a port is in use"""
    try:
        result = subprocess.run(['netstat', '-an'], capture_output=True, text=True)
        return f':{port}' in result.stdout
    except:
        return False

def check_url(url, timeout=3):
    """Check if a URL is accessible"""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except:
        return False

def main():
    print("🔍 Healthy Lifestyle Advisor - Project Status Check")
    print("=" * 60)
    
    services = [
        ("Backend API", "http://localhost:8000", 8000),
        ("Frontend Dev Server", "http://localhost:5173", 5173),
        ("Diet AI Service", "http://localhost:8001", 8001),
        ("Mental Health Frontend", "http://localhost:5175", 5175),
    ]
    
    print("\n📡 Service Status:")
    running_services = 0
    
    for name, url, port in services:
        port_in_use = check_port(port, name)
        url_accessible = check_url(url)
        
        if url_accessible:
            status = "✅ RUNNING"
            running_services += 1
        elif port_in_use:
            status = "🔄 STARTING"
        else:
            status = "❌ STOPPED"
            
        print(f"   {name:<25} {status:<12} {url}")
    
    print(f"\n📊 Summary: {running_services}/{len(services)} services running")
    
    # Check specific endpoints
    print("\n🧪 API Health Checks:")
    endpoints = [
        ("Backend Health", "http://localhost:8000/"),
        ("Mental Health API", "http://localhost:8000/api/mental-health/health"),
        ("API Documentation", "http://localhost:8000/docs"),
    ]
    
    for name, url in endpoints:
        accessible = check_url(url)
        status = "✅ OK" if accessible else "❌ FAIL"
        print(f"   {name:<20} {status}")
    
    print("\n" + "=" * 60)
    
    if running_services == 0:
        print("🚨 No services are currently running!")
        print("💡 Run 'start_project.bat' to start the project")
    elif running_services == 1:
        print("⚠️  Only backend is running. You need Node.js to start the frontend.")
        print("📥 Download Node.js from: https://nodejs.org/")
        print("🔧 Then run: cd frontend && npm install && npm run dev")
    else:
        print("🎉 Project is running successfully!")
        print("🌐 Visit: http://localhost:5173")

if __name__ == "__main__":
    main()
