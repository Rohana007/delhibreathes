const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

/**
 * GET /api/policy/policies
 * Get all available policies
 */
router.get('/policies', policyController.getPolicies);

/**
 * GET /api/policy/cities
 * Get all available cities
 */
router.get('/cities', policyController.getCities);

/**
 * GET /api/policy/zones
 * Get all available zones
 */
router.get('/zones', policyController.getZones);

/**
 * POST /api/policy/simulate
 * Simulate policy impact
 * Body: { region, policy, duration }
 */
router.post('/simulate', policyController.simulatePolicy);

module.exports = router;

