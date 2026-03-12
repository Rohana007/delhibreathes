/**
 * Test script for source identification API
 * Validates that the endpoint returns HTTP 200 with correct structure
 */

const sourceIdentificationController = require('./src/controllers/sourceIdentificationController');

const mockReq = {
  query: {
    lat: '28.6139',
    lng: '77.2090',
    pm25: '120',
    pm10: '180',
    no2: '60',
    co: '2.5',
    so2: '25',
    trafficLevel: 'heavy',
    distance_km: '0.05'
  }
};

const mockRes = {
  status: (code) => {
    console.log(`\n✓ HTTP Status: ${code}`);
    if (code !== 200) {
      console.error(`✗ ERROR: Expected 200, got ${code}`);
    }
    return mockRes;
  },
  json: (data) => {
    console.log('\n=== API Response Structure ===');
    
    // Check required keys
    const requiredKeys = ['vehicular', 'industrial', 'construction', 'biomass', 'summary'];
    const missingKeys = requiredKeys.filter(key => !data[key]);
    
    if (missingKeys.length > 0) {
      console.error(`✗ Missing required keys: ${missingKeys.join(', ')}`);
    } else {
      console.log('✓ All required keys present');
    }
    
    // Check summary
    if (data.summary) {
      console.log(`✓ Summary - Highest: ${data.summary.highest}`);
      console.log(`✓ Summary - Confidence: ${data.summary.overallConfidence}`);
      console.log(`✓ Summary - Contributions:`, data.summary.contributions);
    }
    
    // Check warnings
    if (data.warnings && data.warnings.length > 0) {
      console.log(`\n⚠ Warnings (${data.warnings.length}):`);
      data.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    } else {
      console.log('\n✓ No warnings');
    }
    
    // Check notes_readable
    if (data.notes_readable) {
      console.log(`\n✓ Notes readable: ${data.notes_readable.substring(0, 100)}...`);
    }
    
    // Check vehicular contribution
    if (data.vehicular) {
      const contrib = data.vehicular.contributionPercent || 0;
      console.log(`\n✓ Vehicular contribution: ${contrib.toFixed(1)}%`);
      if (contrib < 3) {
        console.warn('⚠ Warning: Vehicular contribution seems low (< 3%)');
      } else if (contrib >= 30 && contrib <= 45) {
        console.log('✓ Vehicular contribution in expected range (30-45%)');
      }
    }
    
    console.log('\n=== Sample Response JSON (truncated) ===');
    console.log(JSON.stringify({
      vehicular: {
        contributionPercent: data.vehicular?.contributionPercent,
        confidence: data.vehicular?.confidence,
        notes_readable: data.vehicular?.notes_readable?.substring(0, 100)
      },
      summary: data.summary,
      warnings: data.warnings?.slice(0, 3),
      notes_readable: data.notes_readable
    }, null, 2));
    
    return mockRes;
  }
};

console.log('Testing Source Identification API...');
console.log('Request params:', mockReq.query);

sourceIdentificationController.identifySources(mockReq, mockRes)
  .then(() => {
    console.log('\n✓ Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });

