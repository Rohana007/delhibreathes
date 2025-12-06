/**
 * Script to check environment variables for Safe Route service
 * Run with: node check-env.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('\n🔍 Checking backend/.env configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: backend/.env file not found!');
  console.error(`   Expected location: ${envPath}`);
  process.exit(1);
}

console.log('✅ backend/.env file exists');

// Check GOOGLE_MAPS_API_KEY
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  console.error('\n❌ ERROR: GOOGLE_MAPS_API_KEY is not set in backend/.env');
  console.error('   Please add: GOOGLE_MAPS_API_KEY=your-api-key-here');
  process.exit(1);
}

const apiKeyTrimmed = apiKey.trim();
if (!apiKeyTrimmed) {
  console.error('\n❌ ERROR: GOOGLE_MAPS_API_KEY is empty (only whitespace)');
  console.error('   Please check your .env file for extra spaces or quotes');
  process.exit(1);
}

console.log('✅ GOOGLE_MAPS_API_KEY is set');
console.log(`   Length: ${apiKeyTrimmed.length} characters`);
console.log(`   Starts with: ${apiKeyTrimmed.substring(0, 6)}...`);
console.log(`   Ends with: ...${apiKeyTrimmed.substring(apiKeyTrimmed.length - 6)}`);

// Check if it looks like a valid Google API key
if (!apiKeyTrimmed.startsWith('AIza')) {
  console.warn('\n⚠️  WARNING: API key does not start with "AIza"');
  console.warn('   Google API keys typically start with "AIza"');
  console.warn('   Please verify you have the correct key');
}

// Check other required variables
console.log('\n📋 Other Safe Route variables:');
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log(`   MONGO_URI: ${mongoUri ? '✅ SET' : '⚠️  NOT SET (using default)'}`);

const redisUrl = process.env.REDIS_URL;
console.log(`   REDIS_URL: ${redisUrl ? '✅ SET' : '⚠️  NOT SET (using default)'}`);

// Check for common issues
console.log('\n🔍 Checking for common issues...');

// Check if key has quotes
if (apiKeyTrimmed.startsWith('"') || apiKeyTrimmed.startsWith("'")) {
  console.error('❌ ERROR: API key appears to have quotes around it');
  console.error('   Remove quotes from .env file');
  console.error('   Wrong: GOOGLE_MAPS_API_KEY="AIza..."');
  console.error('   Right: GOOGLE_MAPS_API_KEY=AIza...');
  process.exit(1);
}

// Check if key has spaces
if (apiKey !== apiKeyTrimmed) {
  console.warn('⚠️  WARNING: API key has leading/trailing spaces');
  console.warn('   The key will be trimmed automatically, but remove spaces from .env file');
}

// Read .env file to check format
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  let found = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('GOOGLE_MAPS_API_KEY')) {
      found = true;
      console.log(`\n📝 Found in .env file (line ${i + 1}):`);
      
      // Check for common issues
      if (line.includes(' = ')) {
        console.warn('   ⚠️  WARNING: Has spaces around = sign');
        console.warn('   Should be: GOOGLE_MAPS_API_KEY=value (no spaces)');
      }
      
      if (line.includes('"') || line.includes("'")) {
        console.warn('   ⚠️  WARNING: Has quotes around value');
        console.warn('   Should be: GOOGLE_MAPS_API_KEY=value (no quotes)');
      }
      
      // Show the line (masked)
      const masked = line.replace(/=(.+)/, '=' + apiKeyTrimmed.substring(0, 10) + '...' + apiKeyTrimmed.substring(apiKeyTrimmed.length - 6));
      console.log(`   ${masked}`);
      break;
    }
  }
  
  if (!found) {
    console.error('❌ ERROR: GOOGLE_MAPS_API_KEY not found in .env file');
    console.error('   Please add it to backend/.env');
  }
} catch (error) {
  console.warn('⚠️  Could not read .env file to check format:', error.message);
}

console.log('\n✅ Environment check complete!\n');
console.log('💡 Next steps:');
console.log('   1. If all checks passed, restart your backend: npm run dev');
console.log('   2. Test the debug endpoint: http://localhost:5000/api/safe-route/debug');
console.log('   3. Make sure Directions API is enabled in Google Cloud Console\n');

