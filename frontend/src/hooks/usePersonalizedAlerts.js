import { useState, useEffect } from 'react';

// AQI thresholds based on health category
const AQI_THRESHOLDS = {
  asthma: 100,
  elderly: 120,
  pregnant: 90,
  child: 75,
  normal: 150,
  heart_patient: 90,
  sensitive: 50,
};

/**
 * Hook to fetch and manage personalized alert settings
 * Returns alert status, settings, and helper functions
 */
export function usePersonalizedAlerts() {
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [healthCategory, setHealthCategory] = useState('normal');
  const [alertThreshold, setAlertThreshold] = useState(150);

  useEffect(() => {
    fetchAlertsStatus();
  }, []);

  const fetchAlertsStatus = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
      
      const response = await fetch(`${FASTAPI_BASE}/user/alerts/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setIsAlertsEnabled(false);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch alerts status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && (data.success !== false)) {
        setIsAlertsEnabled(data.alerts_enabled || false);
        if (data.region) {
          setRegion(data.region);
        }
        if (data.health_category) {
          const category = data.health_category;
          setHealthCategory(category);
          setAlertThreshold(AQI_THRESHOLDS[category] || 150);
        }
      }
    } catch (err) {
      console.error('Error fetching alerts status:', err);
      setIsAlertsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAlertsEnabled,
    region,
    healthCategory,
    alertThreshold,
    loading,
    refetch: fetchAlertsStatus,
  };
}

