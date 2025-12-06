const mongoose = require('mongoose');

const alertPreferenceSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    unique: true,
    index: true,
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'alertPreferences',
});

// Index for efficient queries
alertPreferenceSchema.index({ phone: 1 });
alertPreferenceSchema.index({ enabled: 1 });

const AlertPreference = mongoose.model('AlertPreference', alertPreferenceSchema, 'alertPreferences');

module.exports = AlertPreference;

