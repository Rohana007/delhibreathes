import { useState } from 'react';

const COLOR_CLASSES = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    header: 'text-green-700 dark:text-green-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
    header: 'text-orange-700 dark:text-orange-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    header: 'text-blue-700 dark:text-blue-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    header: 'text-red-700 dark:text-red-400',
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
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className={`font-semibold ${colors.text} text-lg`}>{title}</h3>
          <p className={`text-sm ${colors.header} mt-1`}>
            Contribution: {contribution.toFixed(1)}% | Confidence: {confidence.toFixed(0)}%
          </p>
        </div>
        <button className={`${colors.text} text-xl`}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Reasoning Text */}
          {data?.reasoningText && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Why</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{data.reasoningText}</p>
            </div>
          )}

          {/* Microscopic Indicators */}
          <div>
            <h4 className={`font-semibold ${colors.text} mb-2`}>Microscopic Indicators</h4>
            <div className="space-y-2">
              {indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{indicator.label}</span>
                  <span className={`text-sm font-semibold ${colors.text}`}>{indicator.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Score Breakdown (if available) */}
          {data?.rawScoreBreakdown && Object.keys(data.rawScoreBreakdown).length > 0 && (
            <div>
              <h4 className={`font-semibold ${colors.text} mb-2`}>Score Breakdown</h4>
              <div className="space-y-1">
                {Object.entries(data.rawScoreBreakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{key}</span>
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
              <h4 className={`font-semibold ${colors.text} mb-2`}>Source Breakdown</h4>
              <div className="space-y-1">
                {Object.entries(data.breakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{key}</span>
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

