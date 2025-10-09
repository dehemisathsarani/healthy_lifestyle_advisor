# 🔧 ASGI App Loading Error - Solutions

**Error**: `ERROR: Error loading ASGI app. Could not import module "main".`

## 🎯 Root Cause
This error occurs when:
1. Running uvicorn from wrong directory
2. Incorrect module path in uvicorn command
3. Missing Python path configuration
4. Virtual environment not activated

---

## ✅ Solution 1: Direct Python Execution (RECOMMENDED)

### From Project Root:
```powershell
cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor
.\.venv\Scripts\python.exe backend\main.py
```

### From Backend Directory:
```powershell
cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor\backend
..\.venv\Scripts\python.exe main.py
```

**Why this works**: Runs main.py directly using the virtual environment Python.

---

## ✅ Solution 2: Correct Uvicorn Commands

### From Project Root (healthy_lifestyle_advisor/):
```powershell
# Method A: Using module path
.\.venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8005

# Method B: Change to backend dir first
cd backend
..\.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8005
```

### From Backend Directory (backend/):
```powershell
# Only this works from backend directory
..\.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8005
```

---

## ❌ Common Mistakes That Cause the Error

### Wrong Commands:
```powershell
# ❌ From project root without backend prefix
uvicorn main:app                           # Can't find main module

# ❌ From backend directory with backend prefix  
uvicorn backend.main:app                   # backend module doesn't exist here

# ❌ Without virtual environment
uvicorn main:app                           # Wrong Python/dependencies

# ❌ Wrong working directory
cd some_other_directory
uvicorn main:app                           # main.py not found
```

---

## 🔍 Troubleshooting Steps

### Step 1: Verify File Structure
```
healthy_lifestyle_advisor/
├── .venv/                    ← Virtual environment
├── backend/
│   ├── main.py              ← ASGI app file
│   ├── app/
│   │   ├── __init__.py
│   │   └── ...
│   └── requirements.txt
└── frontend/
```

### Step 2: Check Current Directory
```powershell
# Should show: ...\healthy_lifestyle_advisor
pwd

# Or: ...\healthy_lifestyle_advisor\backend
pwd
```

### Step 3: Verify Virtual Environment
```powershell
# Check if .venv exists
dir .venv\Scripts\python.exe

# Should show Python executable
```

### Step 4: Test Python Import
```powershell
# From project root
.\.venv\Scripts\python.exe -c "import backend.main; print('Import successful')"

# From backend directory  
..\.venv\Scripts\python.exe -c "import main; print('Import successful')"
```

---

## 🚀 Quick Fix Commands

### Option A: Restart Backend (Recommended)
```powershell
# 1. Stop any running backend (Ctrl+C if running)

# 2. Navigate to project root
cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor

# 3. Start backend using direct Python execution
.\.venv\Scripts\python.exe backend\main.py
```

### Option B: Using Uvicorn Properly
```powershell
# 1. From project root
cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor
.\.venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8005

# 2. OR from backend directory
cd backend
..\.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8005
```

---

## 📋 Batch Files (For Easy Starting)

### Create start_backend_correct.bat in project root:
```batch
@echo off
cd /d "C:\Users\Asus\Desktop\healthy_lifestyle_advisor"
echo Starting backend server on port 8005...
".\.venv\Scripts\python.exe" "backend\main.py"
pause
```

### Create start_backend_uvicorn.bat in project root:
```batch
@echo off
cd /d "C:\Users\Asus\Desktop\healthy_lifestyle_advisor"
echo Starting backend with uvicorn on port 8005...
".\.venv\Scripts\uvicorn" backend.main:app --host 127.0.0.1 --port 8005
pause
```

---

## 🔧 Fix for Existing Batch Files

If you have existing batch files that aren't working, update them:

### Update start_backend.bat:
```batch
@echo off
cd /d "C:\Users\Asus\Desktop\healthy_lifestyle_advisor"
echo Starting backend server...
".\.venv\Scripts\python.exe" "backend\main.py"
pause
```

---

## ⚡ Immediate Action

### Try this command right now:
```powershell
cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor
.\.venv\Scripts\python.exe backend\main.py
```

### Expected Output:
```
🚀 Starting Health Agent API...
✅ MongoDB connection established successfully!
📁 Connected to database: HealthAgent
📊 Collections found: 26
✅ Application startup completed successfully
🌐 API Documentation available at: http://localhost:8000/docs
✅ User collection setup complete
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8005 (Press CTRL+C to quit)
```

---

## 🎯 Key Points to Remember

1. **Always use virtual environment**: `.\.venv\Scripts\python.exe`
2. **Correct working directory**: Project root or backend directory
3. **Correct module path**: 
   - From root: `backend.main:app`
   - From backend: `main:app`
4. **Port consistency**: Use port 8005 (configured in main.py)

---

## 🛡️ What This Doesn't Break

✅ **Existing functionality preserved**:
- All API endpoints remain the same
- Database connections unchanged  
- Mental Health features intact
- Authentication still works
- Frontend integration maintained
- Port 8005 configuration preserved

✅ **No code changes needed** - just correct startup commands!

---

## 📝 Summary

**Problem**: Incorrect uvicorn module path  
**Solution**: Use correct working directory and module path  
**Quick Fix**: `python backend\main.py` from project root  
**Long-term**: Create proper batch files with correct paths

The error is purely about how the backend is started, not the code itself. All functionality remains intact! 🎉