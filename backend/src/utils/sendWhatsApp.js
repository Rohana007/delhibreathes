const axios = require('axios');
const logger = require('./logger');

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || 'instance153770';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || 'xlrqd891p828t3tj';
const ULTRAMSG_API_URL = process.env.ULTRAMSG_API_URL || 'https://api.ultramsg.com';

/**
 * Send WhatsApp message using UltraMsg API
 * @param {string} phone - Phone number (with country code, e.g., 919876543210)
 * @param {string} message - Message text to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendWhatsAppMessage(phone, message) {
  try {
    // Ensure phone has country code format (91XXXXXXXXXX)
    let formattedPhone = phone.toString().trim();
    
    // Remove + if present
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Add 91 if not present (assuming India)
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    const url = `${ULTRAMSG_API_URL}/instance${ULTRAMSG_INSTANCE_ID}/messages/chat`;
    
    const payload = {
      token: ULTRAMSG_TOKEN,
      to: formattedPhone,
      body: message,
    };

    logger.info(`[WhatsApp] Sending message to ${formattedPhone.substring(0, 4)}XXXX${formattedPhone.slice(-4)}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    if (response.data && response.data.sent === 'true') {
      logger.info(`[WhatsApp] Message sent successfully to ${formattedPhone.substring(0, 4)}XXXX${formattedPhone.slice(-4)}`);
      return {
        success: true,
        messageId: response.data.id || null,
      };
    } else {
      logger.warn(`[WhatsApp] Message send failed: ${JSON.stringify(response.data)}`);
      return {
        success: false,
        error: response.data?.error || 'Failed to send WhatsApp message',
      };
    }
  } catch (error) {
    logger.error(`[WhatsApp] Error sending message: ${error.message}`);
    
    if (error.response) {
      logger.error(`[WhatsApp] Response error: ${JSON.stringify(error.response.data)}`);
      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || 'WhatsApp API error',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

module.exports = {
  sendWhatsAppMessage,
};

