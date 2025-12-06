const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for Firebase auth endpoint
 * Limit: 5 requests per hour
 */
const firebaseAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'You can only authenticate 5 times per hour. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for report submission
 * Limit: 5 requests per 10 minutes
 */
const reportSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many report submissions',
    message: 'You can only submit 5 reports every 10 minutes. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  firebaseAuthLimiter,
  reportSubmissionLimiter,
};

