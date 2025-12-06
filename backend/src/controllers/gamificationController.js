const GamificationProfile = require('../models/GamificationProfile');
const User = require('../models/User');
const logger = require('../utils/logger');
const { ensureConnectionAndQuery } = require('../utils/mongoHelper');
const { calculateLevel } = require('../utils/greenPoints');

/**
 * Get gamification summary
 * GET /api/user/gamification/summary
 */
async function getSummary(req, res) {
  try {
    const userId = req.userId; // From JWT middleware

    const profile = await ensureConnectionAndQuery(async () => {
      return await GamificationProfile.findOne({ userId });
    });

    // If profile doesn't exist, create one (migration for existing users)
    if (!profile) {
      const user = await ensureConnectionAndQuery(async () => {
        return await User.findById(userId);
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Create profile with existing greenPoints or default 10
      const initialPoints = user.greenPoints || 10;
      const newProfile = await ensureConnectionAndQuery(async () => {
        return await GamificationProfile.create({
          userId,
          totalPoints: initialPoints,
          currentPointsBalance: initialPoints,
          level: calculateLevel(initialPoints),
          badges: initialPoints >= 10 ? ['NEW_USER'] : [],
          rewardsUnlocked: [],
        });
      });

      // FIX: Return badges with earned property for new profile
      const allBadgeCodes = ['NEW_USER', 'FIRST_REPORT', 'AIR_WARRIOR', 'GREEN_GUARDIAN', 'SMOKELESS_HERO', 'ECO_TRAVELLER', 'DATA_CONTRIBUTOR', 'ECO_HERO'];
      const newUserBadges = newProfile.badges || [];
      const badgesWithEarned = allBadgeCodes.map(badgeCode => ({
        badge_code: badgeCode,
        earned: newUserBadges.includes(badgeCode),
      }));

      // FIX: Return rewards with unlocked property for new profile
      const allRewardCodes = ['METRO10', 'BUSPASS_DAY', 'HEALTHCHK_DISCOUNT', 'HEALTHMASK', 'GREENPASS'];
      const newUserRewardsUnlocked = newProfile.rewardsUnlocked || [];
      const newCurrentPoints = newProfile.currentPointsBalance || 0;
      const newCurrentLevel = newProfile.level || 1;
      
      const rewardRequirements = {
        METRO10: { points: 200, level: 0 },
        BUSPASS_DAY: { points: 150, level: 0 },
        HEALTHCHK_DISCOUNT: { points: 300, level: 0 },
        HEALTHMASK: { points: 0, level: 4 },
        GREENPASS: { points: 0, level: 7 },
      };
      
      const rewardsWithUnlocked = allRewardCodes.map(rewardCode => {
        const requirements = rewardRequirements[rewardCode] || { points: 0, level: 0 };
        const isUnlocked = newUserRewardsUnlocked.includes(rewardCode) || 
                          (requirements.points > 0 && newCurrentPoints >= requirements.points) ||
                          (requirements.level > 0 && newCurrentLevel >= requirements.level);
        return {
          reward_code: rewardCode,
          unlocked: isUnlocked,
          points_cost: requirements.points || null,
          level_required: requirements.level || null,
        };
      });

      return res.json({
        success: true,
        gp: newProfile.currentPointsBalance,
        current_points_balance: newProfile.currentPointsBalance,
        level: newProfile.level,
        badges: badgesWithEarned,
        rewards: rewardsWithUnlocked,
        nextLevelPoints: (newProfile.level * 100) - newProfile.totalPoints,
        totalPoints: newProfile.totalPoints,
      });
    }

    const nextLevelPoints = (profile.level * 100) - profile.totalPoints;

    // FIX: Return badges with earned property for all available badges
    const allBadgeCodes = ['NEW_USER', 'FIRST_REPORT', 'AIR_WARRIOR', 'GREEN_GUARDIAN', 'SMOKELESS_HERO', 'ECO_TRAVELLER', 'DATA_CONTRIBUTOR', 'ECO_HERO'];
    const userBadges = profile.badges || [];
    const badgesWithEarned = allBadgeCodes.map(badgeCode => ({
      badge_code: badgeCode,
      earned: userBadges.includes(badgeCode),
    }));

    // FIX: Return rewards with unlocked property based on points balance and level
    const allRewardCodes = ['METRO10', 'BUSPASS_DAY', 'HEALTHCHK_DISCOUNT', 'HEALTHMASK', 'GREENPASS'];
    const userRewardsUnlocked = profile.rewardsUnlocked || [];
    const currentPoints = profile.currentPointsBalance || 0;
    const currentLevel = profile.level || 1;
    
    // Reward point costs and level requirements
    const rewardRequirements = {
      METRO10: { points: 200, level: 0 },
      BUSPASS_DAY: { points: 150, level: 0 },
      HEALTHCHK_DISCOUNT: { points: 300, level: 0 },
      HEALTHMASK: { points: 0, level: 4 },
      GREENPASS: { points: 0, level: 7 },
    };
    
    const rewardsWithUnlocked = allRewardCodes.map(rewardCode => {
      const requirements = rewardRequirements[rewardCode] || { points: 0, level: 0 };
      const isUnlocked = userRewardsUnlocked.includes(rewardCode) || 
                        (requirements.points > 0 && currentPoints >= requirements.points) ||
                        (requirements.level > 0 && currentLevel >= requirements.level);
      return {
        reward_code: rewardCode,
        unlocked: isUnlocked,
        points_cost: requirements.points || null,
        level_required: requirements.level || null,
      };
    });

    res.json({
      success: true,
      gp: profile.currentPointsBalance,
      current_points_balance: profile.currentPointsBalance,
      level: profile.level,
      badges: badgesWithEarned,
      rewards: rewardsWithUnlocked,
      nextLevelPoints: nextLevelPoints > 0 ? nextLevelPoints : 100 - (profile.totalPoints % 100),
      totalPoints: profile.totalPoints,
    });
  } catch (error) {
    logger.error(`[Gamification] Get summary error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get gamification summary',
      message: error.message,
    });
  }
}

/**
 * Get user badges
 * GET /api/user/badges
 */
async function getBadges(req, res) {
  try {
    const userId = req.userId;

    const profile = await ensureConnectionAndQuery(async () => {
      return await GamificationProfile.findOne({ userId });
    });

    if (!profile) {
      return res.json({
        success: true,
        badges: [],
      });
    }

    res.json({
      success: true,
      badges: profile.badges || [],
    });
  } catch (error) {
    logger.error(`[Gamification] Get badges error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get badges',
      message: error.message,
    });
  }
}

/**
 * Get user rewards
 * GET /api/user/rewards
 */
async function getRewards(req, res) {
  try {
    const userId = req.userId;

    const profile = await ensureConnectionAndQuery(async () => {
      return await GamificationProfile.findOne({ userId });
    });

    if (!profile) {
      return res.json({
        success: true,
        rewards: [],
      });
    }

    res.json({
      success: true,
      rewards: profile.rewardsUnlocked || [],
    });
  } catch (error) {
    logger.error(`[Gamification] Get rewards error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get rewards',
      message: error.message,
    });
  }
}

module.exports = {
  getSummary,
  getBadges,
  getRewards,
  calculateLevel,
};

