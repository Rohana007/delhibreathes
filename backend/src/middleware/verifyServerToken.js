const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to verify server JWT token
 * Expects Authorization: Bearer <token> header
 */
function verifyServerToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
        message: 'Please provide a valid authorization token',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const secret = process.env.VERIFICATION_TOKEN_SECRET;

    if (!secret) {
      logger.error('[JWT] VERIFICATION_TOKEN_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, secret);

    // Attach decoded token to request
    req.user = {
      phone: decoded.phone,
      firebaseUid: decoded.firebaseUid,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please authenticate again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid authorization token',
      });
    }

    logger.error(`[JWT] Token verification error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Token verification failed',
    });
  }
}

module.exports = verifyServerToken;

