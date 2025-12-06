const mongoose = require('mongoose');

const userAuditSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  phone: {
    type: String,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['alerts_toggle', 'profile_update', 'settings_change', 'login', 'logout'],
    index: true,
  },
  enabled: {
    type: Boolean,
    default: null,
  },
  source: {
    type: String,
    default: 'in-app',
    enum: ['in-app', 'web', 'api', 'mobile'],
  },
  ip: {
    type: String,
    default: null,
  },
  user_agent: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'user_audit',
});

// Indexes for efficient queries
userAuditSchema.index({ user_id: 1, action: 1 });
userAuditSchema.index({ phone: 1, action: 1 });
userAuditSchema.index({ createdAt: -1 });

const UserAudit = mongoose.model('UserAudit', userAuditSchema, 'user_audit');

module.exports = UserAudit;

