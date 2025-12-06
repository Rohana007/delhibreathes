const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { firebaseAuthLimiter } = require('../middleware/rateLimit');

/**
 * POST /api/auth/firebase
 * Verify Firebase ID token and issue server JWT
 */
router.post('/firebase', firebaseAuthLimiter, authController.verifyFirebaseToken);

module.exports = router;

