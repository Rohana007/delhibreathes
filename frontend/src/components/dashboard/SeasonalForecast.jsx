import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sun, Cloud, CloudRain, Snowflake, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { getSeasonalForecast } from '../../services/api';
import { getAqiColor, getAqiLabel } from '../../utils/helpers';

export default function SeasonalForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      const data = await getSeasonalForecast();
      setForecast(data);
    } catch (error) {
      console.error('Failed to load seasonal forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="skeleton h-48 rounded-xl"></div>
      </div>
    );
  }

  if (!forecast) return null;

  const { currentSeason, forecast24h, forecast48h, forecast72h, reasonAnalysis } = forecast;
  
  const periods = {
    '24h': forecast24h,
    '48h': forecast48h,
    '72h': forecast72h,
  };
  
  const selectedForecast = periods[selectedPeriod];

  const getSeasonIcon = (season) => {
    switch (season?.toLowerCase()) {
      case 'winter': return <Snowflake className="w-5 h-5 text-blue-400" />;
      case 'summer': return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'monsoon': return <CloudRain className="w-5 h-5 text-blue-300" />;
      default: return <Cloud className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-400" />
          <h3 className="section-title mb-0">Seasonal Forecast</h3>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {['24h', '48h', '72h'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Current Season Info */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          {getSeasonIcon(currentSeason?.name)}
          <div>
            <p className="text-sm text-gray-400">Current Season</p>
            <p className="font-semibold text-gray-200">{currentSeason?.name}</p>
          </div>
        </div>
        <div className="flex-1 border-l pl-4" style={{ borderColor: '#E2E8F0' }}>
          <p className="text-xs mb-1 font-semibold" style={{ color: '#0F172A' }}>Key Factors:</p>
          <div className="flex flex-wrap gap-1">
            {currentSeason?.factors?.slice(0, 3).map((factor, i) => (
              <span 
                key={i}
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  backgroundColor: factor.impact === 'very_high' ? 'rgba(220, 38, 38, 0.08)' :
                                  factor.impact === 'high' ? 'rgba(249, 115, 22, 0.08)' :
                                  factor.impact === 'positive' ? 'rgba(22, 163, 74, 0.08)' :
                                  'rgba(249, 115, 22, 0.08)',
                  color: factor.impact === 'very_high' ? '#DC2626' :
                         factor.impact === 'high' ? '#F97316' :
                         factor.impact === 'positive' ? '#16A34A' :
                         '#F97316',
                  border: `1px solid ${
                    factor.impact === 'very_high' ? 'rgba(220, 38, 38, 0.25)' :
                    factor.impact === 'high' ? 'rgba(249, 115, 22, 0.25)' :
                    factor.impact === 'positive' ? 'rgba(22, 163, 74, 0.25)' :
                    'rgba(249, 115, 22, 0.25)'
                  }`
                }}
              >
                {factor.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Selected Forecast Card */}
        <div 
          className="md:col-span-2 p-5 rounded-xl border"
          style={{
            background: `linear-gradient(135deg, ${getAqiColor(selectedForecast?.aqi)}10, transparent)`,
            borderColor: `${getAqiColor(selectedForecast?.aqi)}30`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">{selectedPeriod} Forecast</p>
            <div className="flex items-center gap-1">
              {selectedForecast?.trend === 'rising' && (
                <TrendingUp className="w-4 h-4 text-red-400" />
              )}
              {selectedForecast?.trend === 'falling' && (
                <TrendingDown className="w-4 h-4 text-green-400" />
              )}
              <span className={`text-sm capitalize ${
                selectedForecast?.trend === 'rising' ? 'text-red-400' :
                selectedForecast?.trend === 'falling' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {selectedForecast?.trend}
              </span>
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div>
              <span 
                className="text-5xl font-display font-bold"
                style={{ color: getAqiColor(selectedForecast?.aqi) }}
              >
                {selectedForecast?.aqi}
              </span>
              <span className="text-gray-400 ml-2">AQI</span>
            </div>
            <div className="flex-1">
              <span 
                className="aqi-badge"
                style={{
                  backgroundColor: `${getAqiColor(selectedForecast?.aqi)}15`,
                  color: getAqiColor(selectedForecast?.aqi),
                  borderColor: `${getAqiColor(selectedForecast?.aqi)}30`,
                }}
              >
                {selectedForecast?.label || getAqiLabel(selectedForecast?.aqi)}
              </span>
            </div>
          </div>

          {/* Change from current */}
          {selectedForecast?.change && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm">
                <span className="text-gray-400">Expected change: </span>
                <span className={selectedForecast.change > 0 ? 'text-red-400' : 'text-green-400'}>
                  {selectedForecast.change > 0 ? '+' : ''}{selectedForecast.change} AQI
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Confidence & Reason */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary-400" />
            <p className="text-sm text-gray-400">Why this prediction?</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {selectedForecast?.reason || reasonAnalysis?.overallAssessment}
          </p>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Confidence: <span className="text-gray-300">{selectedForecast?.confidence || 'Moderate'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      {reasonAnalysis?.primaryFactors && (
        <div>
          <p className="text-sm mb-3 font-semibold" style={{ color: '#0F172A' }}>Major Contributing Factors</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {reasonAnalysis.primaryFactors.slice(0, 5).map((factor, i) => {
              // Determine card color based on percentage
              const getCardStyle = (percentage) => {
                if (percentage > 20) {
                  return {
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    borderColor: 'rgba(220, 38, 38, 0.25)',
                    textColor: '#DC2626',
                    percentageColor: '#DC2626'
                  };
                } else if (percentage > 10) {
                  return {
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    borderColor: 'rgba(249, 115, 22, 0.25)',
                    textColor: '#F97316',
                    percentageColor: '#F97316'
                  };
                } else {
                  return {
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    borderColor: 'rgba(249, 115, 22, 0.25)',
                    textColor: '#F97316',
                    percentageColor: '#F97316'
                  };
                }
              };
              
              const cardStyle = getCardStyle(factor.contribution);
              
              return (
                <div 
                  key={i}
                  className="p-3 rounded-xl border glass-card"
                  style={{
                    backgroundColor: cardStyle.backgroundColor,
                    borderColor: cardStyle.borderColor
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: '#0F172A' }}>{factor.source}</span>
                    <span className="text-xs font-bold" style={{ color: cardStyle.percentageColor }}>
                      {factor.contribution}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, factor.contribution)}%`,
                        backgroundColor: cardStyle.percentageColor,
                        opacity: 0.7
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season Recommendations */}
      {currentSeason?.recommendations && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400 mb-2">💡 Seasonal Tip</p>
          <p className="text-sm text-gray-300">
            {currentSeason.recommendations[Math.floor(Math.random() * currentSeason.recommendations.length)]}
          </p>
        </div>
      )}
    </motion.div>
  );
}

