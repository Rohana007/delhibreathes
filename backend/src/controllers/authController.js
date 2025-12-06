const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const User = require('../models/User');
const { ensureConnectionAndQuery } = require('../utils/mongoHelper');

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, email, and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password too short',
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ email: email.toLowerCase() });
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await ensureConnectionAndQuery(async () => {
      return await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        greenPoints: 10, // Initialize with 10 points
      });
    });

    // Create gamification profile
    const GamificationProfile = require('../models/GamificationProfile');
    await ensureConnectionAndQuery(async () => {
      return await GamificationProfile.create({
        userId: user._id,
        totalPoints: 10,
        currentPointsBalance: 10,
        level: 1,
        badges: ['NEW_USER'],
        rewardsUnlocked: [],
      });
    });

    // Generate JWT token
    const secret = process.env.JWT_SECRET || process.env.VERIFICATION_TOKEN_SECRET;
    if (!secret) {
      logger.error('[Auth] JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'JWT secret not configured',
      });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    logger.info(`[Auth] New user signed up: ${user.email}, ID: ${user._id}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        greenPoints: user.greenPoints,
      },
    });
  } catch (error) {
    logger.error(`[Auth] Signup error: ${error.message}`);
    console.error('[Auth] Signup error:', error);

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
      error: 'Failed to sign up',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while signing up'
        : error.message || 'An error occurred while signing up',
    });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ email: email.toLowerCase().trim() });
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || process.env.VERIFICATION_TOKEN_SECRET;
    if (!secret) {
      logger.error('[Auth] JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'JWT secret not configured',
      });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    logger.info(`[Auth] User logged in: ${user.email}, ID: ${user._id}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        greenPoints: user.greenPoints,
      },
    });
  } catch (error) {
    logger.error(`[Auth] Login error: ${error.message}`);
    console.error('[Auth] Login error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while logging in'
        : error.message || 'An error occurred while logging in',
    });
  }
}

/**
 * Get current user (validate token)
 * GET /api/auth/me
 */
async function getMe(req, res) {
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
    logger.error(`[Auth] Get me error: ${error.message}`);
    console.error('[Auth] Get me error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while fetching user data'
        : error.message || 'An error occurred while fetching user data',
    });
  }
}

/**
 * Change user password
 * POST /api/auth/change-password
 * Protected: Requires JWT
 */
async function changePassword(req, res) {
  try {
    const userId = req.userId; // From JWT middleware
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Current password and new password are required',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password too short',
        message: 'New password must be at least 6 characters long',
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

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await ensureConnectionAndQuery(async () => {
      return await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
    });

    logger.info(`[Auth] Password changed for user: ${user.email}, ID: ${user._id}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error(`[Auth] Change password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message || 'An error occurred while changing password',
    });
  }
}

module.exports = {
  signup,
  login,
  getMe,
  changePassword,
};
