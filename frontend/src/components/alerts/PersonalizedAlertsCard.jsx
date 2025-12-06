import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle, Loader2, Settings } from 'lucide-react';
import AlertSettingsModal from './AlertSettingsModal';
import { disableAlerts, getAlertsStatus, toggleAlerts } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useAqiForecast } from '../../hooks/useAqiForecast';
import './PersonalizedAlertsCard.css';

const HEALTH_CATEGORY_LABELS = {
  normal: 'Normal',
  asthma: 'Asthma',
  child: 'Child',
  elderly: 'Elderly',
  pregnant: 'Pregnant',
  heart_patient: 'Heart Patient',
  sensitive: 'Sensitive',
};

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

export default function PersonalizedAlertsCard() {
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [error, setError] = useState('');
  const [region, setRegion] = useState('');
  const [healthCategory, setHealthCategory] = useState('normal');
  const [alertThreshold, setAlertThreshold] = useState(150);
  
  // Get AQI data from context
  const { ncrAqi, selectedRegion } = useApp();
  const regionKey = region ? region.toLowerCase() : selectedRegion;
  const regionData = ncrAqi?.regions?.[regionKey] || ncrAqi?.regions?.[selectedRegion] || null;
  const currentAQI = regionData?.aqi || ncrAqi?.summary?.averageAqi || null;
  const { expectedChange6h, trendDirection } = useAqiForecast(currentAQI, selectedRegion);

  // Calculate recent alerts
  const recentAlerts = useMemo(() => {
    if (!isAlertsEnabled || !currentAQI) return [];
    
    const alerts = [];
    
    // Check threshold crossing
    if (currentAQI >= alertThreshold) {
      const aqiLabel = currentAQI >= 300 ? 'Hazardous' : 
                      currentAQI >= 200 ? 'Very Unhealthy' :
                      currentAQI >= 150 ? 'Unhealthy' : 'Moderate';
      alerts.push(`AQI in ${region || 'your region'} is now ${aqiLabel} (${currentAQI})`);
    }
    
    // Check forecast trend
    if (expectedChange6h && expectedChange6h > 30) {
      alerts.push(`AQI rising by +${expectedChange6h} expected in next 6 hours`);
    }
    
    // Health category specific alerts
    if (healthCategory === 'child' && currentAQI >= 75) {
      alerts.push(`Child health category: Limit outdoor exposure (AQI: ${currentAQI})`);
    } else if (healthCategory === 'elderly' && currentAQI >= 100) {
      alerts.push(`Elderly health category: Avoid outdoor activities (AQI: ${currentAQI})`);
    } else if (healthCategory === 'pregnant' && currentAQI >= 100) {
      alerts.push(`Pregnant health category: Limit outdoor exposure (AQI: ${currentAQI})`);
    }
    
    return alerts.slice(0, 2); // Return latest 1-2 alerts
  }, [isAlertsEnabled, currentAQI, alertThreshold, healthCategory, region, expectedChange6h]);

  // Check for existing alerts status
  useEffect(() => {
    fetchAlertsStatus();
  }, []);

  // Fetch alerts status from FastAPI
  const fetchAlertsStatus = async () => {
    setCheckingStatus(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setCheckingStatus(false);
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
          console.warn('Gamification server not running. Alerts feature unavailable.');
          setIsAlertsEnabled(false);
          setCheckingStatus(false);
          return;
        }
        throw new Error(`Failed to fetch alerts status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle response (may or may not have success field)
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
      if (err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED'))) {
        console.warn('Backend is offline or unreachable. Please start the FastAPI server on port 8000.');
      }
      setIsAlertsEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Handle Enable button click - show settings modal
  const handleEnable = () => {
    setShowSettingsModal(true);
    setError('');
  };

  // Handle save from settings modal
  // This callback is called by AlertSettingsModal after successful API call
  const handleSaveSettings = async ({ healthCategory, region }) => {
    // Update local state immediately
    setIsAlertsEnabled(true);
    setRegion(region);
    setHealthCategory(healthCategory);
    setAlertThreshold(AQI_THRESHOLDS[healthCategory] || 150);
    setError('');
    
    // Refresh status from server to ensure consistency
    await fetchAlertsStatus();
  };

  // Handle toggle OFF
  const handleDisable = () => {
    setShowConfirmDisable(true);
  };

  // Confirm disable action
  const confirmDisable = async () => {
    setShowConfirmDisable(false);
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
      
      const response = await fetch(`${FASTAPI_BASE}/user/alerts/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && !data.alerts_enabled) {
        setIsAlertsEnabled(false);
      } else {
        throw new Error(data.detail || 'Failed to disable alerts');
      }
    } catch (err) {
      console.error('Error disabling alerts:', err);
      if (err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED'))) {
        setError('Backend is offline or unreachable. Please start the FastAPI server on port 8000.');
      } else {
        setError(err.message || 'Failed to disable alerts');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card h-full"
        style={{ padding: '1.25rem' }}
      >
        {checkingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#64748B' }} />
          </div>
        ) : !isAlertsEnabled ? (
          // OFF State - Compact horizontal layout
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-display font-bold mb-1" style={{ color: '#0F172A' }} data-translate="Enable Personalized Alerts">
                Enable Personalized Alerts
              </h3>
              <p className="text-xs" style={{ color: '#64748B' }} data-translate="Get AQI alerts matched to your location & health category.">
                Get AQI alerts matched to your location & health category.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-medium" style={{ color: '#DC2626' }} data-translate="Alerts OFF">Alerts OFF</span>
              </div>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <Bell className="w-3.5 h-3.5" />
                <span data-translate="Enable">Enable</span>
              </button>
            </div>
            {error && (
              <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#DC2626' }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          // ON State - New design with green dot, badge, and manage button
          <div className="alerts-on-card">
            <div className="alerts-on-header">
              <span className="green-dot"></span>
              <span className="on-text" data-translate="Alerts ON">Alerts ON</span>
              <span className="badge-personalized" data-translate="Personalized">Personalized</span>
            </div>

            <div className="alert-details">
              <p><strong data-translate="Category:">Category:</strong> {HEALTH_CATEGORY_LABELS[healthCategory] || healthCategory || 'Normal'}</p>
              <p><strong data-translate="Region:">Region:</strong> {region || 'Delhi'}</p>
              <p><strong data-translate="Threshold:">Threshold:</strong> AQI &gt; {alertThreshold}</p>
              <p className="subtext" data-translate="You will receive alerts when AQI crosses this limit.">
                You will receive alerts when AQI crosses this limit.
              </p>
              
              {/* Recent Alerts Section */}
              {recentAlerts.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="Recent Alerts:">
                    Recent Alerts:
                  </p>
                  <ul className="space-y-1">
                    {recentAlerts.map((alert, index) => (
                      <li key={index} className="text-xs" style={{ color: '#64748B' }}>
                        • {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                className="manage-btn"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="w-4 h-4" />
                <span data-translate="Manage">Manage</span>
              </button>
              <button 
                className="disable-btn"
                onClick={handleDisable}
                disabled={loading}
              >
                <BellOff className="w-4 h-4" />
                <span data-translate="Disable">Disable</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <AlertSettingsModal
            onSave={handleSaveSettings}
            onClose={() => {
              setShowSettingsModal(false);
              setError('');
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Popup for Disable */}
      <AnimatePresence>
        {showConfirmDisable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmDisable(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-display font-bold mb-2" style={{ color: '#0F172A' }} data-translate="Disable Alerts?">
                Disable Alerts?
              </h3>
              <p className="text-sm mb-4" style={{ color: '#64748B' }} data-translate="Turn off personalized alerts? You will no longer receive personalized alerts.">
                Turn off personalized alerts? You will no longer receive personalized alerts.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDisable(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm border"
                  style={{ 
                    borderColor: '#E2E8F0',
                    color: '#64748B',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisable}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  Disable
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

