import { motion } from 'framer-motion';
import { FileText, ArrowRight, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

export default function ReportsCard() {
  const navigate = useNavigate();
  const flags = useFeatureFlags();
  
  // Always render for Round 2 - feature flag check removed
  // if (!flags.showCitizenReports) {
  //   return null;
  // }

  const handleNavigate = () => {
    navigate('/policy-dashboard/reports');
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
            <FileText className="w-6 h-6" style={{ color: '#DC2626' }} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold" style={{ color: '#0F172A' }}>
              Citizen Reports
            </h3>
            <p className="text-sm" style={{ color: '#64748B' }}>
              View and manage pollution reports
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5" style={{ color: '#64748B' }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Total</p>
          <p className="text-lg font-bold" style={{ color: '#EF4444' }}>—</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Pending</p>
          <p className="text-lg font-bold" style={{ color: '#FBBF24' }}>—</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Reviewed</p>
          <p className="text-lg font-bold" style={{ color: '#22C55E' }}>—</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
        <Clock className="w-4 h-4" />
        <span>Real-time updates</span>
      </div>
    </motion.div>
  );
}

