import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Factory } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function SourceContributionSection({ data, loading }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.source || 'Unknown',
      value: item.percentage || 0,
      count: item.count || 0,
    }));
  }, [data]);

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Factory className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-bold text-gray-900">Source Contribution</h3>
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px',
              }}
              formatter={(value, name, props) => [
                `${value}% (${props.payload.count} reports)`,
                'Contribution'
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

