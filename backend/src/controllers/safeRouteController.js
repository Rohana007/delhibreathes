/**
 * Safe Route Controller
 * Handles requests for AirShield Navigator (Safe Route Finder)
 */
const safeRouteService = require('../services/safeRouteService');
const logger = require('../utils/logger');

/**
 * Get safe route between two points
 * GET /api/safe-route/find
 */
exports.getSafeRoute = async (req, res) => {
  try {
    const { source_lat, source_lng, dest_lat, dest_lng, weight_distance, weight_pollution, weight_traffic } = req.query;

    // Validate required parameters
    if (!source_lat || !source_lng || !dest_lat || !dest_lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: source_lat, source_lng, dest_lat, dest_lng',
      });
    }

    // Parse and validate coordinates
    const sourceLat = parseFloat(source_lat);
    const sourceLng = parseFloat(source_lng);
    const destLat = parseFloat(dest_lat);
    const destLng = parseFloat(dest_lng);

    if (isNaN(sourceLat) || isNaN(sourceLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. All values must be valid numbers.',
      });
    }

    // Parse optional weights (defaults provided)
    const weightDistance = weight_distance ? parseFloat(weight_distance) : 0.6;
    const weightPollution = weight_pollution ? parseFloat(weight_pollution) : 0.3;
    const weightTraffic = weight_traffic ? parseFloat(weight_traffic) : 0.1;

    // Validate weights sum to approximately 1.0
    const weightSum = weightDistance + weightPollution + weightTraffic;
    if (Math.abs(weightSum - 1.0) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Weights must sum to 1.0',
      });
    }

    logger.info(`[Safe Route] Calculating route from (${sourceLat}, ${sourceLng}) to (${destLat}, ${destLng})`);

    // Call Python service
    const routeData = await safeRouteService.getSafeRoute(
      sourceLat,
      sourceLng,
      destLat,
      destLng,
      weightDistance,
      weightPollution,
      weightTraffic
    );

    // Ensure response matches expected format
    if (routeData.recommended_route && routeData.all_routes) {
      res.json({
        success: true,
        ...routeData,
      });
    } else {
      // If routeData is already in the correct format, return as is
      res.json({
        success: true,
        recommended_route: routeData.recommended_route || routeData,
        all_routes: routeData.all_routes || [routeData],
        ...routeData,
      });
    }
  } catch (error) {
    logger.error(`[Safe Route] Error: ${error.message}`);
    logger.error(`[Safe Route] Stack: ${error.stack}`);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('Google Maps API key') || error.message.includes('invalid or missing')) {
      errorMessage = 'Google Maps API key is invalid or missing. Please set a valid GOOGLE_MAPS_API_KEY in backend/.env file and ensure the API key has "Directions API" enabled.';
    } else if (error.message.includes('REQUEST_DENIED')) {
      errorMessage = 'Google Maps API key is invalid or does not have Directions API enabled. Please check your API key in backend/.env and enable "Directions API" in Google Cloud Console.';
    } else if (error.message.includes('OVER_QUERY_LIMIT')) {
      errorMessage = 'Google Maps API quota exceeded. Please check your API usage limits.';
    } else if (error.message.includes('Python service')) {
      errorMessage = `Python service error: ${error.message}. Please check that Python dependencies are installed.`;
    } else if (error.message.includes('exited with code')) {
      errorMessage = `Python script failed. Check backend logs for details. Error: ${error.message}`;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate safe route',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Get safe route with traffic data
 * GET /api/safe-route/with_traffic
 */
exports.getSafeRouteWithTraffic = async (req, res) => {
  try {
    const { source_lat, source_lng, dest_lat, dest_lng, weight_distance, weight_pollution, weight_traffic } = req.query;

    // Validate required parameters
    if (!source_lat || !source_lng || !dest_lat || !dest_lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: source_lat, source_lng, dest_lat, dest_lng',
      });
    }

    // Parse and validate coordinates
    const sourceLat = parseFloat(source_lat);
    const sourceLng = parseFloat(source_lng);
    const destLat = parseFloat(dest_lat);
    const destLng = parseFloat(dest_lng);

    if (isNaN(sourceLat) || isNaN(sourceLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. All values must be valid numbers.',
      });
    }

    // Parse optional weights (defaults provided)
    const weightDistance = weight_distance ? parseFloat(weight_distance) : 0.6;
    const weightPollution = weight_pollution ? parseFloat(weight_pollution) : 0.3;
    const weightTraffic = weight_traffic ? parseFloat(weight_traffic) : 0.1;

    // Validate weights sum to approximately 1.0
    const weightSum = weightDistance + weightPollution + weightTraffic;
    if (Math.abs(weightSum - 1.0) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Weights must sum to 1.0',
      });
    }

    logger.info(`[Safe Route] Calculating route with traffic from (${sourceLat}, ${sourceLng}) to (${destLat}, ${destLng})`);

    // Call Python service with traffic flag
    const routeData = await safeRouteService.getSafeRoute(
      sourceLat,
      sourceLng,
      destLat,
      destLng,
      weightDistance,
      weightPollution,
      weightTraffic,
      true // includeTraffic = true
    );

    // Ensure response matches expected format
    if (routeData.recommended_route && routeData.all_routes) {
      res.json({
        success: true,
        ...routeData,
        traffic_enabled: true,
      });
    } else {
      res.json({
        success: true,
        recommended_route: routeData.recommended_route || routeData,
        all_routes: routeData.all_routes || [routeData],
        traffic_enabled: true,
        ...routeData,
      });
    }
  } catch (error) {
    logger.error(`[Safe Route] Error with traffic: ${error.message}`);
    logger.error(`[Safe Route] Stack: ${error.stack}`);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('Google Maps API key') || error.message.includes('invalid or missing')) {
      errorMessage = 'Google Maps API key is invalid or missing. Please set a valid GOOGLE_MAPS_API_KEY in backend/.env file and ensure the API key has "Directions API" enabled.';
    } else if (error.message.includes('REQUEST_DENIED')) {
      errorMessage = 'Google Maps API key is invalid or does not have Directions API enabled. Please check your API key in backend/.env and enable "Directions API" in Google Cloud Console.';
    } else if (error.message.includes('OVER_QUERY_LIMIT')) {
      errorMessage = 'Google Maps API quota exceeded. Please check your API usage limits.';
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate safe route with traffic',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Health check for Safe Route service
 * GET /api/safe-route/health
 */
exports.healthCheck = async (req, res) => {
  try {
    // Try to initialize service to check if it's working
    const initialized = await safeRouteService.initializeService();
    
    res.json({
      success: true,
      service: 'Safe Route Finder',
      initialized,
      pythonAvailable: true,
      backend: 'http://localhost:5000',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'Safe Route Finder',
      error: error.message,
    });
  }
};

/**
 * Debug endpoint to check API key status
 * GET /api/safe-route/debug
 */
exports.debug = async (req, res) => {
  const config = require('../config');
  const apiKey = config.apis.googleMaps.key || process.env.GOOGLE_MAPS_API_KEY || '';
  const apiKeyTrimmed = apiKey.trim();
  
  res.json({
    success: true,
    apiKeyStatus: {
      present: !!apiKeyTrimmed,
      length: apiKeyTrimmed.length,
      fromConfig: !!config.apis.googleMaps.key,
      fromEnv: !!process.env.GOOGLE_MAPS_API_KEY,
      firstChars: apiKeyTrimmed ? apiKeyTrimmed.substring(0, 10) + '...' : 'NOT_SET',
      lastChars: apiKeyTrimmed && apiKeyTrimmed.length > 10 ? '...' + apiKeyTrimmed.substring(apiKeyTrimmed.length - 10) : 'NOT_SET',
    },
    mongoUri: config.mongo.uri ? 'SET' : 'NOT_SET',
    redisUrl: config.redis.url ? 'SET' : 'NOT_SET',
  });
};

