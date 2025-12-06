const routeService = require('../services/routeService');
const logger = require('../utils/logger');

/**
 * Get safe route between two points
 */
exports.getSafeRoute = async (req, res) => {
  try {
    const { originLat, originLon, destLat, destLon, mode } = req.query;
    
    if (!originLat || !originLon || !destLat || !destLon) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination coordinates are required',
      });
    }

    const origin = {
      lat: parseFloat(originLat),
      lon: parseFloat(originLon),
    };
    
    const destination = {
      lat: parseFloat(destLat),
      lon: parseFloat(destLon),
    };

    const validModes = ['walking', 'cycling', 'two-wheeler', 'car', 'bus'];
    const travelMode = validModes.includes(mode) ? mode : 'car';

    const data = await routeService.getSafeRoute(origin, destination, travelMode);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Safe route error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate safe route',
      message: error.message,
    });
  }
};

/**
 * Compare routes for different modes
 */
exports.compareRoutes = async (req, res) => {
  try {
    const { originLat, originLon, destLat, destLon } = req.query;
    
    if (!originLat || !originLon || !destLat || !destLon) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination coordinates are required',
      });
    }

    const origin = {
      lat: parseFloat(originLat),
      lon: parseFloat(originLon),
    };
    
    const destination = {
      lat: parseFloat(destLat),
      lon: parseFloat(destLon),
    };

    const modes = ['walking', 'two-wheeler', 'car', 'bus'];
    const comparisons = {};

    for (const mode of modes) {
      try {
        const routeData = await routeService.getSafeRoute(origin, destination, mode);
        comparisons[mode] = {
          safestRoute: routeData.safestRoute,
          exposureScore: routeData.safestRoute.exposureScore,
          duration: routeData.safestRoute.durationMinutes,
          distance: routeData.safestRoute.distanceKm,
          avgAqi: routeData.safestRoute.avgAqi,
          maskRequired: routeData.safestRoute.maskRecommendation.required,
        };
      } catch (error) {
        comparisons[mode] = { error: true, message: error.message };
      }
    }

    // Find best mode
    const validComparisons = Object.entries(comparisons)
      .filter(([_, data]) => !data.error)
      .map(([mode, data]) => ({ mode, ...data }));
    
    const safestMode = validComparisons.sort((a, b) => a.exposureScore - b.exposureScore)[0];
    const fastestMode = validComparisons.sort((a, b) => a.duration - b.duration)[0];

    res.json({
      success: true,
      data: {
        comparisons,
        recommendations: {
          safest: safestMode?.mode,
          fastest: fastestMode?.mode,
          summary: `For lowest pollution exposure, use ${safestMode?.mode || 'car'}. For fastest travel, use ${fastestMode?.mode || 'car'}.`,
        },
      },
    });
  } catch (error) {
    logger.error(`Route comparison error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to compare routes',
      message: error.message,
    });
  }
};

