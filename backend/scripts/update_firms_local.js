/**
 * Updates local FIRMS VIIRS fire data from NASA FIRMS API
 * Downloads latest VIIRS data for Delhi bounding box (last 72 hours)
 * Writes to /data/firms_viirs_recent.json
 * 
 * Usage: node backend/scripts/update_firms_local.js
 * 
 * Note: Requires network access. If network unavailable, script will exit gracefully.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Delhi bounding box
const DELHI_BBOX = {
  north: 28.9,
  south: 28.4,
  east: 77.4,
  west: 77.0
};

// FIRMS API endpoint (VIIRS 375m)
const FIRMS_API_URL = 'https://firms.modaps.eosdis.nasa.gov/api/country/csv';

/**
 * Downloads FIRMS data for India (Delhi region)
 * Note: FIRMS API doesn't support direct bounding box, so we filter after download
 */
function downloadFIRMSData() {
  return new Promise((resolve, reject) => {
    const url = `${FIRMS_API_URL}/IND/VIIRS_SNPP_NRT/1`;
    
    console.log(`[FIRMS Update] Fetching data from: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parses CSV data and filters for Delhi region
 */
function parseAndFilterCSV(csvData) {
  const lines = csvData.split('\n');
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header
  const headers = lines[0].split(',');
  const latIdx = headers.findIndex(h => h.toLowerCase().includes('latitude'));
  const lngIdx = headers.findIndex(h => h.toLowerCase().includes('longitude'));
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('acq_date') || h.toLowerCase().includes('date'));
  const timeIdx = headers.findIndex(h => h.toLowerCase().includes('acq_time') || h.toLowerCase().includes('time'));
  const brightIdx = headers.findIndex(h => h.toLowerCase().includes('brightness') || h.toLowerCase().includes('confidence'));
  
  const fires = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    if (values.length < Math.max(latIdx, lngIdx, dateIdx) + 1) continue;
    
    const lat = parseFloat(values[latIdx]);
    const lng = parseFloat(values[lngIdx]);
    
    // Filter for Delhi bounding box
    if (lat >= DELHI_BBOX.south && lat <= DELHI_BBOX.north &&
        lng >= DELHI_BBOX.west && lng <= DELHI_BBOX.east) {
      
      const fire = {
        lat,
        lng,
        timestamp: values[dateIdx] ? `${values[dateIdx]}T${values[timeIdx] || '00:00'}:00` : new Date().toISOString(),
        intensity: brightIdx >= 0 ? parseFloat(values[brightIdx]) || 0.5 : 0.5,
        material: 'agricultural' // Default, could be enhanced with land use data
      };
      
      fires.push(fire);
    }
  }
  
  return fires;
}

/**
 * Main update function
 */
async function updateFIRMSLocal() {
  try {
    console.log('[FIRMS Update] Starting update...');
    
    // Check network availability
    if (process.env.ENABLE_NETWORK === 'false') {
      console.log('[FIRMS Update] Network disabled. Skipping update.');
      return;
    }
    
    // Download data
    const csvData = await downloadFIRMSData();
    console.log(`[FIRMS Update] Downloaded ${csvData.length} bytes`);
    
    // Parse and filter
    const fires = parseAndFilterCSV(csvData);
    console.log(`[FIRMS Update] Found ${fires.length} fires in Delhi region`);
    
    // Filter for last 72 hours
    const cutoffTime = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const recentFires = fires.filter(fire => {
      try {
        const fireTime = new Date(fire.timestamp);
        return fireTime >= cutoffTime;
      } catch {
        return true; // Include if timestamp parsing fails
      }
    });
    
    console.log(`[FIRMS Update] ${recentFires.length} fires in last 72 hours`);
    
    // Write to file
    const outputData = {
      meta: {
        source: 'NASA FIRMS VIIRS',
        lastUpdated: new Date().toISOString(),
        region: 'Delhi NCR',
        boundingBox: DELHI_BBOX,
        totalFires: recentFires.length,
        timeWindowHours: 72
      },
      fires: recentFires
    };
    
    const outputPath = path.join(__dirname, '../../data/firms_viirs_recent.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log(`[FIRMS Update] Successfully wrote ${recentFires.length} fires to ${outputPath}`);
    
  } catch (error) {
    console.error(`[FIRMS Update] Error: ${error.message}`);
    console.error('[FIRMS Update] Update failed. System will use fallback data.');
    process.exit(0); // Exit gracefully, don't crash
  }
}

// Run if called directly
if (require.main === module) {
  updateFIRMSLocal();
}

module.exports = { updateFIRMSLocal };

