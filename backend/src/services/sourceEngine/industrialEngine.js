/**
 * Industrial Pollution Source Identification Engine
 * Implements industrial pollution calculation using DPCC database
 * 
 * Formula: industryWeight × fuelFactor × stackDispersionFactor × 
 *          operatingHoursFactor × proximityFactor × validationWeight
 */

const utils = require('./utils');

// Fuel factor mapping: different fuels have different emission rates
const FUEL_FACTORS = {
  'Coal': 2.5,
  'Diesel': 1.8,
  'Natural Gas': 0.8,
  'Biomass': 1.5,
  'LPG': 0.9,
  'default': 1.5
};

// Category weights based on pollution potential
const CATEGORY_WEIGHTS = {
  'Red': 2.0,    // High pollution potential
  'Orange': 1.5, // Moderate pollution potential
  'Green': 0.8,  // Low pollution potential
  'default': 1.5
};

/**
 * Calculates stack dispersion factor based on stack height
 * Higher stacks disperse better, reducing ground-level impact
 * Formula: 1 / (1 + stackHeight_m / 50)
 * @param {number} stackHeight_m - Stack height in meters
 * @returns {number} - Dispersion factor (0 to 1)
 */
function stackDispersionFactor(stackHeight_m) {
  try {
    const height = utils.safeNumber(stackHeight_m, 20);
    return 1 / (1 + height / 50);
  } catch (error) {
    return 0.5; // Default moderate dispersion
  }
}

/**
 * Calculates operating hours factor
 * 24-hour operations have higher impact than daytime-only
 * @param {number} operatingHours - Operating hours per day
 * @returns {number} - Factor (0.5 to 1.5)
 */
function operatingHoursFactor(operatingHours) {
  try {
    const hours = utils.safeNumber(operatingHours, 16);
    if (hours >= 20) {
      return 1.5; // Near-continuous operation
    } else if (hours >= 16) {
      return 1.2; // Extended hours
    } else if (hours >= 8) {
      return 1.0; // Standard hours
    } else {
      return 0.5; // Part-time operation
    }
  } catch (error) {
    return 1.0;
  }
}

/**
 * Calculates proximity factor using distance decay
 * Closer industries have higher impact
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Proximity factor (0 to 1)
 */
function proximityFactor(distanceKm) {
  try {
    return utils.distanceDecay(distanceKm);
  } catch (error) {
    return 0.5;
  }
}

/**
 * Calculates industrial pollution contribution score
 * @param {Object} params - Input parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {Object} params.industrialData - Industrial database (optional, loaded if not provided)
 * @param {Object} params.validationWeights - Validation weights (optional, loaded if not provided)
 * @param {number} params.searchRadiusKm - Search radius in km (default: 5)
 * @returns {Object} - { score, breakdown, confidence, warnings }
 */
function calculateIndustrialContribution(params = {}) {
  const warnings = [];
  
  try {
    // Load static data
    const industrialData = params.industrialData || utils.loadJSONSafe('data/industrialDatabase.json', []);
    const validationWeights = params.validationWeights || utils.loadJSONSafe('data/validationWeights.json', {});
    
    // Validate inputs
    const lat = utils.safeNumber(params.lat, 28.6139);
    const lng = utils.safeNumber(params.lng, 77.2090);
    const searchRadiusKm = utils.safeNumber(params.searchRadiusKm, 5);
    
    // Filter out metadata if present
    const industries = Array.isArray(industrialData) 
      ? industrialData.filter(item => item && item.id && !item.metadata)
      : [];
    
    if (industries.length === 0) {
      return {
        score: 0,
        breakdown: {},
        confidence: 0.3,
        warnings: ['No industrial data available'],
        metadata: {}
      };
    }
    
    // Find industries within search radius
    const nearbyIndustries = [];
    for (const industry of industries) {
      try {
        const industryLat = utils.safeNumber(industry.lat, 0);
        const industryLng = utils.safeNumber(industry.lng, 0);
        
        if (industryLat === 0 || industryLng === 0) {
          continue; // Skip invalid coordinates
        }
        
        const distance = utils.haversineDistance(lat, lng, industryLat, industryLng);
        
        if (distance <= searchRadiusKm) {
          nearbyIndustries.push({
            ...industry,
            distanceKm: distance
          });
        }
      } catch (error) {
        // Skip this industry on error
        continue;
      }
    }
    
    if (nearbyIndustries.length === 0) {
      return {
        score: 0,
        breakdown: {},
        confidence: 0.5,
        warnings: [`No industries found within ${searchRadiusKm} km radius`],
        metadata: {
          searchRadiusKm,
          totalIndustriesInDatabase: industries.length
        }
      };
    }
    
    // Calculate contribution from each nearby industry
    const breakdown = {};
    let totalScore = 0;
    
    for (const industry of nearbyIndustries) {
      try {
        const category = industry.category || 'Orange';
        const fuel = industry.fuel || 'Coal';
        const stackHeight = utils.safeNumber(industry.stackHeight_m, 20);
        const operatingHours = utils.safeNumber(industry.operatingHours, 16);
        const emissionFactor = utils.safeNumber(industry.emissionFactor_PM25, 30);
        const distance = utils.safeNumber(industry.distanceKm, 1);
        
        // Calculate factors
        const industryWeight = CATEGORY_WEIGHTS[category] || CATEGORY_WEIGHTS.default;
        const fuelFactor = FUEL_FACTORS[fuel] || FUEL_FACTORS.default;
        const stackDispersion = stackDispersionFactor(stackHeight);
        const operatingHoursFactorValue = operatingHoursFactor(operatingHours);
        const proximityFactorValue = proximityFactor(distance);
        
        // Calculate contribution
        const contribution = industryWeight * 
                            fuelFactor * 
                            stackDispersion * 
                            operatingHoursFactorValue * 
                            proximityFactorValue * 
                            emissionFactor;
        
        const industryName = industry.name || industry.id;
        breakdown[industryName] = {
          contribution: utils.safeNumber(contribution, 0),
          distanceKm: distance,
          category,
          fuel,
          stackHeight_m: stackHeight,
          operatingHours
        };
        
        totalScore += contribution;
      } catch (error) {
        warnings.push(`Error processing industry ${industry.id}: ${error.message}`);
        continue;
      }
    }
    
    // Apply validation weight (using CPCB weight for industrial sources)
    const cpcbWeight = utils.safeNumber(validationWeights.CPCB, 0.95);
    const finalScore = totalScore * cpcbWeight;
    
    // Calculate confidence
    let confidence = 0.85;
    if (nearbyIndustries.length === 0) {
      confidence = 0.3;
    } else if (nearbyIndustries.length < 2) {
      confidence = 0.6;
    }
    
    if (!industrialData || industries.length === 0) {
      confidence -= 0.15;
      warnings.push('Industrial database not available, using defaults');
    }
    
    confidence = utils.clamp(confidence, 0.3, 1.0);
    
    return {
      score: utils.safeNumber(finalScore, 0),
      breakdown,
      confidence: utils.safeNumber(confidence, 0.7),
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        nearbyIndustriesCount: nearbyIndustries.length,
        searchRadiusKm,
        totalIndustriesInDatabase: industries.length
      }
    };
    
  } catch (error) {
    // Return safe defaults on any error
    return {
      score: 0,
      breakdown: {},
      confidence: 0.3,
      warnings: [`Error in industrial calculation: ${error.message}`],
      metadata: {}
    };
  }
}

module.exports = {
  calculateIndustrialContribution
};

