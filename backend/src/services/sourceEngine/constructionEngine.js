/**
 * Construction Dust Pollution Source Identification Engine
 * Implements construction dust calculation using DPCC construction site database
 * 
 * Formula: activeSiteCount × dustFactor × windFactor × drynessFactor × 
 *          resuspensionFactor × validationWeight
 */

const utils = require('./utils');

// Load calibration baselines for construction scale
const calibrationBaselines = utils.loadJSONSafe('data/calibration_baselines.json', {});

// Default dust factor per site (PM2.5 emission rate)
const DEFAULT_DUST_FACTOR = 1.2;

/**
 * Calculates wind factor for dust dispersion
 * Higher wind speeds increase dust dispersion but also resuspension
 * @param {number} windSpeed - Wind speed in m/s
 * @returns {number} - Wind factor (0.5 to 2.0)
 */
function windFactor(windSpeed) {
  try {
    const speed = utils.safeNumber(windSpeed, 2.0);
    if (speed < 1.0) {
      return 0.5; // Low wind, minimal dispersion
    } else if (speed < 3.0) {
      return 1.0; // Moderate wind
    } else if (speed < 5.0) {
      return 1.5; // Higher wind, more resuspension
    } else {
      return 2.0; // Strong wind, high resuspension
    }
  } catch (error) {
    return 1.0;
  }
}

/**
 * Calculates dryness factor
 * Drier conditions increase dust generation
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} - Dryness factor (0.5 to 1.5)
 */
function drynessFactor(humidity) {
  try {
    const hum = utils.clamp(utils.safeNumber(humidity, 50), 0, 100);
    if (hum < 30) {
      return 1.5; // Very dry
    } else if (hum < 50) {
      return 1.2; // Dry
    } else if (hum < 70) {
      return 1.0; // Moderate
    } else {
      return 0.5; // Humid, less dust
    }
  } catch (error) {
    return 1.0;
  }
}

/**
 * Calculates resuspension factor based on traffic and wind
 * Higher traffic and wind increase resuspension of settled dust
 * @param {string} trafficLevel - Traffic level
 * @param {number} windSpeed - Wind speed in m/s
 * @returns {number} - Resuspension factor (0.8 to 2.0)
 */
function resuspensionFactor(trafficLevel, windSpeed) {
  try {
    const congestionFactor = utils.congestionToFactor(trafficLevel);
    const windFactorValue = windFactor(windSpeed);
    
    // Resuspension increases with both traffic and wind
    return Math.min(2.0, (congestionFactor + windFactorValue) / 2);
  } catch (error) {
    return 1.0;
  }
}

/**
 * Calculates construction dust pollution contribution score
 * @param {Object} params - Input parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {Object} params.constructionData - Construction database (optional, loaded if not provided)
 * @param {Object} params.validationWeights - Validation weights (optional, loaded if not provided)
 * @param {Object} params.wind - Wind data {speed, direction}
 * @param {number} params.humidity - Relative humidity (0-100)
 * @param {string} params.trafficLevel - Traffic level
 * @param {number} params.searchRadiusKm - Search radius in km (default: 1)
 * @returns {Object} - { score, breakdown, confidence, warnings }
 */
function calculateConstructionContribution(params = {}) {
  const warnings = [];
  
  try {
    // Load static data
    const constructionData = params.constructionData || utils.loadJSONSafe('data/constructionDatabase.json', []);
    const validationWeights = params.validationWeights || utils.loadJSONSafe('data/validationWeights.json', {});
    
    // Validate inputs
    const lat = utils.safeNumber(params.lat, 28.6139);
    const lng = utils.safeNumber(params.lng, 77.2090);
    const searchRadiusKm = utils.safeNumber(params.searchRadiusKm, 1);
    
    // Extract wind data - use fetchWind if not provided
    const wind = params.wind || {};
    let windSpeed = utils.safeNumber(wind.speed, null);
    let windDirection = utils.safeNumber(wind.direction, 0);
    
    // If wind not provided, try to fetch it
    if (windSpeed === null) {
      const windResult = utils.fetchWind(lat, lng);
      windSpeed = windResult.speed;
      windDirection = windResult.direction;
      if (windResult.warnings && windResult.warnings.length > 0) {
        warnings.push(...windResult.warnings);
      }
    }
    
    const humidity = utils.clamp(utils.safeNumber(params.humidity, 50), 0, 100);
    const trafficLevel = params.trafficLevel || 'moderate';
    
    // Extract AOD if provided (for road dust calculation)
    const aqi = params.aqi || {};
    const aod = utils.safeNumber(aqi.aod, null);
    
    // Filter out metadata if present
    const sites = Array.isArray(constructionData)
      ? constructionData.filter(item => item && item.id && !item.metadata)
      : [];
    
    if (sites.length === 0) {
      return {
        score: 0,
        breakdown: {},
        confidence: 0.3,
        warnings: ['No construction site data available'],
        metadata: {}
      };
    }
    
    // Find active sites within search radius
    const nearbySites = [];
    for (const site of sites) {
      try {
        // Only count active sites
        if (!site.active) {
          continue;
        }
        
        const siteLat = utils.safeNumber(site.lat, 0);
        const siteLng = utils.safeNumber(site.lng, 0);
        
        if (siteLat === 0 || siteLng === 0) {
          continue; // Skip invalid coordinates
        }
        
        const distance = utils.haversineDistance(lat, lng, siteLat, siteLng);
        
        if (distance <= searchRadiusKm) {
          nearbySites.push({
            ...site,
            distanceKm: distance
          });
        }
      } catch (error) {
        // Skip this site on error
        continue;
      }
    }
    
    // Count only active sites
    const activeSiteCount = nearbySites.length;
    
    // Calculate dryness factor (if humidity missing, assume 0.5 dryness)
    const drynessFactorValue = drynessFactor(humidity);
    
    if (activeSiteCount === 0) {
      // Still compute road dust from AOD if present
      let roadDustScore = 0;
      if (aod !== null && aod > 0) {
        roadDustScore = aod * 0.1 * windFactorValue * drynessFactorValue; // Small contribution from road dust
        warnings.push(`No active construction sites, but computing road dust from AOD (${aod.toFixed(2)})`);
      } else {
        warnings.push(`No active construction sites found within ${searchRadiusKm} km radius`);
      }
      
      return {
        score: utils.safeNumber(roadDustScore, 0),
        breakdown: {},
        confidence: 0.5,
        warnings: warnings.length > 0 ? warnings : undefined,
        notes_readable: activeSiteCount === 0 
          ? `No active construction sites within ${searchRadiusKm} km. ${aod !== null ? `Road dust estimated from AOD: ${aod.toFixed(2)}.` : 'Score set to baseline.'}`
          : undefined,
        metadata: {
          searchRadiusKm,
          totalSitesInDatabase: sites.length,
          activeSitesInDatabase: sites.filter(s => s.active).length,
          activeSiteCount: 0,
          factors: {
            dustFactor: DEFAULT_DUST_FACTOR,
            windFactor: windFactorValue,
            drynessFactor: drynessFactorValue,
            resuspensionFactor: resuspensionFactor(trafficLevel, windSpeed)
          }
        }
      };
    }
    
    // Calculate factors (drynessFactorValue already calculated above)
    const dustFactor = DEFAULT_DUST_FACTOR;
    const windFactorValue = windFactor(windSpeed);
    const resuspensionFactorValue = resuspensionFactor(trafficLevel, windSpeed);
    
    // Calculate contribution per site
    const breakdown = {};
    let totalScore = 0;
    
    for (const site of nearbySites) {
      try {
        const siteDustFactor = utils.safeNumber(site.dustFactor, dustFactor);
        const siteArea = utils.safeNumber(site.area_m2, 5000);
        const distance = utils.safeNumber(site.distanceKm, 0.5);
        
        // Area factor: larger sites generate more dust
        const areaFactor = Math.min(2.0, siteArea / 5000);
        
        // Distance decay
        const distanceDecayValue = utils.distanceDecay(distance);
        
        // Calculate contribution for this site
        const contribution = siteDustFactor * 
                            areaFactor * 
                            windFactorValue * 
                            drynessFactorValue * 
                            resuspensionFactorValue * 
                            distanceDecayValue;
        
        const siteName = site.siteName || site.id;
        breakdown[siteName] = {
          contribution: utils.safeNumber(contribution, 0),
          distanceKm: distance,
          area_m2: siteArea,
          dustFactor: siteDustFactor
        };
        
        totalScore += contribution;
      } catch (error) {
        warnings.push(`Error processing site ${site.id}: ${error.message}`);
        continue;
      }
    }
    
    // Apply calibration scale
    const calibrationBaselines = params.calibrationBaselines || utils.loadJSONSafe('data/calibration_baselines.json', {});
    const constructionScale = utils.safeNumber(calibrationBaselines.calibrationFactors?.constructionScale, 1.0);
    const finalScore = totalScore * constructionScale;
    
    // Calculate confidence
    let confidence = 0.80;
    if (activeSiteCount < 2) {
      confidence = 0.6;
    }
    
    if (!constructionData || sites.length === 0) {
      confidence -= 0.15;
      warnings.push('Construction database not available, using defaults');
    }
    
    if (windSpeed === 2.0 && !warnings.some(w => w.includes('wind'))) {
      confidence -= 0.05;
      warnings.push('Wind data not provided, using default');
    }
    
    confidence = utils.clamp(confidence, 0.3, 1.0);
    
    // Generate readable notes
    const notes_readable = `Construction dust from ${activeSiteCount} active sites within ${searchRadiusKm} km. ` +
      `Wind speed: ${windSpeed.toFixed(1)} m/s, humidity: ${humidity.toFixed(0)}%, ` +
      `dryness factor: ${drynessFactorValue.toFixed(2)}, resuspension factor: ${resuspensionFactorValue.toFixed(2)}. ` +
      `Data from DPCC construction site registry.`;
    
    return {
      score: utils.safeNumber(finalScore, 0),
      breakdown,
      confidence: utils.safeNumber(confidence, 0.7),
      warnings: warnings.length > 0 ? warnings : undefined,
      notes_readable,
      metadata: {
        activeSiteCount,
        searchRadiusKm,
        totalSitesInDatabase: sites.length,
        factors: {
          dustFactor,
          windFactor: windFactorValue,
          drynessFactor: drynessFactorValue,
          resuspensionFactor: resuspensionFactorValue
        }
      }
    };
    
  } catch (error) {
    // Return safe defaults on any error
    return {
      score: 0,
      breakdown: {},
      confidence: 0.3,
      warnings: [`Error in construction calculation: ${error.message}`],
      metadata: {}
    };
  }
}

module.exports = {
  calculateConstructionContribution
};

