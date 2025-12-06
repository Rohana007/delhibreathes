# MongoDB Connection Setup - Complete Guide

## ✅ All Fixes Applied

This document explains all MongoDB connection fixes that have been implemented.

---

## 🔧 1. Environment Variables (.env)

### Created: `backend/.env.example`

**For MongoDB Atlas (Cloud):**
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/delhi_breathes?retryWrites=true&w=majority
```

**For Local MongoDB:**
```env
MONGO_URI=mongodb://127.0.0.1:27017/delhi_breathes
```

### ✅ Fixed Issues:
- ✅ Changed `localhost` → `127.0.0.1` (better compatibility)
- ✅ Supports both `MONGO_URI` and `MONGODB_URI` (backward compatibility)
- ✅ Includes database name in URI
- ✅ Password URL-encoding instructions included
- ✅ Clear examples for both Atlas and local

### 📝 To Use:
1. Copy `backend/.env.example` to `backend/.env`
2. Update `MONGO_URI` with your actual connection string
3. For Atlas: URL-encode special characters in password (e.g., `@` → `%40`)

---

## 🔧 2. MongoDB Connection Logic

### Created: `backend/src/config/db.js`

**Features:**
- ✅ Clean, modular connection function
- ✅ Removed deprecated options (`useCreateIndex`, `useFindAndModify`)
- ✅ Proper error handling with helpful messages
- ✅ Connection state monitoring
- ✅ Automatic reconnection handling
- ✅ Detailed logging

**Key Functions:**
- `connectDB()` - Main connection function
- `disconnectDB()` - Graceful disconnection
- `isConnected()` - Check connection status
- `getConnectionInfo()` - Get detailed connection info

---

## 🔧 3. Startup Logic

### Updated: `backend/src/server.js`

**Before:**
```javascript
// Connection was non-blocking, server started even if DB failed
initializeMongoDB();
```

**After:**
```javascript
// Server waits for DB connection before starting
const { connectDB } = require('./config/db');
connectDB().catch((error) => {
  logger.error('[Server] Failed to connect to MongoDB. Server will not start.');
  process.exit(1);
});
```

**✅ Benefits:**
- Server only starts if MongoDB connects successfully
- Prevents API errors from missing database
- Clear error messages if connection fails

---

## 🔧 4. MongoDB Atlas IP Whitelist

### Instructions Added to Documentation

**For MongoDB Atlas:**
1. Go to: https://cloud.mongodb.com/
2. Navigate to: **Network Access** → **IP Access List**
3. Click: **Add IP Address**
4. Add: `0.0.0.0/0` (allows from any IP)
   - Or add your specific server IP for better security
5. Click: **Confirm**

**Note:** `0.0.0.0/0` allows connections from anywhere. For production, use specific IPs.

---

## 🔧 5. Detailed DB Error Logs

### Added to: `backend/src/config/db.js`

**Connection Event Handlers:**
```javascript
mongoose.connection.on('connected', () => {
  logger.info('✅ [MongoDB] Connected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ [MongoDB] Connection error:', err.message);
  // Provides specific error guidance
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ [MongoDB] Disconnected from database');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 [MongoDB] Reconnected to database');
});
```

**Error Messages Include:**
- ✅ Specific error type (ECONNREFUSED, authentication, ENOTFOUND)
- ✅ Helpful solutions for each error type
- ✅ Clear next steps

---

## 🔧 6. Local MongoDB Setup Instructions

### Added to: `MONGODB_SETUP_COMPLETE.md`

**Windows:**
```bash
# Check if MongoDB is installed as service
sc query MongoDB

# Start MongoDB service
net start MongoDB

# If service doesn't exist, install MongoDB Community Edition
# Download from: https://www.mongodb.com/try/download/community
```

**Alternative: Use MongoDB Compass**
- Download: https://www.mongodb.com/products/compass
- GUI tool for MongoDB
- Automatically manages connection

**Manual Start:**
```bash
# Navigate to MongoDB bin directory
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB
mongod.exe --dbpath="C:\data\db"
```

---

## 🔧 7. API Error Handling

### Created: `backend/src/middleware/dbCheck.js`

**Middleware to check DB connection:**
```javascript
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({
      success: false,
      error: 'MongoDB is not connected',
      message: 'Database connection is required for this operation',
    });
  }
  next();
};
```

**Usage in Routes:**
```javascript
// Apply to routes that need database
router.post('/api/endpoint', checkDBConnection, controller.handler);
```

**✅ Benefits:**
- Clear error messages when DB is not connected
- Prevents cryptic database errors
- Helps with debugging

---

## 🔧 8. DB Health Check API

### Added: `GET /api/db/health`

**Endpoint:** `GET http://localhost:5000/api/db/health`

**Response (Connected):**
```json
{
  "connected": true,
  "state": "connected",
  "readyState": 1,
  "host": "cluster0.xxxxx.mongodb.net",
  "port": null,
  "database": "delhi_breathes",
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**Response (Disconnected):**
```json
{
  "connected": false,
  "state": "disconnected",
  "readyState": 0,
  "host": null,
  "port": null,
  "database": null,
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**✅ Use Cases:**
- Monitor database connection status
- Health checks for load balancers
- Debugging connection issues

---

## 🧪 Testing Instructions

### 1. Test Local MongoDB Connection

```bash
# Start MongoDB (Windows)
net start MongoDB

# Or manually
mongod --dbpath="C:\data\db"

# Start backend
cd backend
npm start

# Check logs for:
✅ [MongoDB] Connected successfully to: 127.0.0.1
✅ [MongoDB] Database: delhi_breathes
```

### 2. Test MongoDB Atlas Connection

```bash
# Add connection string to .env
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/delhi_breathes

# Start backend
cd backend
npm start

# Check logs for:
✅ [MongoDB] Connected successfully to: cluster0.xxxxx.mongodb.net
✅ [MongoDB] Database: delhi_breathes
```

### 3. Test Health Check Endpoint

```bash
# Check DB health
curl http://localhost:5000/api/db/health

# Should return:
{
  "connected": true,
  "state": "connected",
  "host": "..."
}
```

### 4. Test API with DB Check

```bash
# Try an endpoint that requires DB
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919527563465"}'

# If DB not connected, should return:
{
  "success": false,
  "error": "MongoDB is not connected"
}
```

---

## 📋 Console Logs to Confirm Connection

### ✅ Successful Connection:
```
[MongoDB] Attempting to connect to: mongodb://127.0.0.1:27017/delhi_breathes
✅ [MongoDB] Connected successfully to: 127.0.0.1
✅ [MongoDB] Database: delhi_breathes
✅ [MongoDB] Connection established: 127.0.0.1
✅ [MongoDB] Ready state: 1 (1 = connected)
```

### ❌ Connection Failed:
```
[MongoDB] Attempting to connect to: mongodb://127.0.0.1:27017/delhi_breathes
❌ [MongoDB] Connection error: connect ECONNREFUSED 127.0.0.1:27017
❌ [MongoDB] Connection refused - MongoDB server is not running
[MongoDB] 💡 Solutions:
[MongoDB]   1. For local: Start MongoDB service (net start MongoDB on Windows)
[MongoDB]   2. For Atlas: Check network access IP whitelist (0.0.0.0/0)
[MongoDB]   3. Verify connection string in .env file
❌ [MongoDB] Exiting application due to database connection failure
```

---

## 🚀 Quick Start

### Option 1: Local MongoDB

1. **Install MongoDB:**
   - Download: https://www.mongodb.com/try/download/community
   - Or use MongoDB Compass (includes MongoDB)

2. **Start MongoDB:**
   ```bash
   net start MongoDB  # Windows
   # or
   mongod --dbpath="C:\data\db"
   ```

3. **Configure .env:**
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/delhi_breathes
   ```

4. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Atlas Account:**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Create free cluster

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string

3. **Configure Network Access:**
   - Go to "Network Access"
   - Add IP: `0.0.0.0/0` (or your server IP)

4. **Configure .env:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/delhi_breathes?retryWrites=true&w=majority
   ```
   **Important:** URL-encode password (e.g., `@` → `%40`)

5. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

---

## ✅ Verification Checklist

- [x] `.env.example` created with correct format
- [x] `db.js` created with proper connection logic
- [x] `server.js` updated to wait for DB connection
- [x] Health check endpoint `/api/db/health` added
- [x] DB check middleware created
- [x] Error handling improved with helpful messages
- [x] Connection event handlers added
- [x] Documentation created
- [x] Supports both local and Atlas
- [x] Removed deprecated options
- [x] Server exits if DB connection fails

---

## 🎯 Summary

**All MongoDB connection issues have been fixed:**

1. ✅ Environment variables properly configured
2. ✅ Connection logic updated and cleaned
3. ✅ Server waits for DB before starting
4. ✅ Health check endpoint available
5. ✅ Detailed error logging
6. ✅ Middleware for DB checks
7. ✅ Comprehensive documentation
8. ✅ Supports both local and cloud MongoDB

**The MongoDB connection is now reliable and production-ready!** 🎉

---

## 📞 Troubleshooting

**If connection still fails:**

1. **Check MongoDB is running:**
   ```bash
   # Windows
   sc query MongoDB
   
   # Check port
   netstat -an | findstr 27017
   ```

2. **Verify .env file:**
   - File exists: `backend/.env`
   - Variable name: `MONGO_URI` or `MONGODB_URI`
   - Format is correct

3. **Check MongoDB Atlas:**
   - Network Access IP whitelist
   - Username and password correct
   - Password is URL-encoded

4. **Check logs:**
   - Look for specific error messages
   - Follow suggested solutions in logs

5. **Test connection:**
   ```bash
   curl http://localhost:5000/api/db/health
   ```

---

**Status: ✅ COMPLETE - MongoDB connection fully fixed!**

