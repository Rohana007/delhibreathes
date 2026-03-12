import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { X, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { getAqiColor, getAqiCategory } from '../../utils/aqiColors';
import { POLLUTANT_INFO } from '../../utils/helpers';
import { computeValidatedAQI } from '../../utils/validationEngine';

/**
 * Real-time AQI Breakdown Modal
 * Shows detailed breakdown from CPCB, AQICN, and OpenWeather
 * 
 * @param {Object} props
 * @param {Object} props.data - Real-time AQI data from backend
 * @param {number} props.cpcbAqi - CPCB AQI value
 * @param {Function} props.onClose - Close handler
 */
export default function RealtimeAqiBreakdownModal({ data, cpcbAqi, onClose }) {
  const [showValidation, setShowValidation] = useState(true);
  const [showFormula, setShowFormula] = useState(false);

  if (!data) return null;

  // Compute validated AQI on frontend
  const validatedData = useMemo(() => {
    if (!data.datasets) return null;
    return computeValidatedAQI(
      data.datasets.cpcb,
      data.datasets.aqicn,
      data.datasets.openweather
    );
  }, [data]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  // Get status badge with freshness
  const getStatusBadge = (dataset) => {
    if (!dataset || dataset.aqi === null || dataset.aqi === undefined) {
      return (
        <span 
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
          style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
        >
          <AlertCircle className="w-3 h-3" />
          Unavailable
        </span>
      );
    }

    if (dataset.status === 'error') {
      return (
        <span 
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
        >
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      );
    }

    // Use freshness label from backend
    const freshness = dataset.freshness || 'very_stale';
    const freshnessConfig = {
      fresh: { bg: '#D1FAE5', color: '#10B981', label: 'Fresh', icon: CheckCircle },
      slightly_stale: { bg: '#FEF3C7', color: '#92400E', label: 'Slightly Stale', icon: Clock },
      old: { bg: '#FED7AA', color: '#C2410C', label: 'Old', icon: Clock },
      very_stale: { bg: '#FEE2E2', color: '#DC2626', label: 'Very Stale', icon: AlertCircle },
    };

    const config = freshnessConfig[freshness] || freshnessConfig.very_stale;
    const Icon = config.icon;

    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Render pollutant table
  const renderPollutantTable = (pollutants) => {
    const standardPollutants = ['pm25', 'pm10', 'no2', 'so2', 'o3', 'co'];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Pollutant</th>
              <th className="text-right py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Value</th>
              <th className="text-right py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {standardPollutants.map(pollutant => {
              const value = pollutants?.[pollutant];
              const info = POLLUTANT_INFO[pollutant];
              
              if (value == null) return null;

              return (
                <tr key={pollutant} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td className="py-2 px-3" style={{ color: '#0F172A' }}>
                    {info?.name || pollutant.toUpperCase()}
                  </td>
                  <td className="text-right py-2 px-3 font-medium" style={{ color: '#0F172A' }}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </td>
                  <td className="text-right py-2 px-3" style={{ color: '#64748B' }}>
                    {info?.unit || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Convert OpenWeather AQI scale to readable text
  const getOpenWeatherAqiLabel = (owAqi) => {
    const labels = {
      1: 'Good',
      2: 'Fair',
      3: 'Moderate',
      4: 'Poor',
      5: 'Very Poor'
    };
    return labels[owAqi] || 'Unknown';
  };

  // Get consistency color
  const getConsistencyColor = (status) => {
    const colors = {
      good: '#10B981',
      moderate: '#F59E0B',
      poor: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
            <div>
              <h2 className="text-xl font-display font-bold" style={{ color: '#0F172A' }}>
                Real-Time AQI Breakdown
              </h2>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                Multi-source comparison: CPCB, AQICN, OpenWeather
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: '#64748B' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            <div className="space-y-6">
              {/* Section 1: CPCB AQI */}
              <section>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
                  1. CPCB AQI (Primary Source)
                </h3>
                
                {(() => {
                  const cpcb = data.datasets?.cpcb;
                  if (!cpcb) return null;

                  return (
                    <div className="glass-card p-4 mb-4" style={{ backgroundColor: cpcb.aqi ? `${getAqiColor(cpcb.aqi)}15` : '#F3F4F6' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>CPCB AQI</p>
                          {cpcb.aqi !== null && cpcb.aqi !== undefined ? (
                            <>
                              <p className="text-4xl font-bold" style={{ color: getAqiColor(cpcb.aqi) }}>
                                {cpcb.aqi}
                              </p>
                              <p className="text-sm mt-1" style={{ color: '#64748B' }}>{getAqiCategory(cpcb.aqi)}</p>
                            </>
                          ) : (
                            <p className="text-lg font-semibold" style={{ color: '#6B7280' }}>Not available</p>
                          )}
                        </div>
                        {getStatusBadge(cpcb)}
                      </div>

                      {/* CPCB Pollutants */}
                      {cpcb.pollutants && Object.keys(cpcb.pollutants).length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Pollutants</p>
                          {renderPollutantTable(cpcb.pollutants)}
                        </div>
                      )}

                      {/* Station Info */}
                      {cpcb.station && (
                        <div className="text-xs" style={{ color: '#64748B' }}>
                          Station: {cpcb.station}
                          {cpcb.distance && ` (${cpcb.distance.toFixed(1)} km away)`}
                        </div>
                      )}

                      {/* Timestamp */}
                      {cpcb.timestamp && (
                        <div className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          Updated: {formatTimestamp(cpcb.timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>

              {/* Section 2: AQICN AQI */}
              <section>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
                  2. AQICN AQI
                </h3>
                
                {(() => {
                  const aqicn = data.datasets?.aqicn;
                  if (!aqicn) return null;

                  return (
                    <div className="glass-card p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>AQICN AQI</p>
                          {aqicn.aqi !== null && aqicn.aqi !== undefined ? (
                            <>
                              <p className="text-4xl font-bold" style={{ color: getAqiColor(aqicn.aqi) }}>
                                {aqicn.aqi}
                              </p>
                              <p className="text-sm mt-1" style={{ color: '#64748B' }}>{getAqiCategory(aqicn.aqi)}</p>
                            </>
                          ) : (
                            <p className="text-lg font-semibold" style={{ color: '#6B7280' }}>Not available</p>
                          )}
                        </div>
                        {getStatusBadge(aqicn)}
                      </div>

                      {/* AQICN Pollutants */}
                      {aqicn.pollutants && Object.keys(aqicn.pollutants).length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Pollutants</p>
                          {renderPollutantTable(aqicn.pollutants)}
                        </div>
                      )}

                      {/* Station Info */}
                      {aqicn.station && (
                        <div className="text-xs" style={{ color: '#64748B' }}>
                          Station: {aqicn.station}
                        </div>
                      )}

                      {/* Timestamp */}
                      {aqicn.timestamp && (
                        <div className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          Updated: {formatTimestamp(aqicn.timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>

              {/* Section 3: OpenWeather AQI */}
              <section>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
                  3. OpenWeather AQI (Converted to Indian AQI)
                </h3>
                
                {(() => {
                  const openweather = data.datasets?.openweather;
                  if (!openweather) return null;

                  return (
                    <div className="glass-card p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>OpenWeather AQI</p>
                          {openweather.aqi !== null && openweather.aqi !== undefined ? (
                            <>
                              <p className="text-4xl font-bold" style={{ color: getAqiColor(openweather.aqi) }}>
                                {openweather.aqi}
                              </p>
                              <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                                {getAqiCategory(openweather.aqi)} 
                                {openweather.owAqi && (
                                  <span className="ml-2" style={{ color: '#9CA3AF' }}>
                                    (OW Scale: {openweather.owAqi} - {getOpenWeatherAqiLabel(openweather.owAqi)})
                                  </span>
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-semibold" style={{ color: '#6B7280' }}>Not available</p>
                          )}
                        </div>
                        {getStatusBadge(openweather)}
                      </div>

                      {/* OpenWeather Pollutants */}
                      {openweather.pollutants && Object.keys(openweather.pollutants).length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Pollutants</p>
                          {renderPollutantTable(openweather.pollutants)}
                        </div>
                      )}

                      {/* Timestamp */}
                      {openweather.timestamp && (
                        <div className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          Updated: {formatTimestamp(openweather.timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>

              {/* Section 4: Validated AQI (Our Engine) */}
              {data.validated && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                      5. Validated AQI (Our Engine)
                    </h3>
                    <button
                      onClick={() => setShowValidation(!showValidation)}
                      className="p-1 rounded hover:bg-gray-100 transition"
                    >
                      {showValidation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {showValidation && (
                    <div className="glass-card p-4 mb-4" style={{ backgroundColor: data.validated.aqi ? `${getAqiColor(data.validated.aqi)}15` : '#F3F4F6' }}>
                      {/* Validated AQI Display */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>Validated AQI</p>
                          {data.validated.aqi !== null && data.validated.aqi !== undefined ? (
                            <>
                              <p className="text-4xl font-bold" style={{ color: getAqiColor(data.validated.aqi) }}>
                                {data.validated.aqi}
                              </p>
                              <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                                {getAqiCategory(data.validated.aqi)}
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-semibold" style={{ color: '#6B7280' }}>Not available</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: '#64748B' }}>Confidence</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${data.validated.confidence}%`,
                                  backgroundColor: data.validated.confidence >= 70 ? '#10B981' : data.validated.confidence >= 40 ? '#F59E0B' : '#EF4444'
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                              {data.validated.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Weight Chart */}
                      <div className="mb-6">
                        <p className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>Source Weights</p>
                        <div className="space-y-2">
                          {[
                            { name: 'CPCB', weight: data.validated.weights.cpcb, color: '#3B82F6' },
                            { name: 'AQICN', weight: data.validated.weights.aqicn, color: '#10B981' },
                            { name: 'OpenWeather', weight: data.validated.weights.openweather, color: '#F59E0B' },
                          ].map(({ name, weight, color }) => (
                            <div key={name} className="flex items-center gap-3">
                              <div className="w-20 text-sm font-medium" style={{ color: '#0F172A' }}>{name}</div>
                              <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full transition-all"
                                  style={{ width: `${weight * 100}%`, backgroundColor: color }}
                                />
                              </div>
                              <div className="w-16 text-right text-sm font-semibold" style={{ color: '#64748B' }}>
                                {(weight * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Consistency Metrics */}
                      {validatedData.consistency && (
                        <div className="mb-6">
                          <p className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>Cross-Source Consistency</p>
                          <div className="space-y-2 text-sm">
                            {validatedData.consistency.cpcb_vs_aqicn && (
                              <div className="flex justify-between items-center py-2 px-3 rounded" style={{ backgroundColor: '#F9FAFB' }}>
                                <span style={{ color: '#64748B' }}>CPCB vs AQICN</span>
                                <span className="font-medium" style={{ color: getConsistencyColor(validatedData.consistency.cpcb_vs_aqicn.status) }}>
                                  {validatedData.consistency.cpcb_vs_aqicn.status} ({(validatedData.consistency.cpcb_vs_aqicn.difference * 100).toFixed(1)}% diff)
                                </span>
                              </div>
                            )}
                            {validatedData.consistency.cpcb_vs_openweather && (
                              <div className="flex justify-between items-center py-2 px-3 rounded" style={{ backgroundColor: '#F9FAFB' }}>
                                <span style={{ color: '#64748B' }}>CPCB vs OpenWeather</span>
                                <span className="font-medium" style={{ color: getConsistencyColor(validatedData.consistency.cpcb_vs_openweather.status) }}>
                                  {validatedData.consistency.cpcb_vs_openweather.status} ({(validatedData.consistency.cpcb_vs_openweather.difference * 100).toFixed(1)}% diff)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Freshness Statuses */}
                      {validatedData.diagnostics && (
                        <div className="mb-6">
                          <p className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>Data Freshness & Validation</p>
                          <div className="space-y-3">
                            {Object.entries(validatedData.diagnostics).map(([key, diag]) => {
                              return (
                                <div key={key} className="p-3 rounded" style={{ backgroundColor: '#F9FAFB' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{key.toUpperCase()}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2 py-1 rounded" style={{ 
                                        backgroundColor: diag.freshness === 'fresh' ? '#D1FAE5' : diag.freshness === 'slightly_stale' ? '#FEF3C7' : diag.freshness === 'stale' ? '#FED7AA' : '#FEE2E2',
                                        color: diag.freshness === 'fresh' ? '#10B981' : diag.freshness === 'slightly_stale' ? '#92400E' : diag.freshness === 'stale' ? '#C2410C' : '#DC2626'
                                      }}>
                                        {diag.freshness ? diag.freshness.replace(/_/g, ' ') : 'Unknown'}
                                      </span>
                                      {diag.reliability_score !== undefined && (
                                        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                                          Reliability: {(diag.reliability_score * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {diag.flags && diag.flags.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium mb-1" style={{ color: '#64748B' }}>Validation Flags:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {diag.flags.map((flag, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-0.5 rounded"
                                          style={{
                                            backgroundColor: flag.includes('SPIKE') || flag.includes('STUCK') || flag.includes('DISCREPANCY') ? '#FEE2E2' : '#FEF3C7',
                                            color: flag.includes('SPIKE') || flag.includes('STUCK') || flag.includes('DISCREPANCY') ? '#DC2626' : '#92400E'
                                          }}
                                        >
                                          {flag.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {diag.anomalies && diag.anomalies.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium mb-1" style={{ color: '#64748B' }}>Anomalies Detected:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {diag.anomalies.slice(0, 5).map((anomaly, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-0.5 rounded"
                                          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                                        >
                                          {anomaly.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                      {diag.anomalies.length > 5 && (
                                        <span className="text-xs" style={{ color: '#64748B' }}>
                                          +{diag.anomalies.length - 5} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Formula Derivation - Simplified */}
                      {validatedData && (
                        <div>
                          <button
                            className="flex items-center w-full px-2 py-1 mt-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setShowFormula(!showFormula)}
                          >
                            <Info className="w-4 h-4" style={{ color: '#64748B' }} />

                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                              How Validation Works
                            </span>

                            {showFormula ? (
                              <ChevronUp className="w-4 h-4 ml-auto" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-auto" />
                            )}
                          </button>

                          {showFormula && (
                            <div className="mt-3 p-4 rounded" style={{ backgroundColor: '#F9FAFB' }}>
                              <p className="text-xs mb-4" style={{ color: '#64748B' }}>
                                This validation engine uses weighted fusion of CPCB (60%), AQICN (25%), and OpenWeather (15%) sources. Weights are dynamically adjusted based on data freshness, consistency, and reliability.
                              </p>
                              <div className="space-y-3 text-xs" style={{ color: '#64748B' }}>
                                <div className="border-l-2 pl-3" style={{ borderColor: '#E2E8F0' }}>
                                  <p className="font-semibold mb-1" style={{ color: '#0F172A' }}>Step 1: Data Validity Checks</p>
                                  <p>Each source is validated for freshness, completeness, and reliability.</p>
                                </div>
                                <div className="border-l-2 pl-3" style={{ borderColor: '#E2E8F0' }}>
                                  <p className="font-semibold mb-1" style={{ color: '#0F172A' }}>Step 2: Cross-Source Consistency</p>
                                  <p>Pairwise differences are computed to identify inconsistencies.</p>
                                </div>
                                <div className="border-l-2 pl-3" style={{ borderColor: '#E2E8F0' }}>
                                  <p className="font-semibold mb-1" style={{ color: '#0F172A' }}>Step 3: Dynamic Weight Adjustment</p>
                                  <p>Weights are penalized for stale data and inconsistencies, then normalized.</p>
                                </div>
                                <div className="border-l-2 pl-3" style={{ borderColor: '#E2E8F0' }}>
                                  <p className="font-semibold mb-1" style={{ color: '#0F172A' }}>Step 4: Weighted Fusion</p>
                                  <p>Final AQI = Σ(weight_i × AQI_i) for all valid sources.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Section 6: Comparison Table */}
              <section>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
                  6. Comparison Table
                </h3>
                
                <div className="glass-card p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <th className="text-left py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Dataset</th>
                          <th className="text-right py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>AQI</th>
                          <th className="text-right py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Timestamp</th>
                          <th className="text-center py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Status</th>
                          <th className="text-center py-2 px-3 font-semibold" style={{ color: '#0F172A' }}>Freshness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const cpcb = data.datasets?.cpcb;
                          const aqicn = data.datasets?.aqicn;
                          const openweather = data.datasets?.openweather;

                          return (
                            <>
                              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td className="py-2 px-3 font-medium" style={{ color: '#0F172A' }}>CPCB</td>
                                <td className="text-right py-2 px-3 font-bold" style={{ color: cpcb?.aqi ? getAqiColor(cpcb.aqi) : '#6B7280' }}>
                                  {cpcb?.aqi !== null && cpcb?.aqi !== undefined ? cpcb.aqi : '—'}
                                </td>
                                <td className="text-right py-2 px-3" style={{ color: '#64748B' }}>
                                  {formatTimestamp(cpcb?.timestamp)}
                                </td>
                                <td className="text-center py-2 px-3">
                                  {getStatusBadge(cpcb)}
                                </td>
                                <td className="text-center py-2 px-3 text-xs" style={{ color: '#64748B' }}>
                                  {cpcb?.freshness ? cpcb.freshness.replace('_', ' ') : '—'}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td className="py-2 px-3 font-medium" style={{ color: '#0F172A' }}>AQICN</td>
                                <td className="text-right py-2 px-3 font-bold" style={{ color: aqicn?.aqi ? getAqiColor(aqicn.aqi) : '#6B7280' }}>
                                  {aqicn?.aqi !== null && aqicn?.aqi !== undefined ? aqicn.aqi : '—'}
                                </td>
                                <td className="text-right py-2 px-3" style={{ color: '#64748B' }}>
                                  {formatTimestamp(aqicn?.timestamp)}
                                </td>
                                <td className="text-center py-2 px-3">
                                  {getStatusBadge(aqicn)}
                                </td>
                                <td className="text-center py-2 px-3 text-xs" style={{ color: '#64748B' }}>
                                  {aqicn?.freshness ? aqicn.freshness.replace('_', ' ') : '—'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 font-medium" style={{ color: '#0F172A' }}>OpenWeather</td>
                                <td className="text-right py-2 px-3 font-bold" style={{ color: openweather?.aqi ? getAqiColor(openweather.aqi) : '#6B7280' }}>
                                  {openweather?.aqi !== null && openweather?.aqi !== undefined ? openweather.aqi : '—'}
                                </td>
                                <td className="text-right py-2 px-3" style={{ color: '#64748B' }}>
                                  {formatTimestamp(openweather?.timestamp)}
                                </td>
                                <td className="text-center py-2 px-3">
                                  {getStatusBadge(openweather)}
                                </td>
                                <td className="text-center py-2 px-3 text-xs" style={{ color: '#64748B' }}>
                                  {openweather?.freshness ? openweather.freshness.replace('_', ' ') : '—'}
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Global timestamp */}
                  {data.timestamp_global && (
                    <div className="mt-4 pt-4 border-t text-xs text-center" style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
                      Bundle synchronized at: {formatTimestamp(data.timestamp_global)}
                    </div>
                  )}
                </div>
              </section>

              {/* Section 5: Warnings */}
              {data.warnings && data.warnings.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
                    Warnings
                  </h3>
                  <div className="glass-card p-4">
                    <ul className="space-y-2">
                      {data.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#92400E' }}>
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

