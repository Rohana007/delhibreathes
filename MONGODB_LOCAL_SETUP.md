# 🗄️ MongoDB Local Setup Guide

## Quick Start

### Step 1: Find MongoDB Installation

MongoDB is typically installed in one of these locations:
- `C:\Program Files\MongoDB\Server\[version]\bin\mongod.exe`
- `C:\mongodb\bin\mongod.exe`
- Custom installation path

### Step 2: Start MongoDB (Choose One Method)

#### Method 1: Start as Windows Service (Recommended)
```powershell
# Run PowerShell as Administrator
net start MongoDB
```

#### Method 2: Start Manually (If not installed as service)
```powershell
# Navigate to MongoDB bin directory
cd "C:\Program Files\MongoDB\Server\[version]\bin"

# Start MongoDB (default port 27017)
.\mongod.exe --dbpath "C:\data\db"
```

**Note:** Create the data directory first if it doesn't exist:
```powershell
mkdir C:\data\db
```

#### Method 3: Add to PATH and Start
```powershell
# Add MongoDB to PATH (temporary for this session)
$env:Path += ";C:\Program Files\MongoDB\Server\[version]\bin"

# Start MongoDB
mongod --dbpath "C:\data\db"
```

### Step 3: Verify MongoDB is Running

```powershell
# Check if MongoDB is listening on port 27017
Test-NetConnection -ComputerName localhost -Port 27017

# Or try connecting with mongo shell
mongo
# Or if using MongoDB 6.0+
mongosh
```

### Step 4: Configure Backend

Your backend is already configured to use local MongoDB by default:
- **Default URI:** `mongodb://127.0.0.1:27017/delhi_breathes`

**Option 1: Use Default (No .env needed)**
- Backend will automatically use local MongoDB

**Option 2: Set in .env (Explicit)**
Create or update `backend/.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/delhi_breathes
```

### Step 5: Test Connection

```powershell
cd backend
node test-mongodb-connection.js
```

Or start your backend server:
```powershell
cd backend
npm start
```

You should see:
```
✅ [MongoDB] Connected successfully to: 127.0.0.1
✅ [MongoDB] Database: delhi_breathes
```

## 🔧 Troubleshooting

### MongoDB Not Found
**Error:** `mongod : The term 'mongod' is not recognized`

**Solution:**
1. Find MongoDB installation path
2. Add to PATH or use full path
3. Or install MongoDB as Windows service

### Port Already in Use
**Error:** `Port 27017 is already in use`

**Solution:**
```powershell
# Check what's using the port
netstat -ano | findstr :27017

# Stop MongoDB service
net stop MongoDB

# Or kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F
```

### Cannot Create Data Directory
**Error:** `Failed to create data directory`

**Solution:**
```powershell
# Create data directory
mkdir C:\data\db

# Or use custom path
mongod --dbpath "D:\mongodb-data"
```

### Permission Denied
**Error:** `Access denied` or `Permission denied`

**Solution:**
- Run PowerShell/Command Prompt as Administrator
- Or change data directory to a location you have write access to

## 📋 Install MongoDB as Windows Service

If MongoDB is not installed as a service:

```powershell
# Run as Administrator
cd "C:\Program Files\MongoDB\Server\[version]\bin"

# Install as service
.\mongod.exe --install --serviceName "MongoDB" --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log"

# Start the service
net start MongoDB
```

## 🎯 Quick Commands Reference

```powershell
# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB

# Check MongoDB status
Get-Service MongoDB

# Connect to MongoDB shell
mongosh
# Or (older versions)
mongo

# Test connection
Test-NetConnection localhost -Port 27017
```

## ✅ Verification Checklist

- [ ] MongoDB is installed
- [ ] MongoDB service is running OR mongod.exe is running
- [ ] Port 27017 is accessible
- [ ] Data directory exists (C:\data\db or custom)
- [ ] Backend .env has MONGO_URI (or uses default)
- [ ] Backend can connect to MongoDB

## 🚀 Next Steps

Once MongoDB is running:

1. **Start Backend:**
   ```powershell
   cd backend
   npm start
   ```

2. **Verify Connection:**
   - Check backend logs for MongoDB connection success
   - Backend should show: `✅ [MongoDB] Connected successfully`

3. **Test Firebase OTP:**
   - Start frontend
   - Try OTP authentication
   - User should be created in MongoDB automatically

---

**Need Help?** Check MongoDB logs at `C:\data\log\mongod.log` for detailed error messages.

