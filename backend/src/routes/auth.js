const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middleware/jwtAuth');
const { firebaseAuthLimiter } = require('../middleware/rateLimit');
const checkDBConnection = require('../middleware/dbCheck');

/**
 * POST /api/auth/signup
 * Sign up a new user
 */
router.post('/signup', checkDBConnection, authController.signup);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', checkDBConnection, authController.login);

/**
 * GET /api/auth/me
 * Get current user (validate token)
 */
router.get('/me', verifyJWT, checkDBConnection, authController.getMe);

/**
 * POST /api/auth/change-password
 * Change user password
 * Protected: Requires JWT
 */
router.post('/change-password', verifyJWT, checkDBConnection, authController.changePassword);

module.exports = router;
