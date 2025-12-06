import { motion } from 'framer-motion';
import { TrendingDown, Award } from 'lucide-react';

/**
 * Percentage Improvement Summary Card
 * Large card showing AQI improvement and key metrics
 */
export default function ImprovementCard({ result }) {
  if (!result) return null;

  const improvement = result.percentageImprovement || 0;
  const pm25Reduction = result.pollutantsBefore.PM2_5 - result.pollutantsAfter.PM2_5;
  const no2Reduction = ((result.pollutantsBefore.NO2 - result.pollutantsAfter.NO2) / result.pollutantsBefore.NO2) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        color: '#000000',
        border: '2px solid #2563EB',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
          <Award className="w-6 h-6" style={{ color: '#2563EB' }} />
        </div>
        <h2 className="text-2xl font-display font-bold" style={{ color: '#000000', fontWeight: '900' }}>
          ✨ Policy Result
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AQI Improvement */}
        <div 
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5" style={{ color: '#16A34A' }} />
            <span className="text-sm font-semibold" style={{ color: '#000000', fontWeight: '700' }}>
              AQI Improvement
            </span>
          </div>
          <p className="text-4xl font-display font-bold" style={{ color: '#16A34A', fontWeight: '900' }}>
            {improvement.toFixed(1)}%
          </p>
        </div>

        {/* PM2.5 Reduction */}
        <div 
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5" style={{ color: '#2563EB' }} />
            <span className="text-sm font-semibold" style={{ color: '#000000', fontWeight: '700' }}>
              PM2.5 Reduced By
            </span>
          </div>
          <p className="text-4xl font-display font-bold" style={{ color: '#2563EB', fontWeight: '900' }}>
            {pm25Reduction.toFixed(1)} <span className="text-xl" style={{ fontWeight: '800', color: '#1E40AF' }}>μg/m³</span>
          </p>
        </div>

        {/* NO2 Reduction */}
        <div 
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5" style={{ color: '#7C3AED' }} />
            <span className="text-sm font-semibold" style={{ color: '#000000', fontWeight: '700' }}>
              NO₂ Reduced By
            </span>
          </div>
          <p className="text-4xl font-display font-bold" style={{ color: '#7C3AED', fontWeight: '900' }}>
            {no2Reduction.toFixed(1)} <span className="text-xl" style={{ fontWeight: '800', color: '#6D28D9' }}>%</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

