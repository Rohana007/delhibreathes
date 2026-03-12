import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SourcePieChart from '../components/sourceIdentification/SourcePieChart';
import SourceTrendChart from '../components/sourceIdentification/SourceTrendChart';
import MicroscopicBreakdownCard from '../components/sourceIdentification/MicroscopicBreakdownCard';
import PolicyActionsPanel from '../components/sourceIdentification/PolicyActionsPanel';
import WarningBanner from '../components/sourceIdentification/WarningBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import './SourceAnalysisPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function SourceAnalysisPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      <div className="source-analysis-page bg-white">
        <div className="container mx-auto px-6 py-10">
          {/* Back Button */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                background: "#2D8CFF",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px"
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="source-analysis-page bg-white">
        <div className="container mx-auto px-6 py-10">
          {/* Back Button */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                background: "#2D8CFF",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px"
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
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
    <div id="source-analysis" className="source-analysis-page bg-white">
      <div className="container mx-auto px-6 py-10">
        {/* Back Button */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#2D8CFF",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px"
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-3">
            Microscopic Pollution Source Identification
          </h1>
          <p className="text-gray-600">
            Location: {lat.toFixed(4)}, {lng.toFixed(4)} | 
            Overall Confidence: {(safeData.summary?.overallConfidence * 100 || 0).toFixed(0)}%
          </p>
        </div>
        
        {/* Warning Banner */}
        <WarningBanner 
          warnings={safeData.warnings} 
          notes_readable={safeData.notes_readable}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5 border-l-4 border-l-[#2E7D32]">
            <h3 className="font-semibold text-black mb-2">Vehicular</h3>
            <p className="text-3xl font-bold text-[#2E7D32] mb-1">
              {(safeData.vehicular?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Confidence: {(safeData.vehicular?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5 border-l-4 border-l-[#EF6C00]">
            <h3 className="font-semibold text-black mb-2">Industrial</h3>
            <p className="text-3xl font-bold text-[#EF6C00] mb-1">
              {(safeData.industrial?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Confidence: {(safeData.industrial?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5 border-l-4 border-l-[#1565C0]">
            <h3 className="font-semibold text-black mb-2">Construction</h3>
            <p className="text-3xl font-bold text-[#1565C0] mb-1">
              {(safeData.construction?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Confidence: {(safeData.construction?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5 border-l-4 border-l-[#C62828]">
            <h3 className="font-semibold text-black mb-2">Biomass</h3>
            <p className="text-3xl font-bold text-[#C62828] mb-1">
              {(safeData.biomass?.contributionPercent || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Confidence: {(safeData.biomass?.confidence * 100 || 0).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Source Contribution
            </h2>
            <SourcePieChart data={safeData} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              24-Hour Trend
            </h2>
            <SourceTrendChart data={safeData} />
          </div>
        </div>

        {/* Microscopic Breakdown Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-5 text-black">
            Microscopic Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <h3 className="font-semibold text-yellow-800 mb-2">Warnings</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700">
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

