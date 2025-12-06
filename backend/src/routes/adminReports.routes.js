const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const maskService = require('../services/maskService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');

/**
 * GET /api/admin/reports
 * Get all reports with filters and pagination
 */
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
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
      // Search for phone number (exact match or partial)
      query.phone = { $regex: phone, $options: 'i' };
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Include the entire day
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDateEnd;
      }
    }

    logger.info(`[Admin Reports] Fetching reports - Filters: ${JSON.stringify(query)}, Page: ${pageNum}, Limit: ${limitNum}`);

    // Get total count for pagination
    const total = await Report.countDocuments(query);

    // Fetch reports with pagination, sorted by createdAt (newest first)
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

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
            logger.info(`[Admin Reports] Fetched email from User model for report ${report._id}`);
          } else {
            reportEmail = 'No Email Available';
          }
        } catch (emailError) {
          logger.error(`[Admin Reports] Error fetching email for userId ${userId}:`, emailError.message);
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
        phone: maskService.maskPhone(report.phone),
        phoneOriginal: report.phone, // Include original for admin use (can be removed if not needed)
        category: report.category,
        description: report.description,
        location: report.location,
        imageUrl: report.imageUrl || report.photo, // Support both field names
        timestamp: report.timestamp,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        status: report.status || 'Pending',
      };
    }));

    const totalPages = Math.ceil(total / limitNum);

    logger.info(`[Admin Reports] Found ${reports.length} reports (page ${pageNum} of ${totalPages})`);

    res.json({
      success: true,
      reports: formattedReports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
      },
    });
  } catch (error) {
    logger.error(`[Admin Reports] Error: ${error.message}`);
    console.error('[Admin Reports] Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message || 'An error occurred while fetching reports',
    });
  }
});

/**
 * GET /api/admin/reports/map-data
 * Get geo locations for map + heatmap
 */
router.get('/map-data', adminAuthMiddleware, async (req, res) => {
  try {
    const { category, status, fromDate, toDate } = req.query;

    // Build query (same as reports list)
    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

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

    logger.info(`[Admin Map Data] Fetching map data with filters: ${JSON.stringify(query)}`);

    // Fetch reports with location data only
    const reports = await Report.find(query)
      .select('location category status createdAt timestamp')
      .lean();

    // Format for map/heatmap
    const mapData = reports
      .filter(report => report.location && report.location.lat && report.location.lng)
      .map(report => ({
        id: report._id.toString(),
        lat: report.location.lat,
        lng: report.location.lng,
        category: report.category,
        status: report.status || 'Pending',
        timestamp: report.timestamp || report.createdAt,
      }));

    logger.info(`[Admin Map Data] Returning ${mapData.length} locations`);

    res.json({
      success: true,
      locations: mapData,
      count: mapData.length,
    });
  } catch (error) {
    logger.error(`[Admin Map Data] Error: ${error.message}`);
    console.error('[Admin Map Data] Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch map data',
      message: error.message || 'An error occurred while fetching map data',
    });
  }
});

/**
 * PATCH /api/admin/reports/:id/status
 * Update report status
 */
router.patch('/:id/status', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Reviewed', 'Action Taken'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Find report
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: 'Report with the given ID does not exist',
      });
    }

    const oldStatus = report.status || 'Pending';

    // Update status
    report.status = status;
    await report.save();

    logger.info(`[Admin Status Update] Report ${id} status updated from ${oldStatus} to ${status} by admin ${req.admin.email}`);

    // Send SMS notification if status changed and phone number exists
    let smsSent = false;
    if (oldStatus !== status && report.phone) {
      try {
        const statusMessage = status === 'Reviewed' 
          ? 'Your pollution report has been reviewed by our team.'
          : status === 'Action Taken'
          ? 'Action has been taken on your pollution report. Thank you for your contribution!'
          : 'Your pollution report status has been updated.';

        const message = `Your pollution report (ID: ${id.slice(-8).toUpperCase()}) status updated: ${status}. ${statusMessage} - Delhi Breathes`;

        // Use sendStatusUpdateSMS for custom status update messages
        const smsResult = await smsService.sendStatusUpdateSMS(report.phone, id, status, message);
        if (smsResult.success) {
          smsSent = true;
          logger.info(`[Admin Status Update] SMS sent to ${maskService.maskPhone(report.phone)} for report ${id}`);
        } else {
          logger.error(`[Admin Status Update] Failed to send SMS to ${maskService.maskPhone(report.phone)} for report ${id}: ${smsResult.message}`);
        }
      } catch (smsError) {
        logger.error(`[Admin Status Update] SMS error for report ${id}: ${smsError.message}`);
      }
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: {
        id: report._id.toString(),
        status: report.status,
        phone: maskService.maskPhone(report.phone),
      },
      notify: smsSent,
    });
  } catch (error) {
    logger.error(`[Admin Status Update] Error: ${error.message}`);
    console.error('[Admin Status Update] Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update report status',
      message: error.message || 'An error occurred while updating report status',
    });
  }
});

/**
 * GET /api/admin/reports/export
 * Export reports as CSV
 */
router.get('/export', adminAuthMiddleware, async (req, res) => {
  try {
    const {
      category,
      status,
      phone,
      fromDate,
      toDate,
    } = req.query;

    // Build query (same as reports list)
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

    logger.info(`[Admin Export] Exporting reports with filters: ${JSON.stringify(query)}`);

    // Fetch all matching reports (no pagination for export)
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const csvHeaders = ['ID', 'Phone', 'Category', 'Description', 'Status', 'Latitude', 'Longitude', 'Created At', 'Updated At'];
    const csvRows = reports.map(report => [
      report._id.toString(),
      maskService.maskPhone(report.phone),
      report.category,
      `"${(report.description || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
      report.status || 'Pending',
      report.location?.lat || '',
      report.location?.lng || '',
      report.createdAt ? new Date(report.createdAt).toISOString() : '',
      report.updatedAt ? new Date(report.updatedAt).toISOString() : '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n');

    // Set headers for CSV download
    const filename = `delhi-breathes-reports-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info(`[Admin Export] Exported ${reports.length} reports to CSV`);

    res.send(csvContent);
  } catch (error) {
    logger.error(`[Admin Export] Error: ${error.message}`);
    console.error('[Admin Export] Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to export reports',
      message: error.message || 'An error occurred while exporting reports',
    });
  }
});

module.exports = router;

