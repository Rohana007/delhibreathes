const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
// FIX: Changed to verifyServerToken - frontend sends server JWT token, not Firebase ID token
const verifyServerToken = require('../middleware/verifyServerToken');
const maskService = require('../services/maskService');
const logger = require('../utils/logger');

/**
 * GET /api/my-reports
 * Get user's reports with pagination
 * Protected: Requires server JWT token (issued by /api/auth/firebase)
 */
router.get('/', verifyServerToken, async (req, res) => {
  try {
    const phone = req.user.phone; // Normalized phone from middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    logger.info(`[My Reports] Fetching reports for phone: ${maskService.maskPhone(phone)}, page: ${page}, limit: ${limit}`);

    // Build query - match phone number (try both normalized and with +91)
    const phoneVariations = [
      phone,
      `+91${phone}`,
      `91${phone}`,
    ];

    const query = {
      phone: { $in: phoneVariations },
    };

    // Get total count for pagination
    const total = await Report.countDocuments(query);

    // Fetch reports with pagination, sorted by createdAt (newest first)
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format reports for response
    const formattedReports = reports.map(report => ({
      id: report._id.toString(),
      category: report.category,
      description: report.description,
      location: report.location,
      imageUrl: report.imageUrl,
      timestamp: report.timestamp,
      createdAt: report.createdAt,
      status: report.status || 'Pending', // Default status if not set
    }));

    const totalPages = Math.ceil(total / limit);

    logger.info(`[My Reports] Found ${reports.length} reports (page ${page} of ${totalPages}) for phone: ${maskService.maskPhone(phone)}`);

    res.json({
      success: true,
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    });
  } catch (error) {
    logger.error(`[My Reports] Error: ${error.message}`);
    console.error('[My Reports] Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message || 'An error occurred while fetching reports',
    });
  }
});

module.exports = router;

