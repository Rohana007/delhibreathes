const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import controllers
const aqiController = require('../controllers/aqiController');
const hotspotController = require('../controllers/hotspotController');
const routeController = require('../controllers/routeController');
const predictionController = require('../controllers/predictionController');
const insightsController = require('../controllers/insightsController');
const reportController = require('../controllers/reportController');
const policyRoutes = require('./policyRoutes');

// Import new Firebase auth and report routes
// Note: authRoutes is handled in server.js directly
const reportRoutes = require('./reportRoutes');

// Import new services directly for new endpoints
const seasonalService = require('../services/seasonalService');
const sourceContributionService = require('../services/sourceContributionService');
const userReportService = require('../services/userReportService');
const config = require('../config');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Delhi Breathes API v2',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: ['multi-api', 'seasonal-forecast', 'source-contribution', 'user-reports', 'indian-aqi'],
  });
});

// Database health check
router.get('/db/health', (req, res) => {
  const { getConnectionInfo } = require('../config/db');
  const dbInfo = getConnectionInfo();
  
  res.json({
    connected: dbInfo.connected,
    state: dbInfo.state,
    readyState: dbInfo.readyState,
    host: dbInfo.host,
    port: dbInfo.port,
    database: dbInfo.name,
    timestamp: new Date().toISOString(),
  });
});

// ========== AQI Routes ==========
router.get('/aqi', aqiController.getAQIByLocation);
router.get('/aqi/ncr', aqiController.getAllNCRAQI);
router.get('/aqi/current', aqiController.getCurrentAQIWithSource); // New: validated AQI with source detection
router.get('/aqi/station/:station', aqiController.getAQIByStation);
router.get('/aqi/search', aqiController.searchStations);
router.get('/aqi/health', aqiController.getHealthRecommendations);
router.get('/aqi/history', aqiController.getAQIHistory);

// ========== Hotspot Routes ==========
router.get('/hotspots', hotspotController.getHotspots);
router.get('/hotspots/clusters', hotspotController.getClusters);
router.get('/hotspots/contribution', hotspotController.getPollutionContribution);
router.get('/hotspots/thermalFire', hotspotController.getThermalFireLayer);
router.get('/hotspots/constructionDust', hotspotController.getConstructionDust);
router.get('/hotspots/categories', hotspotController.getCategoryHotspots);

// ========== Route Finder Routes ==========
router.get('/routes/safe', routeController.getSafeRoute);
router.get('/routes/compare', routeController.compareRoutes);

// ========== Prediction Routes ==========
router.get('/predictions', predictionController.getPredictions);
router.get('/predictions/6h', predictionController.get6HourForecast);
router.get('/predictions/24h', predictionController.get24HourForecast);
router.get('/predictions/policy', predictionController.getPolicyPredictions);
router.get('/predictions/trends', predictionController.getTrends);

// ========== AI Insights Routes ==========
router.get('/insights', insightsController.getInsights);
router.get('/insights/sources', insightsController.getSourceAnalysis);
router.get('/insights/warnings', insightsController.getWarnings);
router.get('/insights/recommendations', insightsController.getRecommendations);
router.get('/insights/policy', insightsController.getPolicyInsights);
router.get('/insights/actions', insightsController.getActionItems);

// ========== NEW: Seasonal Forecast Routes ==========
router.get('/seasonal/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const latitude = parseFloat(lat) || config.locations.delhi.lat;
    const longitude = parseFloat(lon) || config.locations.delhi.lon;
    
    const forecast = await seasonalService.getSeasonalForecast(latitude, longitude);
    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/seasonal/current', (req, res) => {
  try {
    const season = seasonalService.getCurrentSeason();
    res.json({ success: true, data: season });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== NEW: Source Contribution Routes ==========
router.get('/sources/markers', async (req, res) => {
  try {
    const markers = await sourceContributionService.getSourceMarkers();
    res.json({ success: true, data: markers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sources/contribution', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Location required' });
    }
    const contribution = await sourceContributionService.getContributionForLocation(
      parseFloat(lat), 
      parseFloat(lon)
    );
    res.json({ success: true, data: contribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sources/seasonal', (req, res) => {
  try {
    const breakdown = sourceContributionService.getCurrentSeasonContribution();
    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Admin Source Contribution Route ==========
router.get('/admin/source-contribution', async (req, res) => {
  try {
    const contribution = await sourceContributionService.getAdminSourceContribution();
    res.json(contribution);
  } catch (error) {
    logger.error(`Admin source contribution error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch source contribution data',
      message: error.message 
    });
  }
});

// ========== Twilio Auth Routes (handled in server.js) ==========
// Auth routes are now at /api/auth (Twilio OTP)

// ========== Report Routes (handled in server.js) ==========
// Report routes are now at /api/reports (Twilio-based)

// ========== Alerts Routes (handled in server.js) ==========
// Alert routes are now at /api/alerts (Twilio-based)

// ========== Policy Simulator Routes ==========
router.use('/policy', policyRoutes);
// Alias for exact endpoint match
router.post('/simulate-policy', (req, res, next) => {
  req.url = '/policy/simulate';
  router.handle(req, res, next);
});

// ========== NEW: User Routes ==========
const alertsController = require('../controllers/alertsController');
router.get('/user/:phone', alertsController.getUser);
// Toggle alerts - NO authentication or OTP required, just region and health category
router.post('/user/alerts/toggle', alertsController.toggleAlerts);

// ========== NEW: User Reports Routes ==========
const userReportsRoutes = require('./userReports.routes');
router.use('/my-reports', userReportsRoutes);

// ========== NEW: Admin Authentication Routes ==========
const adminAuthRoutes = require('./adminAuth.routes');
router.use('/admin', adminAuthRoutes);

// ========== NEW: Admin Reports Routes ==========
const adminReportsRoutes = require('./adminReports.routes');
router.use('/admin/reports', adminReportsRoutes);

// ========== LEGACY OTP ROUTES REMOVED ==========
// All OTP-based authentication has been migrated to Firebase Phone Authentication
// Old endpoints (/api/report/send-otp, /api/report/verify-otp, /api/report/submit) are no longer available
// Use Firebase Phone Auth on the frontend and POST /api/auth/firebase to get server JWT

// ========== Legacy User Report Routes (for backward compatibility) ==========
router.post('/reports', async (req, res) => {
  try {
    const result = await userReportService.submitReport(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// FIX: Added public reports endpoint for policy dashboard
// FIX: corrected Report model import
router.get('/reports', async (req, res) => {
  try {
    console.log("DEBUG: /api/reports hit");
    console.log("DEBUG: Query params:", req.query);
    
    // FIX: corrected MongoDB collection name
    const Report = require('../models/Report');
    const maskService = require('../services/maskService');
    
    const {
      category,
      status,
      phone,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDateEnd;
      }
    }

    console.log("DEBUG: MongoDB query:", JSON.stringify(query));

    // Get total count for pagination
    const total = await Report.countDocuments(query);
    console.log("DEBUG: Total reports found:", total);

    // Fetch reports with pagination, sorted by createdAt (newest first)
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    console.log("DEBUG: Found reports:", reports.length);

    // FIX: Include email and userId in response, with fallback to User model if email missing
    const User = require('../models/User');
    const { ensureConnectionAndQuery } = require('../utils/mongoHelper');
    
    // Format reports for response (mask phone numbers, include email and userId)
    const formattedReports = await Promise.all(reports.map(async (report) => {
      let reportEmail = report.email;
      let userId = report.userId;
      
      // If email is missing but userId exists, fetch from User model
      if ((!reportEmail || reportEmail === 'Email Not Found' || reportEmail === 'No Email Available') && userId) {
        try {
          const user = await ensureConnectionAndQuery(async () => {
            return await User.findById(userId).select('email').lean();
          });
          if (user?.email) {
            reportEmail = user.email;
          } else {
            reportEmail = 'No Email Available';
          }
        } catch (emailError) {
          console.error(`[Reports] Error fetching email for userId ${userId}:`, emailError.message);
          reportEmail = 'No Email Available';
        }
      }
      
      // If still no email, set default
      if (!reportEmail) {
        reportEmail = 'No Email Available';
      }
      
      return {
        id: report._id.toString(),
        userId: userId ? userId.toString() : null,
        email: reportEmail,
        category: report.category || 'pollution',
        description: report.description,
        location: report.location,
        imageUrl: report.imageUrl || report.photo, // Support both field names
        timestamp: report.timestamp,
        createdAt: report.createdAt,
        status: report.status || 'Pending',
        phone: report.phone ? maskService.maskPhone(report.phone) : null,
      };
    }));

    const totalPages = Math.ceil(total / limitNum);

    // FIX: Return friendly empty state instead of breaking
    // If zero reports, return empty array (frontend will show "—")
    const response = {
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: totalPages,
        },
      },
    };

    console.log("DEBUG: Response prepared - reports:", formattedReports.length, "total:", total);
    res.json(response);
  } catch (error) {
    console.error('ERROR: /api/reports failed:', error);
    console.error('ERROR: Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Server error loading reports',
      message: 'Server error loading reports'
    });
  }
});

router.get('/reports/nearby', async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Location required' });
    }
    const reports = await userReportService.getNearbyReports(
      parseFloat(lat), 
      parseFloat(lon), 
      parseFloat(radius) || 5
    );
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/stats', async (req, res) => {
  try {
    const stats = await userReportService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/categories', (req, res) => {
  try {
    const categories = userReportService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const report = await userReportService.getReportById(req.params.id);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// FIX: Use MongoDB Report model instead of in-memory service
router.patch('/reports/:id/status', reportController.updateReportStatus);

router.post('/reports/:id/vote', async (req, res) => {
  try {
    const { voteType } = req.body;
    const report = await userReportService.voteReport(req.params.id, voteType);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== Config Routes ==========
router.get('/config/aqi-levels', (req, res) => {
  res.json({ success: true, data: config.indianAqi });
});

router.get('/config/pollutant-limits', (req, res) => {
  res.json({ success: true, data: config.pollutantLimits });
});

router.get('/config/stations', (req, res) => {
  res.json({ success: true, data: config.cpcbStations });
});

router.get('/config/sources', (req, res) => {
  res.json({ success: true, data: config.pollutionSources });
});

// ========== Chatbot Routes ==========
const chatbotRoutes = require('./chatbot.routes');
router.use('/chat', chatbotRoutes);

// ========== Analytics Routes ==========
const analyticsController = require('../controllers/analyticsController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// All analytics routes require admin/policymaker authentication
router.get('/analytics/historic', adminAuthMiddleware, analyticsController.getHistoric);
router.get('/analytics/pollutants', adminAuthMiddleware, analyticsController.getPollutants);
router.get('/analytics/sources', adminAuthMiddleware, analyticsController.getSources);
router.get('/analytics/reports', adminAuthMiddleware, analyticsController.getReports);
router.get('/analytics/export', adminAuthMiddleware, analyticsController.exportCSV);

module.exports = router;
