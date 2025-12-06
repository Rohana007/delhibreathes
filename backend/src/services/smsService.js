const axios = require('axios');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'msg91';
    this.config = {
      msg91: {
        key: process.env.MSG91_KEY,
        sender: process.env.MSG91_SENDER || 'DELHIB',
        route: process.env.MSG91_ROUTE || '4', // Transactional
      },
      fast2sms: {
        key: process.env.FAST2SMS_KEY ? process.env.FAST2SMS_KEY.trim() : null, // Trim whitespace from API key
        sender: process.env.FAST2SMS_SENDER || 'DELHIB',
      },
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_FROM || '+1234567890',
      },
    };
    
    // Log configuration status (without exposing keys)
    if (this.config.fast2sms.key) {
      logger.info('[SMS Service] Fast2SMS API key configured');
    } else {
      logger.warn('[SMS Service] Fast2SMS API key not configured. OTP sending will fail.');
    }
  }

  /**
   * Send OTP SMS using Fast2SMS (dedicated OTP route)
   * This is the primary method for sending OTP SMS
   */
  async sendOtpSMS(number, otp) {
    // Check if we're in development mode with mock SMS
    if (process.env.SMS_PROVIDER === 'mock' || process.env.NODE_ENV === 'development' && !this.config.fast2sms.key) {
      logger.info(`[MOCK SMS] OTP for ${this.maskPhone(number)}: ${otp}`);
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    if (!this.config.fast2sms.key) {
      logger.error('[Fast2SMS OTP] API key not configured. Please set FAST2SMS_KEY in environment variables.');
      return { success: false, message: 'SMS service not configured. Please contact support.' };
    }

    try {
      // Clean phone number (remove country code + and keep only digits)
      let mobile = number.replace(/\D/g, '');
      
      // For Indian numbers, remove country code 91 if present and ensure 10 digits
      if (mobile.startsWith('91') && mobile.length === 12) {
        mobile = mobile.substring(2);
      }
      
      // Validate phone number format (should be 10 digits for India)
      if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
        logger.error(`[Fast2SMS OTP] Invalid phone number format: ${this.maskPhone(number)} (cleaned: ${mobile}, length: ${mobile.length})`);
        return { success: false, message: 'Invalid phone number format. Please enter a valid 10-digit mobile number starting with 6-9.' };
      }

      logger.info(`[Fast2SMS OTP] Sending OTP to ${this.maskPhone(number)} (mobile: ${mobile}, OTP: ${otp})`);

      // Fast2SMS API payload for OTP route
      // IMPORTANT: For 'otp' route, use 'variables_values' (numeric only) instead of 'message'
      // Error 997: Only numeric variables_values are allowed in the OTP route
      const payload = {
        route: 'otp', // Use 'otp' route for OTP messages
        variables_values: otp, // OTP value (must be numeric string, e.g., "123456")
        numbers: mobile.toString(), // Must be string, 10 digits for India
      };

      logger.info(`[Fast2SMS OTP] Request payload: ${JSON.stringify({ ...payload, message: '[REDACTED]', authorization: '[REDACTED]' })}`);

      let response;
      try {
        response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          payload,
          {
            headers: {
              'authorization': this.config.fast2sms.key,
              'Content-Type': 'application/json',
            },
            timeout: 15000, // 15 second timeout
            validateStatus: function (status) {
              // Don't throw error for 4xx/5xx, handle in code
              return status >= 200 && status < 600;
            }
          }
        );
      } catch (axiosError) {
        // Handle network errors separately
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          logger.error(`[Fast2SMS OTP] Network error: ${axiosError.message}`);
          return { 
            success: false, 
            message: 'Unable to connect to SMS service. Please check your internet connection.' 
          };
        }
        throw axiosError; // Re-throw other errors
      }

      // Log the full API response for debugging
      logger.info(`[Fast2SMS OTP Response] Phone: ${this.maskPhone(number)}, Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);

      // Check HTTP status first
      if (response.status !== 200) {
        const errorMsg = response.data?.message || response.data?.error || `HTTP ${response.status} error`;
        logger.error(`[Fast2SMS OTP Failure] HTTP ${response.status}: ${errorMsg}`);
        return { 
          success: false, 
          message: errorMsg || 'SMS service returned an error. Please try again later.' 
        };
      }

      // Fast2SMS success response structure
      // Fast2SMS bulkV2 returns: { return: true, request_id: "...", message: [...] }
      const responseData = response.data;
      
      // Check if response indicates success
      const isSuccess = 
        (responseData && responseData.return === true) ||
        (responseData && responseData.status === 'success') ||
        (responseData && Array.isArray(responseData.message) && responseData.message.length > 0);

      if (isSuccess) {
        const requestId = responseData.request_id || 
                         (Array.isArray(responseData.message) && responseData.message[0]?.id) ||
                         responseData.message_id || 
                         `fast2sms-${Date.now()}`;
        logger.info(`[Fast2SMS OTP Success] OTP sent successfully to ${this.maskPhone(number)}, Request ID: ${requestId}`);
        return {
          success: true,
          messageId: requestId,
        };
      } else {
        // Fast2SMS error response - extract actual error message
        let errorMsg = 'Failed to send OTP SMS';
        
        if (responseData) {
          // Fast2SMS returns error messages in different formats
          if (responseData.message && typeof responseData.message === 'string') {
            errorMsg = responseData.message;
          } else if (responseData.message && Array.isArray(responseData.message) && responseData.message.length > 0) {
            // Sometimes message is an array with error details
            const firstMsg = responseData.message[0];
            errorMsg = firstMsg.message || firstMsg || 'Unknown error from Fast2SMS';
          } else if (responseData.error) {
            errorMsg = responseData.error;
          } else if (typeof responseData === 'string') {
            errorMsg = responseData;
          } else if (responseData.return === false) {
            errorMsg = responseData.message || 'Fast2SMS API returned false';
          }
        }
        
        logger.error(`[Fast2SMS OTP Failure] Phone: ${this.maskPhone(number)}, Error: ${errorMsg}, Full Response: ${JSON.stringify(responseData)}`);
        return { 
          success: false, 
          message: errorMsg || 'Failed to send OTP. Please try again later.' 
        };
      }
    } catch (error) {
      // Log full error details
      logger.error(`[Fast2SMS OTP Error] Phone: ${this.maskPhone(number)}, Error: ${error.message}`);
      
      let errorMessage = 'Failed to send OTP. Please try again later.';
      
      if (error.response) {
        // Extract error message from API response
        const responseData = error.response.data;
        logger.error(`[Fast2SMS OTP Error] Status: ${error.response.status}, Data: ${JSON.stringify(responseData)}`);
        
        if (responseData) {
          if (responseData.message) {
            errorMessage = responseData.message;
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          } else if (responseData.return === false) {
            errorMessage = responseData.message || 'SMS service temporarily unavailable';
          }
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 401) {
          errorMessage = 'SMS service authentication failed. Please contact support.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request. Please check your phone number.';
        } else if (error.response.status >= 500) {
          errorMessage = 'SMS service temporarily unavailable. Please try again later.';
        }
      } else if (error.request) {
        logger.error(`[Fast2SMS OTP Error] No response received from Fast2SMS API`);
        errorMessage = 'Unable to connect to SMS service. Please check your internet connection and try again.';
      }
      
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Send OTP SMS (wrapper - uses Fast2SMS for OTP)
   */
  async sendOTP(phone, otp) {
    // Always use Fast2SMS for OTP sending
    return await this.sendOtpSMS(phone, otp);
  }

  /**
   * Send confirmation SMS using Fast2SMS (transactional route)
   * This is the dedicated method for sending report confirmation SMS
   */
  async sendConfirmationSMS(phone, reportId) {
    if (!this.config.fast2sms.key) {
      logger.error('[Fast2SMS Confirmation] API key not configured');
      return { success: false, message: 'SMS failed' };
    }

    try {
      // Clean phone number (remove country code + and keep only digits)
      const mobile = phone.replace(/\D/g, '');
      const message = this.getConfirmationMessage(reportId);

      logger.info(`[Fast2SMS Confirmation] Sending confirmation SMS to ${this.maskPhone(phone)} for report ${reportId}`);

      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q', // Use 'q' route for transactional messages
          message: message,
          language: 'english',
          flash: 0,
          numbers: mobile,
        },
        {
          headers: {
            'authorization': this.config.fast2sms.key,
            'Content-Type': 'application/json',
          },
        }
      );

      // Log the full API response for debugging
      logger.info(`[Fast2SMS Confirmation Response] Phone: ${this.maskPhone(phone)}, Report ID: ${reportId}, Response: ${JSON.stringify(response.data)}`);

      // Fast2SMS success response structure
      if (response.data && response.data.return === true) {
        logger.info(`[Fast2SMS Confirmation Success] Confirmation SMS sent successfully to ${this.maskPhone(phone)} for report ${reportId}, Request ID: ${response.data.request_id}`);
        return {
          success: true,
          messageId: response.data.request_id || `fast2sms-${Date.now()}`,
        };
      } else {
        // Fast2SMS error response
        const errorMsg = response.data?.message || 'Unknown error from Fast2SMS';
        logger.error(`[Fast2SMS Confirmation Failure] Phone: ${this.maskPhone(phone)}, Report ID: ${reportId}, Error: ${errorMsg}`);
        return { success: false, message: 'SMS failed' };
      }
    } catch (error) {
      // Log full error details
      logger.error(`[Fast2SMS Confirmation Error] Phone: ${this.maskPhone(phone)}, Report ID: ${reportId}, Error: ${error.message}`);
      if (error.response) {
        logger.error(`[Fast2SMS Confirmation Error] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      return { success: false, message: 'SMS failed' };
    }
  }

  /**
   * Send confirmation SMS with report ID (legacy - uses provider-based approach)
   */
  async sendConfirmation(phone, reportId) {
    try {
      const message = this.getConfirmationMessage(reportId);
      switch (this.provider) {
        case 'msg91':
          return await this.sendViaMSG91(phone, message);
        case 'fast2sms':
          return await this.sendViaFast2SMS(phone, message);
        case 'twilio':
          return await this.sendViaTwilio(phone, message);
        case 'mock':
          logger.info(`[MOCK SMS] Confirmation for ${this.maskPhone(phone)}: ${message}`);
          return { success: true, messageId: 'mock-' + Date.now() };
        default:
          throw new Error(`Unsupported SMS provider: ${this.provider}`);
      }
    } catch (error) {
      logger.error(`SMS confirmation error for ${this.maskPhone(phone)}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send via Twilio (deprecated - use MSG91 instead)
   */
  async sendViaTwilio(phone, message) {
    logger.warn('Twilio provider is deprecated. Please use MSG91 instead.');
    if (!this.config.twilio.accountSid || !this.config.twilio.authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const twilio = require('twilio');
    const client = twilio(this.config.twilio.accountSid, this.config.twilio.authToken);

    const result = await client.messages.create({
      body: message,
      to: phone,
      from: this.config.twilio.from,
    });

    return { success: true, messageId: result.sid };
  }

  /**
   * Send via MSG91 (Transactional SMS API)
   */
  async sendViaMSG91(phone, message) {
    if (!this.config.msg91.key) {
      throw new Error('MSG91 key not configured');
    }

    // Clean phone number (remove country code + and keep only digits)
    const mobile = phone.replace(/\D/g, '');
    
    // MSG91 Send SMS API endpoint
    const url = 'https://control.msg91.com/api/sendhttp.php';
    
    // MSG91 API parameters
    const params = new URLSearchParams({
      authkey: this.config.msg91.key,
      mobiles: mobile,
      message: message,
      sender: this.config.msg91.sender,
      route: this.config.msg91.route, // 4 for transactional
      country: '91', // India country code
    });

    try {
      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // MSG91 returns response as string or JSON
      const responseData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      // Log the full API response for debugging
      logger.info(`[MSG91 API Response] Phone: ${this.maskPhone(phone)}, Response: ${responseData}`);
      
      // MSG91 returns message ID or error code
      // Success response is typically a message ID (numeric string)
      // Error responses start with error codes
      if (responseData && !isNaN(responseData.trim())) {
        // Valid message ID returned
        return { 
          success: true, 
          messageId: `msg91-${responseData.trim()}`,
          rawResponse: responseData 
        };
      } else {
        // Error response from MSG91
        logger.error(`[MSG91 Error] Phone: ${this.maskPhone(phone)}, Error: ${responseData}`);
        throw new Error(`MSG91 API Error: ${responseData}`);
      }
    } catch (error) {
      // Log full error details
      logger.error(`[MSG91 API Error] Phone: ${this.maskPhone(phone)}, Error: ${error.message}`);
      if (error.response) {
        logger.error(`[MSG91 API Error] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Send via Fast2SMS (for non-OTP messages like confirmations)
   */
  async sendViaFast2SMS(phone, message) {
    if (!this.config.fast2sms.key) {
      throw new Error('Fast2SMS key not configured');
    }

    try {
      const mobile = phone.replace(/\D/g, '');
      
      logger.info(`[Fast2SMS] Sending message to ${this.maskPhone(phone)}`);

      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q', // Use 'q' route for transactional messages
          message: message,
          language: 'english',
          flash: 0,
          numbers: mobile,
        },
        {
          headers: {
            'authorization': this.config.fast2sms.key,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`[Fast2SMS Response] Phone: ${this.maskPhone(phone)}, Response: ${JSON.stringify(response.data)}`);

      if (response.data && response.data.return === true) {
        return { success: true, messageId: response.data.request_id || 'fast2sms-' + Date.now() };
      } else {
        const errorMsg = response.data?.message || 'Unknown error from Fast2SMS';
        logger.error(`[Fast2SMS Error] Phone: ${this.maskPhone(phone)}, Error: ${errorMsg}`);
        throw new Error(`Fast2SMS API Error: ${errorMsg}`);
      }
    } catch (error) {
      logger.error(`[Fast2SMS Error] Phone: ${this.maskPhone(phone)}, Error: ${error.message}`);
      if (error.response) {
        logger.error(`[Fast2SMS Error] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Get OTP message template
   */
  getOTPMessage(otp) {
    return `Your DelhiBreathes OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;
  }

  /**
   * Get confirmation message template
   */
  getConfirmationMessage(reportId) {
    return `Your pollution report (ID: ${reportId}) has been successfully submitted. Thank you for helping improve air quality. - Delhi Breathes`;
  }

  /**
   * Send status update SMS with custom message
   */
  async sendStatusUpdateSMS(phone, reportId, status, customMessage) {
    if (!this.config.fast2sms.key) {
      logger.error('[Fast2SMS Status Update] API key not configured');
      return { success: false, message: 'SMS failed' };
    }

    try {
      // Clean phone number
      const mobile = phone.replace(/\D/g, '');
      const message = customMessage || `Your pollution report (ID: ${reportId.slice(-8).toUpperCase()}) status updated: ${status}. - Delhi Breathes`;

      logger.info(`[Fast2SMS Status Update] Sending status update SMS to ${this.maskPhone(phone)} for report ${reportId}`);

      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q', // Use 'q' route for transactional messages
          message: message,
          language: 'english',
          flash: 0,
          numbers: mobile,
        },
        {
          headers: {
            'authorization': this.config.fast2sms.key,
            'Content-Type': 'application/json',
          },
        }
      );

      // Check response
      if (response.data && response.data.return === true) {
        logger.info(`[Fast2SMS Status Update] SMS sent successfully to ${this.maskPhone(phone)}`);
        return { success: true, messageId: response.data.request_id || 'fast2sms-status-' + Date.now() };
      } else {
        logger.error(`[Fast2SMS Status Update] Failed: ${JSON.stringify(response.data)}`);
        return { success: false, message: response.data?.message || 'Failed to send SMS' };
      }
    } catch (error) {
      logger.error(`[Fast2SMS Status Update] Error: ${error.message}`);
      return { success: false, message: error.message || 'Failed to send SMS' };
    }
  }

  /**
   * Mask phone number
   */
  maskPhone(phone) {
    if (!phone || phone.length < 4) return 'XXXX';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return 'XXXX';
    const last4 = cleaned.slice(-4);
    return `+${cleaned.slice(0, -4).replace(/\d/g, 'X')}-${last4}`;
  }
}

module.exports = new SMSService();

