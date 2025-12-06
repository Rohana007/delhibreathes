import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wind } from 'lucide-react';

export default function PollutantTrendChart({ data, loading }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      pollutant: item.pollutant || 'Unknown',
      value: item.value || 0,
      limit: item.limit || 0,
      percentage: item.percentage || 0,
    }));
  }, [data]);

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Wind className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Pollutant Trends</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No data available</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="pollutant" 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Concentration (µg/m³)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px',
              }}
              formatter={(value, name) => {
                if (name === 'value') return [`${value} µg/m³`, 'Current Value'];
                if (name === 'limit') return [`${value} µg/m³`, 'CPCB Limit'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" name="Current Value" />
            <Bar dataKey="limit" fill="#EF4444" name="CPCB Limit" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

