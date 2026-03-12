import { motion } from 'framer-motion';
import { BarChart3, ArrowRight, TrendingUp, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

export default function AnalyticsCard() {
  const navigate = useNavigate();
  const flags = useFeatureFlags();
  
  // Always render for Round 2 - feature flag check removed
  // if (!flags.showReportsAnalytics) {
  //   return null;
  // }

  const handleNavigate = () => {
    navigate('/policy-dashboard/analytics');
  };

  return (
    <motion.div
      className="glass-card p-6 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleNavigate}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <BarChart3 className="w-6 h-6" style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold" style={{ color: '#0F172A' }}>
              Report Analytics
            </h3>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Comprehensive data analysis & insights
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5" style={{ color: '#64748B' }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Charts</p>
          <p className="text-lg font-bold" style={{ color: '#8B5CF6' }}>4</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Filters</p>
          <p className="text-lg font-bold" style={{ color: '#3B82F6' }}>8+</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Export</p>
          <p className="text-lg font-bold" style={{ color: '#22C55E' }}>CSV</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
        <TrendingUp className="w-4 h-4" />
        <span>Trend analysis & forecasting</span>
      </div>
    </motion.div>
  );
}

