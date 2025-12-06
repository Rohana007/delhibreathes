const mongoose = require('mongoose');

const alertSubscriptionSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    unique: true,
    index: true,
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: ['Delhi', 'Noida', 'Ghaziabad', 'Gurgaon', 'Faridabad', 'Rohini', 'Dwarka', 'Greater Noida', 'Anand Vihar', 'ITO'],
    index: true,
  },
  healthCategory: {
    type: String,
    required: [true, 'Health category is required'],
    enum: ['normal', 'asthma', 'child', 'elderly', 'pregnant', 'heart_patient'],
    default: 'normal',
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastAlertAQI: {
    type: Number,
    default: null,
  },
  lastAlertTime: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'alertSubscriptions',
});

// Index for efficient queries
alertSubscriptionSchema.index({ phone: 1 });
alertSubscriptionSchema.index({ enabled: 1 });
alertSubscriptionSchema.index({ region: 1 });
alertSubscriptionSchema.index({ enabled: 1, region: 1 });

const AlertSubscription = mongoose.model('AlertSubscription', alertSubscriptionSchema, 'alertSubscriptions');

module.exports = AlertSubscription;

