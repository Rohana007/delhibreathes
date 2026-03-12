import { motion } from 'framer-motion';
import { Users, DollarSign, Heart, TrendingUp, TrendingDown, Building2, FileText, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { getAqiColor, getAqiLabel } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function PolicyOverview() {
  const { ncrAqi, policyInsights } = useApp();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const avgAqi = ncrAqi?.summary?.averageAqi || 0;
  const overview = policyInsights?.overview;

  const stats = [
    {
      label: 'NCR Average AQI',
      value: avgAqi,
      color: getAqiColor(avgAqi),
      icon: Building2,
      subtext: getAqiLabel(avgAqi),
    },
    {
      label: 'Affected Population',
      value: overview?.affectedPopulation || '46M',
      icon: Users,
      color: '#008C99', // Dark teal for visibility
      textColor: '#0A1F24', // Dark teal for text
      subtext: 'Across NCR region',
    },
    {
      label: 'Health Burden',
      value: overview?.healthBurden?.split(' - ')[0] || 'Critical',
      icon: Heart,
      color: '#B00020', // Dark red for visibility
      textColor: '#0A1F24', // Dark teal for text
      subtext: 'Expected hospital load',
    },
    {
      label: 'Economic Impact',
      value: overview?.economicImpact?.match(/₹[\d,]+/)?.[0] || '₹5000',
      icon: DollarSign,
      color: '#F7A500', // Dark orange for visibility
      textColor: '#0A1F24', // Dark teal for text
      subtext: 'Productivity loss/day',
    },
  ];

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 
            className="text-2xl font-display font-bold transition-colors"
            style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
          >
            Policy Dashboard
          </h2>
          <p 
            className="text-sm mt-1 font-medium transition-colors"
            style={{ color: theme === 'dark' ? '#D1D5DB' : '#4A4A4A' }}
          >
            Real-time decision support for Delhi NCR air quality management
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {overview?.trend === 'Deteriorating' ? (
            <TrendingUp className="w-5 h-5 text-red-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-green-400" />
          )}
          <span className={overview?.trend === 'Deteriorating' ? 'text-red-400' : 'text-green-400'}>
            {overview?.trend || 'Stable'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="p-4 rounded-[18px] border border-[rgba(0,0,0,0.08)]"
              style={{ 
                background: [
                  'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
                  'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
                  'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
                ][index % 3],
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span 
                  className="text-xs font-medium transition-colors"
                  style={{ color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A' }}
                >
                  {stat.label}
                </span>
              </div>
              <p 
                className="text-2xl font-display font-bold transition-colors"
                style={{ 
                  color: typeof stat.value === 'number' 
                    ? '#D72638'
                    : (stat.textColor || (theme === 'dark' ? '#F3F4F6' : '#1A1A1A'))
                }}
              >
                {stat.value}
              </p>
              <p 
                className="text-xs mt-1 font-medium transition-colors"
                style={{ color: theme === 'dark' ? '#D1D5DB' : '#4A4A4A' }}
              >
                {stat.subtext}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Reports Button */}
      {false && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => navigate('/policy-dashboard/reports')}
            className="w-full flex items-center justify-between p-5 rounded-xl border transition-all hover:shadow-xl hover:scale-[1.02]"
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
              borderColor: theme === 'dark' ? '#475569' : 'rgba(0, 0, 0, 0.2)',
              color: theme === 'dark' ? '#F3F4F6' : '#1A1A1A',
              boxShadow: theme === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg transition-colors"
                style={{ backgroundColor: theme === 'dark' ? '#475569' : 'rgba(0, 0, 0, 0.05)' }}
              >
                <FileText 
                  className="w-6 h-6 transition-colors"
                  style={{ color: theme === 'dark' ? '#E5E7EB' : 'rgba(0, 0, 0, 0.7)' }}
                />
              </div>
              <div className="text-left">
                <p 
                  className="font-bold text-lg transition-colors"
                  style={{ color: theme === 'dark' ? '#F3F4F6' : 'rgba(0, 0, 0, 0.8)' }}
                >
                  View Pollution Reports
                </p>
                <p 
                  className="text-sm mt-1 transition-colors"
                  style={{ color: theme === 'dark' ? '#D1D5DB' : 'rgba(0, 0, 0, 0.6)' }}
                >
                  Manage and review citizen-submitted pollution reports
                </p>
              </div>
            </div>
            <ArrowRight 
              className="w-6 h-6 transition-colors"
              style={{ color: theme === 'dark' ? '#E5E7EB' : 'rgba(0, 0, 0, 0.7)' }}
            />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

