import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import { getPolicies, getCities, getZones } from '../../services/api';

/**
 * Policy Simulator Form Component
 * Left side form with city, zone, policy, and duration inputs
 */
export default function PolicyForm({ onSimulate, loading }) {
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [selectedZone, setSelectedZone] = useState('East');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      // Load cities, zones, and policies in parallel
      const [citiesRes, zonesRes, policiesRes] = await Promise.all([
        getCities(),
        getZones(),
        getPolicies(),
      ]);

      if (citiesRes.success && citiesRes.data.length > 0) {
        setCities(citiesRes.data);
        setSelectedCity(citiesRes.data[0]);
      }

      if (zonesRes.success && zonesRes.data.length > 0) {
        setZones(zonesRes.data);
        setSelectedZone(zonesRes.data[0]);
      }

      if (policiesRes.success && policiesRes.data.length > 0) {
        setPolicies(policiesRes.data);
        setSelectedPolicy(policiesRes.data[0].name);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSimulate = () => {
    if (!selectedCity || !selectedZone || !selectedPolicy) {
      return;
    }

    onSimulate({
      city: selectedCity,
      zone: selectedZone,
      policy: selectedPolicy,
      duration: selectedDuration,
    });
  };

  if (loadingData) {
    return (
      <div className="glass-card p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: '#2563EB' }} />
        <p className="text-xs" style={{ color: '#64748B' }}>Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6"
    >
      <h2 className="text-xl font-display font-bold mb-4" style={{ color: '#0F172A' }}>
        Simulation Parameters
      </h2>

      <div className="space-y-4">
        {/* City Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Zone Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Zone
          </label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>

        {/* Policy Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Policy
          </label>
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            {policies.map((policy) => (
              <option key={policy.id} value={policy.name}>
                {policy.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Duration
          </label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            <option value={24}>24 Hours</option>
            <option value={48}>48 Hours</option>
            <option value={168}>7 Days</option>
          </select>
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={loading || !selectedCity || !selectedZone || !selectedPolicy}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#1D4ED8';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#2563EB';
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Simulate Policy Impact
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

