const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    trim: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 5,
  },
}, {
  timestamps: true,
  collection: 'otps',
});

// Index for efficient queries
otpSchema.index({ phone: 1, expiresAt: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create OTP
otpSchema.statics.createOTP = async function(phone, otp) {
  // Delete any existing OTP for this phone
  await this.deleteMany({ phone });
  
  // Create new OTP with 2-minute expiry
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
  
  return await this.create({
    phone,
    otp,
    expiresAt,
  });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(phone, otp) {
  const otpRecord = await this.findOne({ phone }).sort({ createdAt: -1 });
  
  if (!otpRecord) {
    return { success: false, error: 'OTP not found. Please request a new OTP.' };
  }
  
  // Check if expired
  if (new Date() > otpRecord.expiresAt) {
    await this.deleteOne({ _id: otpRecord._id });
    return { success: false, error: 'OTP has expired. Please request a new OTP.' };
  }
  
  // Check attempts
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await this.deleteOne({ _id: otpRecord._id });
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }
  
  // Increment attempts
  otpRecord.attempts += 1;
  await otpRecord.save();
  
  // Verify OTP
  if (otpRecord.otp !== otp) {
    return { success: false, error: 'Invalid OTP code. Please try again.' };
  }
  
  // Delete OTP after successful verification
  await this.deleteOne({ _id: otpRecord._id });
  
  return { success: true };
};

const Otp = mongoose.model('Otp', otpSchema, 'otps');

module.exports = Otp;

