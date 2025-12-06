/**
 * Safe Route API Routes
 * All routes for Safe Route Finder (AirShield Navigator)
 * Exposed under /api/safe-route/*
 */
const express = require('express');
const router = express.Router();
const safeRouteController = require('../../controllers/safeRouteController');

/**
 * GET /api/safe-route/find
 * Find low pollution route between two points
 * 
 * Query params:
 *   - source_lat (required): Source latitude
 *   - source_lng (required): Source longitude
 *   - dest_lat (required): Destination latitude
 *   - dest_lng (required): Destination longitude
 *   - weight_distance (optional, default: 0.6): Weight for distance
 *   - weight_pollution (optional, default: 0.3): Weight for pollution
 *   - weight_traffic (optional, default: 0.1): Weight for traffic
 */
router.get('/find', safeRouteController.getSafeRoute);

/**
 * GET /api/safe-route/with_traffic
 * Find route with real-time traffic data
 * Same params as /find but includes traffic information
 */
router.get('/with_traffic', safeRouteController.getSafeRouteWithTraffic);

/**
 * GET /api/safe-route/health
 * Health check for Safe Route service
 */
router.get('/health', safeRouteController.healthCheck);

/**
 * GET /api/safe-route/debug
 * Debug endpoint to check API key and configuration status
 */
router.get('/debug', safeRouteController.debug);

module.exports = router;

