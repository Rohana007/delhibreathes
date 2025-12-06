import { motion } from 'framer-motion';
import { MapPin, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { getAqiColor, getAqiLabel } from '../../utils/helpers';

export default function ZoneAnalysis() {
  const { ncrAqi, policyInsights } = useApp();
  const { theme } = useTheme();

  if (!ncrAqi?.regions) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-64 bg-gradient-to-br from-[#E9FAF7] to-[#D7F3FF] rounded-[16px] border border-[rgba(0,150,160,0.15)]"></div>
      </div>
    );
  }

  const zones = policyInsights?.zoneAnalysis?.ranking || 
    Object.entries(ncrAqi.regions)
      .filter(([_, data]) => !data.error)
      .map(([key, data]) => ({
        zone: data.location?.name || key,
        aqi: data.aqi,
        level: data.level,
        priority: data.aqi > 200 ? 'high' : data.aqi > 150 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.aqi - a.aqi);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-400" />
          <h3 className="section-title mb-0">Zone Severity Analysis</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Critical
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            High
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Normal
          </span>
        </div>
      </div>

      {/* Zone Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr 
              className="border-b transition-colors"
              style={{ 
                borderColor: theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.08)',
                backgroundColor: theme === 'dark' ? '#334155' : 'transparent'
              }}
            >
              <th 
                className="text-left py-3 px-4 text-xs font-semibold uppercase transition-colors"
                style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
              >
                Rank
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-semibold uppercase transition-colors"
                style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
              >
                Zone
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-semibold uppercase transition-colors"
                style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
              >
                AQI
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-semibold uppercase transition-colors"
                style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
              >
                Status
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-semibold uppercase transition-colors"
                style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
              >
                Priority
              </th>
            </tr>
          </thead>
          <tbody 
            className="divide-y transition-colors"
            style={{ borderColor: theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.08)' }}
          >
            {zones.map((zone, index) => {
              const isDark = theme === 'dark';
              const rowBg = isDark 
                ? (index % 2 === 0 ? '#1E293B' : '#334155')
                : 'transparent';
              const hoverBg = isDark ? '#475569' : 'rgba(0,0,0,0.02)';
              const textColor = isDark ? '#F3F4F6' : '#1A1A1A';
              const rankBg = index === 0 
                ? (isDark ? '#7F1D1D' : '#FFE5E9')
                : index === 1 || index === 2
                  ? (isDark ? '#78350F' : '#FFF2E1')
                  : (isDark ? '#334155' : 'rgba(0,0,0,0.05)');
              const rankText = index === 0
                ? (isDark ? '#FCA5A5' : '#C62828')
                : index === 1 || index === 2
                  ? (isDark ? '#FCD34D' : '#F9A825')
                  : (isDark ? '#D1D5DB' : '#2A2A2A');
              
              return (
                <motion.tr
                  key={zone.zone}
                  className="transition-colors"
                  style={{ 
                    backgroundColor: rowBg,
                    borderColor: theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.08)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBg}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="py-3 px-4">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                      style={{ 
                        backgroundColor: rankBg,
                        color: rankText
                      }}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className="font-semibold transition-colors"
                      style={{ color: textColor }}
                    >
                      {zone.zone}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xl font-display font-bold transition-colors"
                        style={{ 
                          color: '#D72638'
                        }}
                      >
                        {zone.aqi}
                      </span>
                      {/* Trend indicator */}
                      {Math.random() > 0.5 ? (
                        <ArrowUp className="w-4 h-4" style={{ color: '#C62828' }} />
                      ) : Math.random() > 0.5 ? (
                        <ArrowDown className="w-4 h-4" style={{ color: '#2E7D32' }} />
                      ) : (
                        <Minus className="w-4 h-4" style={{ color: isDark ? '#9CA3AF' : '#4A4A4A' }} />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className="text-sm px-2 py-1 rounded-full font-semibold transition-colors"
                      style={{
                        backgroundColor: `${getAqiColor(zone.aqi)}15`,
                        color: getAqiColor(zone.aqi),
                        border: `1px solid ${getAqiColor(zone.aqi)}40`,
                      }}
                    >
                      {getAqiLabel(zone.aqi).split(' ')[0]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className="text-xs px-2 py-1 rounded-full border font-semibold transition-colors"
                      style={{
                        backgroundColor: zone.priority === 'high'
                          ? (isDark ? '#7F1D1D' : '#FFD4C9')
                          : zone.priority === 'medium'
                            ? (isDark ? '#78350F' : '#FFE8B8')
                            : (isDark ? '#064E3B' : '#C8F5E8'),
                        color: zone.priority === 'high'
                          ? (isDark ? '#FCA5A5' : '#8E1A00')
                          : zone.priority === 'medium'
                            ? (isDark ? '#FCD34D' : '#8B5A00')
                            : (isDark ? '#6EE7B7' : '#0A5D2E'),
                        borderColor: zone.priority === 'high'
                          ? (isDark ? '#FCA5A5' : '#8E1A00') + '30'
                          : zone.priority === 'medium'
                            ? (isDark ? '#FCD34D' : '#8B5A00') + '30'
                            : (isDark ? '#6EE7B7' : '#0A5D2E') + '30'
                      }}
                    >
                      {zone.priority.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div 
        className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center transition-colors"
        style={{ 
          borderColor: theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.08)'
        }}
      >
        <div>
          <p className="text-2xl font-display font-bold" style={{ color: '#C62828' }}>
            {zones.filter(z => z.aqi > 200).length}
          </p>
          <p 
            className="text-xs font-medium transition-colors"
            style={{ color: theme === 'dark' ? '#D1D5DB' : '#4A4A4A' }}
          >
            Critical Zones
          </p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold" style={{ color: '#D72638' }}>
            {zones.filter(z => z.aqi > 100 && z.aqi <= 200).length}
          </p>
          <p 
            className="text-xs font-medium transition-colors"
            style={{ color: theme === 'dark' ? '#D1D5DB' : '#4A4A4A' }}
          >
            Moderate Zones
          </p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold" style={{ color: '#D72638' }}>
            {zones.filter(z => z.aqi <= 100).length}
          </p>
          <p 
            className="text-xs font-medium transition-colors"
            style={{ color: theme === 'dark' ? '#D1D5DB' : '#4A4A4A' }}
          >
            Safe Zones
          </p>
        </div>
      </div>
    </motion.div>
  );
}

