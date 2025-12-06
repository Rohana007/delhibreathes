import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EarlyWarning() {
  const { policyInsights, predictions } = useApp();

  const alerts = policyInsights?.earlyWarning || predictions?.factors || [];

  const getAlertStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: AlertTriangle,
          iconColor: 'text-[#C62828]',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: AlertTriangle,
          iconColor: 'text-[#A67A00]',
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          icon: Info,
          iconColor: 'text-[#1A1A1A]',
        };
      default:
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: CheckCircle,
          iconColor: 'text-green-400',
        };
    }
  };

  // Transform factors to alerts format if needed
  const displayAlerts = alerts.length > 0 && alerts[0].level 
    ? alerts 
    : (predictions?.factors || []).slice(0, 4).map(f => ({
        level: f.impact === 'very high' ? 'critical' : f.impact === 'high' ? 'warning' : 'info',
        message: f.factor,
        action: f.description,
      }));

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h3 className="section-title mb-0">Early Warning System</h3>
        </div>
        <span className="text-xs text-[#1E3A40] font-medium">Auto-updated</span>
      </div>

      {displayAlerts.length > 0 ? (
        <div className="space-y-3">
          {displayAlerts.map((alert, index) => {
            const style = getAlertStyle(alert.level);
            const Icon = style.icon;

            return (
              <motion.div
                key={index}
                className="p-4 rounded-[18px] border border-[rgba(0,0,0,0.08)]"
                style={{ 
                  background: [
                    'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
                    'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
                    'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
                  ][index % 3],
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${style.iconColor} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A1A1A]">
                      {alert.message}
                    </p>
                    {alert.action && (
                      <p className="text-sm text-[#4A4A4A] mt-1 flex items-center gap-1 font-medium">
                        <ArrowRight className="w-3 h-3" />
                        {alert.action}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-[#2A2A2A]">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[#4A90E2] opacity-50" />
          <p className="font-medium">No active warnings</p>
          <p className="text-sm mt-1">System is monitoring conditions</p>
        </div>
      )}

      {/* Prediction Summary */}
      {predictions?.aggregate && (
        <div className="mt-4 p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)] bg-white grid grid-cols-3 gap-2 text-center" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <div>
            <p className="text-xs text-[#4A4A4A] font-medium">Now</p>
            <p className="text-lg font-bold text-[#D72638]">{predictions.aggregate.avgCurrent || '--'}</p>
          </div>
          <div>
            <p className="text-xs text-[#4A4A4A] font-medium">6h</p>
            <p className="text-lg font-bold text-[#D72638]">{predictions.aggregate.avg6Hour || '--'}</p>
          </div>
          <div>
            <p className="text-xs text-[#4A4A4A] font-medium">24h</p>
            <p className="text-lg font-bold text-[#D72638]">{predictions.aggregate.avg24Hour || '--'}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

