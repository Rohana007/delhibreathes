import axios from 'axios';

// FIX: unified baseURL to backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch user's reports with pagination
 * @param {string} token - Firebase ID token from localStorage
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<{success: boolean, reports: Array, pagination: Object}>}
 */
export const fetchMyReports = async (token, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE}/my-reports`, {
      params: {
        page,
        limit,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my reports:', error);
    throw error;
  }
};

