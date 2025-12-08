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
    // Load validation weights
    const validationWeights = params.validationWeights || utils.loadJSONSafe('data/validationWeights.json', {});
    const nasaWeight = utils.safeNumber(validationWeights.NASA, 0.90);
    
    // Validate inputs
    const lat = utils.safeNumber(params.lat, 28.6139);
    const lng = utils.safeNumber(params.lng, 77.2090);
    const searchRadiusKm = utils.safeNumber(params.searchRadiusKm, 10);
    const useMockData = params.useMockData !== false; // Default to true
    
    // Try to load FIRMS data
    let firmsData = params.firmsData;
    
    if (!firmsData || !Array.isArray(firmsData) || firmsData.length === 0) {
      // Try to load from file
      firmsData = loadFIRMSData('data/firmsData.json');
      
      if (firmsData.length === 0 && useMockData) {
        // Generate mock data for demo/testing
        firmsData = generateMockFIRMSData(lat, lng, searchRadiusKm);
        warnings.push('Using mock FIRMS data - real data not available');
      }
    }
    
    // If still no data, return safe defaults
    if (!firmsData || firmsData.length === 0) {
      return {
        score: 0,
        breakdown: {},
        confidence: 0.3,
        warnings: ['No FIRMS fire data available - biomass burning contribution set to zero'],
        metadata: {
          dataSource: 'none',
          searchRadiusKm
        }
      };
    }
    
    // Find fires within search radius
    const nearbyFires = [];
    for (const fire of firmsData) {
      try {
        const fireLat = utils.safeNumber(fire.lat, 0);
        const fireLng = utils.safeNumber(fire.lng, 0);
        
        if (fireLat === 0 || fireLng === 0) {
          continue; // Skip invalid coordinates
        }
        
        const distance = utils.haversineDistance(lat, lng, fireLat, fireLng);
        
        if (distance <= searchRadiusKm) {
          nearbyFires.push({
            ...fire,
            distanceKm: distance
          });
        }
      } catch (error) {
        // Skip this fire on error
        continue;
      }
    }
    
    if (nearbyFires.length === 0) {
      return {
        score: 0,
        breakdown: {},
        confidence: 0.5,
        warnings: [`No fire hotspots found within ${searchRadiusKm} km radius`],
        metadata: {
          dataSource: firmsData[0]?.timestamp ? 'firms' : 'mock',
          searchRadiusKm,
          totalFiresInData: firmsData.length
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
    
    // Apply validation weight
    const finalScore = totalScore * nasaWeight;
    
    // Calculate confidence
    let confidence = 0.75;
    if (nearbyFires.length === 0) {
      confidence = 0.3;
    } else if (nearbyFires.length < 2) {
      confidence = 0.6;
    }
    
    // Lower confidence if using mock data
    if (warnings.some(w => w.includes('mock'))) {
      confidence = Math.max(0.3, confidence - 0.2);
    }
    
    // Lower confidence if data source is uncertain
    const dataSource = firmsData[0]?.timestamp ? 'firms' : 'mock';
    if (dataSource === 'mock') {
      confidence = Math.max(0.3, confidence - 0.15);
    }
    
    confidence = utils.clamp(confidence, 0.3, 1.0);
    
    return {
      score: utils.safeNumber(finalScore, 0),
      breakdown,
      confidence: utils.safeNumber(confidence, 0.5),
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        nearbyFiresCount: nearbyFires.length,
        searchRadiusKm,
        totalFiresInData: firmsData.length,
        dataSource
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

