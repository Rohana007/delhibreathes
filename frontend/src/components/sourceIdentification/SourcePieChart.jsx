import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Fallback if recharts is not available
const hasRecharts = typeof PieChart !== 'undefined';

const COLORS = {
  vehicular: '#2E7D32', // green
  industrial: '#EF6C00', // orange
  construction: '#1565C0', // blue
  biomass: '#C62828', // red
};

function SourcePieChart({ data }) {
  // Extract contribution data with safe defaults
  const contributions = [
    {
      name: 'Vehicular',
      value: parseFloat(data?.vehicular?.contributionPercent || 25),
      color: COLORS.vehicular,
    },
    {
      name: 'Industrial',
      value: parseFloat(data?.industrial?.contributionPercent || 25),
      color: COLORS.industrial,
    },
    {
      name: 'Construction',
      value: parseFloat(data?.construction?.contributionPercent || 25),
      color: COLORS.construction,
    },
    {
      name: 'Biomass',
      value: parseFloat(data?.biomass?.contributionPercent || 25),
      color: COLORS.biomass,
    },
  ];

  // If recharts is not available, render simple HTML fallback
  if (!hasRecharts) {
    return (
      <div className="pie-chart-fallback bg-white">
        <div className="space-y-2">
          {contributions.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-black">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-black">
                {item.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={contributions}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {contributions.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value.toFixed(1)}%`}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }}
            labelStyle={{ color: '#000' }}
          />
          <Legend wrapperStyle={{ color: '#222' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SourcePieChart;

