import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAqiColor, getAqiLabel, getAqiLevel, AQI_COLORS } from '../../utils/helpers';
import { useAqiForecast } from '../../hooks/useAqiForecast';

export default function TrendsChart() {
  const { predictions, ncrAqi, selectedRegion } = useApp();
  const [timeRange, setTimeRange] = useState('24h');
  const [showToast, setShowToast] = useState(false);
  
  // Get current AQI for trend calculation
  const regionData = ncrAqi?.regions?.[selectedRegion];
  const currentAQI = regionData?.aqi || ncrAqi?.summary?.averageAqi || null;
  
  // Fetch ML forecast data using shared hook
  const { forecast24h, loading, error, usingFallback } = useAqiForecast(currentAQI, selectedRegion);

  // Show toast when fallback is used
  useEffect(() => {
    if (usingFallback && !showToast) {
      setShowToast(true);
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [usingFallback, showToast]);

  // Transform ML forecast data to chart format
  // Use brighter yellow for graphs when AQI is moderate, keep original color for text
  const data = forecast24h.length > 0
    ? forecast24h.map((f) => {
        const aqi = Math.round(f.AQI || 0);
        const levelObj = getAqiLevel(aqi);
        const baseColor = getAqiColor(aqi);
        // Use brighter yellow for graph lines when moderate
        const graphColor = (aqi > 100 && aqi <= 200) ? AQI_COLORS.moderateGraph : baseColor;
        return {
          hour: `+${f.hour_ahead || 0}h`,
          aqi: aqi,
          level: levelObj?.level || levelObj?.label || 'Unknown',
          color: baseColor, // Keep original color for text/tooltip
          graphColor: graphColor, // Use brighter color for graph line
        };
      })
    : (predictions?.hourlyForecast?.map((item) => {
        const baseColor = getAqiColor(item.aqi);
        const graphColor = (item.aqi > 100 && item.aqi <= 200) ? AQI_COLORS.moderateGraph : baseColor;
        return {
          hour: `+${item.hour}h`,
          aqi: item.aqi,
          level: item.level,
          color: baseColor,
          graphColor: graphColor,
        };
      }) || []);

  const displayData = timeRange === '6h' ? data.slice(0, 6) : data;

  // Loading state
  if (loading && !data.length) {
    return (
      <motion.div
        className="glass-card w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1rem' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <h3 className="section-title mb-0">AQI Forecast Trend</h3>
          </div>
        </div>
        <div className="h-64 flex-1 animate-pulse">
          <div className="h-full bg-gray-200 rounded-xl"></div>
        </div>
      </motion.div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <motion.div
        className="glass-card w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1rem' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <h3 className="section-title mb-0">AQI Forecast Trend</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No forecast data available</p>
        </div>
      </motion.div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const aqiLabel = getAqiLabel(item.aqi);
      // Use darker shade for moderate (yellow) to ensure text readability
      const textColor = item.color === AQI_COLORS.moderate ? AQI_COLORS.moderate : item.color;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl">
          <p className="text-gray-500 text-xs mb-1">{label}</p>
          <p 
            className="text-2xl font-display font-bold"
            style={{ color: textColor }}
          >
            {item.aqi} <span className="text-sm text-gray-500">AQI</span>
          </p>
          <p 
            className="text-xs capitalize mt-1 font-semibold"
            style={{ color: textColor }}
          >
            {aqiLabel}
          </p>
        </div>
      );
    }
    return null;
  };

  // AQI threshold lines - using CPCB standard colors
  // Use brighter yellow for graph lines
  const thresholds = [
    { value: 50, label: 'Good', color: AQI_COLORS.good },
    { value: 100, label: 'Satisfactory', color: AQI_COLORS.satisfactory },
    { value: 200, label: 'Moderate', color: AQI_COLORS.moderateGraph },
    { value: 300, label: 'Poor', color: AQI_COLORS.poor },
    { value: 400, label: 'Very Poor', color: AQI_COLORS.veryPoor },
  ];

  return (
    <motion.div
      className="glass-card w-full relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        padding: '1rem',
        paddingBottom: '1rem',
        borderBottomLeftRadius: '0', 
        borderBottomRightRadius: '0',
        borderBottom: 'none',
        marginBottom: 0,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        zIndex: 1
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h3 className="section-title mb-0">AQI Forecast Trend</h3>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('6h')}
            className={`px-3 py-1 rounded-md text-sm transition-all ${
              timeRange === '6h' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            6h
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 rounded-md text-sm transition-all ${
              timeRange === '24h' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            24h
          </button>
        </div>
      </div>

      <div className="h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                {/* Use graphColor for gradient (brighter yellow for moderate) */}
                <stop offset="5%" stopColor={(displayData[0]?.graphColor) || AQI_COLORS.moderateGraph} stopOpacity={0.3} />
                <stop offset="95%" stopColor={(displayData[0]?.graphColor) || AQI_COLORS.moderateGraph} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey="hour" 
              stroke="#64748B" 
              fontSize={11}
              tickLine={false}
              tick={{ fill: '#1F2937' }}
              height={30}
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11}
              tickLine={false}
              domain={[0, 'dataMax + 50']}
              tick={{ fill: '#1F2937' }}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Threshold reference lines */}
            {thresholds.map((threshold) => (
              <ReferenceLine
                key={threshold.value}
                y={threshold.value}
                stroke={threshold.color}
                strokeDasharray="5 5"
                strokeOpacity={0.3}
              />
            ))}
            
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={(displayData[0]?.graphColor) || AQI_COLORS.moderateGraph}
              strokeWidth={3}
              fill="url(#aqiGradient)"
              isAnimationActive={true}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs">
        {thresholds.slice(0, 3).map((t) => (
          <div key={t.value} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: t.color }}
            />
            <span 
              style={{ 
                color: '#64748B', // All legend text in black/gray for consistency
                fontWeight: '400'
              }}
            >
              {t.label} ({t.value})
            </span>
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      <div className="flex items-center justify-center gap-2 mt-2 mb-0 text-xs text-gray-500" style={{ marginBottom: 0 }}>
        <Clock className="w-3 h-3" />
        Showing forecast from current time
        {usingFallback && (
          <span className="text-amber-600 ml-2">(Using estimated values)</span>
        )}
      </div>

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

