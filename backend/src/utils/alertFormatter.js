const logger = require('./logger');

/**
 * Get AQI category label and emoji
 * @param {number} aqi - AQI value
 * @returns {object} - {label, emoji}
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
 * Get health-specific recommendations based on health category and AQI
 * @param {string} healthCategory - Health category (asthma, child, elderly, pregnant, heart_patient, normal)
 * @param {number} aqi - Current AQI value
 * @returns {array} - Array of recommendation strings
 */
function getHealthRecommendations(healthCategory, aqi) {
  const recommendations = [];

  switch (healthCategory) {
    case 'asthma':
      if (aqi > 100) {
        recommendations.push('• Avoid outdoor activities');
        recommendations.push('• Use N95 mask if going out');
        recommendations.push('• Keep inhaler ready');
      }
      if (aqi > 120) {
        recommendations.push('• High breathing difficulty expected');
        recommendations.push('• Stay indoors with air purifier');
      }
      break;

    case 'child':
      if (aqi > 75) {
        recommendations.push('• Children are sensitive at this AQI');
        recommendations.push('• Avoid outdoor play');
      }
      if (aqi > 100) {
        recommendations.push('• Keep children indoors');
        recommendations.push('• Use air purifier if available');
      }
      break;

    case 'elderly':
      if (aqi > 120) {
        recommendations.push('• Elderly risk increased');
        recommendations.push('• Stay indoors');
      }
      if (aqi > 150) {
        recommendations.push('• Avoid outdoor walks');
        recommendations.push('• Monitor breathing closely');
      }
      break;

    case 'pregnant':
      if (aqi > 90) {
        recommendations.push('• Pregnant women should avoid outdoor travel');
      }
      if (aqi > 120) {
        recommendations.push('• High risk for pregnancy');
        recommendations.push('• Stay indoors with air purifier');
      }
      break;

    case 'heart_patient':
      if (aqi > 90) {
        recommendations.push('• Cardiac stress possible');
        recommendations.push('• Avoid outdoor exercise');
      }
      if (aqi > 150) {
        recommendations.push('• High cardiovascular risk');
        recommendations.push('• Stay indoors and monitor heart rate');
      }
      break;

    case 'normal':
    default:
      if (aqi > 150) {
        recommendations.push('• Unhealthy air quality');
        recommendations.push('• Reduce outdoor exposure');
      }
      break;
  }

  return recommendations;
}

/**
 * Format AQI alert message for SMS/WhatsApp
 * @param {object} params - Alert parameters
 * @param {string} params.region - Region name
 * @param {number} params.aqi - Current AQI value
 * @param {string} params.category - AQI category (optional, will be calculated if not provided)
 * @param {string} params.healthCategory - User's health category
 * @param {object} params.pollutants - Pollutant values (optional)
 * @returns {string} - Formatted alert message
 */
function formatAQIAlert({ region, aqi, category, healthCategory, pollutants = {} }) {
  if (!region || aqi === undefined || !healthCategory) {
    logger.error('[Alert Formatter] Missing required parameters');
    return '⚠ AQI Alert: Invalid parameters';
  }

  const aqiCategory = category || getAQICategory(aqi);
  const healthRecs = getHealthRecommendations(healthCategory, aqi);

  let message = `⚠ Air Quality Alert\n`;
  message += `Region: ${region}\n`;
  message += `AQI: ${aqi} (${aqiCategory.label})\n\n`;

  // Health risk section
  const healthCategoryLabels = {
    normal: 'Normal',
    asthma: 'Asthma',
    child: 'Child',
    elderly: 'Elderly',
    pregnant: 'Pregnant',
    heart_patient: 'Heart Patient',
  };

  const healthLabel = healthCategoryLabels[healthCategory] || healthCategory;
  
  if (healthRecs.length > 0) {
    message += `Health Risk (${healthLabel}): High\n`;
    message += `Recommendations:\n`;
    healthRecs.forEach(rec => {
      message += `${rec}\n`;
    });
    message += `\n`;
  } else {
    message += `Health Risk (${healthLabel}): Low\n\n`;
  }

  // Pollutant breakdown
  if (Object.keys(pollutants).length > 0) {
    const pollutantParts = [];
    if (pollutants.pm25 !== undefined) pollutantParts.push(`PM2.5: ${Math.round(pollutants.pm25)}`);
    if (pollutants.pm10 !== undefined) pollutantParts.push(`PM10: ${Math.round(pollutants.pm10)}`);
    if (pollutants.no2 !== undefined) pollutantParts.push(`NO₂: ${Math.round(pollutants.no2)}`);
    if (pollutants.co !== undefined) pollutantParts.push(`CO: ${Math.round(pollutants.co)}`);
    if (pollutants.o3 !== undefined) pollutantParts.push(`O₃: ${Math.round(pollutants.o3)}`);
    
    if (pollutantParts.length > 0) {
      message += `${pollutantParts.join(' | ')}\n\n`;
    }
  }

  message += `Stay Safe.`;

  return message;
}

module.exports = {
  formatAQIAlert,
  getAQICategory,
  getHealthRecommendations,
};

