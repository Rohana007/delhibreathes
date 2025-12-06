import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Pollutant Breakdown Chart Component
 * Graph 2: Bar chart showing Before vs After pollutant values
 */
export default function PollutantChart({ result }) {
  if (!result || !result.pollutantsBefore || !result.pollutantsAfter) {
    return (
      <div className="glass-card p-6 text-center" style={{ backgroundColor: '#FFFFFF' }}>
        <p style={{ color: '#64748B' }}>No pollutant data available</p>
      </div>
    );
  }

  const pollutants = ['PM2.5', 'PM10', 'NO₂', 'SO₂', 'O₃', 'CO'];
  const beforeValues = [
    result.pollutantsBefore.PM2_5,
    result.pollutantsBefore.PM10,
    result.pollutantsBefore.NO2,
    result.pollutantsBefore.SO2,
    result.pollutantsBefore.O3,
    result.pollutantsBefore.CO,
  ];
  const afterValues = [
    result.pollutantsAfter.PM2_5,
    result.pollutantsAfter.PM10,
    result.pollutantsAfter.NO2,
    result.pollutantsAfter.SO2,
    result.pollutantsAfter.O3,
    result.pollutantsAfter.CO,
  ];

  const chartData = {
    labels: pollutants,
    datasets: [
      {
        label: 'Before',
        data: beforeValues,
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: '#2563EB',
        borderWidth: 2,
      },
      {
        label: 'After',
        data: afterValues,
        backgroundColor: 'rgba(22, 163, 74, 0.7)',
        borderColor: '#16A34A',
        borderWidth: 2,
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
        text: 'Pollutant Breakdown: Before vs After Policy',
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
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const unit = context.label === 'CO' ? 'mg/m³' : 'μg/m³';
            return `${label}: ${value.toFixed(1)} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Pollutant',
          font: {
            size: 12,
            weight: '600',
          },
          color: '#64748B',
        },
        grid: {
          display: false,
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
          text: 'Concentration',
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
        beginAtZero: true,
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
        <Bar data={chartData} options={chartOptions} />
      </div>
    </motion.div>
  );
}

