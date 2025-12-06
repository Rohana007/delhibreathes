import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, TrendingUp, BarChart3, Loader2, 
  AlertCircle, CheckCircle, X
} from 'lucide-react';
import { getPolicies, simulatePolicy } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PolicySimulator({ onClose }) {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [lat, setLat] = useState(28.6139); // Delhi default
  const [lon, setLon] = useState(77.2090);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoadingPolicies(true);
      const response = await getPolicies();
      if (response.success) {
        setPolicies(response.data);
        if (response.data.length > 0) {
          setSelectedPolicy(response.data[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load policies');
      console.error('Error loading policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedPolicy) {
      setError('Please select a policy');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await simulatePolicy(selectedPolicy, lat, lon);
      if (response.success) {
        setResults(response.data);
      } else {
        setError(response.error || 'Simulation failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to simulate policy');
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return { label: 'Good', color: '#16A34A' };
    if (aqi <= 100) return { label: 'Satisfactory', color: '#84CC16' };
    if (aqi <= 200) return { label: 'Moderate', color: '#F59E0B' };
    if (aqi <= 300) return { label: 'Poor', color: '#F97316' };
    if (aqi <= 400) return { label: 'Very Poor', color: '#EF4444' };
    return { label: 'Severe', color: '#DC2626' };
  };

  const pollutantChartData = results ? [
    { name: 'PM2.5', Original: results.original.pollutants.PM2_5, Simulated: results.simulated.pollutants.PM2_5 },
    { name: 'PM10', Original: results.original.pollutants.PM10, Simulated: results.simulated.pollutants.PM10 },
    { name: 'NO₂', Original: results.original.pollutants.NO2, Simulated: results.simulated.pollutants.NO2 },
    { name: 'SO₂', Original: results.original.pollutants.SO2, Simulated: results.simulated.pollutants.SO2 },
    { name: 'CO', Original: results.original.pollutants.CO, Simulated: results.simulated.pollutants.CO },
    { name: 'O₃', Original: results.original.pollutants.O3, Simulated: results.simulated.pollutants.O3 },
  ] : [];

  const aqiChartData = results ? [
    { name: 'Original AQI', AQI: results.original.aqi },
    { name: 'Simulated AQI', AQI: results.simulated.aqi },
  ] : [];

  return (
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
        className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0', backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
          <div>
            <h2 className="text-xl font-display font-bold" style={{ color: '#2563EB' }}>
              Policy Impact Simulator
            </h2>
            <p className="text-sm" style={{ color: '#64748B' }}>Simulate the impact of air quality policies</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]" style={{ backgroundColor: '#FFFFFF' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' }}>
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Policy Selection */}
          <div className="mb-6">
            <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }}>
              Select Policy
            </label>
            {loadingPolicies ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading policies...
              </div>
            ) : (
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
              >
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            )}
            {selectedPolicy && (
              <p className="text-xs mt-2" style={{ color: '#64748B' }}>
                {policies.find(p => p.id === selectedPolicy)?.description}
              </p>
            )}
          </div>

          {/* Location Input (Optional) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }}>
                Latitude
              </label>
              <input
                type="number"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 28.6139)}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                step="0.0001"
              />
            </div>
            <div>
              <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }}>
                Longitude
              </label>
              <input
                type="number"
                value={lon}
                onChange={(e) => setLon(parseFloat(e.target.value) || 77.2090)}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                step="0.0001"
              />
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulate}
            disabled={loading || !selectedPolicy || loadingPolicies}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Simulate Policy Impact
              </>
            )}
          </button>

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* AQI Comparison */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <p className="text-xs mb-1 font-semibold" style={{ color: '#64748B' }}>Original AQI</p>
                  <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{results.original.aqi}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {getAQICategory(results.original.aqi).label}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                  <p className="text-xs mb-1 font-semibold" style={{ color: '#64748B' }}>Simulated AQI</p>
                  <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{results.simulated.aqi}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {getAQICategory(results.simulated.aqi).label}
                  </p>
                </div>
                <div className={`p-4 rounded-lg flex flex-col items-center justify-center ${
                  results.improvement.aqi > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`} style={{ border: '1px solid' }}>
                  <p className="text-xs mb-1 font-semibold" style={{ color: '#64748B' }}>Improvement</p>
                  <div className="flex items-center gap-1">
                    {results.improvement.aqi > 0 ? (
                      <TrendingDown className="w-5 h-5" style={{ color: '#22C55E' }} />
                    ) : (
                      <TrendingUp className="w-5 h-5" style={{ color: '#EF4444' }} />
                    )}
                    <p className={`text-2xl font-bold ${
                      results.improvement.aqi > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(results.improvement.aqi)}
                    </p>
                  </div>
                  <p className={`text-xs mt-1 font-semibold ${
                    results.improvement.aqi > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.improvement.percent > 0 ? '-' : '+'}{Math.abs(results.improvement.percent)}%
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{ borderColor: '#E2E8F0', minHeight: '300px' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>AQI Comparison</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={aqiChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 500]} />
                      <Tooltip />
                      <Bar dataKey="AQI" fill="#2563EB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-4 rounded-lg border" style={{ borderColor: '#E2E8F0', minHeight: '300px' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Pollutant Changes</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pollutantChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Original" fill="#EF4444" />
                      <Bar dataKey="Simulated" fill="#22C55E" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pollutant Details */}
              <div className="p-4 rounded-lg border" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Pollutant Changes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(results.pollutantChanges).map(([key, change]) => (
                    <div key={key} className="p-3 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>{key}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#0F172A' }}>
                          {change.original} → {change.modified}
                        </span>
                        <span className={`text-xs font-semibold ${
                          change.change < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {change.change < 0 ? '↓' : '↑'} {Math.abs(change.changePercent)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

