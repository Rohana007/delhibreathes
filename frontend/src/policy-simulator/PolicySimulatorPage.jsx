import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import PolicySimulatorForm from './components/PolicySimulatorForm';
import PolicyImpactGraph from './components/PolicyImpactGraph';
import PollutantBreakdownGraph from './components/PollutantBreakdownGraph';
import SummaryCards from './components/SummaryCards';
import { simulatePolicy } from '../services/api';

/**
 * Main Policy Simulator Page
 * Integrates all components and handles simulation logic
 */
export default function PolicySimulatorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  const handleSimulate = async (params) => {
    setLoading(true);
    setError('');
    setSimulationResult(null);

    try {
      const response = await simulatePolicy(params);

      if (response.success && response.data) {
        setSimulationResult(response.data);
      } else {
        setError(response.error || 'Unable to process simulation');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.error || err.message || 'Unable to process simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    if (simulationResult) {
      // Retry with last simulation params
      handleSimulate({
        region: simulationResult.region,
        policy: simulationResult.policy.name,
        duration: simulationResult.duration,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h1 className="text-2xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
          Policy Impact Simulator
        </h1>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Simulate the impact of air quality policies on AQI and pollutants using ML predictions
        </p>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 flex items-center justify-between"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
              <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                {error}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#DC2626' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulator Form */}
        <div className="lg:col-span-1">
          <PolicySimulatorForm onSimulate={handleSimulate} loading={loading} />
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResult ? (
            <>
              {/* Summary Cards */}
              <SummaryCards
                summary={simulationResult.summary}
                pollutantChanges={simulationResult.pollutantChanges}
              />

              {/* AQI Forecast Graph */}
              <PolicyImpactGraph
                baselineForecast={simulationResult.forecasts.baseline}
                afterPolicyForecast={simulationResult.forecasts.afterPolicy}
                duration={simulationResult.duration}
              />

              {/* Pollutant Breakdown Graph */}
              <PollutantBreakdownGraph
                baselinePollutants={simulationResult.pollutants.baseline}
                afterPolicyPollutants={simulationResult.pollutants.afterPolicy}
              />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <p className="text-sm" style={{ color: '#64748B' }}>
                Select a region, policy, and duration, then click "Simulate Policy Impact" to see results.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

