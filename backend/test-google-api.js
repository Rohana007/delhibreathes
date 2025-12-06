/**
 * Test script to verify Google Maps API key works with Directions API
 * Run with: node test-google-api.js
 */
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_MAPS_API_KEY not found in environment');
  process.exit(1);
}

console.log('🧪 Testing Google Maps Directions API...\n');
console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 6)}\n`);

// Test coordinates (Delhi to Noida)
const origin = '28.6139,77.2090';
const destination = '28.5355,77.3910';

const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('📡 API Response Status:', result.status);
      console.log('');
      
      if (result.status === 'OK') {
        console.log('✅ SUCCESS! Directions API is working correctly!');
        console.log(`   Found ${result.routes.length} route(s)`);
        if (result.routes.length > 0) {
          const route = result.routes[0];
          console.log(`   Distance: ${(route.legs[0].distance.value / 1000).toFixed(2)} km`);
          console.log(`   Duration: ${(route.legs[0].duration.value / 60).toFixed(1)} minutes`);
        }
        console.log('\n✅ Your API key is valid and Directions API is enabled!');
      } else if (result.status === 'REQUEST_DENIED') {
        console.error('❌ ERROR: REQUEST_DENIED');
        console.error(`   Message: ${result.error_message || 'No error message'}`);
        console.error('');
        console.error('🔧 FIXES:');
        console.error('   1. Go to Google Cloud Console: https://console.cloud.google.com/');
        console.error('   2. Select your project');
        console.error('   3. Go to "APIs & Services" → "Library"');
        console.error('   4. Search for "Directions API"');
        console.error('   5. Click "Enable"');
        console.error('   6. Wait 1-2 minutes for changes to propagate');
        console.error('');
        console.error('   OR check if your API key has restrictions:');
        console.error('   - Go to "APIs & Services" → "Credentials"');
        console.error('   - Click on your API key');
        console.error('   - Check "API restrictions" - make sure "Directions API" is allowed');
        console.error('   - Check "Application restrictions" - make sure your IP/server is allowed');
      } else if (result.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ ERROR: OVER_QUERY_LIMIT');
        console.error('   Your API quota has been exceeded');
        console.error('   Check your usage in Google Cloud Console');
      } else if (result.status === 'ZERO_RESULTS') {
        console.warn('⚠️  WARNING: ZERO_RESULTS');
        console.warn('   No routes found (this is unusual for Delhi to Noida)');
        console.warn('   The API key works, but no route was found');
      } else {
        console.error(`❌ ERROR: ${result.status}`);
        console.error(`   Message: ${result.error_message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
      console.error('Raw response:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('❌ Network error:', err.message);
});

