import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AlertBanner() {
  const { insights, ncrAqi } = useApp();
  const [dismissed, setDismissed] = useState(false);

  const warnings = insights?.warnings?.filter(w => w.type === 'emergency' || w.type === 'alert') || [];
  const avgAqi = ncrAqi?.summary?.averageAqi;

  if (dismissed || warnings.length === 0 || !avgAqi || avgAqi <= 150) {
    return null;
  }

  const primaryWarning = warnings[0];
  const isEmergency = primaryWarning.type === 'emergency';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`mb-6 alert-card border ${
          isEmergency 
            ? 'border-red-500/30' 
            : 'border-yellow-500/30'
        }`}
      >
        <div className="p-4 flex items-start gap-4">
          <div className={`p-2 rounded-lg ${
            isEmergency ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              isEmergency ? 'text-[#FF4D4D]' : 'text-[#F7A500]'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${
              isEmergency ? 'text-[#FF4D4D]' : 'text-[#F7A500]'
            }`}>
              {primaryWarning.title}
            </h3>
            <p className={`text-sm mt-1 ${
              isEmergency ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]'
            }`}>
              {primaryWarning.message}
            </p>

            {warnings.length > 1 && (
              <button className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                isEmergency ? 'text-[#FF4D4D]' : 'text-[#F7A500]'
              } hover:underline`}>
                +{warnings.length - 1} more alerts
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className={`p-1 rounded-lg hover:bg-[rgba(0,0,0,0.05)] transition-colors ${
              isEmergency ? 'text-[#FF4D4D]' : 'text-[#F7A500]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

