import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Factory, Truck, CloudFog, Flame, Wind, Loader2, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const COLORS = {
  traffic: '#3B82F6',
  industrial: '#8B5CF6',
  dust: '#A16207',
  burning: '#DC2626',
  meteorological: '#10B981',
};

export default function AdminSourceContribution() {
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading source contribution data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
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
      <div className="text-center p-8">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gray-800 dark:text-gray-200">
          Source Contribution Breakdown
        </h2>
        <button
          onClick={loadSourceContribution}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{source.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Contribution Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Contribution Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" fill="#8884d8">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Table */}
      <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Detailed Source Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contribution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Formula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Scientific Justification</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sourceDetails.map((source) => (
                <tr key={source.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <source.icon className="w-5 h-5" style={{ color: source.color }} />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{source.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold" style={{ color: source.color }}>
                      {source.percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {source.dataSource}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {source.formula}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    {source.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Raw Data */}
      {data.rawData && (
        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Raw Data Values</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">NO₂ Value</p>
              <p className="font-semibold">{data.rawData.no2Value}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">SO₂ Value</p>
              <p className="font-semibold">{data.rawData.so2Value}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">AOD Value</p>
              <p className="font-semibold">{data.rawData.aodValue}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Fire Count</p>
              <p className="font-semibold">{data.rawData.fireCount}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Wind Speed</p>
              <p className="font-semibold">{data.rawData.windSpeed} m/s</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">PM2.5</p>
              <p className="font-semibold">{data.rawData.pm25} µg/m³</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">PM10</p>
              <p className="font-semibold">{data.rawData.pm10} µg/m³</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">O₃</p>
              <p className="font-semibold">{data.rawData.o3} µg/m³</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Humidity</p>
              <p className="font-semibold">{data.rawData.humidity}%</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Temperature</p>
              <p className="font-semibold">{data.rawData.temperature}°C</p>
            </div>
          </div>
          {data.lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Last Updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

