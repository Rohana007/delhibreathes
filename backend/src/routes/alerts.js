const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

/**
 * POST /api/alerts/enable
 * Enable personalized alerts
 */
router.post('/enable', alertsController.enableAlerts);

/**
 * POST /api/alerts/disable
 * Disable personalized alerts
 */
router.post('/disable', alertsController.disableAlerts);

/**
 * GET /api/alerts/status/:phone
 * Get alerts status for a user
 */
router.get('/status/:phone', alertsController.getAlertsStatus);

/**
 * POST /api/alerts/test
 * Send test alert (SMS + WhatsApp)
 */
router.post('/test', alertsController.sendTestAlert);

module.exports = router;

