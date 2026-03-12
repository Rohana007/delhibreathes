/**
 * Biomass Burning Pollution Source Identification Engine
 * Implements biomass burning calculation using NASA FIRMS data
 * 
 * Formula: fireIntensity × materialFactor × frequency × proximityFactor × validationWeight(NASA)
 * 
 * If no FIRMS data is available, returns safe defaults (score: 0, confidence: 0.3)
 */

const utils = require('./utils');
const fs = require('fs');
const path = require('path');

// Material factors for different biomass types
const MATERIAL_FACTORS = {
  'agricultural': 1.5,  // Crop residue burning
  'forest': 1.2,       // Forest fires
  'waste': 1.8,        // Waste burning (higher PM2.5)
  'default': 1.5
};

/**
 * Loads FIRMS data from file (if available)
 * Expected format: JSON array with fire hotspots
 * @param {string} filePath - Path to FIRMS data file
 * @returns {Array} - Array of fire hotspots or empty array
 */
function loadFIRMSData(filePath) {
  try {
    // Try to load from data directory
    const fullPath = path.join(__dirname, '../../../..', filePath || 'data/firmsData.json');
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Generates mock FIRMS data for testing/demo
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Search radius
 * @returns {Array} - Mock fire hotspots
 */
function generateMockFIRMSData(lat, lng, radiusKm) {
  try {
    // Generate 0-2 mock fires within radius
    const mockFires = [];
    const fireCount = Math.floor(Math.random() * 3); // 0, 1, or 2 fires
    
    for (let i = 0; i < fireCount; i++) {
      // Random offset within radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;
      const latOffset = (distance / 111) * Math.cos(angle); // ~111 km per degree
      const lngOffset = (distance / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
      
      mockFires.push({
        lat: lat + latOffset,
        lng: lng + lngOffset,
        intensity: 0.5 + Math.random() * 0.5, // 0.5 to 1.0
        material: ['agricultural', 'waste', 'forest'][Math.floor(Math.random() * 3)],
        timestamp: new Date().toISOString()
      });
    }
    
    return mockFires;
  } catch (error) {
    return [];
  }
}

/**
 * Calculates proximity factor for fire hotspots
 * Closer fires have higher impact
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Proximity factor (0 to 1)
 */
function fireProximityFactor(distanceKm) {
  try {
    return utils.distanceDecay(distanceKm);
  } catch (error) {
    return 0.5;
  }
}

/**
 * Calculates biomass burning pollution contribution score
 * @param {Object} params - Input parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {Object} params.validationWeights - Validation weights (optional, loaded if not provided)
 * @param {Array} params.firmsData - FIRMS fire data (optional, loaded if not provided)
 * @param {number} params.searchRadiusKm - Search radius in km (default: 10)
 * @param {boolean} params.useMockData - Use mock data if real data unavailable (default: true)
 * @returns {Object} - { score, breakdown, confidence, warnings }
 */
function calculateBurningContribution(params = {}) {
  const warnings = [];
  
  try {
    // Load calibration baselines
    const calibrationBaselines = params.calibrationBaselines || utils.loadJSONSafe('data/calibration_baselines.json', {});
    
    // Validate inputs
    const lat = utils.safeNumber(params.lat, 28.6139);
    const lng = utils.safeNumber(params.lng, 77.2090);
    const searchRadiusKm = utils.safeNumber(params.searchRadiusKm, 10);
    const windowHours = utils.safeNumber(params.windowHours, 72);
    
    // Extract AQI data for burning pattern detection
    const aqi = params.aqi || {};
    const co = utils.safeNumber(aqi.co, 0);
    const pm25 = utils.safeNumber(aqi.pm25, 0);
    const pm10 = utils.safeNumber(aqi.pm10, 0);
    
    // Try to load FIRMS data using robust loader
    const firmsResult = utils.loadFIRMS(lat, lng, windowHours);
    let firmsData = firmsResult.fires;
    if (firmsResult.warnings && firmsResult.warnings.length > 0) {
      warnings.push(...firmsResult.warnings);
    }
    
    // If no FIRMS data, check for burning pattern from AQI signatures
    let estimatedBurningScore = 0;
    let hasBurningSignal = false;
    
    if ((!firmsData || firmsData.length === 0) && (co > 0 || pm25 > 0)) {
      // Check for CO and PM spike pattern indicating burning
      const coBaseline = 1.0;
      const pmBaseline = 50;
      const coRise = Math.max(0, co - coBaseline);
      const pmRise = Math.max(0, pm25 - pmBaseline);
      
      // If CO rise >> baseline and PM rise high, estimate burning
      if (coRise > coBaseline * 2 && pmRise > pmBaseline * 0.5) {
        hasBurningSignal = true;
        estimatedBurningScore = (coRise / coBaseline) * 0.1 + (pmRise / pmBaseline) * 0.2;
        warnings.push('no_firms_data_but_burning_signal_detected');
      }
    }
    
    // If still no data and no signal, return safe defaults
    if ((!firmsData || firmsData.length === 0) && !hasBurningSignal) {
      warnings.push('no_firms_and_no_biomass_signal');
      return {
        score: 0,
        breakdown: {},
        confidence: 0.3,
        warnings: warnings.length > 0 ? warnings : undefined,
        notes_readable: 'No FIRMS fire data available and no biomass burning signal detected from AQI. Contribution set to zero.',
        metadata: {
          dataSource: 'none',
          searchRadiusKm,
          nearbyFiresCount: 0
        }
      };
    }
    
    // Find fires within search radius and time window
    const nearbyFires = [];
    const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    
    for (const fire of firmsData) {
      try {
        const fireLat = utils.safeNumber(fire.lat || fire.latitude, 0);
        const fireLng = utils.safeNumber(fire.lng || fire.longitude, 0);
        
        if (fireLat === 0 || fireLng === 0) {
          continue; // Skip invalid coordinates
        }
        
        // Check time window
        const fireTime = new Date(fire.timestamp || fire.acq_date || fire.acq_time || Date.now());
        if (fireTime < cutoffTime) {
          continue; // Skip old fires
        }
        
        const distance = utils.haversineDistance(lat, lng, fireLat, fireLng);
        
        if (distance <= searchRadiusKm) {
          nearbyFires.push({
            ...fire,
            distanceKm: distance,
            lat: fireLat,
            lng: fireLng
          });
        }
      } catch (error) {
        // Skip this fire on error
        continue;
      }
    }
    
    // Calculate fire intensity sum from nearby fires
    let fireIntensitySum = 0;
    for (const fire of nearbyFires) {
      const intensity = utils.safeNumber(fire.intensity || fire.brightness || fire.confidence || 0.5, 0.5);
      fireIntensitySum += intensity;
    }
    
    // If no nearby fires but has burning signal, use estimated score
    if (nearbyFires.length === 0 && hasBurningSignal) {
      const biomassScale = utils.safeNumber(calibrationBaselines.calibrationFactors?.biomassScale, 1.0);
      const finalScore = estimatedBurningScore * biomassScale;
      
      return {
        score: utils.safeNumber(finalScore, 0),
        breakdown: { estimated_from_aqi: finalScore },
        confidence: 0.4, // Lower confidence for estimated
        warnings: warnings.length > 0 ? warnings : undefined,
        notes_readable: `No FIRMS fires detected, but CO and PM spike pattern suggests biomass burning. Estimated score: ${finalScore.toFixed(2)}.`,
        metadata: {
          dataSource: 'estimated',
          searchRadiusKm,
          nearbyFiresCount: 0,
          estimatedFromAQI: true
        }
      };
    }
    
    if (nearbyFires.length === 0 && !hasBurningSignal) {
      return {
        score: 0,
        breakdown: {},
        confidence: 0.5,
        warnings: warnings.length > 0 ? warnings : undefined,
        notes_readable: `No fire hotspots found within ${searchRadiusKm} km radius in last ${windowHours} hours.`,
        metadata: {
          dataSource: firmsData.length > 0 ? 'firms' : 'none',
          searchRadiusKm,
          totalFiresInData: firmsData.length,
          nearbyFiresCount: 0
        }
      };
    }
    
    // Calculate contribution from each fire
    const breakdown = {};
    let totalScore = 0;
    
    for (const fire of nearbyFires) {
      try {
        const fireIntensity = utils.safeNumber(fire.intensity, 0.5);
        const material = fire.material || 'agricultural';
        const distance = utils.safeNumber(fire.distanceKm, 5);
        
        // Get material factor
        const materialFactor = MATERIAL_FACTORS[material] || MATERIAL_FACTORS.default;
        
        // Frequency factor (if multiple fires, higher frequency)
        const frequency = 1.0 + (nearbyFires.length - 1) * 0.2; // Slight increase per additional fire
        const frequencyFactor = Math.min(2.0, frequency);
        
        // Proximity factor
        const proximityFactorValue = fireProximityFactor(distance);
        
        // Calculate contribution
        const contribution = fireIntensity * 
                            materialFactor * 
                            frequencyFactor * 
                            proximityFactorValue;
        
        const fireId = fire.id || `fire_${nearbyFires.indexOf(fire)}`;
        breakdown[fireId] = {
          contribution: utils.safeNumber(contribution, 0),
          distanceKm: distance,
          intensity: fireIntensity,
          material,
          timestamp: fire.timestamp || new Date().toISOString()
        };
        
        totalScore += contribution;
      } catch (error) {
        warnings.push(`Error processing fire ${fire.id || 'unknown'}: ${error.message}`);
        continue;
      }
    }
    
    // Apply calibration scale
    const biomassScale = utils.safeNumber(calibrationBaselines.calibrationFactors?.biomassScale, 1.0);
    const finalScore = totalScore * biomassScale;
    
    // Calculate confidence
    let confidence = 0.75;
    if (nearbyFires.length < 2) {
      confidence = 0.6;
    }
    
    // Lower confidence if using estimated data
    if (hasBurningSignal && nearbyFires.length === 0) {
      confidence = 0.4;
    }
    
    // Lower confidence if no FIRMS data
    if (warnings.some(w => w.includes('no_firms'))) {
      confidence = Math.max(0.3, confidence - 0.2);
    }
    
    confidence = utils.clamp(confidence, 0.3, 1.0);
    
    // Generate readable notes
    const dataSource = firmsData.length > 0 && firmsData[0].timestamp ? 'firms' : 'estimated';
    const notes_readable = `Biomass burning from ${nearbyFires.length} fire hotspots within ${searchRadiusKm} km (last ${windowHours}h). ` +
      `Fire intensity sum: ${fireIntensitySum.toFixed(2)}. ` +
      `Data source: ${dataSource === 'firms' ? 'NASA FIRMS satellite data' : 'estimated from AQI patterns'}.`;
    
    return {
      score: utils.safeNumber(finalScore, 0),
      breakdown,
      confidence: utils.safeNumber(confidence, 0.5),
      warnings: warnings.length > 0 ? warnings : undefined,
      notes_readable,
      metadata: {
        nearbyFiresCount: nearbyFires.length,
        searchRadiusKm,
        totalFiresInData: firmsData.length,
        dataSource,
        fireIntensitySum
      }
    };
    
  } catch (error) {
    // Return safe defaults on any error
    return {
      score: 0,
      breakdown: {},
      confidence: 0.3,
      warnings: [`Error in burning calculation: ${error.message}`],
      metadata: {}
    };
  }
}

module.exports = {
  calculateBurningContribution
};

