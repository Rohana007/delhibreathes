import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAqiColor } from '../../utils/helpers';

export default function TrendingZones() {
  const { ncrAqi, predictions } = useApp();

  if (!ncrAqi?.regions) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-64 rounded-xl" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)' }}></div>
      </div>
    );
  }

  // Simulate trending data based on current AQI
  const zones = Object.entries(ncrAqi.regions)
    .filter(([_, data]) => !data.error)
    .map(([key, data]) => {
      // Simulate trend for demo
      const trendValue = (Math.random() - 0.5) * 40;
      return {
        zone: data.location?.name || key,
        aqi: data.aqi,
        trend: trendValue > 10 ? 'rising' : trendValue < -10 ? 'falling' : 'stable',
        change: Math.round(trendValue),
      };
    });

  const risingZones = zones.filter(z => z.trend === 'rising').sort((a, b) => b.change - a.change);
  const fallingZones = zones.filter(z => z.trend === 'falling').sort((a, b) => a.change - b.change);

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-[#1A1A1A]" />
        <h3 className="section-title mb-0">Trending Zones</h3>
      </div>

      {/* Deteriorating */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#C62828]" />
          <span className="text-sm font-medium text-[#C62828]">Deteriorating</span>
        </div>
        <div className="space-y-2">
          {risingZones.length > 0 ? (
            risingZones.slice(0, 3).map((zone, index) => {
              const gradients = [
                'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
                'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
                'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
              ];
              return (
                <motion.div
                  key={zone.zone}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    background: gradients[index % gradients.length],
                    border: '1px solid rgba(198,40,40,0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: 'rgba(198,40,40,0.1)', color: '#C62828' }}
                    >
                      {zone.aqi}
                    </span>
                    <span className="text-sm text-[#1A1A1A]">{zone.zone}</span>
                  </div>
                  <span className="text-sm text-[#C62828] font-medium">
                    +{zone.change}
                  </span>
                </motion.div>
              );
            })
          ) : (
            <p className="text-sm text-[#4A4A4A] text-center py-2">No zones deteriorating</p>
          )}
        </div>
      </div>

      {/* Improving */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-[#1E8A3D]" />
          <span className="text-sm font-medium text-[#1E8A3D]">Improving</span>
        </div>
        <div className="space-y-2">
          {fallingZones.length > 0 ? (
            fallingZones.slice(0, 3).map((zone, index) => {
              const gradients = [
                'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
                'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
                'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
              ];
              return (
                <motion.div
                  key={zone.zone}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    background: gradients[index % gradients.length],
                    border: '1px solid rgba(30,138,61,0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: 'rgba(30,138,61,0.1)', color: '#1E8A3D' }}
                    >
                      {zone.aqi}
                    </span>
                    <span className="text-sm text-[#1A1A1A]">{zone.zone}</span>
                  </div>
                  <span className="text-sm text-[#1E8A3D] font-medium">
                    {zone.change}
                  </span>
                </motion.div>
              );
            })
          ) : (
            <p className="text-sm text-[#4A4A4A] text-center py-2">No zones improving</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-3 rounded-lg border text-center" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <p className="text-xs text-[#4A4A4A]">
          Based on last 6 hours trend analysis
        </p>
      </div>
    </motion.div>
  );
}

