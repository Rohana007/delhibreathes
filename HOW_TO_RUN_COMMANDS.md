# Where to Run Commands - Step by Step Guide

## 📍 Where to Run Commands

All commands should be run in **Command Prompt (CMD)** or **PowerShell** on Windows.

---

## 🚀 Quick Start - Step by Step

### Step 1: Open Command Prompt or PowerShell

**Option A: Command Prompt**
- Press `Windows Key + R`
- Type `cmd` and press Enter
- Or search "Command Prompt" in Start Menu

**Option B: PowerShell**
- Press `Windows Key + X`
- Select "Windows PowerShell" or "Terminal"
- Or search "PowerShell" in Start Menu

---

### Step 2: Navigate to Your Project Folder

In the Command Prompt/PowerShell window, type:

```bash
cd "D:\New folder\delhi-breathes - Copy"
```

Press Enter. You should see the path change in your terminal.

---

### Step 3: Start MongoDB (Requires Admin)

**Important:** MongoDB command needs Administrator privileges.

**Option A: Run as Administrator**
1. Right-click on "Command Prompt" or "PowerShell"
2. Select "Run as Administrator"
3. Then run:
   ```bash
   net start MongoDB
   ```

**Option B: Check if MongoDB is already running**
```bash
sc query MongoDB
```

If it shows "RUNNING", you can skip this step!

---

### Step 4: Start All Servers

You have **3 options**:

#### Option 1: Use Batch Script (Easiest - Opens Separate Windows)

In your Command Prompt/PowerShell (in project folder):
```bash
start_all_servers.bat
```

This opens 2 separate windows for the FastAPI servers.

**Then separately start Node.js backend:**
Open a NEW Command Prompt/PowerShell window:
```bash
cd "D:\New folder\delhi-breathes - Copy\backend"
npm run dev
```

---

#### Option 2: Manual Start (3 Separate Terminal Windows)

**Terminal Window 1 - Node.js Backend:**
```bash
cd "D:\New folder\delhi-breathes - Copy\backend"
npm run dev
```

**Terminal Window 2 - Gamification Server:**
```bash
cd "D:\New folder\delhi-breathes - Copy"
python gamification_server.py
```

**Terminal Window 3 - ML/AQI Server:**
```bash
cd "D:\New folder\delhi-breathes - Copy\aqi-forecasting"
python run_api.py
```

---

#### Option 3: All in One (Using Background Processes)

In a single Command Prompt/PowerShell:
```bash
# Navigate to project
cd "D:\New folder\delhi-breathes - Copy"

# Start Node.js backend (in background)
start "Node.js Backend" cmd /k "cd backend && npm run dev"

# Start Gamification server (in background)
start "Gamification Server" cmd /k "python gamification_server.py"

# Start ML server (in background)
start "ML Server" cmd /k "cd aqi-forecasting && python run_api.py"
```

This opens 3 separate windows automatically.

---

## 📋 Complete Example Session

Here's what a complete session looks like:

```bash
# 1. Open Command Prompt (as Admin for MongoDB)
# 2. Navigate to project
cd "D:\New folder\delhi-breathes - Copy"

# 3. Check/Start MongoDB (if needed)
sc query MongoDB
# If not running:
net start MongoDB

# 4. Start servers (choose one method above)
start_all_servers.bat

# 5. In a NEW terminal, start Node.js backend
cd "D:\New folder\delhi-breathes - Copy\backend"
npm run dev
```

---

## ✅ Verify Servers Are Running

In any Command Prompt/PowerShell window (in project folder):
```bash
python check_servers.py
```

Or test manually:
```bash
# Test Node.js backend
curl http://localhost:5000/api/health

# Test Gamification server
curl http://localhost:8000/

# Test ML server
curl http://localhost:8001/
```

---

## 🖥️ Visual Guide

```
┌─────────────────────────────────────┐
│   Command Prompt / PowerShell       │
│   (Run commands here)               │
│                                     │
│   D:\New folder\delhi-breathes...> │
│   python gamification_server.py     │
│   [Server output appears here]      │
└─────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Keep Terminal Windows Open** - Don't close the terminal windows while servers are running
2. **MongoDB First** - Always start MongoDB before FastAPI servers
3. **Project Folder** - Make sure you're in the correct folder before running commands
4. **Admin Rights** - MongoDB start command needs Administrator privileges

---

## 🆘 Troubleshooting

### "Command not found" or "not recognized"
- Make sure you're in the correct folder
- Check Python/Node.js are installed: `python --version` and `node --version`

### "Access Denied" for MongoDB
- Run Command Prompt as Administrator
- Or check if MongoDB is already running: `sc query MongoDB`

### Port already in use
- Check what's using the port: `netstat -ano | findstr :8000`
- Kill the process or use a different port

---

## 📍 Summary

**Where:** Command Prompt or PowerShell  
**Starting Location:** `D:\New folder\delhi-breathes - Copy`  
**Commands:** Run the commands shown above in that terminal window

That's it! All commands go in your terminal/command prompt window.

