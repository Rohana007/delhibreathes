import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Hotspot Info Modal - Detailed validation popup for hotspots
 * Shows real-time source, fallback reasoning, wind impact, satellite data, etc.
 */
export default function HotspotInfoModal({ hotspot, fallbackSource, windDirection, modis, fires, confidence, impactCone, onClose }) {
  if (!hotspot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="hotspot-modal max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              Hotspot Detailed Information
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: '#64748B' }} />
            </button>
          </div>

          {/* Real-Time Source */}
          <section className="modal-info-section">
            <h3 className="section-title">Real-Time Source</h3>
            <p className="section-value" style={{ color: '#0F172A' }}>
              {hotspot.realSource || hotspot.sourceLabel || hotspot.sourceType || "Unavailable"}
            </p>
          </section>

          {/* Wind Direction */}
          {windDirection !== null && windDirection !== undefined && (
            <section className="modal-info-section">
              <h3 className="section-title">Wind Direction</h3>
              <div className="space-y-2">
                <p className="section-value" style={{ color: '#0F172A' }}>
                  Wind blowing toward: {Math.round(windDirection)}°
                </p>
                {impactCone && (
                  <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                    Impact zone: {Math.round(impactCone.angle1)}° → {Math.round(impactCone.angle2)}°
                  </p>
                )}
                {hotspot.drift && (
                  <>
                    <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                      Wind speed: {hotspot.drift.windSpeed?.toFixed(1) || 'N/A'} km/h
                    </p>
                    <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                      Compass direction: {hotspot.drift.compassDirection || 'N/A'}
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Satellite Indicators */}
          <section className="modal-info-section">
            <h3 className="section-title">Satellite Indicators</h3>
            <div className="space-y-2">
              <p className="section-value" style={{ color: '#0F172A' }}>
                AOD: {modis?.aod !== null && modis?.aod !== undefined ? modis.aod.toFixed(2) : "Unavailable"}
              </p>
              <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                {modis?.aod > 0.7 ? "High aerosol loading" : modis?.aod !== null ? "Normal/moderate aerosol" : "No data"}
              </p>
              {modis?.aod_class && (
                <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                  AOD Level: <span className="font-medium capitalize">{modis.aod_class}</span>
                </p>
              )}
              <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                Nearby fire hotspots (15 km): {fires?.count !== null && fires?.count !== undefined ? fires.count : "Unavailable"}
              </p>
              {fires?.count > 0 && fires?.fire_points && fires.fire_points.length > 0 && (
                <p className="text-xs mt-1" style={{ color: '#9CA3AF', lineHeight: '1.6' }}>
                  {fires.fire_points.length} fire point(s) detected in vicinity
                </p>
              )}
            </div>
          </section>

          {/* Surface Activity */}
          <section className="modal-info-section">
            <h3 className="section-title">Surface Activity</h3>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                Fallback Source: {fallbackSource || "Unable to determine"}
              </p>
              <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                Traffic: {hotspot.traffic || hotspot.category === 'traffic' ? (hotspot.traffic === 'high' ? 'High' : 'Moderate') : "Unknown"}
              </p>
              <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                Industrial Area Upwind: {hotspot.industry?.upwind || hotspot.category === 'industrial' ? "YES" : "NO"}
              </p>
              {hotspot.category && (
                <p className="text-xs mt-1" style={{ color: '#9CA3AF', lineHeight: '1.6' }}>
                  Category: {hotspot.category}
                </p>
              )}
            </div>
          </section>

          {/* Confidence Score */}
          {confidence !== null && confidence !== undefined && (
            <section className="modal-info-section">
              <h3 className="section-title">Confidence Score</h3>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${confidence}%`,
                      backgroundColor: confidence >= 70 ? '#10B981' : confidence >= 40 ? '#F59E0B' : '#EF4444'
                    }}
                  />
                </div>
                <span className="text-base font-bold" style={{ color: '#0F172A' }}>
                  {confidence}%
                </span>
              </div>
              <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                {confidence >= 70 ? 'High confidence' : confidence >= 40 ? 'Moderate confidence' : 'Low confidence'}
              </p>
            </section>
          )}

          {/* Additional Hotspot Info */}
          {(hotspot.confidence || hotspot.brightness || hotspot.frp) && (
            <section className="modal-info-section">
              <h3 className="section-title">Detection Details</h3>
              <div className="space-y-2">
                {hotspot.confidence && (
                  <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                    Detection Confidence: {hotspot.confidence}%
                  </p>
                )}
                {hotspot.brightness && (
                  <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                    Brightness: {Math.round(hotspot.brightness)} K
                  </p>
                )}
                {hotspot.frp && (
                  <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                    Fire Radiative Power: {hotspot.frp.toFixed(1)} MW
                  </p>
                )}
                {hotspot.acquisitionDate && (
                  <p className="text-sm" style={{ color: '#64748B', lineHeight: '1.6' }}>
                    Detected: {new Date(hotspot.acquisitionDate).toLocaleString()}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

