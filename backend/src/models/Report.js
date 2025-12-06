const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    index: true,
  },
  name: {
    type: String,
    required: false,
    trim: true,
    default: null,
  },
  idempotency_key: {
    type: String,
    required: false,
    trim: true,
    index: true,
    sparse: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['pollution', 'burning', 'construction', 'industrial', 'traffic', 'other'],
      message: 'Invalid category. Must be one of: pollution, burning, construction, industrial, traffic, other'
    },
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  photo: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        // Allow null/empty or valid URL
        return !v || /^https?:\/\/.+/.test(v) || /^\/uploads\/.+/.test(v);
      },
      message: 'Photo URL must be a valid URL or upload path'
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Action Taken'],
    default: 'Pending',
    index: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'reports', // Explicitly set collection name
});

// Index for efficient queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ email: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ idempotency_key: 1 }, { unique: false, sparse: true });

const Report = mongoose.model('Report', reportSchema, 'reports');

module.exports = Report;

