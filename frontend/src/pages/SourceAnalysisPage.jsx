import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SourcePieChart from '../components/sourceIdentification/SourcePieChart';
import SourceTrendChart from '../components/sourceIdentification/SourceTrendChart';
import MicroscopicBreakdownCard from '../components/sourceIdentification/MicroscopicBreakdownCard';
import PolicyActionsPanel from '../components/sourceIdentification/PolicyActionsPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import './SourceAnalysisPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function SourceAnalysisPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get location from URL params or use default (Delhi center)
  const lat = parseFloat(searchParams.get('lat')) || 28.6139;
  const lng = parseFloat(searchParams.get('lng')) || 77.2090;

  useEffect(() => {
    const fetchSourceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE}/source-identification`, {
          params: {
            lat,
            lng,
            // Optional: pass AQI data if available
            // pm25, pm10, no2, co, so2, windSpeed, windDirection, trafficLevel, etc.
          },
          timeout: 30000, // 30 second timeout
        });

        setData(response.data || response);
      } catch (err) {
        console.error('Error fetching source identification data:', err);
        setError(err.response?.data?.warnings?.[0] || err.message || 'Failed to load source identification data');
      } finally {
        setLoading(false);
      }
    };

    fetchSourceData();
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="source-analysis-page">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="source-analysis-page">
        <div className="container mx-auto px-4 py-8">
          <ErrorDisplay message={error} />
        </div>
      </div>
    );
  }

  // Use safe defaults if data is incomplete
  const safeData = data || {
    vehicular: { score: 0, contributionPercent: 25, confidence: 0.5 },
    industrial: { score: 0, contributionPercent: 25, confidence: 0.5 },
    construction: { score: 0, contributionPercent: 25, confidence: 0.5 },
    biomass: { score: 0, contributionPercent: 25, confidence: 0.5 },
    summary: { highest: 'vehicular', overallConfidence: 0.5, timestamp: new Date().toISOString() }
  };

  return (
    <div className="source-analysis-page">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Microscopic Pollution Source Identification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Location: {lat.toFixed(4)}, {lng.toFixed(4)} | 
            Overall Confidence: {(safeData.summary?.overallConfidence * 100 || 0).toFixed(0)}%
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-300">Vehicular</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(safeData.vehicular?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              Confidence: {(safeData.vehicular?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-orange-800 dark:text-orange-300">Industrial</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(safeData.industrial?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Confidence: {(safeData.industrial?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Construction</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(safeData.construction?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Confidence: {(safeData.construction?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-800 dark:text-red-300">Biomass</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {(safeData.biomass?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">
              Confidence: {(safeData.biomass?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Source Contribution
            </h2>
            <SourcePieChart data={safeData} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              24-Hour Trend
            </h2>
            <SourceTrendChart data={safeData} />
          </div>
        </div>

        {/* Microscopic Breakdown Cards */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            Microscopic Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MicroscopicBreakdownCard
              title="Vehicular Pollution"
              source="vehicular"
              data={safeData.vehicular}
              color="green"
            />
            <MicroscopicBreakdownCard
              title="Industrial Pollution"
              source="industrial"
              data={safeData.industrial}
              color="orange"
            />
            <MicroscopicBreakdownCard
              title="Construction Dust"
              source="construction"
              data={safeData.construction}
              color="blue"
            />
            <MicroscopicBreakdownCard
              title="Biomass Burning"
              source="biomass"
              data={safeData.biomass}
              color="red"
            />
          </div>
        </div>

        {/* Policy Actions Panel */}
        <PolicyActionsPanel data={safeData} />

        {/* Warnings */}
        {safeData.warnings && safeData.warnings.length > 0 && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Warnings</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400">
              {safeData.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default SourceAnalysisPage;

