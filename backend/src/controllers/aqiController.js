const aqiService = require('../services/aqiService');
const airQualityService = require('../services/airQualityService');
const sourceDetectionService = require('../services/sourceDetectionService');
const { getHealthRecommendations } = require('../utils/aqiHelpers');
const logger = require('../utils/logger');

/**
 * Get AQI by coordinates (improved with validation and freshness)
 */
exports.getAQIByLocation = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    // Use improved air quality service
    const aqiData = await airQualityService.getCurrentAQI(parseFloat(lat), parseFloat(lon));
    
    // If unavailable, return graceful error
    if (aqiData.unavailable) {
      return res.json({
        success: true,
        data: aqiData,
        message: aqiData.message,
      });
    }

    res.json({
      success: true,
      data: aqiData,
    });
  } catch (error) {
    logger.error(`AQI fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AQI data',
      message: error.message,
    });
  }
};

/**
 * Get AQI for all Delhi NCR regions (improved)
 */
exports.getAllNCRAQI = async (req, res) => {
  try {
    // Use existing service but enhance with validation
    const data = await aqiService.getAllNCRAQI();
    
    // Validate and enhance each region
    if (data && data.regions) {
      for (const [key, region] of Object.entries(data.regions)) {
        if (region.error) continue;
        
        // Validate AQI
        if (region.aqi < 0 || region.aqi > 800 || isNaN(region.aqi)) {
          logger.warn(`[AQIController] Invalid AQI for ${key}: ${region.aqi}`);
          region.aqi = null;
          region.error = true;
          region.message = 'Invalid AQI value';
          continue;
        }

        // Add freshness check
        const timestamp = region.timestamp || region.lastUpdated;
        if (timestamp) {
          const age = Date.now() - new Date(timestamp).getTime();
          const ageMinutes = Math.floor(age / (60 * 1000));
          region.dataAgeMinutes = ageMinutes;
          region.isStale = ageMinutes > 10;
        }

        // Ensure all required fields are present
        region.aqi = Math.round(region.aqi);
        region.last_updated = timestamp || new Date().toISOString();
      }
    }

    // Validate summary
    if (data && data.summary) {
      const validRegions = Object.values(data.regions || {}).filter(r => !r.error && r.aqi);
      if (validRegions.length > 0) {
        const aqiValues = validRegions.map(r => r.aqi);
        data.summary.averageAqi = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
        data.summary.maxAqi = Math.max(...aqiValues);
        data.summary.minAqi = Math.min(...aqiValues);
        data.summary.activeStations = validRegions.length;
      }
      data.summary.lastUpdated = new Date().toISOString();
    }
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`NCR AQI fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NCR AQI data',
      message: error.message,
    });
  }
};

/**
 * Get current AQI with source detection (new endpoint)
 */
exports.getCurrentAQIWithSource = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    // Get validated AQI
    const aqiData = await airQualityService.getCurrentAQI(latNum, lonNum);
    
    // If unavailable, return graceful response
    if (aqiData.unavailable) {
      return res.json({
        success: true,
        data: {
          aqi: null,
          category: 'Unavailable',
          source_detection: null,
          message: aqiData.message,
        },
      });
    }

    // Get source detection
    const sourceDetection = await sourceDetectionService.detectSource(
      latNum,
      lonNum,
      aqiData
    );

    res.json({
      success: true,
      data: {
        aqi: aqiData.aqi,
        category: aqiData.category,
        last_updated: aqiData.last_updated,
        source: aqiData.source,
        confidence: aqiData.confidence,
        source_detection: sourceDetection,
        pollutants: aqiData.pollutants,
        sensor_id: aqiData.sensor_id,
        is_fallback: aqiData.is_fallback,
        is_forecast: aqiData.is_forecast,
        smoothed: aqiData.smoothed,
      },
    });
  } catch (error) {
    logger.error(`Current AQI with source error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AQI with source detection',
      message: error.message,
    });
  }
};

/**
 * Get AQI by station name
 */
exports.getAQIByStation = async (req, res) => {
  try {
    const { station } = req.params;
    
    if (!station) {
      return res.status(400).json({
        success: false,
        error: 'Station name is required',
      });
    }

    const data = await aqiService.getAQIByStation(station);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Station AQI fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station AQI data',
      message: error.message,
    });
  }
};

/**
 * Search for stations
 */
exports.searchStations = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Search keyword is required',
      });
    }

    const data = await aqiService.searchStations(keyword);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Station search error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to search stations',
      message: error.message,
    });
  }
};

/**
 * Get health recommendations
 */
exports.getHealthRecommendations = async (req, res) => {
  try {
    const { lat, lon, category } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const aqiData = await aqiService.getAQIByLocation(parseFloat(lat), parseFloat(lon));
    const recommendations = getHealthRecommendations(aqiData.aqi, category || 'general');
    
    res.json({
      success: true,
      data: {
        aqi: aqiData.aqi,
        location: aqiData.station,
        recommendations,
      },
    });
  } catch (error) {
    logger.error(`Health recommendations error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get health recommendations',
      message: error.message,
    });
  }
};

/**
 * Get historical AQI data
 */
exports.getAQIHistory = async (req, res) => {
  try {
    const { lat, lon, range } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const validRange = range === 'daily' ? 'daily' : 'hourly';
    const data = await aqiService.getAQIHistory(
      parseFloat(lat), 
      parseFloat(lon), 
      validRange
    );
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`AQI History fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical AQI data',
      message: error.message,
    });
  }
};
