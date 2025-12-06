/**
 * Global AQI Color System - CPCB Standard Colors
 * Single source of truth for all AQI colors across the entire project
 */

export const AQI_COLORS = {
  good: "#00B050",        // 0-50: Green
  satisfactory: "#92D050", // 51-100: Light Green
  moderate: "#FFC107",     // 101-200: Yellow (for text - darker shade for readability)
  moderateGraph: "#FFEB3B", // 101-200: Brighter yellow for graphs
  poor: "#FF9900",         // 201-300: Orange
  veryPoor: "#DC2626",     // 301-400: Stable red (softer than #FF0000)
  severe: "#7E0023"        // 401-500: Dark blood-red
};

/**
 * Get AQI category label
 */
export function getAqiCategory(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

/**
 * Get AQI color based on value (CPCB Standard)
 */
export function getAqiColor(aqi) {
  if (aqi <= 50) return AQI_COLORS.good;
  if (aqi <= 100) return AQI_COLORS.satisfactory;
  if (aqi <= 200) return AQI_COLORS.moderate;
  if (aqi <= 300) return AQI_COLORS.poor;
  if (aqi <= 400) return AQI_COLORS.veryPoor;
  return AQI_COLORS.severe;
}

/**
 * Get AQI level object with all properties
 */
export function getAqiLevel(aqi) {
  if (aqi <= 50) {
    return {
      level: 'good',
      label: 'Good',
      color: AQI_COLORS.good,
      min: 0,
      max: 50,
      class: 'aqi-good'
    };
  }
  if (aqi <= 100) {
    return {
      level: 'satisfactory',
      label: 'Satisfactory',
      color: AQI_COLORS.satisfactory,
      min: 51,
      max: 100,
      class: 'aqi-satisfactory'
    };
  }
  if (aqi <= 200) {
    return {
      level: 'moderate',
      label: 'Moderate',
      color: AQI_COLORS.moderate,
      min: 101,
      max: 200,
      class: 'aqi-moderate'
    };
  }
  if (aqi <= 300) {
    return {
      level: 'poor',
      label: 'Poor',
      color: AQI_COLORS.poor,
      min: 201,
      max: 300,
      class: 'aqi-poor'
    };
  }
  if (aqi <= 400) {
    return {
      level: 'veryPoor',
      label: 'Very Poor',
      color: AQI_COLORS.veryPoor,
      min: 301,
      max: 400,
      class: 'aqi-veryPoor'
    };
  }
  return {
    level: 'severe',
    label: 'Severe',
    color: AQI_COLORS.severe,
    min: 401,
    max: 500,
    class: 'aqi-severe'
  };
}

/**
 * Get AQI class name for CSS styling
 */
export function getAqiClass(aqi) {
  return getAqiLevel(aqi).class;
}

/**
 * AQI Levels configuration (for backward compatibility)
 */
export const INDIAN_AQI_LEVELS = {
  good: { min: 0, max: 50, color: AQI_COLORS.good, label: 'Good', class: 'aqi-good' },
  satisfactory: { min: 51, max: 100, color: AQI_COLORS.satisfactory, label: 'Satisfactory', class: 'aqi-satisfactory' },
  moderate: { min: 101, max: 200, color: AQI_COLORS.moderate, label: 'Moderate', class: 'aqi-moderate' },
  poor: { min: 201, max: 300, color: AQI_COLORS.poor, label: 'Poor', class: 'aqi-poor' },
  veryPoor: { min: 301, max: 400, color: AQI_COLORS.veryPoor, label: 'Very Poor', class: 'aqi-veryPoor' },
  severe: { min: 401, max: 500, color: AQI_COLORS.severe, label: 'Severe', class: 'aqi-severe' },
};

