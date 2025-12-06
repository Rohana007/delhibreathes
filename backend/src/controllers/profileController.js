const User = require('../models/User');
const logger = require('../utils/logger');
const { ensureConnectionAndQuery } = require('../utils/mongoHelper');

/**
 * Get user profile
 * GET /api/profile
 * Protected: Requires JWT
 */
async function getProfile(req, res) {
  try {
    const userId = req.userId; // From JWT middleware

    const user = await ensureConnectionAndQuery(async () => {
      return await User.findById(userId).select('-passwordHash');
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        greenPoints: user.greenPoints,
        region: user.region,
        healthCategory: user.healthCategory,
        alertsEnabled: user.alertsEnabled,
        whatsappEnabled: user.whatsappEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`[Profile] Get profile error: ${error.message}`);
    console.error('[Profile] Get profile error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while fetching profile'
        : error.message || 'An error occurred while fetching profile',
    });
  }
}

/**
 * Update user profile
 * PUT /api/profile/edit
 * Protected: Requires JWT
 */
async function updateProfile(req, res) {
  try {
    const userId = req.userId; // From JWT middleware
    const { name } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
        message: 'Name cannot be empty',
      });
    }

    // Find user
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findById(userId);
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found',
      });
    }

    // Update name
    user.name = name.trim();

    // Handle profile photo upload
    if (req.file) {
      const uploadBaseUrl = process.env.UPLOAD_BASE_URL || '/uploads';
      user.profilePhoto = `${uploadBaseUrl}/${req.file.filename}`;
      logger.info(`[Profile] Profile photo uploaded: ${user.profilePhoto}`);
    }

    // Save user
    await user.save();

    logger.info(`[Profile] Profile updated for userId: ${userId}`);

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        greenPoints: user.greenPoints,
        region: user.region,
        healthCategory: user.healthCategory,
        alertsEnabled: user.alertsEnabled,
        whatsappEnabled: user.whatsappEnabled,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`[Profile] Update profile error: ${error.message}`);
    console.error('[Profile] Update profile error:', error);

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
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while updating profile'
        : error.message || 'An error occurred while updating profile',
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};

