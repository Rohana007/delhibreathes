import axios from 'axios';

// FIX: unified baseURL to backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and policy access header
client.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Add policy access header if available
    const policyAccess = localStorage.getItem('policyAccess');
    if (policyAccess === 'true') {
      config.headers['x-policy-access'] = 'true';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 429 rate limiting errors gracefully
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait a moment and try again.');
      return {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        message: 'Rate limit exceeded. Please wait before making more requests.',
      };
    }
    
    // Handle connection errors
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      console.warn('Backend not available');
      return {
        success: false,
        error: 'Backend unavailable',
        message: 'Unable to connect to server. Please check your connection.',
      };
    }
    
    // Handle other errors
    console.error('API Error:', error.response?.data || error.message);
    const errorData = error.response?.data || {
      success: false,
      error: error.message || 'An error occurred',
      message: error.message || 'Request failed',
    };
    
    // Return error object instead of throwing to prevent crashes
    return errorData;
  }
);

// ========== AQI APIs ==========

export async function getAQIByLocation(lat, lon) {
  // The interceptor already returns response.data
  return await client.get('/aqi', { params: { lat, lon } });
}

export async function getAllNCRAQI() {
  try {
    // The interceptor already returns response.data, so the response IS the data
    const data = await client.get('/aqi/ncr');
    console.log('🔵 [API] getAllNCRAQI response:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] getAllNCRAQI error:', error);
    throw error;
  }
}

export async function getHealthRecommendations(lat, lon, category = 'general') {
  const response = await client.get('/aqi/health', { params: { lat, lon, category } });
  return response.data;
}

// ========== Hotspot APIs ==========

export async function getHotspots(days = 1) {
  const response = await client.get('/hotspots', { params: { days } });
  return response.data;
}

export async function getHotspotClusters() {
  const response = await client.get('/hotspots/clusters');
  return response.data;
}

export async function getThermalFireLayer(days = 1) {
  const response = await client.get('/hotspots/thermalFire', { params: { days } });
  return response.data;
}

export async function getConstructionDustHotspots() {
  const response = await client.get('/hotspots/constructionDust');
  return response.data;
}

export async function getCategoryHotspots() {
  try {
    // Backend returns array directly: [{ lat, lng, category }]
    // Axios interceptor extracts response.data, so we get the array directly
    const response = await client.get('/hotspots/categories');
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Category hotspots: Unexpected response format', response);
    return [];
  } catch (error) {
    console.error('Error fetching category hotspots:', error);
    // Return empty array on error - fallback will be used in component
    return [];
  }
}

// ========== Authentication APIs (JWT) ==========

/**
 * Sign up a new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string}>}
 */
export async function signup(name, email, password) {
  try {
    const response = await client.post('/auth/signup', { name, email, password });
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    if (error.success !== undefined || error.error) {
      return error;
    }
    return {
      success: false,
      error: error.error || error.message || 'Failed to sign up',
    };
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string}>}
 */
export async function login(email, password) {
  try {
    const response = await client.post('/auth/login', { email, password });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    if (error.success !== undefined || error.error) {
      return error;
    }
    return {
      success: false,
      error: error.error || error.message || 'Failed to login',
    };
  }
}

/**
 * Get current user (validate token)
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function getMe() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return {
        success: false,
        error: 'No token found',
      };
    }
    const response = await client.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Get me error:', error);
    if (error.success !== undefined || error.error) {
      return error;
    }
    return {
      success: false,
      error: error.error || error.message || 'Failed to get user',
    };
  }
}

// ========== Route APIs ==========

export async function getSafeRoute(origin, destination, mode = 'car') {
  const response = await client.get('/routes/safe', {
    params: {
      originLat: origin.lat,
      originLon: origin.lon,
      destLat: destination.lat,
      destLon: destination.lon,
      mode,
    },
  });
  return response.data;
}

export async function compareRoutes(origin, destination) {
  const response = await client.get('/routes/compare', {
    params: {
      originLat: origin.lat,
      originLon: origin.lon,
      destLat: destination.lat,
      destLon: destination.lon,
    },
  });
  return response.data;
}

// ========== Gamification APIs ==========

export async function getGamificationSummary() {
  try {
    // The axios interceptor already returns response.data, so the result IS the data
    const result = await client.get('/user/gamification/summary');
    // Ensure result is an object
    if (result && typeof result === 'object') {
      return result;
    }
    // If result is not an object, return error
    return {
      success: false,
      error: 'Invalid response from server',
      message: 'Failed to get gamification summary',
    };
  } catch (error) {
    console.error('Get gamification summary error:', error);
    // The interceptor should catch errors and return error objects, but handle just in case
    if (error && typeof error === 'object' && 'success' in error) {
      return error;
    }
    return {
      success: false,
      error: error?.error || error?.message || 'Failed to get gamification summary',
      message: error?.message || 'An error occurred while fetching gamification summary',
    };
  }
}

export async function getBadges() {
  const response = await client.get('/user/badges');
  return response.data;
}

export async function getRewards() {
  const response = await client.get('/user/rewards');
  return response.data;
}

// ========== Prediction APIs ==========

export async function getPredictions(lat, lon) {
  const params = {};
  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  }
  const response = await client.get('/predictions', { params });
  return response.data;
}

export async function get6HourForecast(lat, lon) {
  const params = {};
  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  }
  const response = await client.get('/predictions/6h', { params });
  return response.data;
}

export async function get24HourForecast(lat, lon) {
  const params = {};
  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  }
  const response = await client.get('/predictions/24h', { params });
  return response.data;
}

// ========== ML Forecasting API (Python FastAPI) ==========

/**
 * Fetch 24-hour AQI forecast from ML API
 * @returns {Promise<Array>} Array of forecast objects with datetime, AQI, hour_ahead
 */
export async function getAqiForecast24h() {
  const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8001';
  
  try {
    const response = await fetch(`${ML_API_URL}/predict/24h`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // No cache - always fetch fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.forecasts || [];
  } catch (error) {
    console.error('ML Forecast API error:', error);
    throw error;
  }
}

// ========== Historical AQI API ==========

/**
 * Fetch historical AQI data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} range - 'hourly' (24h) or 'daily' (7 days)
 * @returns {Promise<Array>} Array of historical AQI data points
 */
export async function getAQIHistory(lat, lon, range = 'hourly') {
  try {
    const response = await client.get('/aqi/history', {
      params: { lat, lon, range },
    });
    return response.data || [];
  } catch (error) {
    console.error('Historical AQI API error:', error);
    throw error;
  }
}

// ========== Insights APIs ==========

export async function getInsights(lat, lon) {
  const params = {};
  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  }
  const response = await client.get('/insights', { params });
  return response.data;
}

export async function getPolicyInsights() {
  const response = await client.get('/insights/policy');
  return response.data;
}

// ========== NEW: Seasonal Forecast APIs ==========

export async function getSeasonalForecast(lat, lon) {
  const params = {};
  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  }
  const response = await client.get('/seasonal/forecast', { params });
  return response.data;
}

export async function getCurrentSeason() {
  const response = await client.get('/seasonal/current');
  return response.data;
}

// ========== NEW: Source Contribution APIs ==========

export async function getSourceMarkers() {
  const response = await client.get('/sources/markers');
  return response.data;
}

export async function getSourceContribution(lat, lon) {
  const response = await client.get('/sources/contribution', { params: { lat, lon } });
  return response.data;
}

export async function getSeasonalContribution() {
  const response = await client.get('/sources/seasonal');
  return response.data;
}

// ========== Report APIs (JWT Auth) ==========

/**
 * Submit report with JWT authentication
 * @param {Object} reportData - Report data { description, location, photo }
 * @returns {Promise<{success: boolean, reportId?: string, error?: string}>}
 */
export async function submitReport(reportData) {
  const formData = new FormData();
  formData.append('category', reportData.category);
  formData.append('description', reportData.description);
  formData.append('location', reportData.location || '');
  
  // FIX: Include user profile info and idempotency key
  if (reportData.profile_email) {
    formData.append('profile_email', reportData.profile_email);
  }
  if (reportData.profile_name) {
    formData.append('profile_name', reportData.profile_name);
  }
  if (reportData.idempotency_key) {
    formData.append('idempotency_key', reportData.idempotency_key);
  }
  
  // Append photo if provided
  if (reportData.photo) {
    formData.append('photo', reportData.photo);
  }

  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  if (!token) {
    return {
      success: false,
      error: 'Not authenticated. Please login first.',
    };
  }

  // Use axios directly for multipart/form-data
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await axios.post(`${API_BASE}/reports/create`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file uploads
    });
    
    return response.data;
  } catch (error) {
    console.error('Submit report error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to submit report',
    };
  }
}

/**
 * Get my reports
 * @returns {Promise<{success: boolean, reports?: Array, error?: string}>}
 */
export async function getMyReports() {
  try {
    const response = await client.get('/reports/my-reports');
    return response;
  } catch (error) {
    console.error('Get my reports error:', error);
    return {
      success: false,
      error: error.error || error.message || 'Failed to get reports',
      reports: [],
    };
  }
}

// ========== Profile APIs ==========

/**
 * Get user profile
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function getProfile() {
  try {
    const response = await client.get('/profile');
    // Ensure response is an object with success property
    if (response && typeof response === 'object') {
      return response;
    }
    // If response is not an object, return error
    return {
      success: false,
      error: 'Invalid response from server',
      message: 'Failed to get profile',
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: error?.error || error?.message || 'Failed to get profile',
      message: error?.message || 'An error occurred while fetching profile',
    };
  }
}

/**
 * Update user profile
 * @param {Object} profileData - { name, photo (File) }
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function updateProfile(profileData) {
  try {
    const formData = new FormData();
    formData.append('name', profileData.name);
    if (profileData.photo) {
      formData.append('photo', profileData.photo);
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated. Please login first.',
      };
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await axios.put(`${API_BASE}/profile/edit`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update profile',
    };
  }
}

// ========== Alerts APIs ==========

/**
 * Enable personalized alerts for a user
 * @param {string} phone - Phone number
 * @param {string} healthCategory - Health category (normal, child, elderly, pregnant, asthma, heart_patient)
 * @param {string} region - Region (Delhi, Noida, Ghaziabad, etc.)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function enableAlerts(phone, healthCategory = 'normal', region = 'Delhi') {
  const response = await client.post('/alerts/enable', {
    phone,
    healthCategory,
    region,
  });
  return response;
}

/**
 * Fetch alert data for a region
 * @param {string} region - Region name
 * @returns {Promise<{success: boolean, data?: {aqi, pollutants, region}, error?: string}>}
 */
export async function fetchAlertData(region) {
  const response = await client.get(`/alerts/fetch-alert-data/${region}`);
  return response;
}

/**
 * Disable personalized alerts for a user
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function disableAlerts(phone) {
  const response = await client.post('/alerts/disable', {
    phone,
  });
  return response;
}

/**
 * Get alerts status for a user
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, enabled?: boolean, alertsEnabled?: boolean, error?: string}>}
 */
export async function getAlertsStatus(phone) {
  const response = await client.get(`/alerts/status/${phone}`);
  return response;
}

/**
 * Toggle alerts for a user
 * NOTE: This endpoint does NOT require authentication or OTP verification.
 * It accepts region and healthCategory from the request body.
 * @param {boolean} enabled - Whether to enable or disable alerts
 * @param {string} phone - Phone number (optional, will be auto-generated if not provided)
 * @param {string} region - Region name (required when enabling)
 * @param {string} healthCategory - Health category (required when enabling)
 * @returns {Promise<{success: boolean, alerts_enabled?: boolean, data?: object, error?: string}>}
 */
export async function toggleAlerts(enabled, phone = null, region = null, healthCategory = null) {
  const body = { enabled };
  
  if (phone) {
    body.phone = phone;
  }
  
  if (region) {
    body.region = region;
  }
  
  if (healthCategory) {
    body.healthCategory = healthCategory;
  }
  
  // No auth token required - endpoint is public
  const response = await client.post('/user/alerts/toggle', body);
  return response;
}

// ========== Legacy User Report APIs (for backward compatibility) ==========

export async function submitReportLegacy(reportData) {
  const response = await client.post('/reports', reportData);
  return response;
}

// FIX: corrected reports endpoint for user-facing dashboard
export async function getReports(filters = {}) {
  // Response interceptor already returns response.data, so we return response directly
  const response = await client.get('/reports', { params: filters });
  return response; // Already unwrapped by interceptor
}

export async function getNearbyReports(lat, lon, radius = 5) {
  const response = await client.get('/reports/nearby', { params: { lat, lon, radius } });
  return response.data;
}

export async function getReportStats() {
  const response = await client.get('/reports/stats');
  return response.data;
}

export async function getReportCategories() {
  const response = await client.get('/reports/categories');
  return response.data;
}

/**
 * Update report status
 * PATCH /api/reports/:id/status
 * @param {string} reportId - Report ID
 * @param {string} status - New status ('Pending', 'Reviewed', 'Action Taken')
 * @returns {Promise<{success: boolean, report?: object, error?: string}>}
 */
export async function updateReportStatus(reportId, status) {
  try {
    const response = await client.patch(`/reports/${reportId}/status`, { status });
    return response;
  } catch (error) {
    console.error('Update report status error:', error);
    return {
      success: false,
      error: error.error || error.message || 'Failed to update report status',
    };
  }
}

// ========== Policy Simulator APIs ==========

/**
 * Get all available policies
 * @returns {Promise<{success: boolean, data?: Array}>}
 */
// ========== Policy Simulator APIs ==========

export async function getCities() {
  try {
    const response = await client.get('/policy/cities');
    // Handle both direct response and wrapped response
    if (response.success !== undefined) {
      return response;
    }
    return { success: true, data: response || [] };
  } catch (error) {
    console.error('Error fetching cities:', error);
    // Return default cities if API fails
    return { 
      success: true, 
      data: ['Delhi', 'Gurugram', 'Noida', 'Ghaziabad', 'Faridabad'] 
    };
  }
}

export async function getZones() {
  try {
    const response = await client.get('/policy/zones');
    // Handle both direct response and wrapped response
    if (response.success !== undefined) {
      return response;
    }
    return { success: true, data: response || [] };
  } catch (error) {
    console.error('Error fetching zones:', error);
    // Return default zones if API fails
    return { 
      success: true, 
      data: ['North', 'South', 'East', 'West', 'Central'] 
    };
  }
}

export async function getPolicies() {
  try {
    const response = await client.get('/policy/policies');
    // Handle both direct response and wrapped response
    if (response.success !== undefined) {
      return response;
    }
    return { success: true, data: response || [] };
  } catch (error) {
    console.error('Get policies error:', error);
    // Return default policies if API fails
    return {
      success: true,
      data: [
        { id: 'odd-even-vehicle-rule', name: 'Odd–Even Vehicle Rule' },
        { id: 'industrial-shutdown', name: 'Industrial Shutdown' },
        { id: 'construction-ban', name: 'Construction Ban' },
        { id: 'traffic-diversion-plan', name: 'Traffic Diversion Plan' },
        { id: 'stubble-burning-control', name: 'Stubble Burning Control' },
      ],
    };
  }
}

/**
 * Get all available regions
 * @returns {Promise<{success: boolean, data?: Array}>}
 */
export async function getRegions() {
  try {
    const response = await client.get('/policy/regions');
    return response;
  } catch (error) {
    console.error('Get regions error:', error);
    throw error;
  }
}

/**
 * Simulate policy impact
 * @param {Object} params - { region, policy, duration }
 * @returns {Promise<{success: boolean, data?: object}>}
 */
export async function simulatePolicy({ city, zone, policy, duration }) {
  try {
    const response = await client.post('/policy/simulate', {
      city,
      zone,
      policy,
      duration,
    });
    // Handle both direct response and wrapped response
    if (response.success !== undefined) {
      return response;
    }
    // If response doesn't have success field, wrap it
    return { success: true, ...response };
  } catch (error) {
    console.error('Simulate policy error:', error);
    // Return error object instead of throwing
    return {
      success: false,
      error: error.error || error.message || 'Failed to simulate policy',
      message: error.message || 'Unable to simulate policy impact. Please try again.',
    };
  }
}

export async function voteReport(reportId, voteType) {
  const response = await client.post(`/reports/${reportId}/vote`, { voteType });
  return response.data;
}

// ========== Config APIs ==========

export async function getAqiLevels() {
  const response = await client.get('/config/aqi-levels');
  return response.data;
}

export async function getPollutantLimits() {
  const response = await client.get('/config/pollutant-limits');
  return response.data;
}

export async function getCPCBStations() {
  const response = await client.get('/config/stations');
  return response.data;
}

export async function getPollutionSources() {
  const response = await client.get('/config/sources');
  return response.data;
}

// ========== Analytics APIs ==========

export async function getAnalyticsHistoric(filters = {}) {
  const params = { ...filters };
  if (filters.default) {
    params.default = 'true';
  }
  const response = await client.get('/analytics/historic', { params });
  // Handle both old format (array) and new format (object with defaultApplied)
  if (response && typeof response === 'object' && response.defaultApplied) {
    return response;
  }
  // If it's an array (old format), wrap it
  if (Array.isArray(response)) {
    return { data: response, defaultApplied: false };
  }
  return response;
}

export async function getAnalyticsPollutants(filters = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (key === 'default') {
      params.append(key, 'true');
    } else if (Array.isArray(filters[key])) {
      filters[key].forEach(item => params.append(key, item));
    } else if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  const response = await client.get(`/analytics/pollutants?${params.toString()}`);
  return response.data || response || [];
}

export async function getAnalyticsSources(filters = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (key === 'default') {
      params.append(key, 'true');
    } else if (Array.isArray(filters[key])) {
      filters[key].forEach(item => params.append(key, item));
    } else if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  const response = await client.get(`/analytics/sources?${params.toString()}`);
  return response.data || response || [];
}

export async function getAnalyticsReports(filters = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (key === 'default') {
      params.append(key, 'true');
    } else if (Array.isArray(filters[key])) {
      filters[key].forEach(item => params.append(key, item));
    } else if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  const response = await client.get(`/analytics/reports?${params.toString()}`);
  return response.data || response || [];
}

export async function exportAnalyticsToCSV(filters = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (key === 'default') {
      params.append(key, 'true');
    } else if (Array.isArray(filters[key])) {
      filters[key].forEach(item => params.append(key, item));
    } else if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  
  // Use axios directly to get text response (bypass interceptor)
  const response = await axios.get(`${API_BASE}/analytics/export?${params.toString()}`, {
    responseType: 'text',
    headers: {
      'x-policy-access': localStorage.getItem('policyAccess') === 'true' ? 'true' : undefined,
    },
  });
  
  return response.data;
}
