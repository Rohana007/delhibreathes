import { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { POLLUTANT_INFO } from '../../utils/helpers';

// CPCB Limits (24-hour average)
const CPCB_LIMITS = {
  pm25: 60,   // µg/m³
  pm10: 100,  // µg/m³
  no2: 80,    // µg/m³
  o3: 100,    // µg/m³
  so2: 80,    // µg/m³
  co: 4,      // mg/m³
  nh3: 400,   // µg/m³
};

// Pollutant order for display
const POLLUTANT_ORDER = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'nh3'];

// Clamp function helper
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function PollutantMiniChart({ data }) {
  const { theme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const chartData = useMemo(() => {
    if (!data || typeof data !== 'object') return [];

    return POLLUTANT_ORDER.map((key) => {
      const value = data[key];
      const info = POLLUTANT_INFO[key];
      const limit = CPCB_LIMITS[key];

      if (value == null || !info || !limit) return null;

      // Calculate percentage relative to CPCB limit
      const percentage = (value / limit) * 100;

      // Determine color based on percentage
      let color;
      if (percentage <= 70) {
        color = '#33cc66'; // Green - Safe
      } else if (percentage <= 100) {
        color = '#ffcc33'; // Yellow - Near limit
      } else {
        color = '#ff4d4d'; // Red - Exceeds limit
      }

      return {
        name: info.name,
        value: Math.round(value),
        percentage: Math.round(percentage),
        limit,
        unit: info.unit,
        color,
        key,
      };
    }).filter(Boolean);
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: '#64748B' }}>Pollutant data unavailable</p>
      </div>
    );
  }

  // Find max percentage for scaling (cap at 150% for better visualization)
  const maxPercentage = Math.max(...chartData.map(item => item.percentage), 150);

  const textColor = theme === 'dark' ? '#E0E0E0' : '#0F172A';
  const barBg = theme === 'dark' ? '#1b2533' : '#f0f0f0';
  const tooltipBg = theme === 'dark' ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? '#374151' : '#E2E8F0';

  return (
    <div className="pollutant-bars-container">
      {chartData.map((item, index) => {
        // Calculate bar width with clamp to ensure it fits (5% min, 100% max)
        const barWidthPercent = clamp((item.percentage / maxPercentage) * 100, 5, 100);
        
        let statusText;
        if (item.percentage > 100) {
          statusText = `(Exceeds CPCB Limit by ${item.percentage - 100}%)`;
        } else if (item.percentage > 70) {
          const belowBy = Math.round(100 - item.percentage);
          statusText = `(${belowBy}% below CPCB Limit)`;
        } else {
          statusText = '(Within CPCB Limit)';
        }

        return (
          <div
            key={item.key}
            className="pollutant-row"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ position: 'relative' }}
          >
            <span className="pollutant-label" style={{ color: textColor }}>
              {item.name}
            </span>
            <div 
              className="pollutant-bar-wrap"
              style={{ 
                backgroundColor: barBg,
              }}
            >
              <div
                className="pollutant-bar"
                style={{
                  width: `${barWidthPercent}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            {hoveredIndex === index && (
              <div
                className="pollutant-tooltip"
                style={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: textColor,
                  top: index === 0 ? '24px' : '-40px', // Show below for first item (PM2.5), above for others
                  zIndex: 1000, // Ensure it's above everything
                }}
              >
                <p className="text-xs font-semibold leading-tight">
                  {item.name} – {item.value} {item.unit} {statusText}
                </p>
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        .pollutant-bars-container {
          width: 100%;
          padding: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: visible;
          background: transparent;
        }
        .pollutant-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          position: relative;
          min-width: 0;
        }
        .pollutant-label {
          min-width: 55px;
          max-width: 55px;
          font-size: 12px;
          flex-shrink: 0;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pollutant-bar-wrap {
          flex: 1;
          height: 8px;
          border-radius: 6px;
          overflow: hidden;
          max-width: 100%;
          min-width: 0;
          position: relative;
          background: transparent;
        }
        .pollutant-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
          min-width: 2px;
        }
        .pollutant-tooltip {
          position: absolute;
          z-index: 1000;
          padding: 8px 12px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid;
          pointer-events: none;
          white-space: nowrap;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
        }
        @media (max-width: 768px) {
          .pollutant-label {
            font-size: 11px;
            min-width: 50px;
            max-width: 50px;
          }
          .pollutant-bar-wrap {
            height: 6px;
          }
          .pollutant-row {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

