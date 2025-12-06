import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
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

export default function UserAlertsSettings() {
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('');
  const [healthCategory, setHealthCategory] = useState('');
  const [userToken, setUserToken] = useState(null);

  // Check if user is already logged in and get alerts status
  useEffect(() => {
    const checkAuthAndStatus = async () => {
      // First check localStorage for stored phone
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
            // Check alerts status
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
      // Don't show error, just assume disabled
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

  // Handle toggle OFF - show confirmation first
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
        setShowSuccessPopup(true);
        // Auto-hide popup after 3 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-display font-bold mb-1" style={{ color: '#0F172A' }}>
              Enable Personalized Alerts
            </h3>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Get AQI alerts matched to your location & health category
            </p>
          </div>
          {checkingStatus ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#64748B' }} />
          ) : (
            <div className="flex items-center gap-3">
              {error && (
                <div className="text-xs text-red-600 max-w-xs">{error}</div>
              )}
              <button
                onClick={isAlertsEnabled ? handleDisable : handleEnable}
                disabled={loading || checkingStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isAlertsEnabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAlertsEnabled ? 'Disabling...' : 'Enabling...'}
                  </>
                ) : isAlertsEnabled ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    Disable
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Enable
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isAlertsEnabled && phoneNumber && (
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
              <span className="font-semibold text-sm" style={{ color: '#059669' }}>🟢 Alerts Enabled</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>Health Category:</span>
                <span className="font-medium" style={{ color: '#0F172A' }}>
                  {healthCategory ? HEALTH_CATEGORY_LABELS[healthCategory] || healthCategory : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>Region:</span>
                <span className="font-medium" style={{ color: '#0F172A' }}>
                  {region || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748B' }}>WhatsApp:</span>
                <span className="font-medium" style={{ color: '#0F172A' }}>
                  {formatPhoneForDisplay(phoneNumber)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          {isAlertsEnabled ? (
            <>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span style={{ color: '#059669' }}>Alerts ON</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span style={{ color: '#DC2626' }}>Alerts OFF</span>
            </>
          )}
        </div>
      </motion.div>

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
                Are you sure you want to disable personalized air quality alerts?
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

      {/* Success Popup for Disable */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="glass-card p-4 flex items-center gap-3 shadow-lg">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6" style={{ color: '#10B981' }} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1" style={{ color: '#0F172A' }}>Alerts turned OFF</h4>
                <p className="text-sm" style={{ color: '#64748B' }}>
                  You will no longer receive personalized AQI alerts unless you enable them again.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#64748B' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

