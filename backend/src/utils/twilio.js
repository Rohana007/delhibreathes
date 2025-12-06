const twilio = require('twilio');
const logger = require('./logger');

// Twilio configuration from environment variables
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const SMS_FROM = process.env.TWILIO_SMS_FROM || null;

// Initialize Twilio client
let client = null;
if (ACCOUNT_SID && AUTH_TOKEN) {
  try {
    client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    logger.info('[Twilio] Client initialized successfully');
  } catch (error) {
    logger.error(`[Twilio] Failed to initialize client: ${error.message}`);
  }
} else {
  logger.warn('[Twilio] Account SID or Auth Token not configured');
}

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string} - Normalized phone number
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Indian numbers (add +91 if missing)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Already has country code
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add country code
    cleaned = `91${cleaned.substring(1)}`;
  }
  
  return `+${cleaned}`;
}

/**
 * Send OTP via Twilio Verify Service
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendOTP(phone) {
  if (!client) {
    logger.error('[Twilio OTP] Client not initialized');
    return {
      success: false,
      error: 'Twilio service not configured',
    };
  }

  if (!VERIFY_SERVICE_SID) {
    logger.error('[Twilio OTP] Verify Service SID not configured');
    return {
      success: false,
      error: 'Twilio Verify Service not configured',
    };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    logger.info(`[Twilio OTP] Sending OTP to ${normalizedPhone.substring(0, 4)}XXXX${normalizedPhone.slice(-4)}`);

    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: normalizedPhone,
        channel: 'sms',
      });

    logger.info(`[Twilio OTP] OTP sent successfully. SID: ${verification.sid}`);
    
    return {
      success: true,
      messageId: verification.sid,
    };
  } catch (error) {
    logger.error(`[Twilio OTP] Error: ${error.message}`);
    
    // Handle specific Twilio errors
    if (error.code === 60200) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    } else if (error.code === 60203) {
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please try again later.',
      };
    } else if (error.code === 20429) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
    };
  }
}

/**
 * Verify OTP via Twilio Verify Service
 * @param {string} phone - Phone number
 * @param {string} code - OTP code
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
async function verifyOTP(phone, code) {
  if (!client) {
    logger.error('[Twilio Verify] Client not initialized');
    return {
      success: false,
      error: 'Twilio service not configured',
    };
  }

  if (!VERIFY_SERVICE_SID) {
    logger.error('[Twilio Verify] Verify Service SID not configured');
    return {
      success: false,
      error: 'Twilio Verify Service not configured',
    };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    if (!code || code.length < 4) {
      return {
        success: false,
        error: 'Invalid OTP code',
      };
    }

    logger.info(`[Twilio Verify] Verifying OTP for ${normalizedPhone.substring(0, 4)}XXXX${normalizedPhone.slice(-4)}`);

    const verificationCheck = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: normalizedPhone,
        code: code,
      });

    logger.info(`[Twilio Verify] Verification status: ${verificationCheck.status}`);

    if (verificationCheck.status === 'approved') {
      return {
        success: true,
        status: 'approved',
      };
    } else {
      return {
        success: false,
        error: 'Invalid or expired OTP code',
        status: verificationCheck.status,
      };
    }
  } catch (error) {
    logger.error(`[Twilio Verify] Error: ${error.message}`);
    
    // Handle specific Twilio errors
    if (error.code === 20404) {
      return {
        success: false,
        error: 'OTP verification not found. Please request a new OTP.',
      };
    } else if (error.code === 60202) {
      return {
        success: false,
        error: 'Too many verification attempts. Please request a new OTP.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to verify OTP',
    };
  }
}

/**
 * Send SMS via Twilio
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMS(phone, message) {
  if (!client) {
    logger.error('[Twilio SMS] Client not initialized');
    return {
      success: false,
      error: 'Twilio service not configured',
    };
  }

  // Use TWILIO_PHONE_NUMBER if available, otherwise fall back to SMS_FROM
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || SMS_FROM;
  
  if (!fromNumber) {
    logger.error('[Twilio SMS] SMS From number not configured');
    return {
      success: false,
      error: 'Twilio SMS From number not configured. Set TWILIO_PHONE_NUMBER or TWILIO_SMS_FROM in .env',
    };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    logger.info(`[Twilio SMS] Sending SMS to ${normalizedPhone.substring(0, 4)}XXXX${normalizedPhone.slice(-4)}`);

    const result = await client.messages.create({
      body: message,
      to: normalizedPhone,
      from: fromNumber,
    });

    logger.info(`[Twilio SMS] SMS sent successfully. SID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    logger.error(`[Twilio SMS] Error: ${error.message}`);
    
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send OTP SMS directly (not using Verify Service)
 * Generates 6-digit OTP and sends via SMS
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, otp?: string, messageId?: string, error?: string}>}
 */
async function sendOTPSMS(phone) {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  const message = `Your verification code is ${otp}. It expires in 2 minutes.`;
  
  const result = await sendSMS(phone, message);
  
  if (result.success) {
    return {
      success: true,
      otp, // Return OTP to be stored in database
      messageId: result.messageId,
    };
  } else {
    return {
      success: false,
      error: result.error,
    };
  }
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendWhatsApp(phone, message) {
  if (!client) {
    logger.error('[Twilio WhatsApp] Client not initialized');
    return {
      success: false,
      error: 'Twilio service not configured',
    };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    // Format phone for WhatsApp (remove + and add whatsapp: prefix)
    const whatsappTo = `whatsapp:${normalizedPhone.substring(1)}`;

    logger.info(`[Twilio WhatsApp] Sending WhatsApp to ${normalizedPhone.substring(0, 4)}XXXX${normalizedPhone.slice(-4)}`);

    const result = await client.messages.create({
      body: message,
      to: whatsappTo,
      from: WHATSAPP_NUMBER,
    });

    logger.info(`[Twilio WhatsApp] WhatsApp sent successfully. SID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    logger.error(`[Twilio WhatsApp] Error: ${error.message}`);
    
    // Handle specific Twilio errors
    if (error.code === 21608) {
      return {
        success: false,
        error: 'WhatsApp number not registered. Please opt-in to receive messages.',
      };
    } else if (error.code === 21614) {
      return {
        success: false,
        error: 'WhatsApp number not opted in. Please opt-in to receive messages.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

module.exports = {
  sendOTP, // Twilio Verify Service (existing)
  verifyOTP, // Twilio Verify Service (existing)
  sendSMS,
  sendOTPSMS, // Direct SMS OTP (new)
  sendWhatsApp,
  normalizePhone,
};

