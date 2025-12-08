const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reportRoutes');
const profileRoutes = require('./routes/profileRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const alertsRoutes = require('./routes/alerts');
const safeRouteApiRoutes = require('./safe_route/api/safe_route.routes'); // Safe Route API routes
const sourceIdentificationRoutes = require('./routes/sourceIdentificationRoute'); // Source Identification routes

// Import alert engine cron
require('./cron/alertEngine');

const app = express();

// Import MongoDB connection
const { connectDB, disconnectDB } = require('./config/db');

// Start server with port fallback
const startServer = (port, retries = 3) => {
  const portNum = parseInt(port, 10);
  const server = app.listen(portNum, () => {
    logger.info(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   🌬️  DELHI BREATHES API Server                               ║
  ║   Real-Time Air Intelligence for a Healthier Delhi            ║
  ║                                                               ║
  ║   Server running on port ${portNum}                                 ║
  ║   Environment: ${config.server.nodeEnv.padEnd(20)}                   ║
  ║                                                               ║
  ║   Endpoints:                                                  ║
  ║   • Health Check: http://localhost:${portNum}/api/health             ║
  ║   • DB Health:    http://localhost:${portNum}/api/db/health           ║
  ║   • AQI Data:     http://localhost:${portNum}/api/aqi/ncr            ║
  ║   • Predictions:  http://localhost:${portNum}/api/predictions        ║
  ║   • Insights:     http://localhost:${portNum}/api/insights           ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = portNum + 1;
      logger.warn(`Port ${portNum} is in use, trying port ${nextPort}...`);
      if (retries > 0) {
        startServer(nextPort, retries - 1);
      } else {
        logger.error('Could not find an available port. Please free up a port and try again.');
        process.exit(1);
      }
    } else {
      logger.error(`Server error: ${err.message}`);
      process.exit(1);
    }
  });

  return server;
};

// Initialize MongoDB connection before starting server
// This ensures database is connected before handling requests
(async () => {
  try {
    await connectDB();
    logger.info('[Server] MongoDB connected. Starting server...');
    
    // Start server after DB connection
    const PORT = config.server.port;
    startServer(PORT);
  } catch (error) {
    logger.error('[Server] Failed to connect to MongoDB. Server will not start.');
    logger.error('[Server] Error:', error.message);
    process.exit(1);
  }
})();

// Global rate limiter - more lenient for development
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow 100 requests per minute (very lenient)
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/api/health' || req.path === '/api/db/health';
  },
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from: ${origin}`);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Allow 200 requests per minute (very lenient for development)
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/db/health';
  },
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const path = require('path');
const fs = require('fs');
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const uploadBaseUrl = process.env.UPLOAD_BASE_URL || '/uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`[Server] Created upload directory: ${uploadDir}`);
}

// Resolve absolute path for static serving
const absoluteUploadDir = path.isAbsolute(uploadDir) 
  ? uploadDir 
  : path.join(__dirname, '..', uploadDir);

app.use(uploadBaseUrl, express.static(absoluteUploadDir));
logger.info(`[Server] Serving uploads from ${absoluteUploadDir} at ${uploadBaseUrl}`);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/user/gamification', gamificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertsRoutes);
// Safe Route API routes
app.use('/api/safe-route', safeRouteApiRoutes);
// Source Identification routes
app.use('/api/source-identification', sourceIdentificationRoutes);

// Other API routes (AQI, hotspots, etc.)
// This includes /api/reports (public endpoint for policy dashboard)
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Delhi Breathes API',
    version: '1.0.0',
    description: 'Real-Time Air Intelligence for a Healthier Delhi',
    documentation: '/api/health',
    endpoints: {
      aqi: '/api/aqi',
      ncrAqi: '/api/aqi/ncr',
      hotspots: '/api/hotspots',
      safeRoutes: '/api/routes/safe',
      safeRouteFinder: '/api/safe-route/find',
      predictions: '/api/predictions',
      insights: '/api/insights',
      chatbot: '/api/chat/selected',
      health: '/api/health',
      // Authentication Endpoints
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      getMe: '/api/auth/me',
      // Profile Endpoints
      getProfile: '/api/profile',
      updateProfile: '/api/profile/edit',
      // Report Endpoints
      createReport: '/api/reports/create',
      myReports: '/api/reports/my-reports',
      // Alert Endpoints
      enableAlerts: '/api/alerts/enable',
      disableAlerts: '/api/alerts/disable',
      alertsStatus: '/api/alerts/status/:phone',
      testAlert: '/api/alerts/test',
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup is handled in the async IIFE above
// This ensures MongoDB connects before server starts

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

module.exports = app;
