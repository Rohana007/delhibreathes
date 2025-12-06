import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Factory, Truck, CloudFog, Flame, Wind, Loader2, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const COLORS = {
  traffic: '#3B82F6',
  industrial: '#8B5CF6',
  dust: '#A16207',
  burning: '#DC2626',
  meteorological: '#10B981',
};

export default function SourceContribution() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSourceContribution();
  }, []);

  const loadSourceContribution = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/admin/source-contribution`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load source contribution data');
      console.error('Source contribution error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-xl font-semibold text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={loadSourceContribution}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Prepare chart data
  const pieData = [
    { name: 'Traffic', value: data.traffic, color: COLORS.traffic, icon: '🚗' },
    { name: 'Industrial', value: data.industrial, color: COLORS.industrial, icon: '🏭' },
    { name: 'Dust', value: data.dust, color: COLORS.dust, icon: '💨' },
    { name: 'Burning', value: data.burning, color: COLORS.burning, icon: '🔥' },
    { name: 'Weather', value: data.meteorological, color: COLORS.meteorological, icon: '🌬️' },
  ];

  const barData = [
    { source: 'Traffic', percentage: data.traffic, color: COLORS.traffic },
    { source: 'Industrial', percentage: data.industrial, color: COLORS.industrial },
    { source: 'Dust', percentage: data.dust, color: COLORS.dust },
    { source: 'Burning', percentage: data.burning, color: COLORS.burning },
    { source: 'Weather', percentage: data.meteorological, color: COLORS.meteorological },
  ];

  const sourceDetails = [
    {
      name: 'Traffic (Vehicular)',
      percentage: data.traffic,
      icon: Truck,
      color: COLORS.traffic,
      dataSource: data.dataSources?.traffic || 'NASA OMI NO₂',
      formula: data.formulas?.traffic || 'normalize(NO₂_value × 5)',
      justification: data.scientificJustification?.traffic || 'NO₂ is a primary indicator of vehicular emissions.',
    },
    {
      name: 'Industrial Emission',
      percentage: data.industrial,
      icon: Factory,
      color: COLORS.industrial,
      dataSource: data.dataSources?.industrial || 'NASA GIBS SO₂',
      formula: data.formulas?.industrial || 'normalize(SO₂_value × 4)',
      justification: data.scientificJustification?.industrial || 'SO₂ emissions are primarily from industrial sources.',
    },
    {
      name: 'Road/Construction Dust',
      percentage: data.dust,
      icon: CloudFog,
      color: COLORS.dust,
      dataSource: data.dataSources?.dust || 'MODIS AOD Deep Blue',
      formula: data.formulas?.dust || 'normalize(AOD_value × 4)',
      justification: data.scientificJustification?.dust || 'AOD > 0.7 indicates high particulate matter from dust.',
    },
    {
      name: 'Biomass/Garbage Burning',
      percentage: data.burning,
      icon: Flame,
      color: COLORS.burning,
      dataSource: data.dataSources?.burning || 'NASA FIRMS',
      formula: data.formulas?.burning || 'normalize(FIRE_count × 3)',
      justification: data.scientificJustification?.burning || 'FIRMS fire detections identify biomass burning events.',
    },
    {
      name: 'Meteorological Influence',
      percentage: data.meteorological,
      icon: Wind,
      color: COLORS.meteorological,
      dataSource: data.dataSources?.meteorological || 'OpenWeather API',
      formula: data.formulas?.meteorological || 'normalize(weather_impact)',
      justification: data.scientificJustification?.meteorological || 'Weather conditions create inversion layers that trap pollutants.',
    },
  ];

  return (
    <motion.div 
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#8B5CF6]" />
            <h3 className="section-title mb-0">Source Contribution Breakdown</h3>
          </div>
          <button
            onClick={loadSourceContribution}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {sourceDetails.map((source) => (
            <motion.div
              key={source.name}
              className="glass-card p-4 text-center"
              whileHover={{ scale: 1.05 }}
            >
              <source.icon className="w-8 h-8 mx-auto mb-2" style={{ color: source.color }} />
              <p className="text-2xl font-bold" style={{ color: source.color }}>
                {source.percentage}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{source.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold mb-4 text-gray-300">Contribution Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelStyle={{
                    fontSize: '16px',
                    fontWeight: '600',
                    fill: '#1F2937',
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#1F2937'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold mb-4 text-gray-300">Contribution Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="source" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="percentage" fill="#8884d8">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="glass-card p-6">
          <h4 
            className="text-lg font-semibold mb-6 flex items-center gap-2 transition-colors"
            style={{ color: theme === 'dark' ? '#F3F4F6' : '#1F2937' }}
          >
            <Info className="w-5 h-5" style={{ color: '#3B82F6' }} />
            Detailed Source Analysis
          </h4>
          <div 
            className="overflow-x-auto rounded-lg border transition-colors"
            style={{ borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }}
          >
            <table className="min-w-full divide-y transition-colors" style={{ borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }}>
              <thead 
                className="transition-colors"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#334155' : 'linear-gradient(to right, #EFF6FF, #EEF2FF)',
                  background: theme === 'dark' ? '#334155' : 'linear-gradient(to right, #EFF6FF, #EEF2FF)'
                }}
              >
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b transition-colors"
                    style={{ 
                      borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
                      color: theme === 'dark' ? '#F3F4F6' : '#374151'
                    }}
                  >
                    Source
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b transition-colors"
                    style={{ 
                      borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
                      color: theme === 'dark' ? '#F3F4F6' : '#374151'
                    }}
                  >
                    Contribution
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b transition-colors"
                    style={{ 
                      borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
                      color: theme === 'dark' ? '#F3F4F6' : '#374151'
                    }}
                  >
                    Data Source
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b transition-colors"
                    style={{ 
                      borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
                      color: theme === 'dark' ? '#F3F4F6' : '#374151'
                    }}
                  >
                    Formula
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b transition-colors"
                    style={{ 
                      borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
                      color: theme === 'dark' ? '#F3F4F6' : '#374151'
                    }}
                  >
                    Scientific Justification
                  </th>
                </tr>
              </thead>
              <tbody 
                className="divide-y transition-colors"
                style={{ borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }}
              >
                {sourceDetails.map((source, index) => {
                  const isDark = theme === 'dark';
                  const rowBg = isDark 
                    ? (index % 2 === 0 ? '#1E293B' : '#334155')
                    : (index % 2 === 0 ? '#FFFFFF' : '#FFFFFF');
                  const hoverBg = isDark ? '#475569' : '#EFF6FF';
                  const textColor = isDark ? '#F3F4F6' : '#1F2937';
                  const textSecondary = isDark ? '#D1D5DB' : '#4B5563';
                  
                  return (
                    <tr 
                      key={source.name} 
                      className="transition-colors duration-150"
                      style={{ backgroundColor: rowBg }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBg}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: isDark ? `${source.color}25` : `${source.color}15` }}
                          >
                            <source.icon className="w-5 h-5" style={{ color: source.color }} />
                          </div>
                          <span 
                            className="text-sm font-semibold transition-colors"
                            style={{ color: textColor }}
                          >
                            {source.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-2xl font-bold transition-colors"
                            style={{ color: source.color }}
                          >
                            {source.percentage}%
                          </span>
                          <div 
                            className="w-16 h-2 rounded-full transition-colors"
                            style={{ backgroundColor: isDark ? `${source.color}30` : `${source.color}20` }}
                          >
                            <div 
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${source.percentage}%`,
                                backgroundColor: source.color 
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="text-sm font-medium transition-colors"
                          style={{ color: textSecondary }}
                        >
                          {source.dataSource}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code 
                          className="text-xs font-mono px-3 py-1.5 rounded-md transition-colors"
                          style={{ 
                            backgroundColor: isDark ? '#334155' : '#F1F5F9',
                            color: isDark ? '#D1D5DB' : '#475569',
                            border: `1px solid ${isDark ? '#475569' : '#E2E8F0'}`
                          }}
                        >
                          {source.formula}
                        </code>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p 
                          className="text-sm leading-relaxed transition-colors"
                          style={{ color: textSecondary }}
                        >
                          {source.justification}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Data */}
        {data.rawData && (
          <div className="glass-card p-4 mt-6">
            <h4 className="text-sm font-semibold mb-4 text-gray-300">Raw Data Values</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div>
                <p className="text-gray-400">NO₂ Value</p>
                <p className="font-semibold text-gray-200">{data.rawData.no2Value}</p>
              </div>
              <div>
                <p className="text-gray-400">SO₂ Value</p>
                <p className="font-semibold text-gray-200">{data.rawData.so2Value}</p>
              </div>
              <div>
                <p className="text-gray-400">AOD Value</p>
                <p className="font-semibold text-gray-200">{data.rawData.aodValue}</p>
              </div>
              <div>
                <p className="text-gray-400">Fire Count</p>
                <p className="font-semibold text-gray-200">{data.rawData.fireCount}</p>
              </div>
              <div>
                <p className="text-gray-400">Wind Speed</p>
                <p className="font-semibold text-gray-200">{data.rawData.windSpeed} m/s</p>
              </div>
              <div>
                <p className="text-gray-400">PM2.5</p>
                <p className="font-semibold text-gray-200">{data.rawData.pm25} µg/m³</p>
              </div>
              <div>
                <p className="text-gray-400">PM10</p>
                <p className="font-semibold text-gray-200">{data.rawData.pm10} µg/m³</p>
              </div>
              <div>
                <p className="text-gray-400">O₃</p>
                <p className="font-semibold text-gray-200">{data.rawData.o3} µg/m³</p>
              </div>
              <div>
                <p className="text-gray-400">Humidity</p>
                <p className="font-semibold text-gray-200">{data.rawData.humidity}%</p>
              </div>
              <div>
                <p className="text-gray-400">Temperature</p>
                <p className="font-semibold text-gray-200">{data.rawData.temperature}°C</p>
              </div>
            </div>
            {data.lastUpdated && (
              <p className="text-xs text-gray-500 mt-4">
                Last Updated: {new Date(data.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

