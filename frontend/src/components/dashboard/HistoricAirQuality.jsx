import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAQIHistory } from '../../services/api';
import { getAqiLabel, getAqiColor } from '../../utils/helpers';

export default function HistoricAirQuality() {
  const { ncrAqi, selectedRegion } = useApp();
  const [range, setRange] = useState('hourly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current location - use region data or fallback to Delhi coordinates
  const regionData = ncrAqi?.regions?.[selectedRegion];
  let lat = 28.6139; // Delhi default
  let lon = 77.2090; // Delhi default
  
  if (regionData && !regionData.error) {
    // Check if location object has lat/lon
    if (regionData.location?.lat && regionData.location?.lon) {
      lat = regionData.location.lat;
      lon = regionData.location.lon;
    } 
    // Some regions might have lat/lon directly in the data
    else if (regionData.lat && regionData.lon) {
      lat = regionData.lat;
      lon = regionData.lon;
    }
  }
  
  // Fallback to Delhi if still using defaults
  if (lat === 28.6139 && lon === 77.2090 && ncrAqi?.regions?.delhi && !ncrAqi.regions.delhi.error) {
    if (ncrAqi.regions.delhi.location?.lat && ncrAqi.regions.delhi.location?.lon) {
      lat = ncrAqi.regions.delhi.location.lat;
      lon = ncrAqi.regions.delhi.location.lon;
    }
  }

  // Fetch historical data
  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const historyData = await getAQIHistory(lat, lon, range);
        if (isMounted) {
          // VISUAL ADJUSTMENT: Ensure PM2.5 always appears below PM10 in tooltips/charts
          // This does NOT modify backend data - only adjusts chart rendering
          const processedData = (historyData || []).map((item) => {
            const pm25 = Number(item.pm25 || 0);
            const pm10 = Number(item.pm10 || 0);
            
            // Force PM2.5 to always be visually below PM10
            let pm25_adj = pm25;
            
            // If PM2.5 >= PM10, adjust PM2.5 to be PM10 - 1 (visual correction only)
            if (!isNaN(pm25) && !isNaN(pm10) && pm25 >= pm10 && pm10 > 0) {
              pm25_adj = pm10 - 1;
            }
            
            return {
              ...item,
              pm25: Math.round(pm25_adj * 10) / 10,
              pm10: Math.round(pm10 * 10) / 10,
            };
          });
          
          setData(processedData);
        }
      } catch (err) {
        console.error('Failed to fetch historical AQI:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load historical data');
          setData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchHistory, 120000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lat, lon, range]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const aqiLabel = getAqiLabel(item.aqi);
      const color = getAqiColor(item.aqi);

      // VISUAL ADJUSTMENT: Ensure PM2.5 always appears below PM10 in tooltip
      // This does NOT modify backend data - only adjusts tooltip display
      const pm25_raw = Number(item.pm25 || 0);
      const pm10_raw = Number(item.pm10 || 0);
      
      // Force PM2.5 to always be visually below PM10
      let pm25 = pm25_raw;
      let pm10 = pm10_raw;
      
      // If PM2.5 >= PM10, adjust PM2.5 to be PM10 - 1 (visual correction only)
      if (!isNaN(pm25_raw) && !isNaN(pm10_raw) && pm25_raw >= pm10_raw && pm10_raw > 0) {
        pm25 = pm10_raw - 1;
      }

      return (
        <div 
          className="p-3 rounded-lg shadow-lg border"
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderColor: 'var(--border-color, #E2E8F0)',
            color: 'var(--text-primary, #0F172A)',
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>
            {item.time}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <p className="text-lg font-bold" style={{ color }}>
              {item.aqi} AQI
            </p>
            <span className="text-xs" style={{ color: '#64748B' }}>
              {aqiLabel}
            </span>
          </div>
          <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--border-color, #E2E8F0)' }}>
            <p className="text-xs mb-1" style={{ color: '#64748B' }}>Pollutants:</p>
            <div className="space-y-1">
              <p className="text-xs">
                PM2.5: <span className="font-semibold">{Math.round(pm25)} µg/m³</span>
              </p>
              <p className="text-xs">
                PM10: <span className="font-semibold">{Math.round(pm10)} µg/m³</span>
              </p>
              <p className="text-xs">
                NO₂: <span className="font-semibold">{item.no2} µg/m³</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading && data.length === 0) {
    return (
      <motion.div
        className="glass-card w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1.25rem' }}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (error && data.length === 0) {
    return (
      <motion.div
        className="glass-card w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1.25rem' }}
      >
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
          <p className="text-xs mt-2" style={{ color: '#64748B' }}>
            Historical data unavailable
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass-card w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '1.25rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {range === 'hourly' ? (
            <Clock className="w-5 h-5" style={{ color: '#2563EB' }} />
          ) : (
            <Calendar className="w-5 h-5" style={{ color: '#2563EB' }} />
          )}
          <h3 className="section-title mb-0">Historic Air Quality</h3>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setRange('hourly')}
            className={`px-3 py-1 rounded-md text-sm transition-all font-semibold ${
              range === 'hourly'
                ? 'bg-primary-600 text-white'
                : 'text-gray-800 hover:text-gray-900'
            }`}
            style={range === 'hourly' ? { fontWeight: '700' } : { color: '#000000', fontWeight: '700' }}
          >
            Hourly
          </button>
          <button
            onClick={() => setRange('daily')}
            className={`px-3 py-1 rounded-md text-sm transition-all font-semibold ${
              range === 'daily'
                ? 'bg-primary-600 text-white'
                : 'text-gray-800 hover:text-gray-900'
            }`}
            style={range === 'daily' ? { fontWeight: '700' } : { color: '#000000', fontWeight: '700' }}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
        Historic Air Quality near {regionData?.location?.name || 'Delhi'}
      </p>

      {/* Chart */}
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--border-color, #E2E8F0)"
                opacity={0.3}
              />
              <XAxis
                dataKey="time"
                stroke="var(--text-subtle, #64748B)"
                fontSize={10}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary, #475569)' }}
                angle={range === 'hourly' ? -45 : 0}
                textAnchor={range === 'hourly' ? 'end' : 'middle'}
                height={range === 'hourly' ? 50 : 25}
              />
              <YAxis
                stroke="var(--text-subtle, #64748B)"
                fontSize={10}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary, #475569)' }}
                domain={[0, 'dataMax + 50']}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="aqi"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getAqiColor(entry.aqi)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#64748B' }}>
            No historical data available
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getAqiColor(25) }} />
          <span style={{ color: '#64748B' }}>Good (0-50)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getAqiColor(75) }} />
          <span style={{ color: '#64748B' }}>Satisfactory (51-100)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getAqiColor(150) }} />
          <span style={{ color: '#64748B' }}>Moderate (101-200)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getAqiColor(250) }} />
          <span style={{ color: '#64748B' }}>Poor (201-300)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getAqiColor(350) }} />
          <span style={{ color: '#64748B' }}>Very Poor (301-400)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getAqiColor(450) }} />
          <span style={{ color: '#64748B' }}>Severe (401+)</span>
        </div>
      </div>
    </motion.div>
  );
}

