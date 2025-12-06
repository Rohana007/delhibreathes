// Load environment variables from backend/.env
const path = require('path');
const dotenv = require('dotenv');

// Try to load .env from backend directory
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`[Config] Warning: Could not load .env file from ${envPath}`);
  console.warn(`[Config] Error: ${result.error.message}`);
  // Fallback to default dotenv behavior (current directory)
  dotenv.config();
}

module.exports = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  apis: {
    openWeather: {
      key: process.env.OPENWEATHER_API_KEY,
      baseUrl: 'https://api.openweathermap.org/data/2.5',
    },
    waqi: {
      token: process.env.WAQI_API_TOKEN,
      baseUrl: 'https://api.waqi.info',
    },
    nasaFirms: {
      key: process.env.NASA_FIRMS_API_KEY,
      baseUrl: 'https://firms.modaps.eosdis.nasa.gov/api',
    },
    iqair: {
      key: process.env.IQAIR_API_KEY,
      baseUrl: 'https://api.airvisual.com/v2',
    },
    openRouteService: {
      key: process.env.ORS_API_KEY,
      baseUrl: 'https://api.openrouteservice.org',
    },
    googleMaps: {
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  
  // MongoDB and Redis for Safe Route service
  mongo: {
    uri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/delhi_breathes',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 120,
    longTtl: 3600, // 1 hour for historical data
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Delhi NCR Locations with CPCB Station IDs
  locations: {
    delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi', cpcbId: 'site_103', district: 'Central Delhi' },
    noida: { lat: 28.5355, lon: 77.3910, name: 'Noida', cpcbId: 'site_119', district: 'Gautam Buddha Nagar' },
    ghaziabad: { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad', cpcbId: 'site_118', district: 'Ghaziabad' },
    faridabad: { lat: 28.4089, lon: 77.3178, name: 'Faridabad', cpcbId: 'site_120', district: 'Faridabad' },
    gurgaon: { lat: 28.4595, lon: 77.0266, name: 'Gurgaon', cpcbId: 'site_121', district: 'Gurugram' },
    greaterNoida: { lat: 28.4744, lon: 77.5040, name: 'Greater Noida', cpcbId: 'site_122', district: 'Gautam Buddha Nagar' },
    dwarka: { lat: 28.5921, lon: 77.0460, name: 'Dwarka', cpcbId: 'site_104', district: 'South West Delhi' },
    rohini: { lat: 28.7495, lon: 77.0565, name: 'Rohini', cpcbId: 'site_105', district: 'North West Delhi' },
    anandVihar: { lat: 28.6469, lon: 77.3164, name: 'Anand Vihar', cpcbId: 'site_106', district: 'East Delhi' },
    ito: { lat: 28.6289, lon: 77.2405, name: 'ITO', cpcbId: 'site_107', district: 'Central Delhi' },
  },
  
  // CPCB Stations in Delhi NCR
  cpcbStations: [
    { id: 'site_103', name: 'NSIT Dwarka', lat: 28.6090, lon: 77.0323, city: 'Delhi' },
    { id: 'site_104', name: 'Punjabi Bagh', lat: 28.6683, lon: 77.1167, city: 'Delhi' },
    { id: 'site_105', name: 'RK Puram', lat: 28.5651, lon: 77.1752, city: 'Delhi' },
    { id: 'site_106', name: 'Anand Vihar', lat: 28.6469, lon: 77.3164, city: 'Delhi' },
    { id: 'site_107', name: 'ITO', lat: 28.6289, lon: 77.2405, city: 'Delhi' },
    { id: 'site_108', name: 'Mandir Marg', lat: 28.6364, lon: 77.2013, city: 'Delhi' },
    { id: 'site_109', name: 'Sirifort', lat: 28.5504, lon: 77.2158, city: 'Delhi' },
    { id: 'site_110', name: 'Shadipur', lat: 28.6514, lon: 77.1473, city: 'Delhi' },
    { id: 'site_119', name: 'Sector 62 Noida', lat: 28.6246, lon: 77.3570, city: 'Noida' },
    { id: 'site_118', name: 'Vasundhara Ghaziabad', lat: 28.6604, lon: 77.3573, city: 'Ghaziabad' },
  ],
  
  // Indian AQI Standards (CPCB National Air Quality Index)
  indianAqi: {
    good: { min: 0, max: 50, color: '#009966', label: 'Good', healthImpact: 'Minimal impact' },
    satisfactory: { min: 51, max: 100, color: '#FFDE33', label: 'Satisfactory', healthImpact: 'Minor breathing discomfort to sensitive people' },
    moderate: { min: 101, max: 200, color: '#FF9933', label: 'Moderate', healthImpact: 'Breathing discomfort to people with lungs, asthma and heart diseases' },
    poor: { min: 201, max: 300, color: '#FF0000', label: 'Poor', healthImpact: 'Breathing discomfort to most people on prolonged exposure' },
    veryPoor: { min: 301, max: 400, color: '#9966CC', label: 'Very Poor', healthImpact: 'Respiratory illness on prolonged exposure' },
    severe: { min: 401, max: 500, color: '#7E0023', label: 'Severe', healthImpact: 'Serious health impacts, avoid outdoor activity' },
  },
  
  // CPCB/WHO Pollutant Limits (24-hour average in µg/m³)
  pollutantLimits: {
    pm25: { cpcb: 60, who: 15, unit: 'µg/m³', name: 'PM2.5' },
    pm10: { cpcb: 100, who: 45, unit: 'µg/m³', name: 'PM10' },
    no2: { cpcb: 80, who: 25, unit: 'µg/m³', name: 'NO₂' },
    so2: { cpcb: 80, who: 40, unit: 'µg/m³', name: 'SO₂' },
    co: { cpcb: 4, who: 4, unit: 'mg/m³', name: 'CO' },
    o3: { cpcb: 100, who: 100, unit: 'µg/m³', name: 'O₃' },
    nh3: { cpcb: 400, who: null, unit: 'µg/m³', name: 'NH₃' },
    pb: { cpcb: 1, who: 0.5, unit: 'µg/m³', name: 'Lead' },
  },
  
  // Delhi Seasonal Patterns
  seasons: {
    winter: { months: [11, 12, 1, 2], name: 'Winter', riskLevel: 'very_high' },
    summer: { months: [3, 4, 5, 6], name: 'Summer', riskLevel: 'moderate' },
    monsoon: { months: [7, 8, 9], name: 'Monsoon', riskLevel: 'low' },
    postMonsoon: { months: [10], name: 'Post-Monsoon', riskLevel: 'high' },
  },
  
  // Pollution Source Categories
  pollutionSources: {
    traffic: { icon: '🚗', color: '#FF6B6B', label: 'Vehicular Traffic' },
    industrial: { icon: '🏭', color: '#845EC2', label: 'Industrial' },
    construction: { icon: '🏗️', color: '#FFA500', label: 'Construction' },
    stubbleBurning: { icon: '🔥', color: '#FF4500', label: 'Stubble Burning' },
    roadDust: { icon: '💨', color: '#DEB887', label: 'Road Dust' },
    powerPlant: { icon: '⚡', color: '#4A4A4A', label: 'Power Plants' },
    residential: { icon: '🏠', color: '#87CEEB', label: 'Residential' },
    waste: { icon: '🗑️', color: '#8B4513', label: 'Waste Burning' },
  },
};
