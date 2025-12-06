import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, TrendingUp, TrendingDown, Minus, ChevronDown, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAqiLabel, getAqiColor, getAqiClass, POLLUTANT_INFO } from '../../utils/helpers';
import PollutantDetailPanel from './PollutantDetailPanel';
import PollutantMiniChart from './PollutantMiniChart';

export default function AQICard() {
  const { ncrAqi, predictions, selectedRegion, setSelectedRegion, loading, error, fetchData } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const regionData = ncrAqi?.regions?.[selectedRegion];
  const aqi = regionData?.aqi || ncrAqi?.summary?.averageAqi;
  const trend = predictions?.trends?.shortTerm;

  // Get list of available regions
  const regionList = ncrAqi?.regions 
    ? Object.entries(ncrAqi.regions)
        .filter(([_, data]) => !data.error)
        .map(([key, data]) => ({
          key,
          name: data.location?.name || key,
          aqi: data.aqi
        }))
    : [];

  // Handle region change from dropdown
  const handleRegionChange = (regionKey) => {
    setSelectedRegion(regionKey);
    setIsDropdownOpen(false);
  };

  // Prevent card click when clicking dropdown
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  // Close dropdown when clicking outside - MUST be before any early returns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Derived states to avoid getting stuck on loading
  const isLoading = loading && !aqi;
  const hasError = !loading && !!error && !aqi;
  const noData = !loading && !error && !aqi;

  // Loading / error / fallback UI for AQI card
  if (isLoading || hasError || noData) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center">
        {isLoading && (
          <p className="text-sm" style={{ color: '#64748B', fontWeight: 500 }} data-translate="Fetching air quality data...">
            Fetching air quality data...
          </p>
        )}
        {hasError && (
          <>
            <p className="text-sm mb-2" style={{ color: '#DC2626', fontWeight: 600 }} data-translate="Unable to load live AQI.">
              Unable to load live AQI.
            </p>
            <button
              onClick={fetchData}
              className="btn-primary text-xs"
              data-translate="Retry"
            >
              Retry
            </button>
          </>
        )}
        {noData && (
          <>
            <p className="text-sm mb-2" style={{ color: '#64748B', fontWeight: 500 }} data-translate="AQI data is currently unavailable.">
              AQI data is currently unavailable.
            </p>
            <button
              onClick={fetchData}
              className="btn-primary text-xs"
              data-translate="Refresh AQI"
            >
              Refresh AQI
            </button>
          </>
        )}
      </div>
    );
  }

  const color = getAqiColor(aqi);
  const label = getAqiLabel(aqi);
  const aqiClass = getAqiClass(aqi);

  // Get gradient background based on AQI category
  const getAqiGradient = (aqi) => {
    if (aqi <= 50) {
      // Good - Green gradient (subtle)
      return 'linear-gradient(135deg, rgba(209, 250, 229, 0.3), rgba(167, 243, 208, 0.2))';
    } else if (aqi <= 100) {
      // Moderate - Yellow/orange gradient (subtle)
      return 'linear-gradient(135deg, rgba(255, 231, 194, 0.3), rgba(255, 215, 160, 0.2))';
    } else if (aqi <= 200) {
      // Unhealthy - Orange/red gradient (subtle)
      return 'linear-gradient(135deg, rgba(255, 213, 213, 0.3), rgba(255, 177, 177, 0.2))';
    } else if (aqi <= 300) {
      // Very Unhealthy - Purple gradient (subtle)
      return 'linear-gradient(135deg, rgba(233, 213, 255, 0.3), rgba(221, 214, 254, 0.2))';
    } else {
      // Hazardous - Dark red gradient (subtle)
      return 'linear-gradient(135deg, rgba(254, 226, 226, 0.3), rgba(254, 202, 202, 0.2))';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4" style={{ color: '#64748B' }} />;
    if (trend.includes('increasing') || trend.includes('rising')) 
      return <TrendingUp className="w-4 h-4" style={{ color: '#DC2626' }} />;
    if (trend.includes('decreasing') || trend.includes('falling')) 
      return <TrendingDown className="w-4 h-4" style={{ color: '#16A34A' }} />;
    return <Minus className="w-4 h-4" style={{ color: '#64748B' }} />;
  };

  const healthImpact = regionData?.healthImpact || getHealthImpact(aqi);

  return (
    <>
      <motion.div
        className="glass-card cursor-pointer h-full"
        onClick={() => setShowDetails(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '1.25rem' }}
      >
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#F1F5F9' }}
              >
                <Wind className="w-6 h-6" style={{ color: '#334155' }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#64748B' }} data-translate="Air Quality Index">Air Quality Index</p>
                <p className="text-sm font-semibold" style={{ color: '#0F172A' }} data-translate={regionData?.location?.name ? undefined : 'NCR Average'}>
                  {regionData?.location?.name || 'NCR Average'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-xs capitalize font-medium" style={{ color: '#475569' }} data-translate={trend ? undefined : 'Stable'}>{trend || 'Stable'}</span>
            </div>
          </div>

          {/* Main AQI Value */}
          <div className="text-center py-6">
            <motion.div
              className="inline-block rounded-2xl px-6 py-3 sm:px-8 sm:py-4"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: getAqiGradient(aqi),
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              <span 
                className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight aqi-value"
                style={{ 
                  color: color
                }}
              >
                {aqi}
              </span>
            </motion.div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-4">
            <span className={`aqi-badge text-base px-4 py-1.5 ${aqiClass}`}>
              {label}
            </span>
          </div>

          {/* Pollutant Breakdown Chart */}
          {regionData?.pollutants && (
            <div className="mb-4 overflow-hidden w-full" style={{ maxWidth: '100%' }}>
              <PollutantMiniChart data={regionData.pollutants} />
            </div>
          )}

          {/* Health Impact */}
          <div className="text-center mb-4">
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{healthImpact}</p>
          </div>

          {/* Click for details hint */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs"
            style={{ color: '#64748B' }}
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Info className="w-3 h-3" />
            <span data-translate="Tap for pollutant breakdown">Tap for pollutant breakdown</span>
            <ChevronDown className="w-3 h-3" />
          </motion.div>

          {/* Quick Pollutant Pills */}
          {regionData?.pollutants && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Object.entries(regionData.pollutants).slice(0, 4).map(([key, value]) => {
                const info = POLLUTANT_INFO[key];
                if (!info || value == null) return null;
                return (
                  <div 
                    key={key} 
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ 
                      backgroundColor: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    {info.name}: {Math.round(value)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Live indicator with freshness check */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: '#64748B' }}>
              <span className="relative flex h-2 w-2">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: color }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: color }}
                />
              </span>
              Live • Updates every 2 min
            </div>
            
            {/* Freshness badge */}
            {(() => {
              const timestamp = regionData?.timestamp || regionData?.last_updated || ncrAqi?.summary?.lastUpdated;
              if (timestamp) {
                const age = Date.now() - new Date(timestamp).getTime();
                const ageMinutes = Math.floor(age / (60 * 1000));
                const isStale = ageMinutes > 10;
                
                if (isStale) {
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      <span>⚠</span>
                      <span>Data may be outdated ({ageMinutes}m ago)</span>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Source chip */}
            {regionData?.source && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>
                <span>Source:</span>
                <span className="font-semibold">{regionData.source}</span>
                {regionData.confidence && (
                  <span style={{ color: '#64748B' }}>({Math.round(regionData.confidence * 100)}% confidence)</span>
                )}
              </div>
            )}

            {/* Fallback indicator */}
            {regionData?.is_fallback && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                <span>ℹ</span>
                <span>Showing nearest sensor value</span>
              </div>
            )}

            {/* Forecast indicator */}
            {regionData?.is_forecast && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                <span>📊</span>
                <span>Forecast model estimate</span>
              </div>
            )}
          </div>

          {/* Region Selector Dropdown */}
          {regionList.length > 0 && (
            <div 
              className="relative mt-4"
              onClick={handleDropdownClick}
              ref={dropdownRef}
            >
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-[10px] border transition-all region-dropdown"
                style={{
                  backgroundColor: 'var(--card-bg, #FFFFFF)',
                  borderColor: 'var(--border-color, #E2E8F0)',
                  color: 'var(--text-primary, #0F172A)',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #E2E8F0)';
                  e.currentTarget.style.backgroundColor = 'var(--card-bg, #FFFFFF)';
                }}
              >
                <span className="truncate text-left flex-1" style={{ color: '#000000', fontWeight: '600' }}>
                  {regionData?.location?.name || 'Select Region'}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: '#64748B' }}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 w-full mt-1 rounded-[10px] border shadow-lg overflow-hidden bottom-full mb-1"
                    style={{
                      backgroundColor: 'var(--card-bg, #FFFFFF)',
                      borderColor: 'var(--border-color, #E2E8F0)',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                  >
                    {regionList.map((region) => {
                      const isSelected = selectedRegion === region.key;
                      return (
                        <button
                          key={region.key}
                          type="button"
                          onClick={() => handleRegionChange(region.key)}
                          className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-gray-50"
                          style={{
                            backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                            color: 'var(--text-primary, #0F172A)',
                            fontWeight: isSelected ? '600' : '500'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate" style={{ color: '#000000', fontWeight: '600' }}>{region.name}</span>
                            {isSelected && (
                              <span className="text-xs ml-2" style={{ color: '#2563EB', fontWeight: 'bold' }}>
                                ✓
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pollutant Detail Panel Modal */}
      <AnimatePresence>
        {showDetails && (
          <PollutantDetailPanel 
            data={regionData} 
            onClose={() => setShowDetails(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function getHealthImpact(aqi) {
  if (aqi <= 50) return 'Air quality is satisfactory. Ideal for outdoor activities.';
  if (aqi <= 100) return 'Minor breathing discomfort to sensitive people.';
  if (aqi <= 200) return 'Breathing discomfort to people with lung/heart conditions.';
  if (aqi <= 300) return 'Breathing discomfort to most people on prolonged exposure.';
  if (aqi <= 400) return 'Respiratory illness on prolonged exposure. Avoid outdoors.';
  return 'Serious health impacts for all. Emergency conditions.';
}
