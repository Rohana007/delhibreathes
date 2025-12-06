const predictionService = require('../services/predictionService');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Get AQI predictions for a location
 */
exports.getPredictions = async (req, res) => {
  try {
    const { lat, lon, location } = req.query;
    
    // Default to Delhi center if no coordinates provided
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;
    const locationName = location || 'Delhi';

    const data = await predictionService.getPredictions(latitude, longitude, locationName);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Predictions error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictions',
      message: error.message,
    });
  }
};

/**
 * Get 6-hour forecast
 */
exports.get6HourForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;

    const data = await predictionService.getPredictions(latitude, longitude);
    
    res.json({
      success: true,
      data: {
        current: data.current,
        sixHour: data.sixHour,
        hourlyForecast: data.hourlyForecast.slice(0, 6),
        confidence: data.confidence,
      },
    });
  } catch (error) {
    logger.error(`6-hour forecast error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate 6-hour forecast',
      message: error.message,
    });
  }
};

/**
 * Get 24-hour forecast
 */
exports.get24HourForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;

    const data = await predictionService.getPredictions(latitude, longitude);
    
    res.json({
      success: true,
      data: {
        current: data.current,
        twentyFourHour: data.twentyFourHour,
        hourlyForecast: data.hourlyForecast,
        trends: data.trends,
        factors: data.factors,
        confidence: data.confidence,
      },
    });
  } catch (error) {
    logger.error(`24-hour forecast error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate 24-hour forecast',
      message: error.message,
    });
  }
};

/**
 * Get policy predictions for all NCR regions
 */
exports.getPolicyPredictions = async (req, res) => {
  try {
    const data = await predictionService.getPolicyPredictions();
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Policy predictions error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate policy predictions',
      message: error.message,
    });
  }
};

/**
 * Get trend analysis
 */
exports.getTrends = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;

    const data = await predictionService.getPredictions(latitude, longitude);
    
    res.json({
      success: true,
      data: {
        current: data.current,
        trends: data.trends,
        factors: data.factors,
        hourlyPattern: data.hourlyForecast.map(h => ({
          hour: h.hour,
          aqi: h.aqi,
          level: h.level,
        })),
      },
    });
  } catch (error) {
    logger.error(`Trends error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trends',
      message: error.message,
    });
  }
};

