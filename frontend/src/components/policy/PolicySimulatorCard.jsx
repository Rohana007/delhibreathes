import { motion } from 'framer-motion';
import { Beaker, BarChart3, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PolicySimulatorCard() {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/policy-dashboard/simulator');
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
            <Beaker className="w-6 h-6" style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold" style={{ color: '#0F172A' }}>
              Policy Impact Simulator
            </h3>
            <p className="text-sm" style={{ color: '#64748B' }}>
              ML-powered policy impact analysis
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5" style={{ color: '#64748B' }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Policies</p>
          <p className="text-lg font-bold" style={{ color: '#EF4444' }}>7</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>ML Model</p>
          <p className="text-lg font-bold" style={{ color: '#22C55E' }}>LSTM</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Features</p>
          <p className="text-lg font-bold" style={{ color: '#2563EB' }}>6</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
        <BarChart3 className="w-4 h-4" />
        <span>Simulate policy impacts on AQI and pollutants</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNavigate();
        }}
        className="w-full mt-4 px-4 py-2 rounded-lg font-medium text-white transition-colors"
        style={{ backgroundColor: '#2563EB' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
      >
        Open Simulator
      </button>
    </motion.div>
  );
}

