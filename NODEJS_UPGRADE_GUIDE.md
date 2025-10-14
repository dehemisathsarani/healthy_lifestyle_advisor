# Node.js Upgrade Guide - Fix Version Warning

## Current Issue
Your Node.js version is **v22.11.0**, but Vite requires **v22.12+** to eliminate the warning.

## ✅ Solution - Node.js v22.12.0 Installed!

The Node.js v22.12.0 installer has been downloaded to:
```
C:\Users\Asus\AppData\Local\Temp\nodejs-22.12.0-installer.msi
```

## Installation Steps

### Option 1: Manual Installation (Recommended)
1. **Open File Explorer** (already opened for you)
2. **Navigate to** `C:\Users\Asus\AppData\Local\Temp\`
3. **Double-click** `nodejs-22.12.0-installer.msi`
4. **Follow the installer** - click Next → Accept → Install
5. **Restart your terminals** after installation completes

### Option 2: PowerShell Installation (Run as Administrator)
```powershell
# Run PowerShell as Administrator, then execute:
Start-Process msiexec.exe -ArgumentList "/i", "C:\Users\Asus\AppData\Local\Temp\nodejs-22.12.0-installer.msi" -Wait
```

### Option 3: Use Node Version Manager (nvm-windows)
If you prefer managing multiple Node.js versions:
```bash
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
nvm install 22.12.0
nvm use 22.12.0
```

## Verification

After installation, close ALL terminals and open a new one, then run:
```bash
node --version
# Should show: v22.12.0 or higher
```

## What This Fixes
- ✅ Eliminates the Vite warning: "You are using Node.js 22.11.0. Vite requires Node.js version 20.19+ or 22.12+"
- ✅ Ensures compatibility with the latest Vite features
- ✅ Future-proofs your development environment

## After Installation
1. **Close all terminal windows** (important!)
2. **Restart VS Code** (optional but recommended)
3. **Navigate to your project**:
   ```bash
   cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor
   ```
4. **Restart the frontend**:
   ```bash
   .\start_frontend.bat
   ```
5. **Verify** - The warning should be gone!

## Troubleshooting

### If node --version still shows v22.11.0:
1. Close ALL terminal windows
2. Restart VS Code completely
3. Open a NEW terminal
4. Run `node --version` again

### If PATH issues persist:
The installer should have updated your PATH automatically. If not:
1. Open System Environment Variables
2. Ensure `C:\Program Files\nodejs` is in your PATH
3. Restart your computer if needed

---

**Note**: The installer was successfully downloaded. Simply double-click it in the temp folder to complete the installation!
