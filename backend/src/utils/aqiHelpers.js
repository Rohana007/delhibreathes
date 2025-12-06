const config = require('../config');

/**
 * Get AQI level information based on AQI value (Indian AQI Standards)
 */
function getAqiLevel(aqi) {
  const levels = config.indianAqi;
  
  if (aqi <= levels.good.max) return { ...levels.good, level: 'good' };
  if (aqi <= levels.satisfactory.max) return { ...levels.satisfactory, level: 'satisfactory' };
  if (aqi <= levels.moderate.max) return { ...levels.moderate, level: 'moderate' };
  if (aqi <= levels.poor.max) return { ...levels.poor, level: 'poor' };
  if (aqi <= levels.veryPoor.max) return { ...levels.veryPoor, level: 'veryPoor' };
  return { ...levels.severe, level: 'severe' };
}

/**
 * Get health recommendations based on AQI level and user category
 * Updated for Indian AQI Standards
 */
function getHealthRecommendations(aqi, userCategory = 'general') {
  const level = getAqiLevel(aqi);
  
  const recommendations = {
    good: {
      general: { riskLevel: 'Minimal', safeOutdoorTime: 'Unlimited', maskType: 'None needed', activities: 'All outdoor activities safe' },
      child: { riskLevel: 'Minimal', safeOutdoorTime: 'Unlimited', maskType: 'None needed', activities: 'Play outdoors freely' },
      elderly: { riskLevel: 'Minimal', safeOutdoorTime: 'Unlimited', maskType: 'None needed', activities: 'Normal activities' },
      asthmatic: { riskLevel: 'Minimal', safeOutdoorTime: '6+ hours', maskType: 'None needed', activities: 'Light outdoor activities safe' },
      pregnant: { riskLevel: 'Minimal', safeOutdoorTime: 'Unlimited', maskType: 'None needed', activities: 'Normal activities' },
      outdoorWorker: { riskLevel: 'Minimal', safeOutdoorTime: 'Full shift', maskType: 'None needed', activities: 'Normal work activities' },
    },
    satisfactory: {
      general: { riskLevel: 'Minor', safeOutdoorTime: '4-6 hours', maskType: 'Optional N95', activities: 'Most activities safe' },
      child: { riskLevel: 'Minor', safeOutdoorTime: '3-4 hours', maskType: 'N95 for sensitive', activities: 'Reduce prolonged outdoor play' },
      elderly: { riskLevel: 'Minor', safeOutdoorTime: '3-4 hours', maskType: 'N95 recommended', activities: 'Limit strenuous activities' },
      asthmatic: { riskLevel: 'Moderate', safeOutdoorTime: '2-3 hours', maskType: 'N95 required', activities: 'Avoid heavy exertion outdoors' },
      pregnant: { riskLevel: 'Minor', safeOutdoorTime: '3-4 hours', maskType: 'N95 recommended', activities: 'Limit outdoor exposure' },
      outdoorWorker: { riskLevel: 'Minor', safeOutdoorTime: '6 hours with breaks', maskType: 'N95 recommended', activities: 'Take regular indoor breaks' },
    },
    moderate: {
      general: { riskLevel: 'Moderate', safeOutdoorTime: '2-4 hours', maskType: 'N95 recommended', activities: 'Reduce prolonged outdoor exertion' },
      child: { riskLevel: 'High', safeOutdoorTime: '1-2 hours', maskType: 'N95 required', activities: 'Indoor play preferred' },
      elderly: { riskLevel: 'High', safeOutdoorTime: '1-2 hours', maskType: 'N95 required', activities: 'Stay indoors mostly' },
      asthmatic: { riskLevel: 'Very High', safeOutdoorTime: '< 1 hour', maskType: 'N95/N99 required', activities: 'Stay indoors, keep inhaler ready' },
      pregnant: { riskLevel: 'High', safeOutdoorTime: '1-2 hours', maskType: 'N95 required', activities: 'Stay indoors, use air purifier' },
      outdoorWorker: { riskLevel: 'High', safeOutdoorTime: '4 hours max', maskType: 'N95 required', activities: 'Frequent breaks, hydrate well' },
    },
    poor: {
      general: { riskLevel: 'High', safeOutdoorTime: '1-2 hours', maskType: 'N95 required', activities: 'Avoid outdoor exercise' },
      child: { riskLevel: 'Very High', safeOutdoorTime: '< 30 min', maskType: 'N95/N99 required', activities: 'Stay indoors' },
      elderly: { riskLevel: 'Very High', safeOutdoorTime: '< 30 min', maskType: 'N95/N99 required', activities: 'Stay indoors, monitor health' },
      asthmatic: { riskLevel: 'Severe', safeOutdoorTime: 'Avoid outdoors', maskType: 'N99 if must go out', activities: 'Stay indoors, air purifier on' },
      pregnant: { riskLevel: 'Very High', safeOutdoorTime: '< 30 min', maskType: 'N95/N99 required', activities: 'Stay indoors strictly' },
      outdoorWorker: { riskLevel: 'Very High', safeOutdoorTime: '2 hours max', maskType: 'N95 required', activities: 'Consider work-from-home if possible' },
    },
    veryPoor: {
      general: { riskLevel: 'Very High', safeOutdoorTime: '< 1 hour', maskType: 'N95/N99 required', activities: 'Stay indoors' },
      child: { riskLevel: 'Severe', safeOutdoorTime: 'Avoid outdoors', maskType: 'N99 if emergency', activities: 'Schools should close' },
      elderly: { riskLevel: 'Severe', safeOutdoorTime: 'Avoid outdoors', maskType: 'N99 if emergency', activities: 'Stay indoors, monitor symptoms' },
      asthmatic: { riskLevel: 'Critical', safeOutdoorTime: 'Do not go out', maskType: 'N99 emergency only', activities: 'Emergency contact ready' },
      pregnant: { riskLevel: 'Severe', safeOutdoorTime: 'Avoid outdoors', maskType: 'N99 if emergency', activities: 'Stay indoors, consult doctor' },
      outdoorWorker: { riskLevel: 'Severe', safeOutdoorTime: '1 hour max', maskType: 'N99 required', activities: 'Essential work only' },
    },
    severe: {
      general: { riskLevel: 'Severe', safeOutdoorTime: 'Avoid outdoors', maskType: 'N99/P100 required', activities: 'Stay indoors, seal windows' },
      child: { riskLevel: 'Critical', safeOutdoorTime: 'Do not go out', maskType: 'N99 emergency only', activities: 'Schools closed, stay home' },
      elderly: { riskLevel: 'Critical', safeOutdoorTime: 'Do not go out', maskType: 'N99 emergency only', activities: 'Stay indoors, medical alert' },
      asthmatic: { riskLevel: 'Emergency', safeOutdoorTime: 'Do not go out', maskType: 'Do not go out', activities: 'Hospital on standby' },
      pregnant: { riskLevel: 'Critical', safeOutdoorTime: 'Do not go out', maskType: 'N99 emergency only', activities: 'Stay indoors, medical consult' },
      outdoorWorker: { riskLevel: 'Critical', safeOutdoorTime: '< 30 min', maskType: 'N99/P100 required', activities: 'Emergency work only' },
    },
  };

  const levelKey = level.level;
  const categoryRecs = recommendations[levelKey];
  
  if (!categoryRecs) {
    // Fallback if level not found
    return {
      riskLevel: 'Unknown',
      safeOutdoorTime: 'Check AQI',
      maskType: 'N95 recommended',
      activities: 'Monitor air quality',
      aqiLevel: level,
    };
  }

  return {
    ...(categoryRecs[userCategory] || categoryRecs.general),
    aqiLevel: level,
  };
}

/**
 * Calculate exposure score for a route
 */
function calculateExposureScore(routeAqiPoints, travelTimeMinutes, mode) {
  if (!routeAqiPoints || routeAqiPoints.length === 0) return 0;
  
  const avgAqi = routeAqiPoints.reduce((sum, p) => sum + p.aqi, 0) / routeAqiPoints.length;
  
  // Mode multipliers (higher = more exposure)
  const modeMultipliers = {
    walking: 1.5,
    cycling: 1.4,
    'two-wheeler': 1.3,
    bus: 0.8,
    car: 0.6,
  };
  
  const multiplier = modeMultipliers[mode] || 1;
  const exposureScore = (avgAqi * travelTimeMinutes * multiplier) / 100;
  
  return Math.round(exposureScore * 10) / 10;
}

/**
 * Get mask recommendation based on AQI and travel mode
 */
function getMaskRecommendation(aqi, mode) {
  const isHighExposure = ['walking', 'cycling', 'two-wheeler'].includes(mode);
  
  if (aqi <= 50) return { required: false, type: 'None needed' };
  if (aqi <= 100) return { required: isHighExposure, type: isHighExposure ? 'N95 recommended' : 'Optional' };
  if (aqi <= 200) return { required: true, type: 'N95 recommended' };
  if (aqi <= 300) return { required: true, type: 'N95 required' };
  if (aqi <= 400) return { required: true, type: 'N95/N99 required' };
  return { required: true, type: 'N99/P100 required' };
}

/**
 * Calculate Indian AQI from pollutant concentrations
 */
function calculateIndianAQI(pollutants) {
  const subIndices = [];
  
  // PM2.5 sub-index calculation (Indian standards)
  if (pollutants.pm25 != null) {
    subIndices.push(calculateSubIndex(pollutants.pm25, [
      { c: 0, i: 0 }, { c: 30, i: 50 }, { c: 60, i: 100 },
      { c: 90, i: 200 }, { c: 120, i: 300 }, { c: 250, i: 400 }, { c: 380, i: 500 }
    ]));
  }
  
  // PM10 sub-index calculation
  if (pollutants.pm10 != null) {
    subIndices.push(calculateSubIndex(pollutants.pm10, [
      { c: 0, i: 0 }, { c: 50, i: 50 }, { c: 100, i: 100 },
      { c: 250, i: 200 }, { c: 350, i: 300 }, { c: 430, i: 400 }, { c: 510, i: 500 }
    ]));
  }
  
  // NO2 sub-index
  if (pollutants.no2 != null) {
    subIndices.push(calculateSubIndex(pollutants.no2, [
      { c: 0, i: 0 }, { c: 40, i: 50 }, { c: 80, i: 100 },
      { c: 180, i: 200 }, { c: 280, i: 300 }, { c: 400, i: 400 }, { c: 520, i: 500 }
    ]));
  }
  
  // SO2 sub-index
  if (pollutants.so2 != null) {
    subIndices.push(calculateSubIndex(pollutants.so2, [
      { c: 0, i: 0 }, { c: 40, i: 50 }, { c: 80, i: 100 },
      { c: 380, i: 200 }, { c: 800, i: 300 }, { c: 1600, i: 400 }, { c: 2100, i: 500 }
    ]));
  }
  
  // CO sub-index (mg/m³)
  if (pollutants.co != null) {
    subIndices.push(calculateSubIndex(pollutants.co, [
      { c: 0, i: 0 }, { c: 1, i: 50 }, { c: 2, i: 100 },
      { c: 10, i: 200 }, { c: 17, i: 300 }, { c: 34, i: 400 }, { c: 46, i: 500 }
    ]));
  }
  
  // O3 sub-index
  if (pollutants.o3 != null) {
    subIndices.push(calculateSubIndex(pollutants.o3, [
      { c: 0, i: 0 }, { c: 50, i: 50 }, { c: 100, i: 100 },
      { c: 168, i: 200 }, { c: 208, i: 300 }, { c: 748, i: 400 }, { c: 940, i: 500 }
    ]));
  }
  
  // Return maximum sub-index as the AQI
  return subIndices.length > 0 ? Math.round(Math.max(...subIndices)) : null;
}

/**
 * Calculate sub-index using linear interpolation
 */
function calculateSubIndex(concentration, breakpoints) {
  for (let i = 0; i < breakpoints.length - 1; i++) {
    if (concentration <= breakpoints[i + 1].c) {
      const cLow = breakpoints[i].c;
      const cHigh = breakpoints[i + 1].c;
      const iLow = breakpoints[i].i;
      const iHigh = breakpoints[i + 1].i;
      
      return ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow;
    }
  }
  // If concentration exceeds all breakpoints
  return breakpoints[breakpoints.length - 1].i;
}

module.exports = {
  getAqiLevel,
  getHealthRecommendations,
  calculateExposureScore,
  getMaskRecommendation,
  calculateIndianAQI,
  calculateSubIndex,
};
