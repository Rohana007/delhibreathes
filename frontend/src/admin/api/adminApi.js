import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Get admin token from localStorage
const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

// Create axios instance with default headers
const adminClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
adminClient.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token
      localStorage.removeItem('adminToken');
      // FIX: user view -> policy dashboard reports (prevent admin-login redirect)
      // Check if we're in a user-facing route (policy dashboard)
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/policy-dashboard')) {
        // Redirect to policy reports instead of admin login for user-facing routes
        window.location.href = '/policy-dashboard/reports';
      } else {
        // Only redirect to admin login for actual admin routes
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Admin Authentication APIs
 */
export const adminAuth = {
  /**
   * Register a new admin
   */
  register: async (name, email, password) => {
    const response = await adminClient.post('/admin/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Login admin
   */
  login: async (email, password) => {
    const response = await adminClient.post('/admin/login', {
      email,
      password,
    });
    return response.data;
  },
};

/**
 * Admin Reports APIs
 */
export const adminReports = {
  /**
   * Get all reports with filters
   */
  getReports: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const response = await adminClient.get(`/admin/reports?${params.toString()}`);
    return response.data;
  },

  /**
   * Get map data for heatmap
   */
  getMapData: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const response = await adminClient.get(`/admin/reports/map-data?${params.toString()}`);
    return response.data;
  },

  /**
   * Update report status
   */
  updateStatus: async (reportId, status) => {
    const response = await adminClient.patch(`/admin/reports/${reportId}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Export reports as CSV
   */
  exportReports: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const response = await adminClient.get(`/admin/reports/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default adminClient;

