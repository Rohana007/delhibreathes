const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

// Enable alerts
router.post('/enable', alertsController.enableAlerts);

// Disable alerts
router.post('/disable', alertsController.disableAlerts);

// Get alerts status
router.get('/status/:phone', alertsController.getAlertsStatus);

// Send test alert
router.post('/test', alertsController.sendTestAlert);

// Legacy test alert endpoint (for backward compatibility)
router.post('/send-test', alertsController.sendTestAlert);

// Fetch alert data for region
router.get('/fetch-alert-data/:region', alertsController.fetchAlertData);

// Send AQI alert (legacy)
router.post('/send-alert', alertsController.sendAQIAlert);

module.exports = router;

