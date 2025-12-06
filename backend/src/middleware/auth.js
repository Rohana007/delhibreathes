const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token (from Firebase Phone Auth)
 * Middleware to verify user authentication
 */
function verifyUser(req, res, next) {
  try {
    // Get token from Authorization header or body
    let token = null;

    // Check Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check body token
    if (!token && req.body.token) {
      token = req.body.token;
    }

    // Check query parameter (for backward compatibility)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Phone verification required',
        error: 'No token provided',
      });
    }

    // Verify JWT token
    const secret = process.env.VERIFICATION_TOKEN_SECRET;
    if (!secret) {
      logger.error('[Auth Middleware] VERIFICATION_TOKEN_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Phone verification required',
        error: 'Server configuration error',
      });
    }

    try {
      const decoded = jwt.verify(token, secret);
      
      // Attach phone to request
      req.phone = decoded.phone;
      
      logger.info(`[Auth Middleware] Token verified for phone: ${decoded.phone}`);
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Phone verification required',
          error: 'Token expired. Please verify your phone again.',
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Phone verification required',
          error: 'Invalid token',
        });
      }
      
      throw jwtError;
    }
  } catch (error) {
    logger.error(`[Auth Middleware] Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Phone verification required',
      error: 'Authentication error',
    });
  }
}

module.exports = {
  verifyUser,
};

