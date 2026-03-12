/**
 * Frontend Validation Engine - Computes validated AQI from multiple sources
 * Includes CPCB, AQICN, and OpenWeather
 * NO backend dependencies - all logic runs client-side
 */

/**
 * Calculate freshness label from timestamp
 */
function calculateFreshness(timestamp) {
  if (!timestamp) return 'very_stale';
  const now = new Date();
  const dataTime = new Date(timestamp);
  const ageMinutes = (now - dataTime) / (1000 * 60);
  
  if (ageMinutes <= 5) return 'fresh';
  if (ageMinutes <= 15) return 'slightly_stale';
  if (ageMinutes <= 60) return 'old';
  return 'very_stale';
}

/**
 * Check data validity for a dataset
 */
function checkDataValidity(dataset, sourceName) {
  if (!dataset || dataset.aqi === null || dataset.aqi === undefined) {
    return {
      valid: false,
      freshness: 'very_stale',
      flags: ['missing_data'],
      reliability_score: 0,
    };
  }

  const freshness = dataset.freshness || calculateFreshness(dataset.timestamp);
  const flags = [];
  let reliability = 1.0;

  // Freshness penalties
  if (freshness === 'very_stale') {
    flags.push('very_stale');
    reliability *= 0.2;
  } else if (freshness === 'old') {
    flags.push('old');
    reliability *= 0.5;
  } else if (freshness === 'slightly_stale') {
    flags.push('slightly_stale');
    reliability *= 0.7;
  }

  // Status penalties
  if (dataset.status === 'error') {
    flags.push('error');
    reliability *= 0.3;
  }

  return {
    valid: reliability > 0.2,
    freshness,
    flags,
    reliability_score: Math.max(0, reliability),
  };
}

/**
 * Check cross-source consistency
 */
function checkCrossSourceConsistency(cpcb, aqicn, openweather) {
  const consistency = {};

  // Helper to compute difference
  const computeDiff = (aqi1, aqi2) => {
    if (!aqi1 || !aqi2 || aqi1 === null || aqi2 === null) return null;
    const diff = Math.abs(aqi1 - aqi2) / Math.max(aqi1, 1);
    let status = 'good';
    if (diff >= 0.40) status = 'poor';
    else if (diff >= 0.25) status = 'moderate';
    return { difference: diff, status };
  };

  // CPCB vs AQICN
  if (cpcb?.aqi && aqicn?.aqi) {
    consistency.cpcb_vs_aqicn = computeDiff(cpcb.aqi, aqicn.aqi);
  }

  // CPCB vs OpenWeather
  if (cpcb?.aqi && openweather?.aqi) {
    consistency.cpcb_vs_openweather = computeDiff(cpcb.aqi, openweather.aqi);
  }

  return consistency;
}

/**
 * Apply weight penalties based on diagnostics and consistency
 */
function applyWeightPenalties(baseWeights, diagnostics, consistency) {
  const adjusted = { ...baseWeights };

  // Apply freshness penalties
  Object.keys(adjusted).forEach((source) => {
    const diag = diagnostics[source];
    if (!diag || !diag.valid) {
      adjusted[source] = 0;
      return;
    }

    if (diag.freshness === 'very_stale') {
      adjusted[source] = 0;
    } else if (diag.freshness === 'old') {
      adjusted[source] *= 0.4;
    } else if (diag.freshness === 'slightly_stale') {
      adjusted[source] *= 0.7;
    }

    // Apply consistency penalties
    if (source === 'cpcb') {
      if (consistency.cpcb_vs_aqicn?.status === 'poor') adjusted[source] *= 0.5;
      if (consistency.cpcb_vs_openweather?.status === 'poor') adjusted[source] *= 0.5;
    } else if (source === 'aqicn') {
      if (consistency.cpcb_vs_aqicn?.status === 'poor') adjusted[source] *= 0.5;
    } else if (source === 'openweather') {
      if (consistency.cpcb_vs_openweather?.status === 'poor') adjusted[source] *= 0.5;
    }
  });

  // Normalize weights
  const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    Object.keys(adjusted).forEach((key) => {
      adjusted[key] = adjusted[key] / sum;
    });
  } else {
    // Fallback: equal weights if all are zero
    Object.keys(adjusted).forEach((key) => {
      adjusted[key] = 1 / Object.keys(adjusted).length;
    });
  }

  return adjusted;
}

/**
 * Compute weighted fusion AQI
 */
function computeWeightedFusion(cpcb, aqicn, openweather, weights) {
  let sum = 0;
  let totalWeight = 0;

  if (cpcb?.aqi !== null && cpcb?.aqi !== undefined && weights.cpcb > 0) {
    sum += cpcb.aqi * weights.cpcb;
    totalWeight += weights.cpcb;
  }

  if (aqicn?.aqi !== null && aqicn?.aqi !== undefined && weights.aqicn > 0) {
    sum += aqicn.aqi * weights.aqicn;
    totalWeight += weights.aqicn;
  }

  if (openweather?.aqi !== null && openweather?.aqi !== undefined && weights.openweather > 0) {
    sum += openweather.aqi * weights.openweather;
    totalWeight += weights.openweather;
  }

  if (totalWeight === 0) return null;
  return Math.round(sum / totalWeight);
}

/**
 * Compute confidence score (0-100)
 */
function computeConfidence(diagnostics, consistency) {
  let score = 100;

  // Penalties for freshness
  Object.values(diagnostics).forEach((diag) => {
    if (diag.freshness === 'very_stale') score -= 20;
    else if (diag.freshness === 'old') score -= 15;
    else if (diag.freshness === 'slightly_stale') score -= 10;
  });

  // Penalties for consistency
  Object.values(consistency).forEach((cons) => {
    if (cons?.status === 'poor') score -= 15;
    else if (cons?.status === 'moderate') score -= 8;
  });

  // Penalties for invalid data
  Object.values(diagnostics).forEach((diag) => {
    if (!diag.valid) score -= 20;
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * Compute validated AQI from multiple sources
 * @param {Object} cpcb - CPCB dataset
 * @param {Object} aqicn - AQICN dataset
 * @param {Object} openweather - OpenWeather dataset
 * @returns {Object} Validation result
 */
export function computeValidatedAQI(cpcb, aqicn, openweather) {
  try {
    // A) SENSOR & DATA VALIDITY CHECKS
    const diagnostics = {
      cpcb: checkDataValidity(cpcb, 'CPCB'),
      aqicn: checkDataValidity(aqicn, 'AQICN'),
      openweather: checkDataValidity(openweather, 'OpenWeather'),
    };

    // B) CROSS-SOURCE CONSISTENCY CHECK
    const consistency = checkCrossSourceConsistency(cpcb, aqicn, openweather);

    // C) BASE WEIGHTS
    const baseWeights = {
      cpcb: 0.60,
      aqicn: 0.25,
      openweather: 0.15,
    };

    // D) DYNAMIC WEIGHT ADJUSTMENT
    const adjustedWeights = applyWeightPenalties(baseWeights, diagnostics, consistency);

    // E) VALIDATED AQI CALCULATION (Weighted Fusion)
    const validatedAQI = computeWeightedFusion(cpcb, aqicn, openweather, adjustedWeights);

    // F) CONFIDENCE SCORE (0-100)
    const confidence = computeConfidence(diagnostics, consistency);

    return {
      validated_aqi: validatedAQI,
      weights: adjustedWeights,
      confidence: confidence,
      consistency: consistency,
      diagnostics: diagnostics,
    };
  } catch (error) {
    console.error('[ValidationEngine] Error computing validated AQI:', error);
    return {
      validated_aqi: null,
      weights: { cpcb: 0.60, aqicn: 0.25, openweather: 0.15 },
      confidence: 0,
      consistency: {},
      diagnostics: {},
    };
  }
}

