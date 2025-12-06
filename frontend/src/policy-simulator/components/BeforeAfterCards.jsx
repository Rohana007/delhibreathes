import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Eye, Heart } from 'lucide-react';

/**
 * Before/After Comparison Cards
 * Side-by-side comparison showing Before Policy and After Policy metrics
 */
export default function BeforeAfterCards({ result }) {
  if (!result || !result.healthImpactBefore || !result.healthImpactAfter) {
    return null;
  }

  const before = result.healthImpactBefore;
  const after = result.healthImpactAfter;
  const baselineAvg = result.baselineAQI?.reduce((a, b) => a + b, 0) / result.baselineAQI?.length || 0;
  const adjustedAvg = result.adjustedAQI?.reduce((a, b) => a + b, 0) / result.adjustedAQI?.length || 0;

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#16A34A';
    if (aqi <= 100) return '#84CC16';
    if (aqi <= 200) return '#F59E0B';
    if (aqi <= 300) return '#F97316';
    if (aqi <= 400) return '#DC2626';
    return '#991B1B';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Before Policy Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-6 rounded-xl"
        style={{ 
          borderLeft: `4px solid ${getAQIColor(baselineAvg)}`,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h3 className="text-xl font-display font-bold mb-5" style={{ color: '#0F172A' }}>
          Before Policy
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1F2937', fontWeight: '700' }}>AQI</p>
            <p className="text-4xl font-display font-bold" style={{ color: getAQIColor(baselineAvg), fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {Math.round(baselineAvg)}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1F2937', fontWeight: '700' }}>Category</p>
            <p className="text-xl font-bold" style={{ color: '#000000', fontWeight: '800' }}>
              {before.category}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5" style={{ color: '#DC2626' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#374151', fontWeight: '700' }}>Health Risk</p>
              <p className="text-base font-bold" style={{ color: '#000000', fontWeight: '800' }}>
                {before.risk}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" style={{ color: '#475569' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#374151', fontWeight: '700' }}>Visibility</p>
              <p className="text-base font-bold" style={{ color: '#000000', fontWeight: '800' }}>
                {before.visibility}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* After Policy Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-6 rounded-xl"
        style={{ 
          borderLeft: `4px solid ${getAQIColor(adjustedAvg)}`,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h3 className="text-xl font-display font-bold mb-5" style={{ color: '#0F172A' }}>
          After Policy
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1F2937', fontWeight: '700' }}>AQI</p>
            <p className="text-4xl font-display font-bold" style={{ color: getAQIColor(adjustedAvg), fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {Math.round(adjustedAvg)}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1F2937', fontWeight: '700' }}>Category</p>
            <p className="text-xl font-bold" style={{ color: '#000000', fontWeight: '800' }}>
              {after.category}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5" style={{ color: '#16A34A' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#374151', fontWeight: '700' }}>Health Risk</p>
              <p className="text-base font-bold" style={{ color: '#000000', fontWeight: '800' }}>
                {after.risk}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" style={{ color: '#475569' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#374151', fontWeight: '700' }}>Visibility</p>
              <p className="text-base font-bold" style={{ color: '#000000', fontWeight: '800' }}>
                {after.visibility}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

