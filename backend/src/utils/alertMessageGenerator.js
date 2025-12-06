const config = require('../config');
const logger = require('./logger');

/**
 * Get AQI category based on Indian AQI standards
 */
function getAQICategory(aqi) {
  if (aqi <= 50) return { label: 'Good', emoji: '✅' };
  if (aqi <= 100) return { label: 'Satisfactory', emoji: '🟡' };
  if (aqi <= 200) return { label: 'Moderate', emoji: '🟠' };
  if (aqi <= 300) return { label: 'Poor', emoji: '🔴' };
  if (aqi <= 400) return { label: 'Very Poor', emoji: '🟣' };
  return { label: 'Severe', emoji: '⚫' };
}

/**
 * Generate health-based warnings based on category and AQI
 */
function getHealthWarnings(healthCategory, aqi) {
  const warnings = [];

  switch (healthCategory) {
    case 'asthma':
      if (aqi > 120) {
        warnings.push('⚠ High breathing difficulty expected. Use N95 mask outdoors.');
      }
      if (aqi > 100) {
        warnings.push('⚠ Keep inhaler handy. Avoid outdoor activities.');
      }
      break;

    case 'child':
      if (aqi > 100) {
        warnings.push('⚠ Children are sensitive at this AQI. Avoid outdoor play.');
      }
      if (aqi > 150) {
        warnings.push('⚠ Keep children indoors. Use air purifier if available.');
      }
      break;

    case 'elderly':
      if (aqi > 110) {
        warnings.push('⚠ Elderly risk increased. Stay indoors.');
      }
      if (aqi > 150) {
        warnings.push('⚠ Avoid outdoor walks. Monitor breathing closely.');
      }
      break;

    case 'pregnant':
      if (aqi > 80) {
        warnings.push('⚠ Pregnant women should avoid outdoor travel at this AQI.');
      }
      if (aqi > 120) {
        warnings.push('⚠ High risk for pregnancy. Stay indoors with air purifier.');
      }
      break;

    case 'heart_patient':
      if (aqi > 90) {
        warnings.push('⚠ Cardiac stress possible. Avoid outdoor exercise.');
      }
      if (aqi > 150) {
        warnings.push('⚠ High cardiovascular risk. Stay indoors. Monitor heart rate.');
      }
      break;

    case 'normal':
    default:
      if (aqi > 150) {
        warnings.push('⚠ Unhealthy air quality. Reduce outdoor exposure.');
      }
      break;
  }

  return warnings;
}

/**
 * Generate general recommendations based on AQI
 */
function getGeneralRecommendations(aqi) {
  const recommendations = [];

  if (aqi > 100) {
    recommendations.push('• Use air purifier indoors if available');
  }

  if (aqi > 150) {
    recommendations.push('• Avoid running or heavy exercise');
    recommendations.push('• Stay hydrated & monitor breathing');
  }

  if (aqi > 200) {
    recommendations.push('• Keep windows closed during peak hours');
    recommendations.push('• Use N95 mask if going outdoors');
  }

  if (aqi > 100) {
    recommendations.push('• Check live AQI before travel');
  }

  return recommendations;
}

/**
 * Generate personalized alert message
 */
function generateAlertMessage(region, aqi, healthCategory, pollutants = {}) {
  const category = getAQICategory(aqi);
  const healthWarnings = getHealthWarnings(healthCategory, aqi);
  const recommendations = getGeneralRecommendations(aqi);

  let message = `🌫 DelhiBreathes — Personalized AQI Alert\n\n`;
  message += `Region: ${region}\n`;
  message += `Current AQI: ${aqi} ${category.emoji} (${category.label})\n\n`;

  // Add health-specific warnings
  if (healthWarnings.length > 0) {
    message += `Health Alert:\n`;
    healthWarnings.forEach(warning => {
      message += `${warning}\n`;
    });
    message += `\n`;
  }

  // Add recommendations
  if (recommendations.length > 0) {
    message += `Recommendations:\n`;
    recommendations.forEach(rec => {
      message += `${rec}\n`;
    });
    message += `\n`;
  }

  // Add pollutant info if available
  if (Object.keys(pollutants).length > 0) {
    message += `Key Pollutants:\n`;
    if (pollutants.pm25) message += `PM2.5: ${Math.round(pollutants.pm25)} µg/m³\n`;
    if (pollutants.pm10) message += `PM10: ${Math.round(pollutants.pm10)} µg/m³\n`;
    if (pollutants.no2) message += `NO₂: ${Math.round(pollutants.no2)} µg/m³\n`;
    message += `\n`;
  }

  // Add safety tips
  message += `Safety Tips:\n`;
  message += `• Limit outdoor activities\n`;
  message += `• Use air purifier at home\n`;
  message += `• Keep windows closed\n`;
  message += `• Stay hydrated\n\n`;

  message += `Stay safe! 🌬️`;

  return message;
}

/**
 * Check if alert should be sent based on thresholds and last alert
 */
function shouldSendAlert(healthCategory, currentAQI, lastAlertAQI, lastAlertTime) {
  // Define thresholds based on health category
  const thresholds = {
    normal: 150,
    asthma: 120,
    child: 100,
    elderly: 110,
    pregnant: 80,
    heart_patient: 90,
  };

  const threshold = thresholds[healthCategory] || 150;

  // Always send if AQI exceeds threshold
  if (currentAQI > threshold) {
    // Check if we should send (avoid duplicates unless significant change)
    if (!lastAlertTime) {
      return true; // First alert
    }

    const hoursSinceLastAlert = (Date.now() - lastAlertTime.getTime()) / (1000 * 60 * 60);
    
    // Send if:
    // 1. More than 2 hours since last alert
    // 2. AQI changed significantly (more than 20 points)
    // 3. AQI crossed into new category
    if (hoursSinceLastAlert >= 2) {
      return true;
    }

    if (lastAlertAQI && Math.abs(currentAQI - lastAlertAQI) > 20) {
      return true;
    }

    // Check if category changed
    const currentCategory = getAQICategory(currentAQI).label;
    const lastCategory = lastAlertAQI ? getAQICategory(lastAlertAQI).label : null;
    if (lastCategory && currentCategory !== lastCategory) {
      return true;
    }
  }

  return false;
}

module.exports = {
  generateAlertMessage,
  getAQICategory,
  getHealthWarnings,
  getGeneralRecommendations,
  shouldSendAlert,
};

