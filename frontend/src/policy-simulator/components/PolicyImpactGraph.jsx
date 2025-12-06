import { Line } from 'react-chartjs-2';
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

// Register Chart.js components
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
 * Policy Impact Graph Component
 * Shows Before vs After Policy AQI over time
 */
export default function PolicyImpactGraph({ baselineForecast, afterPolicyForecast, duration }) {
  if (!baselineForecast || !afterPolicyForecast || baselineForecast.length === 0) {
    return null;
  }

  // Format duration label
  const durationLabel = duration === 24 ? '24 Hours' : duration === 48 ? '48 Hours' : '7 Days';

  // Prepare data for chart
  const labels = baselineForecast.map((point, index) => {
    const date = new Date(point.datetime);
    if (duration === 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (duration === 48) {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  });

  const baselineData = baselineForecast.map(p => p.aqi);
  const afterPolicyData = afterPolicyForecast.map(p => p.aqi);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Baseline Forecast',
        data: baselineData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: 'After Policy Application',
        data: afterPolicyData,
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
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
        text: `AQI Forecast Comparison (${durationLabel})`,
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
            return `${context.dataset.label}: ${context.parsed.y} AQI`;
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
          maxRotation: duration === 168 ? 45 : 0,
        },
      },
      y: {
        beginAtZero: false,
        min: 0,
        max: 500,
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
          text: 'AQI',
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
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

