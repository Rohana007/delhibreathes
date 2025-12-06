const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token middleware
 * Attaches userId and email to req.userId and req.userEmail
 */
function verifyJWT(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required',
        message: 'Please provide a valid authentication token',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const secret = process.env.JWT_SECRET || process.env.VERIFICATION_TOKEN_SECRET;
    if (!secret) {
      logger.error('[JWT Auth] JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'JWT secret not configured',
      });
    }

    try {
      const decoded = jwt.verify(token, secret);

      // Attach user info to request
      req.userId = decoded.userId;
      req.userEmail = decoded.email;

      logger.info(`[JWT Auth] Token verified for userId: ${decoded.userId}, email: ${decoded.email}`);
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired. Please login again.',
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Invalid authentication token. Please login again.',
        });
      }

      throw jwtError;
    }
  } catch (error) {
    logger.error(`[JWT Auth] Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
}

module.exports = {
  verifyJWT,
};

