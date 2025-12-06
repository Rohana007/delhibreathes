const axios = require('axios');
const policyConfig = require('../config/policyConfig.json');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');

/**
 * Policy Impact Service
 * Handles policy impact calculations and ML integration
 */

// ML API URL (Python FastAPI microservice)
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Get baseline AQI forecast for a city-zone
 * @param {string} city - City name (e.g., "Delhi")
 * @param {string} zone - Zone name (e.g., "East")
 * @param {number} duration - Duration in hours (24, 48, or 168 for 7 days)
 * @returns {Promise<Array>} - Array of forecast data points
 */
async function getBaselineForecast(city, zone, duration) {
  try {
    const zoneData = policyConfig.cityZones[city]?.[zone];
    if (!zoneData) {
      throw new Error(`City-Zone combination "${city} ${zone}" not found`);
    }

    // Try to fetch from ML API first
    try {
      const response = await axios.post(`${ML_API_URL}/forecast/baseline`, {
        city,
        zone,
        duration_hours: duration,
      }, {
        timeout: 10000,
      });

      if (response.data && response.data.forecast) {
        logger.info(`[Policy Impact] Fetched baseline forecast from ML API for ${city} ${zone}`);
        return response.data.forecast;
      }
    } catch (mlError) {
      logger.warn(`[Policy Impact] ML API unavailable, using fallback: ${mlError.message}`);
    }

    // Fallback: Generate baseline forecast from zone baseline data
    const baseline = zoneData.baselineAQI;
    const pollutants = zoneData.baselinePollutants;
    const dataPoints = duration === 24 ? 24 : duration === 48 ? 48 : 168; // 7 days = 168 hours

    const forecast = [];
    const now = new Date();

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      
      // Simulate natural variation in AQI
      const variation = (Math.sin(i / 12) * 15) + (Math.random() - 0.5) * 10;
      const aqi = Math.max(50, Math.min(500, baseline + variation));

      forecast.push({
        datetime: timestamp.toISOString(),
        aqi: Math.round(aqi),
        pollutants: {
          PM2_5: pollutants['PM2.5'] + (Math.random() - 0.5) * 10,
          PM10: pollutants['PM10'] + (Math.random() - 0.5) * 15,
          NO2: pollutants['NO2'] + (Math.random() - 0.5) * 5,
          SO2: pollutants['SO2'] + (Math.random() - 0.5) * 3,
          CO: pollutants['CO'] + (Math.random() - 0.5) * 1,
          O3: pollutants['O3'] + (Math.random() - 0.5) * 5,
        },
      });
    }

    return forecast;
  } catch (error) {
    logger.error(`[Policy Impact] Error fetching baseline forecast: ${error.message}`);
    throw error;
  }
}

/**
 * Apply policy impact to pollutants
 * @param {Object} pollutants - Original pollutant values
 * @param {Object} policy - Policy configuration
 * @returns {Object} - Modified pollutant values
 */
function applyPolicyImpact(pollutants, policy) {
  const modified = { ...pollutants };
  const impacts = policy.impacts;

  // Apply percentage reduction (negative values mean reduction)
  Object.keys(impacts).forEach(pollutantKey => {
    // Map config keys to pollutant keys
    const keyMap = {
      'PM2.5': 'PM2_5',
      'PM10': 'PM10',
      'NO2': 'NO2',
      'SO2': 'SO2',
      'CO': 'CO',
      'O3': 'O3',
    };

    const pollutantKeyMapped = keyMap[pollutantKey] || pollutantKey;
    
    if (modified[pollutantKeyMapped] !== undefined) {
      const reductionPercent = impacts[pollutantKey];
      // Apply reduction: new = old * (1 + reduction/100)
      // e.g., -18% means new = old * 0.82
      modified[pollutantKeyMapped] = Math.max(0, modified[pollutantKeyMapped] * (1 + reductionPercent / 100));
    }
  });

  return modified;
}

/**
 * Generate "After Policy" AQI curve using ML model
 * @param {Array} baselineForecast - Baseline forecast data
 * @param {Object} policy - Policy configuration
 * @param {number} duration - Duration in hours
 * @returns {Promise<Array>} - Modified forecast with policy impact
 */
async function generateAfterPolicyCurve(baselineForecast, policy, duration) {
  try {
    // Try to call ML API for policy impact prediction
    try {
      const response = await axios.post(`${ML_API_URL}/forecast/policy-impact`, {
        baseline_forecast: baselineForecast,
        policy_impacts: policy.impacts,
        duration_hours: duration,
      }, {
        timeout: 15000,
      });

      if (response.data && response.data.forecast) {
        logger.info(`[Policy Impact] Generated policy impact forecast from ML API`);
        return response.data.forecast;
      }
    } catch (mlError) {
      logger.warn(`[Policy Impact] ML API unavailable, using fallback calculation: ${mlError.message}`);
    }

    // Fallback: Apply policy impacts manually and recalculate AQI
    const afterPolicyForecast = baselineForecast.map(point => {
      const modifiedPollutants = applyPolicyImpact(point.pollutants, policy);
      
      // Recalculate AQI using EPA formula (simplified)
      const newAQI = calculateAQI(modifiedPollutants);

      return {
        datetime: point.datetime,
        aqi: Math.round(newAQI),
        pollutants: modifiedPollutants,
      };
    });

    return afterPolicyForecast;
  } catch (error) {
    logger.error(`[Policy Impact] Error generating after-policy curve: ${error.message}`);
    throw error;
  }
}

/**
 * Calculate AQI from pollutants (EPA formula - simplified)
 * @param {Object} pollutants - Pollutant values
 * @returns {number} - AQI value
 */
function calculateAQI(pollutants) {
  const { PM2_5, PM10, NO2, SO2, CO, O3 } = pollutants;
  
  // Indian AQI calculation (simplified)
  const subIndices = [];
  
  // PM2.5 sub-index
  if (PM2_5 <= 30) subIndices.push((PM2_5 / 30) * 50);
  else if (PM2_5 <= 60) subIndices.push(50 + ((PM2_5 - 30) / 30) * 50);
  else if (PM2_5 <= 90) subIndices.push(100 + ((PM2_5 - 60) / 30) * 50);
  else if (PM2_5 <= 120) subIndices.push(200 + ((PM2_5 - 90) / 30) * 100);
  else if (PM2_5 <= 250) subIndices.push(300 + ((PM2_5 - 120) / 130) * 100);
  else subIndices.push(400 + ((PM2_5 - 250) / 250) * 100);
  
  // PM10 sub-index
  if (PM10 <= 50) subIndices.push((PM10 / 50) * 50);
  else if (PM10 <= 100) subIndices.push(50 + ((PM10 - 50) / 50) * 50);
  else if (PM10 <= 250) subIndices.push(100 + ((PM10 - 100) / 150) * 100);
  else if (PM10 <= 350) subIndices.push(200 + ((PM10 - 250) / 100) * 100);
  else if (PM10 <= 430) subIndices.push(300 + ((PM10 - 350) / 80) * 100);
  else subIndices.push(400 + ((PM10 - 430) / 70) * 100);
  
  // NO2 sub-index
  if (NO2 <= 40) subIndices.push((NO2 / 40) * 50);
  else if (NO2 <= 80) subIndices.push(50 + ((NO2 - 40) / 40) * 50);
  else if (NO2 <= 180) subIndices.push(100 + ((NO2 - 80) / 100) * 100);
  else if (NO2 <= 280) subIndices.push(200 + ((NO2 - 180) / 100) * 100);
  else if (NO2 <= 400) subIndices.push(300 + ((NO2 - 280) / 120) * 100);
  else subIndices.push(400 + ((NO2 - 400) / 400) * 100);
  
  // CO sub-index (in mg/m³)
  const co_mg = CO * 1.15;
  if (co_mg <= 1) subIndices.push((co_mg / 1) * 50);
  else if (co_mg <= 2) subIndices.push(50 + ((co_mg - 1) / 1) * 50);
  else if (co_mg <= 10) subIndices.push(100 + ((co_mg - 2) / 8) * 100);
  else if (co_mg <= 17) subIndices.push(200 + ((co_mg - 10) / 7) * 100);
  else if (co_mg <= 34) subIndices.push(300 + ((co_mg - 17) / 17) * 100);
  else subIndices.push(400 + ((co_mg - 34) / 34) * 100);
  
  // O3 sub-index
  if (O3 <= 50) subIndices.push((O3 / 50) * 50);
  else if (O3 <= 100) subIndices.push(50 + ((O3 - 50) / 50) * 50);
  else if (O3 <= 168) subIndices.push(100 + ((O3 - 100) / 68) * 100);
  else if (O3 <= 208) subIndices.push(200 + ((O3 - 168) / 40) * 100);
  else if (O3 <= 748) subIndices.push(300 + ((O3 - 208) / 540) * 100);
  else subIndices.push(400 + ((O3 - 748) / 252) * 100);
  
  // SO2 sub-index
  if (SO2 <= 40) subIndices.push((SO2 / 40) * 50);
  else if (SO2 <= 80) subIndices.push(50 + ((SO2 - 40) / 40) * 50);
  else if (SO2 <= 380) subIndices.push(100 + ((SO2 - 80) / 300) * 100);
  else if (SO2 <= 800) subIndices.push(200 + ((SO2 - 380) / 420) * 100);
  else if (SO2 <= 1600) subIndices.push(300 + ((SO2 - 800) / 800) * 100);
  else subIndices.push(400 + ((SO2 - 1600) / 400) * 100);
  
  return Math.round(Math.max(...subIndices));
}

/**
 * Calculate pollutant-wise changes
 * @param {Object} baselinePollutants - Original pollutant values
 * @param {Object} afterPolicyPollutants - Modified pollutant values
 * @returns {Object} - Pollutant changes with original, modified, change, and changePercent
 */
function calculatePollutantChanges(baselinePollutants, afterPolicyPollutants) {
  const changes = {};
  
  Object.keys(baselinePollutants).forEach(key => {
    const original = baselinePollutants[key];
    const modified = afterPolicyPollutants[key] || original;
    const change = modified - original;
    const changePercent = original > 0 ? ((change / original) * 100) : 0;

    changes[key] = {
      original: Math.round(original * 10) / 10,
      modified: Math.round(modified * 10) / 10,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10,
    };
  });

  return changes;
}

/**
 * Get health category from AQI
 * @param {number} aqi - AQI value
 * @returns {string} - Health category
 */
function getHealthCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

module.exports = {
  getBaselineForecast,
  applyPolicyImpact,
  generateAfterPolicyCurve,
  calculateAQI,
  calculatePollutantChanges,
  getHealthCategory,
};

