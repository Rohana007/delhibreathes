import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle, Loader2, Settings, AlertTriangle } from 'lucide-react';
import AlertSettingsModal from './AlertSettingsModal';
import { useApp } from '../../context/AppContext';
import { useAqiForecast } from '../../hooks/useAqiForecast';
import { generateAlerts, ALERTS_UPDATED_EVENT } from '@/utils/alertsEngine';
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

  // State for generated alerts (can be updated instantly)
  const [generatedAlerts, setGeneratedAlerts] = useState([]);

  // Generate alerts using frontend-only alert engine
  useEffect(() => {
    if (!isAlertsEnabled || !currentAQI || currentAQI === null) {
      setGeneratedAlerts([]);
      return;
    }
    const alerts = generateAlerts(currentAQI, healthCategory, region || 'Delhi');
    setGeneratedAlerts(alerts);
  }, [isAlertsEnabled, currentAQI, healthCategory, region]);

  // Listen for force update events - triggers instant alert refresh
  useEffect(() => {
    function handleForceUpdate(event) {
      if (event.detail && event.detail.force === true) {
        // Refresh alerts instantly (bypass any debounce/timing)
        if (!isAlertsEnabled || !currentAQI || currentAQI === null) {
          setGeneratedAlerts([]);
          return;
        }
        // Generate alerts immediately without waiting
        const alerts = generateAlerts(currentAQI, healthCategory, region || 'Delhi');
        setGeneratedAlerts(alerts);
      }
    }
    
    window.addEventListener(ALERTS_UPDATED_EVENT, handleForceUpdate);
    return () => window.removeEventListener(ALERTS_UPDATED_EVENT, handleForceUpdate);
  }, [isAlertsEnabled, currentAQI, healthCategory, region]);
  
  // Get latest 3 alerts for display
  const recentAlerts = useMemo(() => {
    return generatedAlerts.slice(0, 3).map(alert => alert.message);
  }, [generatedAlerts]);

  // Load alerts status from localStorage
  useEffect(() => {
    loadAlertsFromStorage();
  }, []);

  // Load alerts preferences from localStorage (no API call)
  const loadAlertsFromStorage = () => {
    setCheckingStatus(true);
    
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
      setCheckingStatus(false);
    }
  };

  // Handle Enable button click - show settings modal
  const handleEnable = () => {
    setShowSettingsModal(true);
    setError('');
  };

  // Handle save from settings modal
  // This callback is called by AlertSettingsModal after saving to localStorage
  const handleSaveSettings = ({ healthCategory, region }) => {
    // Update local state immediately
    setIsAlertsEnabled(true);
    setRegion(region);
    setHealthCategory(healthCategory);
    setAlertThreshold(AQI_THRESHOLDS[healthCategory] || 150);
    setError('');
    
    // Refresh status from localStorage to ensure consistency
    loadAlertsFromStorage();
  };

  // Handle toggle OFF
  const handleDisable = () => {
    setShowConfirmDisable(true);
  };

  // Confirm disable action - save to localStorage (no API call)
  const confirmDisable = () => {
    setShowConfirmDisable(false);
    setLoading(true);
    setError('');

    try {
      // Get user's email from localStorage
      let email = null;
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          email = user.email || user.userEmail || null;
        } catch (e) {
          // Invalid JSON
        }
      }
      if (!email) {
        email = localStorage.getItem('email');
      }

      // Save disabled state to localStorage
      const alertsData = {
        email: email || 'unknown',
        region: region || 'Delhi',
        healthCategory: healthCategory || 'normal',
        enabled: false,
      };
      
      localStorage.setItem('personalized_alerts', JSON.stringify(alertsData));
      setIsAlertsEnabled(false);
      setError('');
    } catch (err) {
      setError('Unable to disable alerts');
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
              {generatedAlerts.length > 0 ? (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="Active Alerts:">
                    Active Alerts:
                  </p>
                  <ul className="space-y-2">
                    {generatedAlerts.slice(0, 3).map((alert, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle 
                          className="w-4 h-4 mt-0.5 flex-shrink-0" 
                          style={{ 
                            color: alert.severity === 'danger' ? '#DC2626' : 
                                   alert.severity === 'warning' ? '#F59E0B' : '#3B82F6' 
                          }} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: '#0F172A' }}>
                            {alert.title}
                          </p>
                          <p className="text-xs" style={{ color: '#64748B' }}>
                            {alert.message}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xs" style={{ color: '#64748B' }} data-translate="Air quality is normal for your region.">
                    Air quality is normal for your region.
                  </p>
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

