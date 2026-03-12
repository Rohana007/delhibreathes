import { useState } from 'react';

const COLOR_CLASSES = {
  green: {
    borderLeft: 'border-l-[#2E7D32]',
    text: 'text-[#2E7D32]',
  },
  orange: {
    borderLeft: 'border-l-[#EF6C00]',
    text: 'text-[#EF6C00]',
  },
  blue: {
    borderLeft: 'border-l-[#1565C0]',
    text: 'text-[#1565C0]',
  },
  red: {
    borderLeft: 'border-l-[#C62828]',
    text: 'text-[#C62828]',
  },
};

function MicroscopicBreakdownCard({ title, source, data, color = 'green' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.green;

  // Extract indicators based on source type
  const getIndicators = () => {
    if (!data) return [];

    switch (source) {
      case 'vehicular':
        return [
          { label: 'Vehicle Mix', value: data.metadata?.vehicleMix ? 'Available' : 'N/A' },
          { label: 'Age Mix', value: data.metadata?.ageMix ? 'Available' : 'N/A' },
          { label: 'Fuel Mix', value: data.metadata?.fuelMix ? 'Available' : 'N/A' },
          { label: 'Diesel Signature Score', value: data.dieselSignatureScore?.toFixed(2) || 'N/A' },
          { label: 'NO2/CO Ratio', value: 'Calculated' },
        ];
      case 'industrial':
        return [
          { label: 'Nearby Industries', value: data.metadata?.nearbyIndustriesCount || 0 },
          { label: 'Search Radius', value: `${data.metadata?.searchRadiusKm || 5} km` },
          { label: 'Stack Heights', value: 'Analyzed' },
          { label: 'Fuel Types', value: 'Analyzed' },
        ];
      case 'construction':
        return [
          { label: 'Active Sites', value: data.metadata?.activeSiteCount || 0 },
          { label: 'Dust Factor', value: data.metadata?.factors?.dustFactor?.toFixed(2) || 'N/A' },
          { label: 'Wind Factor', value: data.metadata?.factors?.windFactor?.toFixed(2) || 'N/A' },
          { label: 'Dryness Factor', value: data.metadata?.factors?.drynessFactor?.toFixed(2) || 'N/A' },
        ];
      case 'biomass':
        return [
          { label: 'Fire Hotspots', value: data.metadata?.nearbyFiresCount || 0 },
          { label: 'Data Source', value: data.metadata?.dataSource || 'unknown' },
          { label: 'Search Radius', value: `${data.metadata?.searchRadiusKm || 10} km` },
        ];
      default:
        return [];
    }
  };

  const indicators = getIndicators();
  const contribution = parseFloat(data?.contributionPercent || 0);
  const confidence = parseFloat(data?.confidence || 0) * 100;

  return (
    <div className={`bg-white shadow-sm border border-gray-200 rounded-xl p-5 text-black border-l-4 ${colors.borderLeft}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-semibold text-black text-lg mb-1">{title}</h3>
          <p className="text-sm text-gray-600">
            Contribution: {contribution.toFixed(1)}% | Confidence: {confidence.toFixed(0)}%
          </p>
        </div>
        <button className={`${colors.text} text-xl font-bold`}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-4">
          {/* Reasoning Text */}
          {data?.reasoningText && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-black mb-2">Why</h4>
              <p className="text-sm text-gray-700">{data.reasoningText}</p>
            </div>
          )}

          {/* Microscopic Indicators */}
          <div>
            <h4 className={`font-semibold ${colors.text} mb-3`}>Microscopic Indicators</h4>
            <div className="space-y-2">
              {indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <span className="text-sm text-gray-700">{indicator.label}</span>
                  <span className={`text-sm font-semibold ${colors.text}`}>{indicator.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Score Breakdown (if available) */}
          {data?.rawScoreBreakdown && Object.keys(data.rawScoreBreakdown).length > 0 && (
            <div>
              <h4 className={`font-semibold ${colors.text} mb-3`}>Score Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(data.rawScoreBreakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-gray-700">{key}</span>
                    <span className={`font-semibold ${colors.text}`}>
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown (for industrial/construction) */}
          {data?.breakdown && Object.keys(data.breakdown).length > 0 && (
            <div>
              <h4 className={`font-semibold ${colors.text} mb-3`}>Source Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(data.breakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-gray-700">{key}</span>
                    <span className={`font-semibold ${colors.text}`}>
                      {typeof value === 'object' && value.contribution
                        ? value.contribution.toFixed(2)
                        : typeof value === 'number'
                        ? value.toFixed(2)
                        : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MicroscopicBreakdownCard;

