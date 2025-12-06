const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  greenPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  region: {
    type: String,
    enum: ['Delhi', 'Noida', 'Ghaziabad', 'Gurgaon', 'Faridabad', 'Rohini', 'Dwarka', 'Greater Noida', 'Anand Vihar', 'ITO'],
    default: null,
  },
  healthCategory: {
    type: String,
    enum: ['normal', 'child', 'elderly', 'pregnant', 'asthma', 'sensitive', 'heart_patient'],
    default: 'normal',
  },
  alertsEnabled: {
    type: Boolean,
    default: false,
    index: true,
  },
  whatsappEnabled: {
    type: Boolean,
    default: false,
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
  collection: 'users',
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ alertsEnabled: 1 });
userSchema.index({ alertsEnabled: 1, region: 1 });

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;

