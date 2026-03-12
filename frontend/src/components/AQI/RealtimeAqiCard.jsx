import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, ChevronDown } from 'lucide-react';
import { useRealtimeAqi } from '../../hooks/useRealtimeAqi';
import { getAqiColor, getAqiCategory, getAqiClass } from '../../utils/aqiColors';
import { computeValidatedAQI } from '../../utils/validationEngine';
import RealtimeAqiBreakdownModal from './RealtimeAqiBreakdownModal';

/**
 * Real-time AQI Card Component
 * Displays CPCB AQI from real-time multi-source data
 * 
 * @param {Object} props
 * @param {number} props.lat - Latitude
 * @param {number} props.lon - Longitude
 */
export default function RealtimeAqiCard({ lat, lon }) {
  const { data, loading, error } = useRealtimeAqi(lat, lon);
  const [modalOpen, setModalOpen] = useState(false);

  // Compute validated AQI
  const validatedData = useMemo(() => {
    if (!data?.datasets) return null;
    return computeValidatedAQI(
      data.datasets.cpcb,
      data.datasets.aqicn,
      data.datasets.openweather
    );
  }, [data]);

  // Use validated AQI if available, otherwise fallback to CPCB
  const displayAqi = validatedData?.validated_aqi ?? data?.datasets?.cpcb?.aqi ?? null;

  // Loading state
  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2563EB' }} />
        <p className="text-sm mt-4" style={{ color: '#64748B' }}>
          Fetching real-time AQI...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-sm mb-2" style={{ color: '#DC2626', fontWeight: 600 }}>
          Unable to load real-time AQI
        </p>
        <p className="text-xs" style={{ color: '#64748B' }}>
          {error || 'Data unavailable'}
        </p>
      </div>
    );
  }

  // AQI unavailable state
  if (displayAqi === null || displayAqi === undefined) {
    return (
      <div 
        className="glass-card p-6 cursor-pointer min-h-[300px] flex flex-col items-center justify-center"
        onClick={() => setModalOpen(true)}
        style={{ backgroundColor: '#F3F4F6' }}
      >
        <h1 className="text-6xl font-bold mb-2" style={{ color: '#6B7280' }}>
          —
        </h1>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#6B7280' }}>
          AQI Unavailable
        </h3>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Tap to view sources
        </p>
      </div>
    );
  }

  // Normal state - show Validated AQI
  const aqiColor = getAqiColor(displayAqi);
  const aqiCategory = getAqiCategory(displayAqi);
  const aqiClass = getAqiClass(displayAqi);

  return (
    <>
      <motion.div
        className="glass-card p-6 cursor-pointer min-h-[300px] flex flex-col items-center justify-center"
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{ backgroundColor: `${aqiColor}15` }} // 15 = ~8% opacity
      >
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: '#64748B' }}>
            Real-Time AQI
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {validatedData?.validated_aqi ? 'Validated (Multi-Source)' : 'CPCB (Primary Source)'}
          </p>
        </div>

        {/* Main AQI Value */}
        <motion.div
          className="text-center py-6"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <h1 
            className="font-display text-7xl sm:text-8xl lg:text-9xl font-bold tracking-tight"
            style={{ color: aqiColor }}
          >
            {displayAqi}
          </h1>
        </motion.div>

        {/* Category Badge */}
        <div className="flex justify-center mb-4">
          <span className={`aqi-badge text-base px-4 py-1.5 ${aqiClass}`}>
            {aqiCategory}
          </span>
        </div>

        {/* Tap hint */}
        <motion.div 
          className="flex items-center justify-center gap-2 text-xs mt-4"
          style={{ color: '#64748B' }}
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Info className="w-3 h-3" />
          <span>Tap to view breakdown</span>
          <ChevronDown className="w-3 h-3" />
        </motion.div>

        {/* Source count indicator */}
        {(() => {
          const sources = [];
          if (data.datasets?.cpcb?.aqi !== null && data.datasets?.cpcb?.aqi !== undefined) sources.push('CPCB');
          if (data.datasets?.aqicn?.aqi !== null && data.datasets?.aqicn?.aqi !== undefined) sources.push('AQICN');
          if (data.datasets?.openweather?.aqi !== null && data.datasets?.openweather?.aqi !== undefined) sources.push('OpenWeather');
          
          if (sources.length > 0) {
            return (
              <div className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium" 
                   style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>
                {sources.length} source{sources.length !== 1 ? 's' : ''} available
                {validatedData?.confidence !== undefined && (
                  <span className="ml-2" style={{ color: '#64748B' }}>
                    • {validatedData.confidence}% confidence
                  </span>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* Last updated timestamp */}
        {data?.timestamp_global && (
          <div className="mt-2 text-xs" style={{ color: '#9CA3AF' }}>
            Updated: {new Date(data.timestamp_global).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </motion.div>

      {/* Breakdown Modal */}
      {modalOpen && (
        <RealtimeAqiBreakdownModal
          data={data}
          cpcbAqi={displayAqi}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

