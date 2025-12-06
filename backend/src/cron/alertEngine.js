const cron = require('node-cron');
const User = require('../models/User');
const aqiService = require('../services/aqiService');
// Twilio imports removed - alerts will use alternative messaging if needed
// const { sendSMS, sendWhatsApp } = require('../utils/twilio');
const { formatAQIAlert } = require('../utils/alertFormatter');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Get region coordinates from config
 */
function getRegionCoordinates(regionName) {
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

  const regionKey = regionName.toLowerCase().replace(/\s+/g, '');
  const mappedKey = regionMap[regionKey] || regionKey;
  const regionConfig = config.locations[mappedKey] || config.locations.delhi;
  
  return {
    lat: regionConfig.lat,
    lon: regionConfig.lon,
    name: regionConfig.name,
  };
}

/**
 * Get AQI threshold based on health category
 */
function getAQIThreshold(healthCategory) {
  const thresholds = {
    asthma: 100,
    elderly: 120,
    pregnant: 90,
    child: 75,
    normal: 150,
    heart_patient: 90,
  };

  return thresholds[healthCategory] || 150;
}

/**
 * Check if alert should be sent
 */
function shouldSendAlert(user, currentAQI) {
  // Check if alerts are enabled
  if (!user.alertsEnabled) {
    return false;
  }

  // Get threshold for user's health category
  const threshold = getAQIThreshold(user.healthCategory);

  // Check if AQI exceeds threshold
  if (currentAQI <= threshold) {
    return false;
  }

  // Check if we should send based on last alert
  if (user.lastAlertTime) {
    const hoursSinceLastAlert = (Date.now() - user.lastAlertTime.getTime()) / (1000 * 60 * 60);
    
    // Don't send if last alert was less than 2 hours ago
    if (hoursSinceLastAlert < 2) {
      // But send if AQI increased significantly (more than 20 points)
      if (user.lastAlertAQI && (currentAQI - user.lastAlertAQI) > 20) {
        return true;
      }
      return false;
    }
  }

  return true;
}

/**
 * Send AQI alerts to all enabled users
 */
async function sendAQIAlertsToUsers() {
  try {
    logger.info('[Alert Engine] Starting AQI alert check...');

    // Get all users with alerts enabled
    const enabledUsers = await User.find({ alertsEnabled: true });

    if (enabledUsers.length === 0) {
      logger.info('[Alert Engine] No users with alerts enabled');
      return;
    }

    logger.info(`[Alert Engine] Found ${enabledUsers.length} users with alerts enabled`);

    // Group users by region to minimize API calls
    const regionGroups = {};
    enabledUsers.forEach(user => {
      const region = user.region || 'Delhi';
      if (!regionGroups[region]) {
        regionGroups[region] = [];
      }
      regionGroups[region].push(user);
    });

    // Fetch AQI for each region
    const regionAQIData = {};
    
    for (const region of Object.keys(regionGroups)) {
      try {
        const coords = getRegionCoordinates(region);
        const aqiData = await aqiService.getAQIByLocation(coords.lat, coords.lon);
        const aqi = aqiData?.aqi || aqiData?.summary?.averageAqi;
        
        if (aqi) {
          regionAQIData[region] = {
            aqi,
            pollutants: aqiData?.pollutants || {},
            data: aqiData,
          };
          logger.info(`[Alert Engine] Region ${region} AQI: ${aqi}`);
        } else {
          logger.warn(`[Alert Engine] Could not fetch AQI for region ${region}`);
        }
      } catch (error) {
        logger.error(`[Alert Engine] Error fetching AQI for ${region}: ${error.message}`);
      }
    }

    // Process each user
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const user of enabledUsers) {
      try {
        const region = user.region || 'Delhi';
        const regionData = regionAQIData[region];
        
        if (!regionData || !regionData.aqi) {
          logger.warn(`[Alert Engine] No AQI data for region ${region}, skipping user ${user.phone}`);
          skippedCount++;
          continue;
        }

        const currentAQI = regionData.aqi;

        // Check if alert should be sent
        if (!shouldSendAlert(user, currentAQI)) {
          logger.info(`[Alert Engine] Skipping alert for ${user.phone} - AQI ${currentAQI} doesn't meet threshold or too soon since last alert`);
          skippedCount++;
          continue;
        }

        // Format alert message
        const alertMessage = formatAQIAlert({
          region,
          aqi: currentAQI,
          healthCategory: user.healthCategory,
          pollutants: regionData.pollutants,
        });

        // Send alerts
        let smsSent = false;
        let whatsappSent = false;

        // Send SMS - Twilio removed, using alternative service if available
        // TODO: Implement alternative SMS service
        logger.warn(`[Alert Engine] SMS sending disabled - Twilio removed. Alert for ${user.phone.substring(0, 4)}XXXX${user.phone.slice(-4)}`);
        // For now, mark as sent to prevent spam (implement alternative service later)
        smsSent = true;

        // Send WhatsApp if enabled - Twilio removed
        if (user.whatsappEnabled) {
          // TODO: Implement alternative WhatsApp service
          logger.warn(`[Alert Engine] WhatsApp sending disabled - Twilio removed. Alert for ${user.phone.substring(0, 4)}XXXX${user.phone.slice(-4)}`);
          whatsappSent = true; // Mark as sent to prevent spam
        }

        // Update user if at least one message was sent
        if (smsSent || whatsappSent) {
          user.lastAlertAQI = currentAQI;
          user.lastAlertTime = new Date();
          await user.save();
          successCount++;
        } else {
          failureCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failureCount++;
        logger.error(`[Alert Engine] Error processing user ${user.phone}: ${error.message}`);
      }
    }

    logger.info(`[Alert Engine] Alert run completed. Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    logger.error(`[Alert Engine] Error in alert cron job: ${error.message}`);
  }
}

/**
 * Initialize cron job to run every 15 minutes
 */
function initializeAlertEngine() {
  try {
    // Run every 15 minutes: */15 * * * *
    cron.schedule('*/15 * * * *', async () => {
      await sendAQIAlertsToUsers();
    });

    logger.info('[Alert Engine] Cron job initialized - will run every 15 minutes');
    
    // Optional: Run immediately on startup for testing (uncomment if needed)
    // sendAQIAlertsToUsers();
  } catch (error) {
    logger.error(`[Alert Engine] Failed to initialize cron job: ${error.message}`);
  }
}

module.exports = {
  initializeAlertEngine,
  sendAQIAlertsToUsers,
};

