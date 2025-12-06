const crypto = require('crypto');
const logger = require('../utils/logger');

class OTPService {
  constructor() {
    // In-memory storage for OTPs (use Redis/MongoDB in production)
    this.otpStore = new Map();
    this.otpAttempts = new Map(); // Track OTP send attempts per phone
    this.otpTTL = 5 * 60 * 1000; // 5 minutes
    this.maxOTPSendsPerHour = 5;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash OTP for storage
   */
  hashOTP(otp) {
    const salt = process.env.OTP_SECRET_SALT || 'default-salt-change-in-production';
    return crypto.createHash('sha256').update(otp + salt).digest('hex');
  }

  /**
   * Verify OTP
   */
  verifyOTP(phone, otp) {
    const key = `otp:${phone}`;
    const stored = this.otpStore.get(key);
    
    if (!stored) {
      logger.warn(`OTP verification failed: No OTP found for ${this.maskPhone(phone)}`);
      return { valid: false, error: 'OTP not found or expired' };
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(key);
      logger.warn(`OTP verification failed: OTP expired for ${this.maskPhone(phone)}`);
      return { valid: false, error: 'OTP expired' };
    }

    if (stored.attempts >= 3) {
      logger.warn(`OTP verification failed: Too many attempts for ${this.maskPhone(phone)}`);
      return { valid: false, error: 'Too many verification attempts. Please request a new OTP.' };
    }

    const hashedOTP = this.hashOTP(otp);
    if (hashedOTP !== stored.hashedOTP) {
      stored.attempts += 1;
      this.otpStore.set(key, stored);
      logger.warn(`OTP verification failed: Invalid OTP for ${this.maskPhone(phone)} (attempt ${stored.attempts})`);
      return { valid: false, error: 'Invalid OTP' };
    }

    // OTP verified successfully
    this.otpStore.delete(key);
    logger.info(`OTP verified successfully for ${this.maskPhone(phone)}`);
    return { valid: true };
  }

  /**
   * Store OTP for a phone number
   */
  storeOTP(phone, otp) {
    const key = `otp:${phone}`;
    const hashedOTP = this.hashOTP(otp);
    
    this.otpStore.set(key, {
      hashedOTP,
      phone,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.otpTTL,
      attempts: 0,
    });

    return { expiresAt: Date.now() + this.otpTTL };
  }

  /**
   * Check if phone can receive OTP (rate limiting)
   */
  canSendOTP(phone) {
    const key = `attempts:${phone}`;
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const attempts = this.otpAttempts.get(key) || [];
    const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
    
    if (recentAttempts.length >= this.maxOTPSendsPerHour) {
      const oldestAttempt = recentAttempts[0];
      const retryAfter = Math.ceil((oldestAttempt + (60 * 60 * 1000) - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: retryAfter,
        error: `You can request only ${this.maxOTPSendsPerHour} OTPs per hour. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      };
    }

    // Record this attempt
    recentAttempts.push(now);
    this.otpAttempts.set(key, recentAttempts);

    return { allowed: true };
  }

  /**
   * Mask phone number for logging
   */
  maskPhone(phone) {
    if (!phone || phone.length < 4) return 'XXXX';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return 'XXXX';
    const last4 = cleaned.slice(-4);
    return `+${cleaned.slice(0, -4).replace(/\d/g, 'X')}-${last4}`;
  }

  /**
   * Cleanup expired OTPs and old attempts
   */
  cleanup() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    // Cleanup expired OTPs
    for (const [key, value] of this.otpStore.entries()) {
      if (now > value.expiresAt) {
        this.otpStore.delete(key);
      }
    }

    // Cleanup old attempt records
    for (const [key, attempts] of this.otpAttempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
      if (recentAttempts.length === 0) {
        this.otpAttempts.delete(key);
      } else {
        this.otpAttempts.set(key, recentAttempts);
      }
    }
  }

  /**
   * Get OTP info (for debugging)
   */
  getOTPInfo(phone) {
    const key = `otp:${phone}`;
    const stored = this.otpStore.get(key);
    if (!stored) return null;
    
    return {
      phone: this.maskPhone(phone),
      createdAt: new Date(stored.createdAt).toISOString(),
      expiresAt: new Date(stored.expiresAt).toISOString(),
      attempts: stored.attempts,
      timeRemaining: Math.max(0, Math.ceil((stored.expiresAt - Date.now()) / 1000)),
    };
  }
}

module.exports = new OTPService();

