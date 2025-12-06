# MongoDB Connection Troubleshooting

## Error: "Operation `users.findOne()` buffering timed out after 10000ms"

This error means MongoDB is not connected or not accessible.

## Quick Fixes

### 1. Check if MongoDB is Running

**Windows:**
```bash
# Check if MongoDB service is running
sc query MongoDB

# Start MongoDB service if not running
net start MongoDB
```

**macOS/Linux:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb
# or
sudo systemctl status mongod

# Start MongoDB if not running
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### 2. Verify MongoDB Connection String

Check your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/delhi_breathes
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delhi_breathes
```

### 3. Test MongoDB Connection

**Using MongoDB Shell:**
```bash
mongosh mongodb://localhost:27017/delhi_breathes
```

**Using Node.js:**
```javascript
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/delhi_breathes')
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Error:', err));
```

### 4. Check Server Logs

Look for these messages in your server console:
- ✅ `[MongoDB] Connected to database` - Connection successful
- ❌ `[MongoDB] Connection error` - Connection failed
- ⚠️ `[MongoDB] Disconnected from database` - Connection lost

### 5. Common Issues

**Issue: MongoDB not installed**
- Download from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

**Issue: Wrong port**
- Default MongoDB port: `27017`
- Check if another service is using this port

**Issue: Firewall blocking**
- Allow MongoDB through Windows Firewall
- Check if port 27017 is open

**Issue: MongoDB service not started**
- Start the MongoDB service manually
- Set it to start automatically on boot

### 6. Verify Connection in Code

The server now includes connection checks. If you see:
- `MongoDB connection not available` - MongoDB is not connected
- `Operation buffering timed out` - MongoDB connection is taking too long

## Testing Connection

1. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

2. **Start your backend server:**
   ```bash
   npm start
   ```

3. **Check server logs for:**
   ```
   [MongoDB] Connecting to database...
   [MongoDB] Connected to database: mongodb://localhost:27017/delhi_breathes
   ```

4. **Test an API endpoint:**
   ```bash
   GET http://localhost:5000/api/alerts/status/9876543210
   ```

## Still Having Issues?

1. **Check MongoDB logs:**
   - Windows: `C:\Program Files\MongoDB\Server\{version}\log\mongod.log`
   - macOS: `/usr/local/var/log/mongodb/mongo.log`
   - Linux: `/var/log/mongodb/mongod.log`

2. **Try connecting with MongoDB Compass:**
   - Download: https://www.mongodb.com/products/compass
   - Connect to: `mongodb://localhost:27017`

3. **Use MongoDB Atlas (Cloud) as alternative:**
   - Free tier available
   - No local installation needed
   - Update `MONGODB_URI` in `.env` with Atlas connection string

## Connection Status Endpoint

You can check MongoDB connection status by looking at server logs when the server starts. The connection check is now built into all database queries, so you'll get clearer error messages if MongoDB is not available.

