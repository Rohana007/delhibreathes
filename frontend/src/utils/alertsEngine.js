/**
 * Frontend-only Alert Engine
 * Generates alerts based on AQI and user's health category
 * NO backend calls - uses only frontend data
 */

// Custom event name for forcing immediate alert check
export const ALERTS_UPDATED_EVENT = 'alerts:force-update';

// AQI thresholds based on health category
const HEALTH_CATEGORY_THRESHOLDS = {
  normal: 150,
  asthma: 100,
  elderly: 120,
  pregnant: 90,
  child: 75,
  heart_patient: 90,
  sensitive: 50,
};

// AQI level labels
const AQI_LABELS = {
  good: { min: 0, max: 50, label: 'Good', color: 'green' },
  moderate: { min: 51, max: 100, label: 'Moderate', color: 'yellow' },
  unhealthySensitive: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: 'orange' },
  unhealthy: { min: 151, max: 200, label: 'Unhealthy', color: 'red' },
  veryUnhealthy: { min: 201, max: 300, label: 'Very Unhealthy', color: 'purple' },
  hazardous: { min: 301, max: 500, label: 'Hazardous', color: 'maroon' },
};

/**
 * Get AQI level label
 */
function getAqiLevel(aqi) {
  if (aqi <= 50) return AQI_LABELS.good;
  if (aqi <= 100) return AQI_LABELS.moderate;
  if (aqi <= 150) return AQI_LABELS.unhealthySensitive;
  if (aqi <= 200) return AQI_LABELS.unhealthy;
  if (aqi <= 300) return AQI_LABELS.veryUnhealthy;
  return AQI_LABELS.hazardous;
}

/**
 * Generate alerts based on AQI and health category
 * @param {number} aqi - Current AQI value
 * @param {string} healthCategory - User's health category
 * @param {string} region - User's selected region
 * @returns {Array} Array of alert objects
 */
export function generateAlerts(aqi, healthCategory = 'normal', region = 'Delhi') {
  if (!aqi || aqi === null || aqi === undefined) {
    return [];
  }

  const alerts = [];
  const threshold = HEALTH_CATEGORY_THRESHOLDS[healthCategory] || 150;
  const aqiLevel = getAqiLevel(aqi);

  // Base alert: AQI exceeds threshold for health category
  if (aqi >= threshold) {
    const severity = aqi >= 200 ? 'danger' : aqi >= 150 ? 'warning' : 'info';
    
    let message = '';
    let title = 'Air Quality Alert';

    // Health category specific messages
    switch (healthCategory) {
      case 'child':
        if (aqi >= 80) {
          message = `AQI ${aqi} (${aqiLevel.label}) — Children are particularly sensitive. Limit outdoor play and activities.`;
          title = 'Child Health Alert';
        }
        break;
      
      case 'elderly':
        if (aqi >= 80) {
          message = `AQI ${aqi} (${aqiLevel.label}) — Seniors should avoid strenuous outdoor activities. Stay indoors when possible.`;
          title = 'Senior Health Alert';
        }
        break;
      
      case 'asthma':
        if (aqi >= 50) {
          message = `AQI ${aqi} (${aqiLevel.label}) — High risk for asthma patients. Carry your inhaler and avoid outdoor exercise.`;
          title = 'Asthma Alert';
        }
        break;
      
      case 'heart_patient':
        if (aqi >= 50) {
          message = `AQI ${aqi} (${aqiLevel.label}) — Heart patients should avoid outdoor exertion. Monitor your condition closely.`;
          title = 'Heart Health Alert';
        }
        break;
      
      case 'pregnant':
        if (aqi >= 90) {
          message = `AQI ${aqi} (${aqiLevel.label}) — Pregnant women should limit outdoor exposure. Wear a mask if going outside.`;
          title = 'Pregnancy Health Alert';
        }
        break;
      
      case 'sensitive':
        if (aqi >= 50) {
          message = `AQI ${aqi} (${aqiLevel.label}) — Sensitive individuals should consider wearing a mask outdoors.`;
          title = 'Sensitivity Alert';
        }
        break;
      
      default: // normal
        if (aqi >= 150) {
          message = `AQI ${aqi} (${aqiLevel.label}) — Air quality is unhealthy. Limit outdoor activities.`;
          title = 'Air Quality Alert';
        }
        break;
    }

    // If message was set, add alert
    if (message) {
      alerts.push({
        title,
        message: `${message} Region: ${region}`,
        severity,
        aqi,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Critical alerts for very high AQI (all categories)
  if (aqi >= 300) {
    alerts.push({
      title: 'Hazardous Air Quality',
      message: `AQI ${aqi} — Air quality is HAZARDOUS. Stay indoors, close windows, and use air purifiers if available.`,
      severity: 'danger',
      aqi,
      timestamp: new Date().toISOString(),
    });
  } else if (aqi >= 200) {
    alerts.push({
      title: 'Very Unhealthy Air',
      message: `AQI ${aqi} — Air quality is very unhealthy. Avoid all outdoor activities.`,
      severity: 'danger',
      aqi,
      timestamp: new Date().toISOString(),
    });
  }

  // Health category specific recommendations
  if (healthCategory === 'pregnant' && aqi >= 90) {
    alerts.push({
      title: 'Pregnancy Safety',
      message: 'Consider wearing an N95 mask if you must go outside. Limit time outdoors.',
      severity: 'warning',
      aqi,
      timestamp: new Date().toISOString(),
    });
  }

  if (healthCategory === 'asthma' && aqi >= 100) {
    alerts.push({
      title: 'Asthma Precaution',
      message: 'Keep your rescue inhaler with you at all times. Avoid outdoor exercise.',
      severity: 'warning',
      aqi,
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Get alert preferences from localStorage
 * @returns {Object|null} Alert preferences or null
 */
export function getAlertPreferences() {
  try {
    const saved = localStorage.getItem('personalized_alerts');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Error reading alert preferences:', err);
  }
  return null;
}

/**
 * Check if alerts are enabled
 * @returns {boolean}
 */
export function areAlertsEnabled() {
  const prefs = getAlertPreferences();
  return prefs && prefs.enabled === true;
}

/**
 * Force immediate alert check by dispatching custom event
 * This triggers instant alert generation without waiting for poller timing
 */
export function forceImmediateAlertCheck() {
  const event = new CustomEvent(ALERTS_UPDATED_EVENT, {
    detail: { force: true }
  });
  window.dispatchEvent(event);
}

