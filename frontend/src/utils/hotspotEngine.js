/**
 * Hotspot Engine - Frontend-only utility functions for hotspot analysis
 * No backend dependencies - all logic runs client-side
 */

/**
 * Get impact direction (downwind direction)
 * @param {number} windDeg - Wind direction in degrees (0-360)
 * @returns {number} Impact direction in degrees
 */
export function getImpactDirection(windDeg) {
  if (windDeg === null || windDeg === undefined || isNaN(windDeg)) {
    return 0;
  }
  // Downwind direction (opposite of wind direction)
  return (windDeg + 180) % 360;
}

/**
 * Get impact cone angles
 * @param {number} direction - Impact direction in degrees
 * @returns {Object} Cone angles
 */
export function getImpactCone(direction) {
  return {
    angle1: (direction - 20 + 360) % 360,
    angle2: (direction + 20) % 360,
  };
}

/**
 * Determine fallback source when real source is unavailable
 * @param {Object} params - Source parameters
 * @returns {string} Fallback source description
 */
export function determineFallbackSource({ realSource, modis, fires, traffic, industry }) {
  // If real source exists, use it
  if (realSource) {
    return realSource;
  }

  // Fallback logic based on available data
  if (fires?.count > 0) {
    return "Biomass burning / nearby fire activity";
  }

  if (modis?.aod > 0.7) {
    return "Regional aerosol transport (high AOD)";
  }

  if (traffic === "high") {
    return "Vehicular congestion";
  }

  if (industry?.upwind) {
    return "Industrial emissions";
  }

  return "Unknown source (low confidence)";
}

/**
 * Compute confidence score based on validation data
 * @param {Object} params - Validation parameters
 * @returns {number} Confidence score (0-100)
 */
export function computeConfidenceScore({ modis, fires, consistency }) {
  let score = 100;

  // Penalties for various factors
  if (modis?.aod > 0.8) {
    score -= 5;
  }

  if (fires?.count > 10) {
    score -= 10;
  }

  if (consistency === "poor") {
    score -= 15;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get compass direction from degrees
 * @param {number} degrees - Direction in degrees
 * @returns {string} Compass direction
 */
export function getCompassDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

