/**
 * Format a date to readable string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a time to readable string
 */
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a datetime to readable string
 */
export function formatDateTime(date) {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return formatDate(date);
}

/**
 * Import AQI color functions from global config
 */
import { 
  AQI_COLORS,
  getAqiCategory,
  getAqiColor,
  getAqiLevel,
  getAqiClass,
  INDIAN_AQI_LEVELS
} from './aqiColors';

/**
 * Re-export AQI color functions for backward compatibility
 */
export { 
  AQI_COLORS,
  getAqiCategory,
  getAqiColor,
  getAqiLevel,
  getAqiClass,
  INDIAN_AQI_LEVELS
};

/**
 * Get Indian AQI label (alias for getAqiCategory for backward compatibility)
 */
export function getAqiLabel(aqi) {
  return getAqiCategory(aqi);
}

/**
 * Get AQI background gradient (removed - no gradients in new design)
 */
export function getAqiGradient(aqi) {
  // No gradients - return white background
  return '#FFFFFF';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-IN');
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Delhi NCR locations
 */
export const NCR_LOCATIONS = {
  delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi', district: 'Central Delhi' },
  noida: { lat: 28.5355, lon: 77.3910, name: 'Noida', district: 'Gautam Buddha Nagar' },
  ghaziabad: { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad', district: 'Ghaziabad' },
  faridabad: { lat: 28.4089, lon: 77.3178, name: 'Faridabad', district: 'Faridabad' },
  gurgaon: { lat: 28.4595, lon: 77.0266, name: 'Gurgaon', district: 'Gurugram' },
  greaterNoida: { lat: 28.4744, lon: 77.5040, name: 'Greater Noida', district: 'G.B. Nagar' },
  dwarka: { lat: 28.5921, lon: 77.0460, name: 'Dwarka', district: 'South West Delhi' },
  rohini: { lat: 28.7495, lon: 77.0565, name: 'Rohini', district: 'North West Delhi' },
  anandVihar: { lat: 28.6469, lon: 77.3164, name: 'Anand Vihar', district: 'East Delhi' },
  ito: { lat: 28.6289, lon: 77.2405, name: 'ITO', district: 'Central Delhi' },
};

/**
 * User categories
 */
export const USER_CATEGORIES = [
  { id: 'general', label: 'General', icon: '👤', description: 'Healthy adult' },
  { id: 'child', label: 'Child', icon: '👶', description: 'Under 14 years' },
  { id: 'elderly', label: 'Elderly', icon: '👴', description: 'Above 60 years' },
  { id: 'asthmatic', label: 'Asthmatic', icon: '🫁', description: 'Respiratory conditions' },
  { id: 'pregnant', label: 'Pregnant', icon: '🤰', description: 'Expecting mothers' },
  { id: 'heartPatient', label: 'Heart Patient', icon: '❤️', description: 'Cardiovascular conditions' },
  { id: 'outdoorWorker', label: 'Outdoor Worker', icon: '👷', description: 'Extended outdoor exposure' },
];

/**
 * Travel modes
 */
export const TRAVEL_MODES = [
  { id: 'walking', label: 'Walking', icon: '🚶', exposureFactor: 1.5 },
  { id: 'cycling', label: 'Cycling', icon: '🚴', exposureFactor: 1.4 },
  { id: 'two-wheeler', label: 'Two Wheeler', icon: '🏍️', exposureFactor: 1.3 },
  { id: 'car', label: 'Car (AC)', icon: '🚗', exposureFactor: 0.6 },
  { id: 'bus', label: 'Bus/Metro', icon: '🚌', exposureFactor: 0.7 },
];

/**
 * Report categories
 */
export const REPORT_CATEGORIES = [
  { id: 'pollution', label: 'General Pollution', icon: '💨', color: '#6B7280' },
  { id: 'burning', label: 'Waste/Stubble Burning', icon: '🔥', color: '#EF4444' },
  { id: 'construction', label: 'Construction Dust', icon: '🏗️', color: '#F59E0B' },
  { id: 'industrial', label: 'Industrial Emission', icon: '🏭', color: '#8B5CF6' },
  { id: 'traffic', label: 'Vehicle Pollution', icon: '🚗', color: '#3B82F6' },
  { id: 'other', label: 'Other', icon: '📍', color: '#10B981' },
];

/**
 * Pollutant info
 */
export const POLLUTANT_INFO = {
  pm25: { 
    name: 'PM2.5', 
    fullName: 'Fine Particulate Matter',
    unit: 'µg/m³', 
    cpcbLimit: 60, 
    whoLimit: 15,
    description: 'Fine particles less than 2.5 micrometers that can penetrate deep into lungs',
    sources: ['Vehicle exhaust', 'Industrial emissions', 'Burning'],
    color: '#EF4444'
  },
  pm10: { 
    name: 'PM10', 
    fullName: 'Coarse Particulate Matter',
    unit: 'µg/m³', 
    cpcbLimit: 100, 
    whoLimit: 45,
    description: 'Particles less than 10 micrometers including dust and pollen',
    sources: ['Road dust', 'Construction', 'Industrial processes'],
    color: '#F59E0B'
  },
  no2: { 
    name: 'NO₂', 
    fullName: 'Nitrogen Dioxide',
    unit: 'µg/m³', 
    cpcbLimit: 80, 
    whoLimit: 25,
    description: 'Toxic gas from combustion, causes respiratory issues',
    sources: ['Vehicle exhaust', 'Power plants', 'Industrial boilers'],
    color: '#8B5CF6'
  },
  so2: { 
    name: 'SO₂', 
    fullName: 'Sulfur Dioxide',
    unit: 'µg/m³', 
    cpcbLimit: 80, 
    whoLimit: 40,
    description: 'Pungent gas that irritates respiratory system',
    sources: ['Coal burning', 'Oil refineries', 'Metal processing'],
    color: '#EC4899'
  },
  co: { 
    name: 'CO', 
    fullName: 'Carbon Monoxide',
    unit: 'mg/m³', 
    cpcbLimit: 4, 
    whoLimit: 4,
    description: 'Odorless gas that reduces blood oxygen capacity',
    sources: ['Vehicle exhaust', 'Incomplete combustion', 'Fires'],
    color: '#6366F1'
  },
  o3: { 
    name: 'O₃', 
    fullName: 'Ground-level Ozone',
    unit: 'µg/m³', 
    cpcbLimit: 100, 
    whoLimit: 100,
    description: 'Secondary pollutant formed by sunlight reaction with NOx and VOCs',
    sources: ['Photochemical reactions', 'Vehicle emissions'],
    color: '#06B6D4'
  },
  nh3: { 
    name: 'NH₃', 
    fullName: 'Ammonia',
    unit: 'µg/m³', 
    cpcbLimit: 400, 
    whoLimit: null,
    description: 'Pungent gas from agricultural and industrial sources',
    sources: ['Fertilizers', 'Livestock', 'Industrial processes'],
    color: '#10B981'
  },
};
