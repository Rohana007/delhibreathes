import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * AQI Trend Graph Component
 * Graph 1: 24-Hour Before vs After AQI Trend
 * Uses react-chartjs-2
 */
export default function AQITrendGraph({ result }) {
  if (!result) {
    return (
      <div className="glass-card p-6 text-center" style={{ backgroundColor: '#FFFFFF' }}>
        <p style={{ color: '#64748B' }}>No data available</p>
      </div>
    );
  }

  // Get duration first (needed for chart title)
  const duration = result.duration || 24;

  // Handle both chartData format and baselineAQI/adjustedAQI arrays
  let baselineData = [];
  let adjustedData = [];
  let timeLabels = [];

  if (result.chartData && result.chartData.length > 0) {
    // Use chartData if available
    baselineData = result.chartData.map((d) => d.baselineAQI);
    adjustedData = result.chartData.map((d) => d.adjustedAQI);
    timeLabels = result.chartData.map((_, i) => {
      if (duration === 24) return `${i}h`;
      if (duration === 48) return `${i}h`;
      return `${Math.floor(i / 7)}d ${i % 7}h`;
    });
  } else if (result.baselineAQI && result.adjustedAQI) {
    // Use baselineAQI and adjustedAQI arrays directly
    baselineData = result.baselineAQI;
    adjustedData = result.adjustedAQI;
    timeLabels = baselineData.map((_, i) => {
      if (duration === 24) return `${i}h`;
      if (duration === 48) return `${i}h`;
      return `${Math.floor(i / 7)}d ${i % 7}h`;
    });
  } else {
    return (
      <div className="glass-card p-6 text-center" style={{ backgroundColor: '#FFFFFF' }}>
        <p style={{ color: '#64748B' }}>No chart data available</p>
      </div>
    );
  }

  if (baselineData.length === 0 || adjustedData.length === 0) {
    return (
      <div className="glass-card p-6 text-center" style={{ backgroundColor: '#FFFFFF' }}>
        <p style={{ color: '#64748B' }}>No data points available</p>
      </div>
    );
  }

  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Baseline AQI',
        data: baselineData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'After Policy AQI',
        data: adjustedData,
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '600',
          },
          color: '#0F172A',
        },
      },
      title: {
        display: true,
        text: `${duration === 24 ? '24-Hour' : duration === 48 ? '48-Hour' : '7-Day'} AQI Trend: Before vs After Policy`,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#0F172A',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        borderColor: '#E2E8F0',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          font: {
            size: 12,
            weight: '600',
          },
          color: '#64748B',
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'AQI',
          font: {
            size: 12,
            weight: '600',
          },
          color: '#64748B',
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11,
          },
        },
        beginAtZero: false,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl"
      style={{ 
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ height: '400px', position: 'relative' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </motion.div>
  );
}

