const policyConfig = require('../config/policyConfig.json');
const policyImpactService = require('../services/policyImpactService');
const logger = require('../utils/logger');

/**
 * Get all available policies
 */
exports.getPolicies = async (req, res) => {
  try {
    res.json({
      success: true,
      data: policyConfig.policies.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
      })),
    });
  } catch (error) {
    logger.error(`[Policy Controller] Error fetching policies: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies',
    });
  }
};

/**
 * Get all available cities
 */
exports.getCities = async (req, res) => {
  try {
    res.json({
      success: true,
      data: policyConfig.cities,
    });
  } catch (error) {
    logger.error(`[Policy Controller] Error fetching cities: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities',
    });
  }
};

/**
 * Get all available zones
 */
exports.getZones = async (req, res) => {
  try {
    res.json({
      success: true,
      data: policyConfig.zones,
    });
  } catch (error) {
    logger.error(`[Policy Controller] Error fetching zones: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zones',
    });
  }
};

/**
 * Simulate policy impact
 * POST /api/policy/simulate
 * Body: { city, zone, policy, duration }
 */
exports.simulatePolicy = async (req, res) => {
  try {
    const { city, zone, policy, duration } = req.body;

    // Validate inputs
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City is required',
      });
    }

    if (!zone) {
      return res.status(400).json({
        success: false,
        error: 'Zone is required',
      });
    }

    if (!policy) {
      return res.status(400).json({
        success: false,
        error: 'Policy is required',
      });
    }

    if (!duration || ![24, 48, 168].includes(duration)) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be 24, 48, or 168 (7 days) hours',
      });
    }

    // Validate city
    if (!policyConfig.cities.includes(city)) {
      return res.status(400).json({
        success: false,
        error: `Invalid city: ${city}. Must be one of: ${policyConfig.cities.join(', ')}`,
      });
    }

    // Validate zone
    if (!policyConfig.zones.includes(zone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid zone: ${zone}. Must be one of: ${policyConfig.zones.join(', ')}`,
      });
    }

    // Validate city-zone combination
    if (!policyConfig.cityZones[city] || !policyConfig.cityZones[city][zone]) {
      return res.status(400).json({
        success: false,
        error: `Invalid city-zone combination: ${city} ${zone}`,
      });
    }

    // Find policy by name or ID
    let policyConfigItem = policyConfig.policies.find(
      p => p.id === policy || p.name === policy
    );

    if (!policyConfigItem) {
      return res.status(400).json({
        success: false,
        error: `Invalid policy: ${policy}`,
      });
    }

    logger.info(`[Policy Controller] Simulating policy: ${policyConfigItem.name} for ${city} ${zone}, duration: ${duration}h`);

    // Get baseline forecast
    const baselineForecast = await policyImpactService.getBaselineForecast(city, zone, duration);

    if (!baselineForecast || baselineForecast.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch baseline forecast',
      });
    }

    // Generate after-policy forecast
    const afterPolicyForecast = await policyImpactService.generateAfterPolicyCurve(
      baselineForecast,
      policyConfigItem,
      duration
    );

    // Calculate summary statistics
    const baselineAvgAQI = baselineForecast.reduce((sum, p) => sum + p.aqi, 0) / baselineForecast.length;
    const afterPolicyAvgAQI = afterPolicyForecast.reduce((sum, p) => sum + p.aqi, 0) / afterPolicyForecast.length;
    
    const improvement = baselineAvgAQI - afterPolicyAvgAQI;
    const improvementPercent = ((improvement / baselineAvgAQI) * 100).toFixed(2);

    // Get average pollutants for baseline and after policy
    const baselinePollutants = {
      PM2_5: baselineForecast.reduce((sum, p) => sum + p.pollutants.PM2_5, 0) / baselineForecast.length,
      PM10: baselineForecast.reduce((sum, p) => sum + p.pollutants.PM10, 0) / baselineForecast.length,
      NO2: baselineForecast.reduce((sum, p) => sum + p.pollutants.NO2, 0) / baselineForecast.length,
      SO2: baselineForecast.reduce((sum, p) => sum + p.pollutants.SO2, 0) / baselineForecast.length,
      CO: baselineForecast.reduce((sum, p) => sum + p.pollutants.CO, 0) / baselineForecast.length,
      O3: baselineForecast.reduce((sum, p) => sum + p.pollutants.O3, 0) / baselineForecast.length,
    };

    const afterPolicyPollutants = {
      PM2_5: afterPolicyForecast.reduce((sum, p) => sum + p.pollutants.PM2_5, 0) / afterPolicyForecast.length,
      PM10: afterPolicyForecast.reduce((sum, p) => sum + p.pollutants.PM10, 0) / afterPolicyForecast.length,
      NO2: afterPolicyForecast.reduce((sum, p) => sum + p.pollutants.NO2, 0) / afterPolicyForecast.length,
      SO2: afterPolicyForecast.reduce((sum, p) => sum + p.pollutants.SO2, 0) / afterPolicyForecast.length,
      CO: afterPolicyForecast.reduce((sum, p) => sum + p.pollutants.CO, 0) / afterPolicyForecast.length,
      O3: afterPolicyForecast.reduce((sum, p) => sum + p.pollutants.O3, 0) / afterPolicyForecast.length,
    };

    // Calculate pollutant changes
    const pollutantChanges = policyImpactService.calculatePollutantChanges(
      baselinePollutants,
      afterPolicyPollutants
    );

    // Find most reduced pollutant
    let mostReducedPollutant = null;
    let maxReduction = 0;
    Object.keys(pollutantChanges).forEach(key => {
      if (pollutantChanges[key].change < 0 && Math.abs(pollutantChanges[key].change) > maxReduction) {
        maxReduction = Math.abs(pollutantChanges[key].change);
        mostReducedPollutant = {
          name: key,
          reduction: Math.abs(pollutantChanges[key].change),
          unit: key === 'CO' ? 'mg/m³' : 'μg/m³',
        };
      }
    });

    // Get health categories
    const baselineHealthCategory = policyImpactService.getHealthCategory(baselineAvgAQI);
    const afterPolicyHealthCategory = policyImpactService.getHealthCategory(afterPolicyAvgAQI);

    // Format response according to spec
    const baselineAQI = baselineForecast.map(p => p.aqi);
    const adjustedAQI = afterPolicyForecast.map(p => p.aqi);

    // Format pollutants with proper keys
    const pollutantsBefore = {
      PM2_5: Math.round(baselinePollutants.PM2_5 * 10) / 10,
      PM10: Math.round(baselinePollutants.PM10 * 10) / 10,
      NO2: Math.round(baselinePollutants.NO2 * 10) / 10,
      CO: Math.round(baselinePollutants.CO * 10) / 10,
      SO2: Math.round(baselinePollutants.SO2 * 10) / 10,
      O3: Math.round(baselinePollutants.O3 * 10) / 10,
    };

    const pollutantsAfter = {
      PM2_5: Math.round(afterPolicyPollutants.PM2_5 * 10) / 10,
      PM10: Math.round(afterPolicyPollutants.PM10 * 10) / 10,
      NO2: Math.round(afterPolicyPollutants.NO2 * 10) / 10,
      CO: Math.round(afterPolicyPollutants.CO * 10) / 10,
      SO2: Math.round(afterPolicyPollutants.SO2 * 10) / 10,
      O3: Math.round(afterPolicyPollutants.O3 * 10) / 10,
    };

    // Calculate health impact
    const getHealthImpact = (aqi) => {
      if (aqi <= 50) return { risk: 'Low', visibility: 'Clear', category: 'Good' };
      if (aqi <= 100) return { risk: 'Low', visibility: 'Clear', category: 'Satisfactory' };
      if (aqi <= 200) return { risk: 'Moderate', visibility: 'Moderate', category: 'Moderate' };
      if (aqi <= 300) return { risk: 'High', visibility: 'Low', category: 'Poor' };
      if (aqi <= 400) return { risk: 'High', visibility: 'Low', category: 'Very Poor' };
      return { risk: 'Very High', visibility: 'Very Low', category: 'Severe' };
    };

    const healthImpactBefore = getHealthImpact(baselineAvgAQI);
    const healthImpactAfter = getHealthImpact(afterPolicyAvgAQI);

    res.json({
      success: true,
      baselineAQI,
      adjustedAQI,
      pollutantsBefore,
      pollutantsAfter,
      percentageImprovement: parseFloat(improvementPercent),
      healthImpactBefore,
      healthImpactAfter,
      // Additional data for frontend
      policy: {
        id: policyConfigItem.id,
        name: policyConfigItem.name,
        description: policyConfigItem.description,
      },
      city,
      zone,
      duration,
      // Chart data with time labels
      chartData: baselineForecast.map((p, i) => ({
        time: i,
        baselineAQI: p.aqi,
        adjustedAQI: afterPolicyForecast[i]?.aqi || p.aqi,
      })),
    });
  } catch (error) {
    logger.error(`[Policy Controller] Simulation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate policy',
      message: error.message,
    });
  }
};
