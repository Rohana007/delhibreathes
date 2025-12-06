import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { getPolicies, getRegions } from '../../services/api';

/**
 * Policy Simulator Form Component
 * Handles user inputs: Region, Policy, Duration
 */
export default function PolicySimulatorForm({ onSimulate, loading }) {
  const [regions, setRegions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      setError('');

      // Load regions and policies in parallel
      const [regionsRes, policiesRes] = await Promise.all([
        getRegions(),
        getPolicies(),
      ]);

      if (regionsRes.success && regionsRes.data.length > 0) {
        setRegions(regionsRes.data);
        setSelectedRegion(regionsRes.data[0].name);
      }

      if (policiesRes.success && policiesRes.data.length > 0) {
        setPolicies(policiesRes.data);
        setSelectedPolicy(policiesRes.data[0].name);
      }
    } catch (err) {
      setError('Failed to load simulator data. Please refresh the page.');
      console.error('Error loading initial data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSimulate = () => {
    if (!selectedRegion || !selectedPolicy) {
      setError('Please select both region and policy');
      return;
    }

    setError('');
    onSimulate({
      region: selectedRegion,
      policy: selectedPolicy,
      duration: selectedDuration,
    });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#2563EB' }} />
        <span className="ml-2 text-sm" style={{ color: '#64748B' }}>Loading simulator data...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h2 className="text-xl font-display font-bold mb-6" style={{ color: '#0F172A' }}>
        🎛️ Policy Simulator
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold" 
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' }}>
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Region Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
            disabled={loading}
          >
            {regions.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Policy Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Select Policy
          </label>
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
            disabled={loading}
          >
            {policies.map((policy) => (
              <option key={policy.id} value={policy.name}>
                {policy.name}
              </option>
            ))}
          </select>
          {selectedPolicy && (
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>
              {policies.find(p => p.name === selectedPolicy)?.description}
            </p>
          )}
        </div>

        {/* Duration Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Impact Duration
          </label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
            disabled={loading}
          >
            <option value={24}>24 Hours</option>
            <option value={48}>48 Hours</option>
            <option value={168}>7 Days</option>
          </select>
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={loading || !selectedRegion || !selectedPolicy}
          className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#2563EB' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#2563EB')}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Simulating...
            </span>
          ) : (
            'Simulate Policy Impact'
          )}
        </button>
      </div>
    </motion.div>
  );
}

