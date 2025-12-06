import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Award, Heart } from 'lucide-react';

/**
 * Summary Cards Component
 * Displays three key metrics: Percentage Improvement, Most Reduced Pollutant, Health Impact
 */
export default function SummaryCards({ summary, pollutantChanges }) {
  if (!summary) return null;

  const getHealthColor = (category) => {
    const colors = {
      'Good': '#16A34A',
      'Satisfactory': '#84CC16',
      'Moderate': '#F59E0B',
      'Poor': '#F97316',
      'Very Poor': '#EF4444',
      'Severe': '#DC2626',
    };
    return colors[category] || '#64748B';
  };

  // Find most reduced pollutant
  let mostReduced = summary.mostReducedPollutant;
  if (!mostReduced && pollutantChanges) {
    let maxReduction = 0;
    Object.keys(pollutantChanges).forEach(key => {
      if (pollutantChanges[key].change < 0 && Math.abs(pollutantChanges[key].change) > maxReduction) {
        maxReduction = Math.abs(pollutantChanges[key].change);
        mostReduced = {
          name: key,
          reduction: Math.abs(pollutantChanges[key].change),
          unit: key === 'CO' ? 'mg/m³' : 'μg/m³',
        };
      }
    });
  }

  const pollutantLabels = {
    PM2_5: 'PM2.5',
    PM10: 'PM10',
    NO2: 'NO₂',
    SO2: 'SO₂',
    CO: 'CO',
    O3: 'O₃',
  };

  const cards = [
    {
      title: 'Percentage Improvement',
      value: `${summary.improvementPercent > 0 ? '+' : ''}${summary.improvementPercent}%`,
      subtitle: `AQI improves by ${Math.abs(summary.improvementPercent)}%`,
      icon: summary.improvementPercent > 0 ? TrendingDown : TrendingUp,
      color: summary.improvementPercent > 0 ? '#22C55E' : '#EF4444',
      bgColor: summary.improvementPercent > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Most Reduced Pollutant',
      value: mostReduced ? `${mostReduced.reduction.toFixed(1)} ${mostReduced.unit}` : 'N/A',
      subtitle: mostReduced ? `${pollutantLabels[mostReduced.name] || mostReduced.name} reduced` : 'No significant reduction',
      icon: Award,
      color: '#2563EB',
      bgColor: 'rgba(37, 99, 235, 0.1)',
    },
    {
      title: 'Health Impact Summary',
      value: `${summary.baselineHealthCategory} → ${summary.afterPolicyHealthCategory}`,
      subtitle: `Overall health risk shifting from "${summary.baselineHealthCategory}" to "${summary.afterPolicyHealthCategory}"`,
      icon: Heart,
      color: getHealthColor(summary.afterPolicyHealthCategory),
      bgColor: `${getHealthColor(summary.afterPolicyHealthCategory)}20`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-6"
          style={{ backgroundColor: card.bgColor }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: '#1F2937', fontWeight: '700' }}>
                {card.title}
              </p>
              <p className="text-2xl font-bold" style={{ color: card.color, fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.2)', fontSize: '28px' }}>
                {card.value}
              </p>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${card.color}20` }}
            >
              <card.icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: '#374151', fontWeight: '600' }}>
            {card.subtitle}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

