const Report = require('../models/Report');
const User = require('../models/User');
const logger = require('../utils/logger');
const { increaseGreenPoints } = require('../utils/greenPoints');
const { ensureConnectionAndQuery } = require('../utils/mongoHelper');

/**
 * Submit a pollution report
 * POST /api/reports/create
 * Protected: Requires JWT
 */
async function submitReport(req, res) {
  try {
    const { description, location } = req.body;
    const userId = req.userId; // From JWT middleware
    const userEmail = req.userEmail; // From JWT middleware

    // Log incoming request for debugging
    logger.info(`[Report] Submission attempt - UserId: ${userId}, Email: ${userEmail}`);
    logger.info(`[Report] Request body keys: ${Object.keys(req.body).join(', ')}`);
    logger.info(`[Report] Has file: ${!!req.file}, Description length: ${description?.length || 0}, Location: ${location}`);

    // Validate required fields
    if (!description || !location) {
      logger.warn(`[Report] Missing required fields - description: ${!!description}, location: ${!!location}`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Description and location are required',
      });
    }

    // Validate description length
    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Description too short',
        message: 'Description must be at least 10 characters',
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Description too long',
        message: 'Description cannot exceed 500 characters',
      });
    }

    // Handle photo upload
    let photoUrl = null;
    if (req.file) {
      const uploadBaseUrl = process.env.UPLOAD_BASE_URL || '/uploads';
      photoUrl = `${uploadBaseUrl}/${req.file.filename}`;
      logger.info(`[Report] Photo uploaded: ${photoUrl}`);
    }

    // Validate category
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required',
        message: 'Please select a type of pollution',
      });
    }

    const validCategories = ['pollution', 'burning', 'construction', 'industrial', 'traffic', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        message: 'Please select a valid pollution type',
      });
    }

    // FIX: Fetch email and name from User model if not available from JWT
    let reportEmail = userEmail;
    let reportName = req.body.profile_name || null;
    const idempotencyKey = req.body.idempotency_key || null;
    
    // Idempotency check: prevent duplicate submissions
    if (idempotencyKey) {
      try {
        const existingReport = await ensureConnectionAndQuery(async () => {
          return await Report.findOne({ idempotency_key: idempotencyKey }).lean();
        });
        if (existingReport) {
          logger.info(`[Report] Duplicate submission detected with idempotency_key: ${idempotencyKey}`);
          return res.json({
            success: true,
            reportId: existingReport._id.toString(),
            report: {
              id: existingReport._id,
              userId: existingReport.userId,
              email: existingReport.email,
              name: existingReport.name,
              location: existingReport.location,
              description: existingReport.description,
              photo: existingReport.photo,
              status: existingReport.status,
              createdAt: existingReport.createdAt,
            },
            duplicate: true,
          });
        }
      } catch (idempError) {
        logger.warn(`[Report] Idempotency check error: ${idempError.message}`);
      }
    }
    
    // Fetch user profile if email or name is missing
    if ((!reportEmail || !reportName) && userId) {
      try {
        const user = await ensureConnectionAndQuery(async () => {
          return await User.findById(userId).select('email name').lean();
        });
        if (user) {
          reportEmail = reportEmail || user.email || 'No Email Available';
          reportName = reportName || user.name || 'Unknown';
          logger.info(`[Report] Fetched profile from User model for userId: ${userId}`);
        } else {
          reportEmail = reportEmail || 'No Email Available';
          reportName = reportName || 'Unknown';
          logger.warn(`[Report] User not found in User model for userId: ${userId}`);
        }
      } catch (profileError) {
        logger.error(`[Report] Error fetching user profile: ${profileError.message}`);
        reportEmail = reportEmail || 'No Email Available';
        reportName = reportName || 'Unknown';
      }
    }
    
    // Set fallbacks if still missing
    if (!reportEmail) {
      reportEmail = 'No Email Available';
    }
    if (!reportName) {
      reportName = 'Unknown';
    }

    // Create report
    const report = await ensureConnectionAndQuery(async () => {
      return await Report.create({
        userId,
        email: reportEmail,
        name: reportName,
        location: location.trim(),
        category: category.trim(),
        description: description.trim(),
        photo: photoUrl,
        status: 'Pending',
        idempotency_key: idempotencyKey,
      });
    });

    logger.info(`[Report] Report submitted by userId: ${userId}, ID: ${report._id}`);

    // Increase green points with gamification (non-blocking)
    // Get report count for badge checking (including the one just created)
    const reportCount = await ensureConnectionAndQuery(async () => {
      return await Report.countDocuments({ userId });
    });
    
    // Get verified report count for GREEN_GUARDIAN badge
    const verifiedReports = await ensureConnectionAndQuery(async () => {
      return await Report.countDocuments({ 
        userId,
        status: { $in: ['Reviewed', 'Action Taken'] }
      });
    });
    
    increaseGreenPoints(userId, 10, { reportCount, verifiedReports })
      .then((result) => {
        if (result.success) {
          logger.info(`[Report] Added 10 green points to user ${userId}. New total: ${result.newTotal}, Level: ${result.newLevel}`);
          if (result.levelUp) {
            logger.info(`[Report] 🎉 LEVEL UP! User ${userId} reached level ${result.newLevel}`);
          }
          if (result.unlockedBadges && result.unlockedBadges.length > 0) {
            logger.info(`[Report] 🏆 Badges unlocked: ${result.unlockedBadges.join(', ')}`);
          }
          if (result.unlockedRewards && result.unlockedRewards.length > 0) {
            logger.info(`[Report] 🎁 Rewards unlocked: ${result.unlockedRewards.join(', ')}`);
          }
        } else {
          logger.error(`[Report] Failed to add green points to user ${userId}: ${result.error}`);
        }
      })
      .catch((error) => {
        logger.error(`[Report] Green points error for report ${report._id}: ${error.message}`);
      });

    res.json({
      success: true,
      reportId: report._id.toString(),
      report: {
        id: report._id,
        userId: report.userId,
        email: report.email,
        name: report.name,
        location: report.location,
        description: report.description,
        photo: report.photo,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    logger.error(`[Report] Submission error: ${error.message}`);
    logger.error(`[Report] Error stack: ${error.stack}`);
    console.error('[Report] Full error:', error);

    // Check if it's a MongoDB connection error
    if (error.name === 'MongoServerError' || error.message.includes('MongoServerError')) {
      return res.status(503).json({
        success: false,
        error: 'Database connection error',
        message: 'Unable to connect to database. Please try again later.',
      });
    }

    // Check if it's a Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: errors || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit report',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while submitting the report'
        : error.message || 'An error occurred while submitting the report',
    });
  }
}

/**
 * Get user's reports
 * GET /api/reports/my-reports
 * Protected: Requires JWT
 */
async function getMyReports(req, res) {
  try {
    const userId = req.userId; // From JWT middleware

    // Build query by userId
    const query = { userId };

    // Fetch reports sorted by createdAt (newest first)
    const reports = await ensureConnectionAndQuery(async () => {
      return await Report.find(query)
        .sort({ createdAt: -1 })
        .lean();
    });

    logger.info(`[Report] Fetched ${reports.length} reports for userId: ${userId}`);

    res.json({
      success: true,
      reports: reports.map(report => ({
        id: report._id,
        userId: report.userId,
        email: report.email,
        location: report.location,
        category: report.category,
        description: report.description,
        photo: report.photo,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
    });
  } catch (error) {
    logger.error(`[Report] Fetch error: ${error.message}`);
    console.error(error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message || 'An error occurred while fetching reports',
    });
  }
}

/**
 * Update report status
 * PATCH /api/reports/:id/status
 * Public endpoint (for policy makers)
 */
async function updateReportStatus(req, res) {
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

    // Find and update report
    const report = await ensureConnectionAndQuery(async () => {
      const foundReport = await Report.findById(id);
      if (!foundReport) {
        return null;
      }
      
      // Update status
      foundReport.status = status;
      await foundReport.save();
      
      return foundReport;
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: 'Report with the given ID does not exist',
      });
    }

    logger.info(`[Report] Status updated for report ${id}: ${status}`);

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: {
        id: report._id.toString(),
        status: report.status,
        email: report.email,
        category: report.category,
        description: report.description,
        location: report.location,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`[Report] Status update error: ${error.message}`);
    console.error('[Report] Status update error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update report status',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while updating report status'
        : error.message || 'An error occurred while updating report status',
    });
  }
}

module.exports = {
  submitReport,
  getMyReports,
  updateReportStatus,
};
