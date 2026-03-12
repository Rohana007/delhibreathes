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
 * Hook to fetch and manage personalized alert settings from localStorage
 * Returns alert status, settings, and helper functions
 */
export function usePersonalizedAlerts() {
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [healthCategory, setHealthCategory] = useState('normal');
  const [alertThreshold, setAlertThreshold] = useState(150);

  useEffect(() => {
    loadAlertsFromStorage();
  }, []);

  const loadAlertsFromStorage = () => {
    setLoading(true);
    
    try {
      const saved = localStorage.getItem('personalized_alerts');
      if (saved) {
        const alertsData = JSON.parse(saved);
        if (alertsData.enabled) {
          setIsAlertsEnabled(true);
          setRegion(alertsData.region || 'Delhi');
          const category = alertsData.healthCategory || 'normal';
          setHealthCategory(category);
          setAlertThreshold(AQI_THRESHOLDS[category] || 150);
        } else {
          setIsAlertsEnabled(false);
        }
      } else {
        setIsAlertsEnabled(false);
      }
    } catch (err) {
      // Invalid data in localStorage, treat as disabled
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
    refetch: loadAlertsFromStorage,
  };
}

