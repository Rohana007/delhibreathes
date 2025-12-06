import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle, Loader2 } from 'lucide-react';
import AlertSubscriptionModal from './AlertSubscriptionModal';
import { disableAlerts, getAlertsStatus } from '../../services/api';

const HEALTH_CATEGORY_LABELS = {
  normal: 'Normal',
  asthma: 'Asthma',
  child: 'Child',
  elderly: 'Elderly',
  pregnant: 'Pregnant',
  heart_patient: 'Heart Patient',
};

export default function CompactAlertsSettings() {
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('');
  const [healthCategory, setHealthCategory] = useState('');
  const [userToken, setUserToken] = useState(null);

  // Check if user is already logged in and get alerts status
  useEffect(() => {
    const checkAuthAndStatus = async () => {
      const storedPhone = localStorage.getItem('userPhone');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
        await fetchAlertsStatus(storedPhone);
        return;
      }

      const token = localStorage.getItem('authToken');
      if (token) {
        setUserToken(token);
        try {
          // Extract phone from JWT token
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.phone) {
            let phone = payload.phone;
            // Remove country code if present
            if (phone.startsWith('+91')) {
              phone = phone.substring(3);
            } else if (phone.startsWith('91') && phone.length === 12) {
              phone = phone.substring(2);
            }
            setPhoneNumber(phone);
            localStorage.setItem('userPhone', phone);
            await fetchAlertsStatus(phone);
          } else {
            setCheckingStatus(false);
          }
        } catch (err) {
          console.error('Error checking auth:', err);
          setCheckingStatus(false);
        }
      } else {
        setCheckingStatus(false);
      }
    };

    checkAuthAndStatus();
  }, []);

  // Fetch alerts status
  const fetchAlertsStatus = async (phone) => {
    if (!phone) return;
    
    try {
      const response = await getAlertsStatus(phone);
      if (response.success) {
        setIsAlertsEnabled(response.enabled || response.alertsEnabled || false);
        if (response.data) {
          setRegion(response.data.region || '');
          setHealthCategory(response.data.healthCategory || '');
        }
      }
    } catch (err) {
      console.error('Error fetching alerts status:', err);
      setIsAlertsEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Handle subscription success
  const handleSubscriptionSuccess = (subscriptionData) => {
    setIsAlertsEnabled(true);
    setPhoneNumber(subscriptionData.phone);
    setRegion(subscriptionData.region);
    setHealthCategory(subscriptionData.healthCategory);
    setShowSubscriptionModal(false);
  };

  // Handle toggle ON
  const handleEnable = () => {
    setShowSubscriptionModal(true);
  };

  // Handle toggle OFF
  const handleDisable = () => {
    if (!phoneNumber) {
      setError('Phone number not found. Please enable alerts first.');
      return;
    }
    setShowConfirmDisable(true);
  };

  // Confirm disable action
  const confirmDisable = async () => {
    setShowConfirmDisable(false);
    setLoading(true);
    setError('');

    try {
      const response = await disableAlerts(phoneNumber);
      
      if (response.success) {
        setIsAlertsEnabled(false);
      } else {
        throw new Error(response.error || 'Failed to disable alerts');
      }
    } catch (err) {
      console.error('Error disabling alerts:', err);
      setError(err.response?.data?.error || err.message || 'Failed to disable alerts');
    } finally {
      setLoading(false);
    }
  };

  // Format phone number for display
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    if (phone.length === 10) {
      return `+91 ${phone.substring(0, 2)}XXXX${phone.slice(-2)}`;
    }
    return `+91 ${phone.substring(0, 2)}XXXX${phone.slice(-2)}`;
  };

  if (checkingStatus) {
    return (
      <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#64748B' }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="mt-4 pt-4 border-t"
        style={{ borderColor: '#E2E8F0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isAlertsEnabled ? (
          // Alerts OFF - Compact row
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                  Personalized Alerts
                </h4>
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs" style={{ color: '#DC2626' }}>Alerts OFF</span>
              </div>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Get AQI alerts matched to your location & health category
              </p>
            </div>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
              style={{ 
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <Bell className="w-3 h-3" />
              Enable
            </button>
          </div>
        ) : (
          // Alerts ON - Compact success box
          <div 
            className="p-3 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.15)'
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10B981' }} />
                <span className="text-xs font-semibold" style={{ color: '#059669' }}>Alerts Enabled</span>
              </div>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all flex-shrink-0"
                style={{ 
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#DC2626',
                  border: '1px solid rgba(220, 38, 38, 0.2)'
                }}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <BellOff className="w-3 h-3" />
                    Disable
                  </>
                )}
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>Health:</span>
                <span className="font-medium truncate ml-2" style={{ color: '#0F172A' }}>
                  {healthCategory ? HEALTH_CATEGORY_LABELS[healthCategory] || healthCategory : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>Region:</span>
                <span className="font-medium truncate ml-2" style={{ color: '#0F172A' }}>
                  {region || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>WhatsApp:</span>
                <span className="font-medium truncate ml-2" style={{ color: '#0F172A' }}>
                  {formatPhoneForDisplay(phoneNumber)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs" style={{ color: '#059669' }}>Alerts ON</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#DC2626' }}>
            {error}
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <AlertSubscriptionModal
            onSuccess={handleSubscriptionSuccess}
            onClose={() => {
              setShowSubscriptionModal(false);
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
              <h3 className="text-lg font-display font-bold mb-2" style={{ color: '#0F172A' }}>
                Disable Alerts?
              </h3>
              <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                Turn off personalized alerts? You will no longer receive WhatsApp alerts.
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

