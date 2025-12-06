const AlertSubscription = require('../models/AlertSubscription');
const User = require('../models/User');
const UserAudit = require('../models/UserAudit');
const { sendWhatsAppMessage } = require('../utils/sendWhatsApp');
const { sendSMS, sendWhatsApp } = require('../utils/twilio');
const { generateAlertMessage } = require('../utils/alertMessageGenerator');
const { formatAQIAlert } = require('../utils/alertFormatter');
const { ensureConnectionAndQuery } = require('../utils/mongoHelper');
const aqiService = require('../services/aqiService');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Enable alerts for a user with region and health category
 * POST /api/alerts/enable
 */
exports.enableAlerts = async (req, res) => {
  try {
    const { phone, region, healthCategory = 'normal', whatsappEnabled = false } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    if (!region) {
      return res.status(400).json({
        success: false,
        error: 'Region is required',
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().trim();
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    // Validate region
    const validRegions = ['Delhi', 'Noida', 'Ghaziabad', 'Gurgaon', 'Faridabad', 'Rohini', 'Dwarka', 'Greater Noida', 'Anand Vihar', 'ITO'];
    if (!validRegions.includes(region)) {
      return res.status(400).json({
        success: false,
        error: `Invalid region. Must be one of: ${validRegions.join(', ')}`,
      });
    }

    // Validate health category
    const validCategories = ['normal', 'asthma', 'child', 'elderly', 'pregnant', 'heart_patient'];
    if (!validCategories.includes(healthCategory)) {
      return res.status(400).json({
        success: false,
        error: `Invalid health category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    // Find or create user (with connection check)
    let user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ phone: normalizedPhone });
    });

    if (!user) {
      // Create new user
      user = await ensureConnectionAndQuery(async () => {
        return await User.create({
          phone: normalizedPhone,
          region,
          healthCategory,
          alertsEnabled: true,
          whatsappEnabled: Boolean(whatsappEnabled),
        });
      });
      logger.info(`New user created with alerts enabled: ${normalizedPhone}`);
    } else {
      // Update existing user
      user.region = region;
      user.healthCategory = healthCategory;
      user.alertsEnabled = true;
      user.whatsappEnabled = Boolean(whatsappEnabled);
      await ensureConnectionAndQuery(async () => {
        await user.save();
      });
      logger.info(`Alerts enabled for user: ${normalizedPhone}, region: ${region}, category: ${healthCategory}`);
    }

    // Also update AlertSubscription for backward compatibility
    let subscription = await ensureConnectionAndQuery(async () => {
      return await AlertSubscription.findOne({ phone: normalizedPhone });
    });
    if (subscription) {
      subscription.region = region;
      subscription.healthCategory = healthCategory;
      subscription.enabled = true;
      await ensureConnectionAndQuery(async () => {
        await subscription.save();
      });
    } else {
      await ensureConnectionAndQuery(async () => {
        await AlertSubscription.create({
          phone: normalizedPhone,
          region,
          healthCategory,
          enabled: true,
        });
      });
    }

    // Send welcome message
    try {
      const welcomeMessage = 'Welcome to DelhiBreathes Alerts. You will now receive personalized AQI updates for your region and health category.';
      
      if (whatsappEnabled) {
        const whatsappResult = await sendWhatsApp(normalizedPhone, welcomeMessage);
        if (whatsappResult.success) {
          logger.info(`Welcome WhatsApp sent to ${normalizedPhone}`);
        } else {
          logger.warn(`Failed to send welcome WhatsApp: ${whatsappResult.error}`);
        }
      } else {
        const smsResult = await sendSMS(normalizedPhone, welcomeMessage);
        if (smsResult.success) {
          logger.info(`Welcome SMS sent to ${normalizedPhone}`);
        } else {
          logger.warn(`Failed to send welcome SMS: ${smsResult.error}`);
        }
      }
    } catch (messageError) {
      logger.error(`Error sending welcome message: ${messageError.message}`);
      // Don't fail the request if message fails
    }

    res.json({
      success: true,
      message: 'Alerts Enabled',
      data: {
        phone: user.phone,
        region: user.region,
        healthCategory: user.healthCategory,
        alertsEnabled: user.alertsEnabled,
        whatsappEnabled: user.whatsappEnabled,
      },
    });
  } catch (error) {
    logger.error(`Error enabling alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to enable alerts',
      message: error.message,
    });
  }
};

/**
 * Disable alerts for a user
 * POST /api/alerts/disable
 */
exports.disableAlerts = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().trim();
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    // Find user (with connection check)
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ phone: normalizedPhone });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Disable alerts
    user.alertsEnabled = false;
    await ensureConnectionAndQuery(async () => {
      await user.save();
    });

    // Also update AlertSubscription for backward compatibility
    const subscription = await ensureConnectionAndQuery(async () => {
      return await AlertSubscription.findOne({ phone: normalizedPhone });
    });
    if (subscription) {
      subscription.enabled = false;
      await ensureConnectionAndQuery(async () => {
        await subscription.save();
      });
    }

    logger.info(`Alerts disabled for user: ${normalizedPhone}`);

    res.json({
      success: true,
      message: 'Personalized alerts disabled',
      data: {
        phone: user.phone,
        alertsEnabled: user.alertsEnabled,
      },
    });
  } catch (error) {
    logger.error(`Error disabling alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to disable alerts',
      message: error.message,
    });
  }
};

/**
 * Toggle alerts for user
 * POST /api/user/alerts/toggle
 * Body: { enabled: boolean, region?: string, healthCategory?: string, phone?: string }
 * 
 * NOTE: This endpoint does NOT require authentication or OTP verification.
 * It accepts region and healthCategory from the request body.
 * If phone is not provided, a temporary/anonymous identifier will be used.
 */
exports.toggleAlerts = async (req, res) => {
  try {
    const { enabled, region, healthCategory } = req.body;
    
    // Get phone from request body or use a temporary identifier
    let phone = req.body.phone;
    
    // If no phone provided, generate a temporary identifier based on IP or session
    if (!phone) {
      const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'anonymous';
      // Use a hash of IP + timestamp for anonymous users (or just use a simple identifier)
      phone = `temp_${Date.now()}_${clientIp.replace(/\./g, '_').substring(0, 20)}`;
    }

    // Normalize phone number (only if it's a real phone, not a temp identifier)
    let normalizedPhone = phone.toString().trim();
    if (!normalizedPhone.startsWith('temp_')) {
      if (normalizedPhone.startsWith('+91')) {
        normalizedPhone = normalizedPhone.substring(3);
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = normalizedPhone.substring(2);
      }
    }

    // Find or create user
    let user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ phone: normalizedPhone });
    });

    if (!user) {
      // Create new user with provided settings if enabling
      if (enabled) {
        user = await ensureConnectionAndQuery(async () => {
          return await User.create({
            phone: normalizedPhone,
            region: region || 'Delhi',
            healthCategory: healthCategory || 'normal',
            alertsEnabled: true,
            whatsappEnabled: false,
          });
        });
        logger.info(`New user created with alerts enabled: ${normalizedPhone}, region: ${region || 'Delhi'}, category: ${healthCategory || 'normal'}`);
      } else {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
    } else {
      // Update existing user
      user.alertsEnabled = Boolean(enabled);
      if (region) user.region = region;
      if (healthCategory) user.healthCategory = healthCategory;
      await ensureConnectionAndQuery(async () => {
        await user.save();
      });
      logger.info(`Alerts ${enabled ? 'enabled' : 'disabled'} for user: ${normalizedPhone}`);
    }

    // Also update AlertSubscription for backward compatibility
    let subscription = await ensureConnectionAndQuery(async () => {
      return await AlertSubscription.findOne({ phone: normalizedPhone });
    });
    if (subscription) {
      subscription.enabled = Boolean(enabled);
      await ensureConnectionAndQuery(async () => {
        await subscription.save();
      });
    } else if (enabled) {
      await ensureConnectionAndQuery(async () => {
        await AlertSubscription.create({
          phone: normalizedPhone,
          region: region || user.region || 'Delhi',
          healthCategory: healthCategory || user.healthCategory || 'normal',
          enabled: true,
        });
      });
    }

    // Create audit log entry
    const userAgent = req.headers['user-agent'] || null;
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null;
    
    try {
      await ensureConnectionAndQuery(async () => {
        await UserAudit.create({
          user_id: user._id?.toString() || normalizedPhone,
          phone: normalizedPhone,
          action: 'alerts_toggle',
          enabled: Boolean(enabled),
          source: 'in-app',
          ip: clientIp,
          user_agent: userAgent,
          metadata: {
            region: user.region || 'Delhi',
            healthCategory: user.healthCategory || 'normal',
          },
        });
      });
      logger.info(`[Alerts Toggle] Audit log created for user: ${normalizedPhone}, enabled: ${enabled}`);
    } catch (auditError) {
      // Log audit error but don't fail the request
      logger.error(`[Alerts Toggle] Failed to create audit log: ${auditError.message}`);
    }

    // Log the action
    logger.info(`[Alerts Toggle] User: ${normalizedPhone}, enabled: ${enabled}, user_id: ${user._id?.toString() || 'N/A'}`);

    res.json({
      success: true,
      alerts_enabled: user.alertsEnabled,
      data: {
        phone: user.phone,
        region: user.region || 'Delhi',
        healthCategory: user.healthCategory || 'normal',
        alertsEnabled: user.alertsEnabled,
      },
    });
  } catch (error) {
    logger.error(`Error toggling alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle alerts',
      message: error.message,
    });
  }
};

/**
 * Get alerts status for a user
 * GET /api/alerts/status/:phone
 */
exports.getAlertsStatus = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().trim();
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    // Find user (with connection check)
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ phone: normalizedPhone });
    });

    if (!user) {
      return res.json({
        success: true,
        enabled: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      enabled: user.alertsEnabled,
      data: {
        phone: user.phone,
        region: user.region,
        healthCategory: user.healthCategory,
        alertsEnabled: user.alertsEnabled,
        whatsappEnabled: user.whatsappEnabled,
      },
    });
  } catch (error) {
    logger.error(`Error getting alerts status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts status',
      message: error.message,
    });
  }
};

/**
 * Get user data by phone
 * GET /api/user/:phone
 */
exports.getUser = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().trim();
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    // Find user (with connection check)
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ phone: normalizedPhone });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        phone: user.phone,
        region: user.region,
        healthCategory: user.healthCategory,
        alertsEnabled: user.alertsEnabled,
        whatsappEnabled: user.whatsappEnabled,
      },
    });
  } catch (error) {
    logger.error(`Error getting user: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
      message: error.message,
    });
  }
};

/**
 * Send test alert
 * POST /api/alerts/test
 */
exports.sendTestAlert = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().trim();
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    // Find user (with connection check)
    const user = await ensureConnectionAndQuery(async () => {
      return await User.findOne({ phone: normalizedPhone });
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Fetch current AQI for region
    const regionKey = (user.region || 'Delhi').toLowerCase().replace(/\s+/g, '');
    const regionMap = {
      'delhi': 'delhi',
      'noida': 'noida',
      'ghaziabad': 'ghaziabad',
      'gurgaon': 'gurgaon',
      'faridabad': 'faridabad',
      'rohini': 'rohini',
      'dwarka': 'dwarka',
      'greaternoida': 'greaterNoida',
      'anandvihar': 'anandVihar',
      'ito': 'ito',
    };
    const mappedKey = regionMap[regionKey] || 'delhi';
    const regionConfig = config.locations[mappedKey] || config.locations.delhi;
    
    const aqiData = await aqiService.getAQIByLocation(regionConfig.lat, regionConfig.lon);
    const aqi = aqiData?.aqi || aqiData?.summary?.averageAqi || 150;

    // Format alert message using new formatter
    const alertMessage = formatAQIAlert({
      region: user.region || 'Delhi',
      aqi,
      healthCategory: user.healthCategory,
      pollutants: aqiData?.pollutants || {},
    });

    const results = {
      sms: null,
      whatsapp: null,
    };

    // Send SMS
    const smsResult = await sendSMS(normalizedPhone, alertMessage);
    results.sms = smsResult;

    // Send WhatsApp if enabled
    if (user.whatsappEnabled) {
      const whatsappResult = await sendWhatsApp(normalizedPhone, alertMessage);
      results.whatsapp = whatsappResult;
    }

    if (results.sms.success || (results.whatsapp && results.whatsapp.success)) {
      logger.info(`Test alert sent successfully to ${normalizedPhone}`);
      res.json({
        success: true,
        message: 'Test alert sent successfully',
        data: {
          phone: normalizedPhone,
          sms: results.sms,
          whatsapp: results.whatsapp,
        },
      });
    } else {
      logger.error(`Failed to send test alert`);
      res.status(500).json({
        success: false,
        error: 'Failed to send test alert',
        data: {
          sms: results.sms,
          whatsapp: results.whatsapp,
        },
      });
    }
  } catch (error) {
    logger.error(`Error sending test alert: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert',
      message: error.message,
    });
  }
};

/**
 * Fetch alert data for a region (AQI + pollutants)
 * GET /api/alerts/fetch-alert-data/:region
 */
exports.fetchAlertData = async (req, res) => {
  try {
    const { region } = req.params;

    if (!region) {
      return res.status(400).json({
        success: false,
        error: 'Region is required',
      });
    }

    // Map region name to config key
    const regionMap = {
      'delhi': 'delhi',
      'noida': 'noida',
      'ghaziabad': 'ghaziabad',
      'gurgaon': 'gurgaon',
      'faridabad': 'faridabad',
      'rohini': 'rohini',
      'dwarka': 'dwarka',
      'greaternoida': 'greaterNoida',
      'anandvihar': 'anandVihar',
      'ito': 'ito',
    };
    
    const regionKey = region.toLowerCase().replace(/\s+/g, '');
    const mappedKey = regionMap[regionKey] || regionKey;
    const regionConfig = config.locations[mappedKey] || config.locations.delhi;

    // Fetch AQI data
    const aqiData = await aqiService.getAQIByLocation(regionConfig.lat, regionConfig.lon);

    res.json({
      success: true,
      data: {
        region: regionConfig.name,
        aqi: aqiData?.aqi || aqiData?.summary?.averageAqi,
        pollutants: aqiData?.pollutants || {},
        location: {
          lat: regionConfig.lat,
          lon: regionConfig.lon,
        },
      },
    });
  } catch (error) {
    logger.error(`Error fetching alert data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert data',
      message: error.message,
    });
  }
};

/**
 * Send AQI alert via WhatsApp (legacy endpoint)
 * POST /api/alerts/send-alert
 */
exports.sendAQIAlert = async (req, res) => {
  try {
    const { phone, aqi, message, region, healthCategory } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().trim();
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    // Build alert message
    let alertMessage = message;
    if (!alertMessage && aqi) {
      const regionName = region || 'Delhi';
      const category = healthCategory || 'normal';
      alertMessage = generateAlertMessage(regionName, aqi, category);
    }

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(normalizedPhone, alertMessage);

    if (result.success) {
      logger.info(`AQI alert sent successfully to ${normalizedPhone}`);
      res.json({
        success: true,
        message: 'Alert sent successfully',
        data: {
          phone: normalizedPhone,
          messageId: result.messageId,
        },
      });
    } else {
      logger.error(`Failed to send AQI alert: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send alert',
      });
    }
  } catch (error) {
    logger.error(`Error sending AQI alert: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to send alert',
      message: error.message,
    });
  }
};
