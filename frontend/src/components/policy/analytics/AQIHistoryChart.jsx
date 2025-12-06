import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getAqiColor, AQI_COLORS } from '../../../utils/helpers';

export default function AQIHistoryChart({ data, loading }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    const processed = data
      .filter(item => item && item.date && (item.aqi !== undefined && item.aqi !== null) && Number(item.aqi) > 0)
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        aqi: Number(item.aqi),
        category: item.category || 'Moderate',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
    return processed;
  }, [data]);

  // Fallback data if no data available
  const displayData = chartData.length > 0 ? chartData : [
    { date: 'No Data', aqi: 0 },
  ];

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">AQI Historic Trends</h3>
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
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="aqi" 
              stroke={(chartData.length > 0 && chartData[0]?.aqi > 0) ? getAqiColor(chartData[0].aqi) : AQI_COLORS.moderate}
              strokeWidth={3}
              dot={(props) => {
                const aqi = props.payload?.aqi || 0;
                if (aqi <= 0) return null;
                return <circle cx={props.cx} cy={props.cy} r={4} fill={getAqiColor(aqi)} />;
              }}
              activeDot={{ r: 6 }}
              name="AQI"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

