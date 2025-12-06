import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAqiColor, getAqiLabel } from '../../utils/helpers';
import { useAqiForecast } from '../../hooks/useAqiForecast';

export default function PredictionCard() {
  const { predictions, ncrAqi, selectedRegion } = useApp();
  const [showToast, setShowToast] = useState(false);
  
  // Get current AQI for trend calculation
  const regionData = ncrAqi?.regions?.[selectedRegion];
  const currentAQI = regionData?.aqi || ncrAqi?.summary?.averageAqi || null;
  
  // Fetch ML forecast data using shared hook
  const { 
    forecast6h, 
    forecast24hPoint, 
    trendDirection, 
    expectedChange6h, 
    loading, 
    error, 
    usingFallback 
  } = useAqiForecast(currentAQI, selectedRegion);

  // Show toast when fallback is used
  useEffect(() => {
    if (usingFallback && !showToast) {
      setShowToast(true);
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [usingFallback, showToast]);

  // Fallback to old predictions if ML data not available
  const fallbackPredictions = predictions || {};
  const sixHour = forecast6h 
    ? { aqi: Math.round(forecast6h.AQI), trend: trendDirection }
    : fallbackPredictions.sixHour;
  const twentyFourHour = forecast24hPoint
    ? { aqi: Math.round(forecast24hPoint.AQI), trend: trendDirection }
    : fallbackPredictions.twentyFourHour;
  const confidence = fallbackPredictions.confidence;

  // Loading state
  if (loading && !sixHour && !twentyFourHour) {
    return (
      <motion.div
        className="glass-card w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1.25rem' }}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (!sixHour && !twentyFourHour) {
    return (
      <motion.div
        className="glass-card w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1.25rem' }}
      >
        <div className="text-center py-8">
          <p className="text-gray-500">No forecast data available</p>
        </div>
      </motion.div>
    );
  }

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <motion.div
      className="glass-card w-full relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        padding: '1rem',
        paddingTop: '1rem',
        borderTopLeftRadius: '0', 
        borderTopRightRadius: '0', 
        borderTop: 'none',
        marginTop: 0,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        zIndex: 0
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">AQI Forecast</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <AlertCircle className="w-3 h-3" />
          {confidence?.label || 'Moderate'} confidence
        </div>
      </div>

      {/* 6 Hour Prediction */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary-400" />
          <span className="text-sm text-gray-400">In 6 Hours</span>
        </div>
        
        <div 
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: `${getAqiColor(sixHour?.aqi)}10`,
            borderColor: `${getAqiColor(sixHour?.aqi)}30`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span 
                className="text-3xl font-display font-bold"
                style={{ color: getAqiColor(sixHour?.aqi) }}
              >
                {sixHour?.aqi || '--'}
              </span>
              <span className="text-gray-400 ml-2">AQI</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon(sixHour?.trend)}
              <span className="text-gray-400 capitalize">{sixHour?.trend || 'Stable'}</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {getAqiLabel(sixHour?.aqi || 0)}
          </p>
        </div>
      </div>

      {/* 24 Hour Prediction */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-400">In 24 Hours</span>
        </div>
        
        <div 
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: `${getAqiColor(twentyFourHour?.aqi)}10`,
            borderColor: `${getAqiColor(twentyFourHour?.aqi)}30`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span 
                className="text-3xl font-display font-bold"
                style={{ color: getAqiColor(twentyFourHour?.aqi) }}
              >
                {twentyFourHour?.aqi || '--'}
              </span>
              <span className="text-gray-400 ml-2">AQI</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon(twentyFourHour?.trend)}
              <span className="text-gray-400 capitalize">{twentyFourHour?.trend || 'Stable'}</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {getAqiLabel(twentyFourHour?.aqi || 0)}
          </p>
          {twentyFourHour?.isWeekend && (
            <p className="text-xs text-primary-400 mt-1">
              📅 Weekend - Typically lower pollution
            </p>
          )}
        </div>
      </div>

      {/* Trend Change - Use ML forecast expected change */}
      {expectedChange6h !== 0 && (
        <div className="mt-3 p-3 rounded-xl border text-center glass-card" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
            Expected change in next 6h: 
            <span className="ml-1 font-bold" style={{ color: expectedChange6h > 0 ? '#DC2626' : '#16A34A' }}>
              {expectedChange6h > 0 ? '+' : ''}{expectedChange6h} AQI
            </span>
          </p>
        </div>
      )}

      {/* Toast notification for fallback */}
      <AnimatePresence>
        {showToast && usingFallback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 flex items-center gap-2 p-3 rounded-lg shadow-lg border"
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#F59E0B',
              color: '#92400E',
              zIndex: 50,
            }}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">
              AI Forecast unavailable — showing estimated values
            </span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-2 text-amber-800 hover:text-amber-900"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

