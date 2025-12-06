const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * GET /api/user/gamification/summary
 * Get gamification summary (GP, level, badges, rewards)
 * Protected: Requires JWT
 */
router.get('/summary', verifyJWT, gamificationController.getSummary);

/**
 * GET /api/user/badges
 * Get user badges
 * Protected: Requires JWT
 */
router.get('/badges', verifyJWT, gamificationController.getBadges);

/**
 * GET /api/user/rewards
 * Get user rewards
 * Protected: Requires JWT
 */
router.get('/rewards', verifyJWT, gamificationController.getRewards);

module.exports = router;

