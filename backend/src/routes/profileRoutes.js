const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyJWT } = require('../middleware/jwtAuth');
const { handleUpload } = require('../middleware/upload');

/**
 * GET /api/profile
 * Get user profile
 * Protected: Requires JWT
 */
router.get('/', verifyJWT, profileController.getProfile);

/**
 * PUT /api/profile/edit
 * Update user profile (name + profile photo)
 * Protected: Requires JWT
 */
router.put(
  '/edit',
  verifyJWT,
  handleUpload,
  profileController.updateProfile
);

module.exports = router;

