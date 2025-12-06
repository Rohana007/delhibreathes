const User = require('../models/User');
const GamificationProfile = require('../models/GamificationProfile');
const logger = require('../utils/logger');
const { ensureConnectionAndQuery } = require('../utils/mongoHelper');

/**
 * Calculate level based on total points
 * level = 1 + floor(total_points / 100)
 */
function calculateLevel(totalPoints) {
  return 1 + Math.floor(totalPoints / 100);
}

/**
 * Badge unlock rules - matching gamification engine logic
 */
const BADGE_RULES = {
  NEW_USER: { 
    condition: (profile) => profile.totalPoints >= 10,
    description: 'Welcome to Delhi Breathes!'
  },
  FIRST_REPORT: { 
    condition: async (profile, context) => {
      // Check if user has submitted at least 1 report
      const Report = require('../models/Report');
      const { ensureConnectionAndQuery } = require('./mongoHelper');
      const reportCount = await ensureConnectionAndQuery(async () => {
        return await Report.countDocuments({ userId: profile.userId });
      });
      return reportCount >= 1;
    },
    description: 'Submitted your first pollution report'
  },
  AIR_WARRIOR: { 
    condition: async (profile, context) => {
      // Check if user has completed 10 clean routes
      // Use context.cleanRoutes if provided, otherwise return false
      // In future, this should query a clean_routes collection or track route completions
      if (context.cleanRoutes !== undefined) {
        return context.cleanRoutes >= 10;
      }
      // For now, we can't track clean routes without a dedicated collection
      return false;
    },
    description: 'Completed 10 clean routes'
  },
  GREEN_GUARDIAN: { 
    condition: async (profile, context) => {
      // Check if user has 5 verified pollution reports
      const Report = require('../models/Report');
      const { ensureConnectionAndQuery } = require('./mongoHelper');
      const verifiedCount = await ensureConnectionAndQuery(async () => {
        return await Report.countDocuments({ 
          userId: profile.userId,
          status: { $in: ['Reviewed', 'Action Taken'] }
        });
      });
      return verifiedCount >= 5;
    },
    description: '5 verified pollution reports'
  },
  SMOKELESS_HERO: { 
    condition: async (profile, context) => {
      // Check for 7-day red-zone avoidance streak
      // This would need streak tracking - for now, check context
      // In future, query streaks collection
      return (context.redZoneStreakDays || 0) >= 7;
    },
    description: '7-day red-zone avoidance streak'
  },
  ECO_TRAVELLER: { 
    condition: async (profile, context) => {
      // Check for 20 public transport days
      // This would need public transport tracking
      return (context.publicTransportDays || 0) >= 20;
    },
    description: '20 public transport days'
  },
  DATA_CONTRIBUTOR: { 
    condition: async (profile, context) => {
      // Check for 50 total events logged
      // Count total reports as events for now
      const Report = require('../models/Report');
      const { ensureConnectionAndQuery } = require('./mongoHelper');
      const totalEvents = await ensureConnectionAndQuery(async () => {
        return await Report.countDocuments({ userId: profile.userId });
      });
      return totalEvents >= 50;
    },
    description: '50 events logged'
  },
  ECO_HERO: { 
    condition: (profile) => profile.level >= 5,
    description: 'Reached level 5'
  },
};

/**
 * Reward unlock rules
 */
const REWARD_RULES = {
  METRO10: { condition: (profile) => profile.level >= 3 },
  HEALTHMASK: { condition: (profile) => profile.level >= 4 },
  GREENPASS: { condition: (profile) => profile.level >= 7 },
};

/**
 * Check and unlock badges
 */
async function checkBadgeUnlocks(profile, context = {}) {
  const unlockedBadges = [];
  
  for (const [badgeCode, rule] of Object.entries(BADGE_RULES)) {
    // Skip if badge already unlocked
    if (profile.badges.includes(badgeCode)) {
      continue;
    }
    
    try {
      // Check condition - handle both sync and async conditions
      const conditionResult = rule.condition(profile, context);
      const isUnlocked = conditionResult instanceof Promise 
        ? await conditionResult 
        : conditionResult;
      
      if (isUnlocked) {
        unlockedBadges.push(badgeCode);
        logger.info(`[Gamification] Unlocked badge: ${badgeCode} for user ${profile.userId}`);
      }
    } catch (error) {
      logger.error(`[Gamification] Error checking badge ${badgeCode}: ${error.message}`);
    }
  }

  if (unlockedBadges.length > 0) {
    profile.badges = [...profile.badges, ...unlockedBadges];
    logger.info(`[Gamification] Unlocked badges for user ${profile.userId}: ${unlockedBadges.join(', ')}`);
  }

  return unlockedBadges;
}

/**
 * Check and unlock rewards
 */
async function checkRewardUnlocks(profile) {
  const unlockedRewards = [];
  
  for (const [rewardCode, rule] of Object.entries(REWARD_RULES)) {
    if (!profile.rewardsUnlocked.includes(rewardCode) && rule.condition(profile)) {
      unlockedRewards.push(rewardCode);
    }
  }

  if (unlockedRewards.length > 0) {
    profile.rewardsUnlocked = [...profile.rewardsUnlocked, ...unlockedRewards];
    logger.info(`[Gamification] Unlocked rewards for user ${profile.userId}: ${unlockedRewards.join(', ')}`);
  }

  return unlockedRewards;
}

/**
 * Increase green points for a user (upgraded with gamification)
 * @param {string} userId - User ID
 * @param {number} points - Points to add
 * @param {object} context - Additional context for badge checking (e.g., { reportCount, cleanRoutes })
 * @returns {Promise<{success: boolean, newTotal?: number, newLevel?: number, unlockedBadges?: string[], unlockedRewards?: string[], error?: string}>}
 */
async function increaseGreenPoints(userId, points, context = {}) {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    if (!points || points <= 0) {
      return {
        success: false,
        error: 'Points must be a positive number',
      };
    }

    // Fetch user
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findById(userId);
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Get or create gamification profile
    let profile = await ensureConnectionAndQuery(async () => {
      return await GamificationProfile.findOne({ userId });
    });

    if (!profile) {
      // Create profile with existing greenPoints or default 10
      const initialPoints = user.greenPoints || 10;
      profile = await ensureConnectionAndQuery(async () => {
        return await GamificationProfile.create({
          userId,
          totalPoints: initialPoints,
          currentPointsBalance: initialPoints,
          level: calculateLevel(initialPoints),
          badges: initialPoints >= 10 ? ['NEW_USER'] : [],
          rewardsUnlocked: [],
        });
      });
    }

    // Update points
    const oldTotal = profile.totalPoints;
    const oldLevel = profile.level;
    
    profile.totalPoints += points;
    profile.currentPointsBalance += points;
    profile.level = calculateLevel(profile.totalPoints);

    // Check badge unlocks
    const unlockedBadges = await checkBadgeUnlocks(profile, context);
    
    // Check reward unlocks
    const unlockedRewards = await checkRewardUnlocks(profile);

    // Save profile
    await profile.save();

    // Also update User model for backward compatibility
    user.greenPoints = profile.currentPointsBalance;
    await user.save();

    const levelUp = profile.level > oldLevel;

    logger.info(`[Green Points] Added ${points} points to user ${userId}. New total: ${profile.totalPoints}, Level: ${profile.level}${levelUp ? ' (LEVEL UP!)' : ''}`);

    return {
      success: true,
      newTotal: profile.currentPointsBalance,
      newLevel: profile.level,
      levelUp,
      unlockedBadges,
      unlockedRewards,
    };
  } catch (error) {
    logger.error(`[Green Points] Error: ${error.message}`);
    return {
      success: false,
      error: error.message || 'Failed to increase green points',
    };
  }
}

module.exports = {
  increaseGreenPoints,
  checkBadgeUnlocks,
  checkRewardUnlocks,
  calculateLevel,
};
