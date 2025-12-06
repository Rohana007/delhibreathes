import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import OTPAuthModal from '../auth/OTPAuthModal';
import { enableAlerts } from '../../services/api';

const HEALTH_CATEGORIES = [
  { value: 'normal', label: 'Normal', description: 'Healthy adult' },
  { value: 'asthma', label: 'Asthma', description: 'Respiratory condition' },
  { value: 'child', label: 'Child', description: 'Children (sensitive)' },
  { value: 'elderly', label: 'Elderly', description: 'Senior citizens' },
  { value: 'pregnant', label: 'Pregnant', description: 'Pregnant women' },
  { value: 'heart_patient', label: 'Heart Patient', description: 'Cardiac condition' },
];

const REGIONS = [
  'Delhi',
  'Noida',
  'Ghaziabad',
  'Gurgaon',
  'Faridabad',
  'Rohini',
  'Dwarka',
  'Greater Noida',
  'Anand Vihar',
  'ITO',
];

export default function AlertSubscriptionModal({ onSuccess, onClose }) {
  const [step, setStep] = useState(1); // 1: OTP, 2: Health Category, 3: Region, 4: Confirm
  const [showOTPModal, setShowOTPModal] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [healthCategory, setHealthCategory] = useState('normal');
  const [region, setRegion] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Handle OTP success
  const handleOTPSuccess = async (token, user) => {
    try {
      setLoading(true);
      setError('');

      // Token is already stored by OTPAuthModal
      // Get phone from localStorage (set by OTPAuthModal) or from user object
      let phone = localStorage.getItem('userPhone');
      
      if (!phone && user && user.phone) {
        phone = user.phone;
        // Remove country code if present
        if (phone.startsWith('+91')) {
          phone = phone.substring(3);
        } else if (phone.startsWith('91') && phone.length === 12) {
          phone = phone.substring(2);
        }
        localStorage.setItem('userPhone', phone);
      }
      
      if (!phone) {
        // Try to extract from token (JWT payload)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.phone) {
            phone = payload.phone;
            // Remove country code if present
            if (phone.startsWith('+91')) {
              phone = phone.substring(3);
            } else if (phone.startsWith('91') && phone.length === 12) {
              phone = phone.substring(2);
            }
            localStorage.setItem('userPhone', phone);
          }
        } catch (e) {
          console.error('Error extracting phone from token:', e);
        }
      }

      if (!phone) {
        throw new Error('Phone number not found. Please try again.');
      }

      setPhoneNumber(phone);
      setOtpVerified(true);
      setShowOTPModal(false);
      setStep(2);
    } catch (err) {
      console.error('Error in OTP success:', err);
      setError(err.message || 'Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (step === 2 && !healthCategory) {
      setError('Please select a health category');
      return;
    }
    if (step === 3 && !region) {
      setError('Please select a region');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  // Handle previous step
  const handlePrevious = () => {
    setError('');
    setStep(step - 1);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!phoneNumber || !healthCategory || !region) {
      setError('Please complete all steps');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await enableAlerts(phoneNumber, healthCategory, region);

      if (response.success) {
        // Show success briefly
        setStep(5); // Success step
        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              phone: phoneNumber,
              region,
              healthCategory,
              enabled: true,
            });
          }
          onClose();
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to enable alerts');
      }
    } catch (err) {
      console.error('Error enabling alerts:', err);
      setError(err.response?.data?.error || err.message || 'Failed to enable alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* OTP Modal */}
      <AnimatePresence>
        {showOTPModal && (
          <OTPAuthModal
            onSuccess={handleOTPSuccess}
            onClose={() => {
              setShowOTPModal(false);
              onClose();
            }}
            title="Enable Personalized Alerts"
          />
        )}
      </AnimatePresence>

      {/* Multi-step Modal */}
      <AnimatePresence>
        {!showOTPModal && step < 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
                <div>
                  <h2 className="text-lg font-display font-bold" style={{ color: '#0F172A' }}>
                    Enable Personalized Alerts
                  </h2>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                    Step {step - 1} of 3
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: '#64748B' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-5 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 h-1 rounded-full" style={{ backgroundColor: s <= step ? '#2563EB' : '#E2E8F0' }} />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {error && (
                  <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' }}>
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Step 2: Health Category */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold mb-2" style={{ color: '#0F172A' }}>
                        Select Your Health Category
                      </h3>
                      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                        This helps us send personalized health recommendations
                      </p>
                    </div>
                    <div className="space-y-2">
                      {HEALTH_CATEGORIES.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => {
                            setHealthCategory(category.value);
                            setError('');
                          }}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            healthCategory === category.value
                              ? 'border-2'
                              : 'border'
                          }`}
                          style={{
                            borderColor: healthCategory === category.value ? '#2563EB' : '#E2E8F0',
                            backgroundColor: healthCategory === category.value ? 'rgba(37, 99, 235, 0.05)' : '#FFFFFF',
                          }}
                        >
                          <div className="font-medium" style={{ color: '#0F172A' }}>
                            {category.label}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                            {category.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Region */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold mb-2" style={{ color: '#0F172A' }}>
                        Select Your Region
                      </h3>
                      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                        Choose the Delhi NCR region for AQI alerts
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {REGIONS.map((reg) => (
                        <button
                          key={reg}
                          onClick={() => {
                            setRegion(reg);
                            setError('');
                          }}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            region === reg
                              ? 'border-2'
                              : 'border'
                          }`}
                          style={{
                            borderColor: region === reg ? '#2563EB' : '#E2E8F0',
                            backgroundColor: region === reg ? 'rgba(37, 99, 235, 0.05)' : '#FFFFFF',
                            color: '#0F172A',
                          }}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>
                        Confirm Your Preferences
                      </h3>
                    </div>
                    <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#64748B' }}>Phone:</span>
                        <span className="text-sm font-medium" style={{ color: '#0F172A' }}>
                          +91 {phoneNumber.substring(0, 2)}XXXX{phoneNumber.slice(-2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#64748B' }}>Health Category:</span>
                        <span className="text-sm font-medium" style={{ color: '#0F172A' }}>
                          {HEALTH_CATEGORIES.find(c => c.value === healthCategory)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#64748B' }}>Region:</span>
                        <span className="text-sm font-medium" style={{ color: '#0F172A' }}>
                          {region}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {step < 4 && (
                  <div className="flex gap-3 mt-6">
                    {step > 2 && (
                      <button
                        onClick={handlePrevious}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-sm border"
                        style={{ borderColor: '#E2E8F0', color: '#64748B', backgroundColor: '#FFFFFF' }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </div>
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                      style={{ backgroundColor: '#2563EB' }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                {step === 4 && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handlePrevious}
                      className="flex-1 px-4 py-2 rounded-lg font-medium text-sm border"
                      style={{ borderColor: '#E2E8F0', color: '#64748B', backgroundColor: '#FFFFFF' }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </div>
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        'Enable Alerts'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Step */}
      <AnimatePresence>
        {step === 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="glass-card w-full max-w-md p-6 text-center"
            >
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>
                Alerts Enabled Successfully!
              </h3>
              <p className="text-sm" style={{ color: '#64748B' }}>
                You will now receive personalized AQI alerts via WhatsApp
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

