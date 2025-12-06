import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import PolicyForm from './components/PolicyForm';
import AQITrendGraph from './components/AQITrendGraph';
import PollutantChart from './components/PollutantChart';
import ImprovementCard from './components/ImprovementCard';
import BeforeAfterCards from './components/BeforeAfterCards';
import ErrorBoundary from './components/ErrorBoundary';
import { simulatePolicy } from '../services/api';

/**
 * Main Policy Simulator Component
 * Complete Policy Impact Simulator with all required features
 */
export default function PolicySimulator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSimulate = async (params) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await simulatePolicy(params);

      if (response.success) {
        setResult(response);
      } else {
        setError(response.error || 'Unable to simulate policy impact. Please try again.');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.error || err.message || 'Unable to simulate policy impact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
          Policy Impact Simulator
        </h1>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Simulate the impact of air quality policies on Delhi NCR region
        </p>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg flex items-center gap-3"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}
        >
          <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</span>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Form */}
        <div className="lg:col-span-1">
          <PolicyForm onSimulate={handleSimulate} loading={loading} />
        </div>

        {/* Right Side: Results Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#2563EB' }} />
              <p className="text-sm" style={{ color: '#64748B' }}>Simulating policy impact...</p>
            </motion.div>
          ) : result ? (
            <>
              {/* Improvement Summary Card */}
              <ErrorBoundary>
                <ImprovementCard result={result} />
              </ErrorBoundary>

              {/* Before/After Comparison Cards */}
              <ErrorBoundary>
                <BeforeAfterCards result={result} />
              </ErrorBoundary>

              {/* Graph 1: AQI Trend */}
              <ErrorBoundary>
                <AQITrendGraph result={result} />
              </ErrorBoundary>

              {/* Graph 2: Pollutant Breakdown */}
              <ErrorBoundary>
                <PollutantChart result={result} />
              </ErrorBoundary>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <p className="text-sm" style={{ color: '#64748B' }}>
                Select city, zone, policy, and duration, then click "Simulate Policy Impact" to see results.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

