/**
 * MongoDB Connection Test Script
 * Run this to test MongoDB connection without starting the full server
 * 
 * Usage: node test-mongodb-connection.js
 */

require('dotenv').config();
const { connectDB, getConnectionInfo, disconnectDB } = require('./src/config/db');

async function testConnection() {
  console.log('\n🧪 Testing MongoDB Connection...\n');
  
  try {
    // Attempt connection
    await connectDB();
    
    // Get connection info
    const info = getConnectionInfo();
    
    console.log('✅ MongoDB Connection Successful!\n');
    console.log('Connection Details:');
    console.log('  - Connected:', info.connected);
    console.log('  - State:', info.state);
    console.log('  - Host:', info.host || 'N/A');
    console.log('  - Port:', info.port || 'N/A');
    console.log('  - Database:', info.name || 'N/A');
    console.log('  - Ready State:', info.readyState, '(1 = connected)\n');
    
    // Test a simple query
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available Collections:', collections.length);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n✅ All tests passed! MongoDB is ready to use.\n');
    
    // Disconnect
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check if MongoDB is running');
    console.error('  2. Verify MONGO_URI in .env file');
    console.error('  3. For Atlas: Check network access IP whitelist');
    console.error('  4. For local: Start MongoDB service (net start MongoDB)\n');
    process.exit(1);
  }
}

// Run test
testConnection();

