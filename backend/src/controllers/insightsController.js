const aiInsightsService = require('../services/aiInsightsService');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Get AI-generated insights for a location
 */
exports.getInsights = async (req, res) => {
  try {
    const { lat, lon, location } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;
    const locationName = location || 'Delhi';

    const data = await aiInsightsService.generateInsights(latitude, longitude, locationName);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Insights error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message,
    });
  }
};

/**
 * Get source analysis
 */
exports.getSourceAnalysis = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;

    const insights = await aiInsightsService.generateInsights(latitude, longitude);
    
    res.json({
      success: true,
      data: insights.sourceAnalysis,
    });
  } catch (error) {
    logger.error(`Source analysis error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze pollution sources',
      message: error.message,
    });
  }
};

/**
 * Get warnings and alerts
 */
exports.getWarnings = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;

    const insights = await aiInsightsService.generateInsights(latitude, longitude);
    
    res.json({
      success: true,
      data: {
        warnings: insights.warnings,
        summary: insights.summary,
      },
    });
  } catch (error) {
    logger.error(`Warnings error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warnings',
      message: error.message,
    });
  }
};

/**
 * Get recommendations
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const latitude = lat ? parseFloat(lat) : config.locations.delhi.lat;
    const longitude = lon ? parseFloat(lon) : config.locations.delhi.lon;

    const insights = await aiInsightsService.generateInsights(latitude, longitude);
    
    res.json({
      success: true,
      data: {
        recommendations: insights.recommendations,
        preventionSteps: insights.preventionSteps,
        cityAdvice: insights.cityAdvice,
      },
    });
  } catch (error) {
    logger.error(`Recommendations error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      message: error.message,
    });
  }
};

/**
 * Get policy maker insights
 */
exports.getPolicyInsights = async (req, res) => {
  try {
    const data = await aiInsightsService.generatePolicyInsights();
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Policy insights error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate policy insights',
      message: error.message,
    });
  }
};

/**
 * Get action items for policy makers
 */
exports.getActionItems = async (req, res) => {
  try {
    const data = await aiInsightsService.generatePolicyInsights();
    
    res.json({
      success: true,
      data: {
        actionItems: data.actionItems,
        resourceAllocation: data.resourceAllocation,
        grapRecommendation: data.grapRecommendation,
      },
    });
  } catch (error) {
    logger.error(`Action items error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action items',
      message: error.message,
    });
  }
};

