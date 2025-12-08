import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fallback if recharts is not available
const hasRecharts = typeof LineChart !== 'undefined';

function SourceTrendChart({ data }) {
  // Generate mock 24-hour trend data (6 timepoints)
  // In production, this would come from historical API data
  const generateTrendData = () => {
    const now = new Date();
    const timepoints = [];
    
    // Get current values
    const current = {
      vehicular: parseFloat(data?.vehicular?.contributionPercent || 25),
      industrial: parseFloat(data?.industrial?.contributionPercent || 25),
      construction: parseFloat(data?.construction?.contributionPercent || 25),
      biomass: parseFloat(data?.biomass?.contributionPercent || 25),
    };
    
    // Generate 6 timepoints (last 24 hours, every 4 hours)
    for (let i = 5; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - (i * 4));
      
      // Add small random variation (±5%) to simulate trend
      const variation = () => (Math.random() - 0.5) * 0.1; // ±5%
      
      timepoints.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        Vehicular: Math.max(0, Math.min(100, current.vehicular + current.vehicular * variation())),
        Industrial: Math.max(0, Math.min(100, current.industrial + current.industrial * variation())),
        Construction: Math.max(0, Math.min(100, current.construction + current.construction * variation())),
        Biomass: Math.max(0, Math.min(100, current.biomass + current.biomass * variation())),
      });
    }
    
    return timepoints;
  };

  const trendData = generateTrendData();

  // If recharts is not available, render simple HTML fallback
  if (!hasRecharts) {
    return (
      <div className="trend-chart-fallback">
        <div className="space-y-2 text-sm">
          {trendData.map((point, idx) => (
            <div key={idx} className="flex items-center justify-between border-b pb-1">
              <span className="text-gray-600 dark:text-gray-400">{point.time}</span>
              <div className="flex gap-4">
                <span className="text-green-600 dark:text-green-400">
                  V: {point.Vehicular.toFixed(1)}%
                </span>
                <span className="text-orange-600 dark:text-orange-400">
                  I: {point.Industrial.toFixed(1)}%
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  C: {point.Construction.toFixed(1)}%
                </span>
                <span className="text-red-600 dark:text-red-400">
                  B: {point.Biomass.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="Vehicular"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Industrial"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Construction"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Biomass"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SourceTrendChart;

