import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, MapPin, Car, Bike, PersonStanding, Bus, AlertTriangle, 
  Check, Clock, Route, Wind, Flame, ChevronDown, ChevronUp, Info,
  Shield, AlertCircle, CheckCircle2, Map
} from 'lucide-react';
import { getSafeRoute } from '../../services/api';
import { getAqiColor, getAqiLabel, TRAVEL_MODES } from '../../utils/helpers';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

const PRESET_LOCATIONS = [
  { id: 'cp', name: 'Connaught Place', lat: 28.6315, lon: 77.2167 },
  { id: 'nehru', name: 'Nehru Place', lat: 28.5494, lon: 77.2517 },
  { id: 'dwarka', name: 'Dwarka', lat: 28.5921, lon: 77.0460 },
  { id: 'noida_sec18', name: 'Noida Sector 18', lat: 28.5706, lon: 77.3221 },
  { id: 'gurgaon_cyber', name: 'Cyber City Gurgaon', lat: 28.4941, lon: 77.0888 },
  { id: 'saket', name: 'Saket', lat: 28.5245, lon: 77.2066 },
  { id: 'rohini', name: 'Rohini', lat: 28.7495, lon: 77.0565 },
  { id: 'laxmi_nagar', name: 'Laxmi Nagar', lat: 28.6304, lon: 77.2777 },
  { id: 'ito', name: 'ITO', lat: 28.6289, lon: 77.2405 },
  { id: 'anand_vihar', name: 'Anand Vihar', lat: 28.6469, lon: 77.3164 },
];

export default function SafeRouteFinder() {
  const navigate = useNavigate();
  const flags = useFeatureFlags();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState('car');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showWhyRecommended, setShowWhyRecommended] = useState(true);

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    const originLoc = PRESET_LOCATIONS.find(l => l.id === origin);
    const destLoc = PRESET_LOCATIONS.find(l => l.id === destination);

    if (!originLoc || !destLoc) {
      setError('Invalid locations');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getSafeRoute(
        { lat: originLoc.lat, lon: originLoc.lon },
        { lat: destLoc.lat, lon: destLoc.lon },
        mode
      );
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (modeId) => {
    switch (modeId) {
      case 'walking': return <PersonStanding className="w-4 h-4" />;
      case 'cycling': case 'two-wheeler': return <Bike className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  // Get route classification color
  const getRouteClassColor = (classification) => {
    switch (classification) {
      case 'recommended': return { bg: '#10B981', text: '#10B981', label: 'Best Route' };
      case 'moderate': return { bg: '#FBBF24', text: '#FBBF24', label: 'Moderate Risk' };
      case 'avoid': return { bg: '#EF4444', text: '#EF4444', label: 'High Risk' };
      default: return { bg: '#6B7280', text: '#6B7280', label: 'Unknown' };
    }
  };

  const RouteCard = ({ route, isMain = false }) => {
    const classColors = getRouteClassColor(route.classification);
    
    return (
      <div 
        className={`p-4 rounded-xl border transition-all ${isMain ? '' : 'hover:scale-[1.01]'}`}
        style={{
          backgroundColor: `${classColors.bg}08`,
          borderColor: `${classColors.bg}30`,
          borderWidth: isMain ? '2px' : '1px',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {route.classification === 'recommended' ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: classColors.bg }} />
            ) : route.classification === 'avoid' ? (
              <AlertCircle className="w-5 h-5" style={{ color: classColors.bg }} />
            ) : (
              <Shield className="w-5 h-5" style={{ color: classColors.bg }} />
            )}
            <span className="font-semibold text-gray-200">
              {isMain ? 'Recommended Route' : route.classLabel}
            </span>
            {route.rank && !isMain && (
              <span className="text-xs text-black/70">#{route.rank}</span>
            )}
          </div>
          <span 
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${classColors.bg}20`,
              color: classColors.text,
            }}
          >
            {route.classification === 'recommended' ? '✓ Best' : 
             route.classification === 'moderate' ? '⚠ Moderate' : '✗ Avoid'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-black/80">Average AQI</p>
            <p 
              className="text-2xl font-display font-bold"
              style={{ color: getAqiColor(route.avgAqi) }}
            >
              {route.avgAqi}
            </p>
            <p className="text-xs" style={{ color: getAqiColor(route.avgAqi) }}>
              {getAqiLabel(route.avgAqi)}
            </p>
          </div>
          <div>
            <p className="text-xs text-black/80">Pollution Score</p>
            <p className="text-2xl font-display font-bold text-gray-200">
              {route.totalScore}
            </p>
            <p className="text-xs text-black/70">Lower is better</p>
          </div>
          <div>
            <p className="text-xs text-black/80">Distance</p>
            <p className="text-lg font-semibold text-gray-200">
              {route.distanceKm} km
            </p>
          </div>
          <div>
            <p className="text-xs text-black/80">Duration</p>
            <p className="text-lg font-semibold text-gray-200 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {route.durationMinutes} min
            </p>
          </div>
        </div>

        {/* Score Breakdown */}
        {isMain && route.scoreBreakdown && (
          <div className="mt-4 pt-4 border-t border-[#d0e0f0]">
            <p className="text-xs text-black/80 mb-2">Score Breakdown</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-[#f0f4f8]">
                <p className="text-sm font-bold text-blue-400">{route.scoreBreakdown.aqi}</p>
                <p className="text-xs text-black/70">AQI</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#f0f4f8]">
                <p className="text-sm font-bold text-orange-400">
                  {route.scoreBreakdown.hotspotCount !== undefined ? route.scoreBreakdown.hotspotCount : route.scoreBreakdown.hotspotProximity}
                </p>
                <p className="text-xs text-black/70">Hotspots</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#f0f4f8]">
                <p className="text-sm font-bold text-purple-400">{route.scoreBreakdown.windDrift}</p>
                <p className="text-xs text-black/70">Wind</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#f0f4f8]">
                <p className="text-sm font-bold text-green-400">{route.scoreBreakdown.exposure}</p>
                <p className="text-xs text-black/70">Exposure</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Road Description for Alternative Routes */}
        {!isMain && (route.majorIntersections?.keySegments?.length > 0 || route.roadNames?.length > 0) && (
          <div className="mt-3 pt-3 border-t border-[#d0e0f0]">
            <p className="text-xs text-black/80 mb-2 flex items-center gap-1">
              <Route className="w-3 h-3" />
              Route via
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(route.majorIntersections?.keySegments || route.roadNames || []).slice(0, 3).map((road, idx, arr) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="text-xs px-2 py-1 rounded-md bg-primary-500/10 border border-primary-500/20 text-primary-300 font-medium">
                    {road.name || road.roadName || road}
                  </span>
                  {idx < arr.length - 1 && idx < 2 && (
                    <span className="text-black/70 text-xs">→</span>
                  )}
                </span>
              ))}
              {((route.majorIntersections?.keySegments || route.roadNames || []).length > 3) && (
                <span className="text-xs text-black/80">
                  (+{((route.majorIntersections?.keySegments || route.roadNames || []).length - 3)} more)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Hotspot Warning */}
        {route.hotspotAnalysis?.affectedSegments?.length > 0 && isMain && (
          <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-2">
            <Flame className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-orange-400">
                {route.hotspotAnalysis.affectedSegments.length} Hotspot(s) Nearby
              </p>
              <p className="text-xs text-black/80 mt-1">
                Route passes within 800m of pollution hotspots. Keep windows closed.
              </p>
            </div>
          </div>
        )}

        {/* Mask Recommendation */}
        {route.maskRecommendation && isMain && (
          <div className="mt-3 p-3 rounded-lg bg-[#f0f4f8] flex items-center gap-3">
            <span className="text-2xl">😷</span>
            <div>
              <p className="text-sm font-medium text-gray-200">
                {route.maskRecommendation.type}
              </p>
              <p className="text-xs text-black/80">
                {route.maskRecommendation.required 
                  ? 'Mask recommended for this journey' 
                  : 'Mask optional for this route'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Navigation className="w-5 h-5 text-primary-400" />
        <h3 className="section-title mb-0">Safe Route Finder</h3>
        <span className="text-xs text-black/70 ml-2">Hotspot & Wind-Aware Routing</span>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Origin */}
        <div className="relative">
          <label className="text-xs text-black/80 mb-1 block">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="input-field pl-10 appearance-none cursor-pointer"
            >
              <option value="" style={{ color: '#111827' }}>Select origin</option>
              {PRESET_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id} style={{ color: '#111827' }}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination */}
        <div className="relative">
          <label className="text-xs text-black/80 mb-1 block">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="input-field pl-10 appearance-none cursor-pointer"
            >
              <option value="" style={{ color: '#111827' }}>Select destination</option>
              {PRESET_LOCATIONS.filter(l => l.id !== origin).map((loc) => (
                <option key={loc.id} value={loc.id} style={{ color: '#111827' }}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode */}
        <div>
          <label className="text-xs text-black/80 mb-1 block">Travel Mode</label>
          <div className="flex gap-1 bg-[#e8f0f8] rounded-xl p-1">
            {TRAVEL_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs transition-all ${
                  mode === m.id
                    ? 'bg-teal-500 text-gray-900'
                    : 'text-black/80 hover:text-gray-200'
                }`}
                title={m.label}
              >
                {getModeIcon(m.id)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={loading || !origin || !destination}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Route className="w-4 h-4" />
                Find Safe Route
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-warning mb-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && result.safestRoute && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Wind Data Banner */}
            {result.windData && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Wind className="w-5 h-5 text-blue-400" />
                <div className="text-sm">
                  <span className="text-black/80">Wind: </span>
                  <span className="font-medium text-gray-200">
                    {result.windData.speedKmh?.toFixed(1)} km/h from {result.windData.compassDirection}
                  </span>
                  {result.windData.driftRisk !== 'low' && (
                    <span className={`ml-2 ${
                      result.windData.driftRisk === 'high' ? 'text-red-400' : 'text-orange-400'
                    }`}>
                      • {result.windData.driftRisk === 'high' ? 'Strong' : 'Moderate'} pollution dispersion
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Main Route Card */}
            <RouteCard route={result.safestRoute} isMain={true} />

            {/* Route Instructions & Road Names */}
            {(result.safestRoute.instructions?.length > 0 || result.safestRoute.roadNames?.length > 0) && (
              <div className="rounded-xl border border-[#d0e0f0] bg-[#f0f4f8] overflow-hidden">
                <div className="p-4 border-b border-dark-700">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-primary-400" />
                    <h4 className="font-medium text-gray-200">Route Details</h4>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Key Road Segments */}
                  {result.safestRoute.majorIntersections?.keySegments?.length > 0 && (
                    <div>
                      <p className="text-xs text-black/80 mb-2">Key Road Segments</p>
                      <div className="flex flex-wrap gap-2">
                        {result.safestRoute.majorIntersections.keySegments.map((segment, idx) => (
                          <div key={idx} className="px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
                            <p className="text-sm font-medium text-gray-200">{segment.roadName}</p>
                            <p className="text-xs text-black/80">{segment.distance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step-by-step Instructions */}
                  {result.safestRoute.instructions?.length > 0 && (
                    <div>
                      <p className="text-xs text-black/80 mb-3">Turn-by-Turn Directions</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {result.safestRoute.instructions.slice(0, 15).map((instruction, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-[#f0f4f8] hover:bg-[#e8f0f8] transition-colors">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                              {instruction.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200">{instruction.instruction}</p>
                              {instruction.roadName && (
                                <p className="text-xs text-black/80 mt-1">via {instruction.roadName}</p>
                              )}
                              {instruction.distance > 0 && (
                                <p className="text-xs text-black/70 mt-1">
                                  {(instruction.distance / 1000).toFixed(2)} km
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Major Intersections */}
                  {result.safestRoute.majorIntersections?.intersections?.length > 0 && (
                    <div>
                      <p className="text-xs text-black/80 mb-2">Major Intersections</p>
                      <div className="space-y-2">
                        {result.safestRoute.majorIntersections.intersections.slice(0, 5).map((intersection, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#f0f4f8]">
                            <Navigation className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200">{intersection.instruction}</p>
                              {intersection.roadName && (
                                <p className="text-xs text-black/80">on {intersection.roadName}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Go to Maps Button - Below Route Details */}
            {flags.showGoToMapsButton && (
              <motion.button
                onClick={() => navigate('/safe-route-map', { state: { routeData: result } })}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                  border: '2px solid #2563EB',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  color: '#000000',
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                  borderColor: '#1E40AF',
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Map className="w-5 h-5" style={{ color: '#2563EB' }} />
                <span style={{ color: '#000000', fontWeight: '700', fontSize: '15px' }}>Go to maps</span>
              </motion.button>
            )}

            {/* Why Recommended Section */}
            {result.whyRecommended && (
              <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 overflow-hidden">
                <button
                  onClick={() => setShowWhyRecommended(!showWhyRecommended)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-primary-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-400" />
                    <span className="font-medium text-gray-200">Why This Route is Recommended</span>
                  </div>
                  {showWhyRecommended ? (
                    <ChevronUp className="w-5 h-5 text-black/80" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-black/80" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showWhyRecommended && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {/* Summary */}
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {result.whyRecommended.summary}
                        </p>

                        {/* Reasons */}
                        <div className="space-y-2">
                          {result.whyRecommended.reasons?.map((reason, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5">{reason.charAt(0)}</span>
                              <p className="text-gray-300">{reason.slice(2)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Metrics */}
                        {result.whyRecommended.metrics?.length > 0 && (
                          <div className="pt-2 border-t border-[#d0e0f0]">
                            {result.whyRecommended.metrics.map((metric, index) => (
                              <p key={index} className="text-sm text-primary-400">
                                {metric}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Disclaimer */}
                        <p className="text-xs text-black/70 pt-2 border-t border-[#d0e0f0]">
                          {result.whyRecommended.disclaimer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Alternative Routes */}
            {result.alternativeRoutes?.length > 0 && (
              <div className="rounded-xl border border-dark-700 overflow-hidden">
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#e8f0f8] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-black/80" />
                    <span className="font-medium text-gray-300">
                      Alternative Routes ({result.alternativeRoutes.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Route color indicators */}
                    <div className="flex gap-1">
                      {result.alternativeRoutes.map((alt, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRouteClassColor(alt.classification).bg }}
                        />
                      ))}
                    </div>
                    {showAlternatives ? (
                      <ChevronUp className="w-5 h-5 text-black/80" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-black/80" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {showAlternatives && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-3">
                        {result.alternativeRoutes.map((route, index) => (
                          <RouteCard key={index} route={route} isMain={false} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Nearby Hotspots Warning */}
            {result.nearbyHotspots?.length > 0 && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="font-medium text-orange-400">
                    {result.nearbyHotspots.length} Pollution Hotspots Near Route
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {result.nearbyHotspots.slice(0, 6).map((hotspot, index) => (
                    <div 
                      key={index}
                      className="p-2 rounded-lg bg-[#f0f4f8] text-xs"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span>{hotspot.sourceIcon}</span>
                        <span className="text-gray-300 truncate">{hotspot.sourceLabel?.split(' ')[0]}</span>
                      </div>
                      <p className="text-black/70">
                        {(hotspot.distanceFromRoute / 1000).toFixed(1)} km away
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="p-4 rounded-xl bg-[#f0f4f8] border border-[#d0e0f0]">
                <h4 className="text-sm font-medium text-black/80 mb-3">Travel Tips</h4>
                <div className="space-y-2">
                  {result.recommendations.slice(0, 4).map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-red-400' : 
                        rec.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <p className="text-gray-300">{rec.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-8 text-black/70">
          <Navigation className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select origin and destination to find the cleanest route</p>
          <p className="text-sm mt-1">We'll analyze pollution hotspots and wind patterns along the way</p>
        </div>
      )}
    </motion.div>
  );
}
