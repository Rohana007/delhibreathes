import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Pollutant Breakdown Graph Component
 * Multi-bar chart comparing Before vs After pollutant levels
 */
export default function PollutantBreakdownGraph({ baselinePollutants, afterPolicyPollutants }) {
  if (!baselinePollutants || !afterPolicyPollutants) {
    return null;
  }

  const pollutantLabels = {
    PM2_5: 'PM2.5',
    PM10: 'PM10',
    NO2: 'NO₂',
    SO2: 'SO₂',
    CO: 'CO',
    O3: 'O₃',
  };

  const pollutantUnits = {
    PM2_5: 'μg/m³',
    PM10: 'μg/m³',
    NO2: 'μg/m³',
    SO2: 'μg/m³',
    CO: 'mg/m³',
    O3: 'μg/m³',
  };

  const labels = Object.keys(baselinePollutants).map(key => pollutantLabels[key] || key);
  const baselineData = Object.values(baselinePollutants);
  const afterPolicyData = Object.values(afterPolicyPollutants);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Before Policy',
        data: baselineData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 1,
      },
      {
        label: 'After Policy',
        data: afterPolicyData,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22C55E',
        borderWidth: 1,
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
            weight: '500',
          },
          color: '#0F172A',
        },
      },
      title: {
        display: true,
        text: 'Pollutant Levels Comparison',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#0F172A',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context) {
            const pollutantKey = Object.keys(baselinePollutants)[context.dataIndex];
            const unit = pollutantUnits[pollutantKey] || 'μg/m³';
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
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
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Concentration',
          color: '#64748B',
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
    },
  };

  return (
    <div className="glass-card p-6">
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

