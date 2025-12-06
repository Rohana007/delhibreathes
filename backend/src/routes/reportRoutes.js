const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyJWT } = require('../middleware/jwtAuth');
const { handleUpload } = require('../middleware/upload');
const { reportSubmissionLimiter } = require('../middleware/rateLimit');

/**
 * POST /api/reports/create
 * Submit a pollution report
 * Protected: Requires JWT
 */
router.post(
  '/create',
  verifyJWT,
  reportSubmissionLimiter,
  handleUpload,
  reportController.submitReport
);

/**
 * GET /api/reports/my-reports
 * Get user's reports
 * Protected: Requires JWT
 */
router.get(
  '/my-reports',
  verifyJWT,
  reportController.getMyReports
);

module.exports = router;

