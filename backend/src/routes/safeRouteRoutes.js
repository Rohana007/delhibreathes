/**
 * Safe Route Routes
 * Routes for AirShield Navigator (Safe Route Finder)
 */
const express = require('express');
const router = express.Router();
const safeRouteController = require('../controllers/safeRouteController');

/**
 * GET /api/safe-route/find
 * Get safe route between two points
 * Query params:
 *   - source_lat (required)
 *   - source_lng (required)
 *   - dest_lat (required)
 *   - dest_lng (required)
 *   - weight_distance (optional, default: 0.6)
 *   - weight_pollution (optional, default: 0.3)
 *   - weight_traffic (optional, default: 0.1)
 */
router.get('/find', safeRouteController.getSafeRoute);

/**
 * GET /api/safe-route/health
 * Health check for Safe Route service
 */
router.get('/health', safeRouteController.healthCheck);

module.exports = router;

