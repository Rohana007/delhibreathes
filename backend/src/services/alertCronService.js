const AlertSubscription = require('../models/AlertSubscription');
const { sendWhatsAppMessage } = require('../utils/sendWhatsApp');
const { generateAlertMessage, shouldSendAlert } = require('../utils/alertMessageGenerator');
const aqiService = require('./aqiService');
const config = require('../config');
const logger = require('../utils/logger');

// Try to require node-cron, but don't fail if not installed
let cron;
try {
  cron = require('node-cron');
} catch (error) {
  logger.warn('[Alert Cron] node-cron not installed. Install it with: npm install node-cron');
  cron = null;
}

/**
 * Get region coordinates from config
 */
function getRegionCoordinates(regionName) {
  // Map region names to config keys
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
 * Send AQI alerts to all enabled subscribers
 */
async function sendAQIAlertsToUsers() {
  try {
    logger.info('[Alert Cron] Starting AQI alert check...');

    // Get all enabled subscriptions
    const enabledSubscriptions = await AlertSubscription.find({ enabled: true });
    
    if (enabledSubscriptions.length === 0) {
      logger.info('[Alert Cron] No enabled alert subscriptions found');
      return;
    }

    logger.info(`[Alert Cron] Found ${enabledSubscriptions.length} enabled subscriptions`);

    // Group subscriptions by region to minimize API calls
    const regionGroups = {};
    enabledSubscriptions.forEach(sub => {
      if (!regionGroups[sub.region]) {
        regionGroups[sub.region] = [];
      }
      regionGroups[sub.region].push(sub);
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
          logger.info(`[Alert Cron] Region ${region} AQI: ${aqi}`);
        } else {
          logger.warn(`[Alert Cron] Could not fetch AQI for region ${region}`);
        }
      } catch (error) {
        logger.error(`[Alert Cron] Error fetching AQI for ${region}: ${error.message}`);
      }
    }

    // Process each subscription
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const subscription of enabledSubscriptions) {
      try {
        const regionData = regionAQIData[subscription.region];
        
        if (!regionData || !regionData.aqi) {
          logger.warn(`[Alert Cron] No AQI data for region ${subscription.region}, skipping subscription ${subscription.phone}`);
          skippedCount++;
          continue;
        }

        const currentAQI = regionData.aqi;

        // Check if alert should be sent based on health category and thresholds
        const shouldSend = shouldSendAlert(
          subscription.healthCategory,
          currentAQI,
          subscription.lastAlertAQI,
          subscription.lastAlertTime
        );

        if (!shouldSend) {
          logger.info(`[Alert Cron] Skipping alert for ${subscription.phone} - AQI ${currentAQI} doesn't meet threshold or too soon since last alert`);
          skippedCount++;
          continue;
        }

        // Generate personalized alert message
        const alertMessage = generateAlertMessage(
          subscription.region,
          currentAQI,
          subscription.healthCategory,
          regionData.pollutants
        );

        // Send WhatsApp message
        const result = await sendWhatsAppMessage(subscription.phone, alertMessage);
        
        if (result.success) {
          // Update subscription with last alert info
          subscription.lastAlertAQI = currentAQI;
          subscription.lastAlertTime = new Date();
          await subscription.save();

          successCount++;
          logger.info(`[Alert Cron] Alert sent to ${subscription.phone.substring(0, 4)}XXXX${subscription.phone.slice(-4)} (${subscription.region}, AQI: ${currentAQI})`);
        } else {
          failureCount++;
          logger.warn(`[Alert Cron] Failed to send alert to ${subscription.phone}: ${result.error}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failureCount++;
        logger.error(`[Alert Cron] Error processing subscription ${subscription.phone}: ${error.message}`);
      }
    }

    logger.info(`[Alert Cron] Alert run completed. Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    logger.error(`[Alert Cron] Error in alert cron job: ${error.message}`);
  }
}

/**
 * Initialize cron job to run every 30 minutes
 */
function initializeAlertCron() {
  if (!cron) {
    logger.warn('[Alert Cron] node-cron not available. Install with: npm install node-cron');
    return;
  }

  // Run every 30 minutes: */30 * * * *
  cron.schedule('*/30 * * * *', async () => {
    await sendAQIAlertsToUsers();
  });

  logger.info('[Alert Cron] Cron job initialized - will run every 30 minutes');
  
  // Run immediately on startup (optional - uncomment to test)
  // sendAQIAlertsToUsers();
}

module.exports = {
  initializeAlertCron,
  sendAQIAlertsToUsers,
};
