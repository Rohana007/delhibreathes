import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

const HEALTH_CATEGORIES = [
  { value: 'normal', label: 'Normal', description: 'Healthy adult' },
  { value: 'asthma', label: 'Asthma', description: 'Respiratory condition' },
  { value: 'child', label: 'Child', description: 'Children (sensitive)' },
  { value: 'elderly', label: 'Elderly', description: 'Senior citizens' },
  { value: 'pregnant', label: 'Pregnant', description: 'Pregnant women' },
  { value: 'heart_patient', label: 'Heart Patient', description: 'Cardiac condition' },
  { value: 'sensitive', label: 'Sensitive', description: 'Sensitive individuals' },
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

export default function AlertSettingsModal({ onSave, onClose }) {
  const [healthCategory, setHealthCategory] = useState('normal');
  const [region, setRegion] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!healthCategory || !region) {
      setError('Please select both region and health category');
      return;
    }

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
      
      const response = await fetch(`${FASTAPI_BASE}/user/alerts/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          region: region,
          health_category: healthCategory,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        if (response.status === 404) {
          errorMessage = 'Gamification server not running. Please start the FastAPI server on port 8000.';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.error || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.alerts_enabled) {
        // Call onSave callback to update parent state and close modal
        await onSave({ healthCategory, region });
        // Close modal after successful save
        onClose();
      } else {
        throw new Error(data.detail || 'Failed to enable alerts');
      }
    } catch (err) {
      console.error('Error enabling alerts:', err);
      if (err.message && err.message.includes('fetch')) {
        setError('Backend is offline or unreachable. Please start the FastAPI server on port 8000.');
      } else {
        setError(err.message || 'Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="glass-card w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold" style={{ color: '#0F172A' }} data-translate="Enable Personalized Alerts">
              Enable Personalized Alerts
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: '#64748B' }} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Region Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }} data-translate="Select Region">
                Select Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{
                  borderColor: '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Health Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }} data-translate="Select Health Category">
                Select Health Category
              </label>
              <div className="space-y-2">
                {HEALTH_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className="flex items-start p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50"
                    style={{
                      borderColor: healthCategory === category.value ? '#009769' : '#E2E8F0',
                      backgroundColor: healthCategory === category.value ? '#E8F9F1' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="radio"
                      name="healthCategory"
                      value={category.value}
                      checked={healthCategory === category.value}
                      onChange={(e) => setHealthCategory(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-sm" style={{ color: '#0F172A' }} data-translate={category.label}>
                        {category.label}
                      </div>
                      <div className="text-xs" style={{ color: '#64748B' }} data-translate={category.description}>
                        {category.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-2 rounded text-xs" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#DC2626' }}>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-sm border transition-all"
                style={{
                  borderColor: '#E2E8F0',
                  color: '#64748B',
                  backgroundColor: '#FFFFFF',
                }}
                disabled={loading}
              >
                <span data-translate="Cancel">Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all"
                style={{
                  backgroundColor: loading ? '#94A3B8' : '#009769',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span data-translate="Enabling...">Enabling...</span>
                  </span>
                ) : (
                  <span data-translate="Enable Alerts">Enable Alerts</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

