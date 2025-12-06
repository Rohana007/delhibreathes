/**
 * Database indexes for reports collection
 * Run this script to create indexes: node backend/scripts/create-indexes.js
 */

const mongoose = require('mongoose');
const Report = require('../src/models/Report');

async function createIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/delhi_breathes';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Indexes are already defined in the schema, but we can ensure they exist
    const collection = mongoose.connection.db.collection('reports');
    
    console.log('Creating indexes...');
    
    // Ensure idempotency_key index (sparse, non-unique)
    await collection.createIndex({ idempotency_key: 1 }, { unique: false, sparse: true });
    console.log('✓ Created index on idempotency_key');
    
    // Ensure userId index
    await collection.createIndex({ userId: 1 });
    console.log('✓ Created index on userId');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('\nAll indexes on reports collection:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✓ All indexes created successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();

