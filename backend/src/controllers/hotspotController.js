const hotspotService = require('../services/hotspotService');
const logger = require('../utils/logger');

/**
 * Get pollution hotspots
 */
exports.getHotspots = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 1;
    
    if (days < 1 || days > 10) {
      return res.status(400).json({
        success: false,
        error: 'Days must be between 1 and 10',
      });
    }

    const data = await hotspotService.getHotspots(days);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Hotspots fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hotspots data',
      message: error.message,
    });
  }
};

/**
 * Get hotspot clusters
 */
exports.getClusters = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 1;
    const data = await hotspotService.getHotspots(days);
    
    res.json({
      success: true,
      data: {
        clusters: data.clusters,
        summary: {
          totalClusters: data.clusters.length,
          criticalClusters: data.clusters.filter(c => c.riskLevel === 'critical').length,
          highRiskClusters: data.clusters.filter(c => c.riskLevel === 'high').length,
        },
      },
    });
  } catch (error) {
    logger.error(`Clusters fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cluster data',
      message: error.message,
    });
  }
};

/**
 * Get pollution contribution estimate
 */
exports.getPollutionContribution = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const hotspotsData = await hotspotService.getHotspots(1);
    const contribution = hotspotService.estimatePollutionContribution(
      parseFloat(lat),
      parseFloat(lon),
      hotspotsData.hotspots,
      hotspotsData.windData
    );
    
    res.json({
      success: true,
      data: {
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        ...contribution,
        nearbyHotspots: hotspotsData.hotspots.filter(h => {
          const dist = Math.sqrt(
            Math.pow(h.latitude - parseFloat(lat), 2) + 
            Math.pow(h.longitude - parseFloat(lon), 2)
          );
          return dist < 0.5; // ~50km radius
        }).length,
      },
    });
  } catch (error) {
    logger.error(`Pollution contribution error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate pollution contribution',
      message: error.message,
    });
  }
};

/**
 * Get MODIS Thermal Fire Layer
 */
exports.getThermalFireLayer = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 1;
    
    if (days < 1 || days > 10) {
      return res.status(400).json({
        success: false,
        error: 'Days must be between 1 and 10',
      });
    }

    const data = await hotspotService.getThermalFireLayer(days);
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Thermal fire layer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thermal fire layer data',
      message: error.message,
    });
  }
};

/**
 * Get Construction Dust Hotspots
 */
exports.getConstructionDust = async (req, res) => {
  try {
    const data = await hotspotService.getConstructionDustHotspots();
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Construction dust error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch construction dust hotspots',
      message: error.message,
    });
  }
};

/**
 * Get Category Hotspots (Traffic, Industrial, Dust)
 * Returns simplified format: [{ lat, lng, category }]
 */
exports.getCategoryHotspots = async (req, res) => {
  try {
    const hotspots = await hotspotService.getCategoryHotspots();
    
    // Return in the exact format requested: [{ lat, lng, category }]
    res.json(hotspots);
  } catch (error) {
    logger.error(`Category hotspots error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category hotspots',
      message: error.message,
    });
  }
};

