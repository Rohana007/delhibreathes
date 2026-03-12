/**
 * Utility functions for Microscopic Pollution Source Identification Engine
 * All functions include input validation and safe defaults
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Safely converts a value to a number with fallback
 * @param {*} x - Value to convert
 * @param {number} fallback - Default value if conversion fails
 * @returns {number} - Valid number or fallback
 */
function safeNumber(x, fallback = 0) {
  try {
    if (x === null || x === undefined || x === '') {
      return fallback;
    }
    const num = typeof x === 'number' ? x : parseFloat(x);
    if (isNaN(num) || !isFinite(num)) {
      return fallback;
    }
    return num;
  } catch (error) {
    return fallback;
  }
}

/**
 * Clamps a number between min and max values
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
function clamp(value, min, max) {
  try {
    const num = safeNumber(value, min);
    return Math.max(min, Math.min(max, num));
  } catch (error) {
    return min;
  }
}

/**
 * Calculates Haversine distance between two geographic points
 * Formula: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *          c = 2 ⋅ atan2( √a, √(1−a) )
 *          d = R ⋅ c
 * @param {number} lat1 - Latitude of first point (degrees)
 * @param {number} lon1 - Longitude of first point (degrees)
 * @param {number} lat2 - Latitude of second point (degrees)
 * @param {number} lon2 - Longitude of second point (degrees)
 * @returns {number} - Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  try {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (safeNumber(lat2) - safeNumber(lat1)) * Math.PI / 180;
    const dLon = (safeNumber(lon2) - safeNumber(lon1)) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(safeNumber(lat1) * Math.PI / 180) *
              Math.cos(safeNumber(lat2) * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch (error) {
    return Infinity; // Return large distance on error
  }
}

/**
 * Safely loads JSON file with error handling
 * @param {string} filePath - Path to JSON file
 * @param {*} fallback - Default value if file cannot be loaded
 * @returns {*} - Parsed JSON or fallback
 */
function loadJSONSafe(filePath, fallback = null) {
  try {
    const fullPath = path.join(__dirname, '../../../..', filePath);
    if (!fs.existsSync(fullPath)) {
      return fallback;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return fallback;
  }
}

/**
 * Calculates time of day factor for pollution dispersion
 * Morning/Evening rush hours have higher factors
 * @param {Date|string} time - Time to evaluate
 * @returns {number} - Factor between 0.8 and 1.5
 */
function timeOfDayFactor(time) {
  try {
    const date = time instanceof Date ? time : new Date(time);
    const hour = date.getHours();
    
    // Rush hours: 7-10 AM and 5-8 PM have higher pollution
    if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) {
      return 1.5; // Peak traffic
    } else if (hour >= 10 && hour < 17) {
      return 1.2; // Daytime
    } else if (hour >= 20 && hour < 23) {
      return 1.0; // Evening
    } else {
      return 0.8; // Night/early morning
    }
  } catch (error) {
    return 1.0; // Default neutral factor
  }
}

/**
 * Converts traffic level string to congestion factor
 * @param {string} trafficLevel - Traffic level: 'free', 'moderate', 'heavy', 'jammed'
 * @returns {number} - Congestion factor (1.0 to 3.0)
 */
function congestionToFactor(trafficLevel) {
  try {
    const level = String(trafficLevel || 'moderate').toLowerCase();
    const factors = {
      'free': 1.0,
      'moderate': 1.5,
      'heavy': 2.0,
      'jammed': 3.0
    };
    return factors[level] || 1.5; // Default to moderate
  } catch (error) {
    return 1.5;
  }
}

/**
 * Calculates distance decay factor
 * Formula: 1 / (1 + 0.1 * distance_km)
 * Pollution influence decreases with distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Decay factor between 0 and 1
 */
function distanceDecay(distanceKm) {
  try {
    const dist = safeNumber(distanceKm, 0);
    return 1 / (1 + 0.1 * dist);
  } catch (error) {
    return 1.0; // No decay on error
  }
}

/**
 * Calculates road type factor
 * Highways and major roads have higher pollution
 * @param {string} roadType - Type of road: 'highway', 'major', 'minor', 'residential'
 * @returns {number} - Factor between 0.8 and 2.0
 */
function roadTypeFactor(roadType) {
  try {
    const type = String(roadType || 'major').toLowerCase();
    const factors = {
      'highway': 2.0,
      'major': 1.5,
      'minor': 1.0,
      'residential': 0.8
    };
    return factors[type] || 1.5;
  } catch (error) {
    return 1.5;
  }
}

/**
 * Calculates idling factor based on traffic conditions
 * Higher idling in heavy traffic increases emissions
 * @param {string} trafficLevel - Traffic level
 * @returns {number} - Idling factor (1.0 to 2.5)
 */
function idlingFactor(trafficLevel) {
  try {
    const level = String(trafficLevel || 'moderate').toLowerCase();
    const factors = {
      'free': 1.0,
      'moderate': 1.3,
      'heavy': 1.8,
      'jammed': 2.5
    };
    return factors[level] || 1.3;
  } catch (error) {
    return 1.3;
  }
}

/**
 * Validates latitude value
 * @param {number} lat - Latitude to validate
 * @returns {boolean} - True if valid (-90 to 90)
 */
function isValidLatitude(lat) {
  try {
    const num = safeNumber(lat);
    return num >= -90 && num <= 90;
  } catch (error) {
    return false;
  }
}

/**
 * Validates longitude value
 * @param {number} lng - Longitude to validate
 * @returns {boolean} - True if valid (-180 to 180)
 */
function isValidLongitude(lng) {
  try {
    const num = safeNumber(lng);
    return num >= -180 && num <= 180;
  } catch (error) {
    return false;
  }
}

/**
 * Gets default location (Delhi center) if coordinates are invalid
 * @returns {{lat: number, lng: number}} - Default coordinates
 */
function getDefaultLocation() {
  return {
    lat: 28.6139, // Delhi center
    lng: 77.2090
  };
}

/**
 * Estimates distance to nearest road with robust fallbacks
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} providedDistance - Optional provided distance_km parameter
 * @returns {Object} - { distance_km, warnings }
 */
function estimateDistanceToRoad(lat, lng, providedDistance = null) {
  const warnings = [];
  
  try {
    // 1) Use provided distance if available
    if (providedDistance !== null && providedDistance !== undefined) {
      const dist = safeNumber(providedDistance, 0);
      if (dist >= 0) {
        return { distance_km: dist, warnings: [] };
      }
    }
    
    // 2) Try Google Roads API if key exists
    const googleApiKey = process.env.GOOGLE_ROADS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      // Note: In production, you'd make an async call here
      // For now, we'll skip to fallback for safety
    }
    
    // 3) Try OSM nearest road (would require network access and overpass API)
    // Skipped for offline safety
    
    // 4) Fallback to urban default
    warnings.push('distance_assumed_urban_20m');
    return { distance_km: 0.02, warnings }; // 20m urban default
  } catch (error) {
    warnings.push('distance_assumed_urban_20m');
    return { distance_km: 0.02, warnings };
  }
}

/**
 * Fetches wind data from Open-Meteo API with fallback
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} - { speed, direction, warnings }
 */
function fetchWind(lat, lng) {
  const warnings = [];
  
  try {
    // Check if network is available (simple check)
    const networkEnabled = process.env.ENABLE_NETWORK !== 'false';
    
    if (networkEnabled) {
      // Try Open-Meteo API (free, no key required)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&timezone=Asia/Kolkata`;
      
      // Note: This is a synchronous placeholder. In production, use async/await with https.get
      // For now, we'll use fallback to ensure no crashes
    }
    
    // Fallback to default
    warnings.push('wind_default_2ms');
    return {
      speed: 2.0,
      direction: 0,
      warnings
    };
  } catch (error) {
    warnings.push('wind_default_2ms');
    return {
      speed: 2.0,
      direction: 0,
      warnings
    };
  }
}

/**
 * Loads FIRMS fire data with robust fallbacks
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} windowHours - Time window in hours (default: 72)
 * @returns {Object} - { fires, warnings }
 */
function loadFIRMS(lat, lng, windowHours = 72) {
  const warnings = [];
  
  try {
    // 1) Try local recent file first
    const localFile = 'data/firms_viirs_recent.json';
    const localData = loadJSONSafe(localFile, null);
    
    if (localData && localData.fires && Array.isArray(localData.fires)) {
      // Filter fires within time window
      const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000);
      const recentFires = localData.fires.filter(fire => {
        try {
          const fireTime = new Date(fire.timestamp || fire.acq_date || 0);
          return fireTime >= cutoffTime;
        } catch {
          return true; // Include if timestamp parsing fails
        }
      });
      
      return { fires: recentFires, warnings: [] };
    }
    
    // 2) Try sample/fallback file
    const sampleFile = 'data/firms_sample_viirs.json';
    const sampleData = loadJSONSafe(sampleFile, null);
    
    if (sampleData && sampleData.fires && Array.isArray(sampleData.fires)) {
      warnings.push('no_firms_data');
      return { fires: sampleData.fires, warnings };
    }
    
    // 3) Try network fetch if enabled (would require async implementation)
    const networkEnabled = process.env.ENABLE_NETWORK !== 'false';
    if (networkEnabled) {
      // Note: FIRMS CSV download would go here
      // For now, return empty with warning
    }
    
    // 4) Final fallback
    warnings.push('no_firms_data');
    return { fires: [], warnings };
  } catch (error) {
    warnings.push('no_firms_data');
    return { fires: [], warnings };
  }
}

module.exports = {
  safeNumber,
  clamp,
  haversineDistance,
  loadJSONSafe,
  timeOfDayFactor,
  congestionToFactor,
  distanceDecay,
  roadTypeFactor,
  idlingFactor,
  isValidLatitude,
  isValidLongitude,
  getDefaultLocation,
  estimateDistanceToRoad,
  fetchWind,
  loadFIRMS
};

