"""
Quick Tesseract OCR installer for Windows
"""
import requests
import subprocess
import os
import zipfile
from pathlib import Path

def install_tesseract():
    print("🔧 Installing Tesseract OCR for Windows...")
    
    # Download Tesseract installer
    tesseract_url = "https://github.com/UB-Mannheim/tesseract/releases/download/v5.3.3.20231005/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
    installer_path = "tesseract_installer.exe"
    
    try:
        print("📥 Downloading Tesseract installer...")
        response = requests.get(tesseract_url, stream=True)
        response.raise_for_status()
        
        with open(installer_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print("✅ Download complete!")
        print(f"📁 Installer saved as: {installer_path}")
        print("\n🚀 Please run the installer manually:")
        print(f"   1. Double-click: {installer_path}")
        print("   2. Install to default location: C:\\Program Files\\Tesseract-OCR")
        print("   3. Add to PATH or restart backend")
        
        # Try to run installer
        try:
            subprocess.run([installer_path], check=False)
        except Exception as e:
            print(f"⚠️  Could not auto-run installer: {e}")
            print("Please run manually")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to download: {e}")
        return False

def check_tesseract():
    """Check if Tesseract is available"""
    try:
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Tesseract is already installed!")
            print(f"Version: {result.stdout.split()[1] if result.stdout else 'Unknown'}")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass
    
    print("❌ Tesseract not found in PATH")
    return False

if __name__ == "__main__":
    print("🔍 Checking Tesseract OCR installation...")
    
    if not check_tesseract():
        install_tesseract()
    else:
        print("🎉 Tesseract is ready to use!")