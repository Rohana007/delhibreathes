const mongoose = require('mongoose');

const gamificationProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'User',
    index: true,
  },
  totalPoints: {
    type: Number,
    default: 10,
    min: 0,
  },
  currentPointsBalance: {
    type: Number,
    default: 10,
    min: 0,
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
  },
  badges: {
    type: [String],
    default: [],
  },
  rewardsUnlocked: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
  collection: 'gamification_profiles',
});

// Index for efficient queries
gamificationProfileSchema.index({ userId: 1 });
gamificationProfileSchema.index({ level: 1 });

const GamificationProfile = mongoose.model('GamificationProfile', gamificationProfileSchema, 'gamification_profiles');

module.exports = GamificationProfile;

