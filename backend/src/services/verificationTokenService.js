const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class VerificationTokenService {
  constructor() {
    this.secret = process.env.VERIFICATION_TOKEN_SECRET || process.env.JWT_SECRET || 'change-this-secret-in-production';
    this.tokenTTL = 15 * 60; // 15 minutes in seconds
    this.usedTokens = new Set(); // Track used tokens (single-use)
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Generate verification token for a verified phone
   */
  generateToken(phone) {
    const payload = {
      phone,
      type: 'report_verification',
      jti: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique token ID
    };

    const token = jwt.sign(payload, this.secret, {
      expiresIn: this.tokenTTL,
    });

    logger.info(`Verification token generated for ${this.maskPhone(phone)}`);
    return token;
  }

  /**
   * Verify token and extract phone
   */
  verifyToken(token) {
    try {
      // Check if token was already used
      if (this.usedTokens.has(token)) {
        logger.warn('Verification token reuse attempt detected');
        return { valid: false, error: 'Token already used' };
      }

      const decoded = jwt.verify(token, this.secret);

      // Validate token type
      if (decoded.type !== 'report_verification') {
        return { valid: false, error: 'Invalid token type' };
      }

      // Mark token as used (single-use)
      this.usedTokens.add(token);

      logger.info(`Verification token verified for ${this.maskPhone(decoded.phone)}`);
      return {
        valid: true,
        phone: decoded.phone,
        jti: decoded.jti,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Verification token expired');
        return { valid: false, error: 'Token expired' };
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid verification token');
        return { valid: false, error: 'Invalid token' };
      }
      logger.error(`Token verification error: ${error.message}`);
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Cleanup old used tokens (older than 1 hour)
   */
  cleanup() {
    // In production, use Redis with TTL instead of manual cleanup
    // For now, we'll keep a limited set and clear periodically
    if (this.usedTokens.size > 10000) {
      // Clear half of the oldest entries (simple approach)
      const tokensArray = Array.from(this.usedTokens);
      this.usedTokens = new Set(tokensArray.slice(tokensArray.length / 2));
    }
  }

  /**
   * Mask phone number
   */
  maskPhone(phone) {
    if (!phone || phone.length < 4) return 'XXXX';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return 'XXXX';
    const last4 = cleaned.slice(-4);
    return `+${cleaned.slice(0, -4).replace(/\d/g, 'X')}-${last4}`;
  }
}

module.exports = new VerificationTokenService();

