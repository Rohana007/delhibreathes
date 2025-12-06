const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const logger = require('../utils/logger');

/**
 * Middleware to verify admin JWT token
 * Expects Authorization: Bearer <admin-jwt-token>
 * Attaches admin info to req.admin
 */
async function adminAuthMiddleware(req, res, next) {
  try {
    // Check for policyAccess header (for policymaker access)
    const policyAccess = req.headers['x-policy-access'];
    if (policyAccess === 'true') {
      logger.info('[Admin Auth] Policy access granted via header');
      req.admin = { role: 'policymaker' };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
        message: 'Please provide a valid admin token or policy access',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    // Use ADMIN_JWT_SECRET with fallback to default secure key
    const jwtSecret = process.env.ADMIN_JWT_SECRET || 'DelhiBreathes@Admin2025SecureKey!';
    const decoded = jwt.verify(token, jwtSecret);

    // Find admin by ID
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Admin not found',
      });
    }

    // Attach admin info to request
    req.admin = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    logger.info(`[Admin Auth] Admin authenticated - ID: ${admin._id}, Email: ${admin.email}`);
    next();
  } catch (error) {
    logger.error(`[Admin Auth] Token verification error: ${error.message}`);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid admin token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Admin token has expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message || 'Failed to verify admin token',
    });
  }
}

module.exports = adminAuthMiddleware;

