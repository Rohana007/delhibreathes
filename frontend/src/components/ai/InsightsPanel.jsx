import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, Flame, Car, Factory, Wind, AlertTriangle, Lightbulb, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function InsightsPanel() {
  const { insights } = useApp();
  const [expandedSection, setExpandedSection] = useState('summary');

  if (!insights) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-48 bg-[rgba(0,0,0,0.05)] rounded-xl"></div>
      </div>
    );
  }

  const sections = [
    { id: 'summary', title: 'Summary', icon: Brain },
    { id: 'sources', title: 'Pollution Sources', icon: Factory },
    { id: 'warnings', title: 'Warnings', icon: AlertTriangle },
    { id: 'prevention', title: 'Prevention Tips', icon: Shield },
  ];

  const getSourceIcon = (source) => {
    if (source.toLowerCase().includes('traffic')) return <Car className="w-5 h-5" />;
    if (source.toLowerCase().includes('industrial')) return <Factory className="w-5 h-5" />;
    if (source.toLowerCase().includes('dust')) return <Wind className="w-5 h-5" />;
    if (source.toLowerCase().includes('biomass') || source.toLowerCase().includes('burning')) return <Flame className="w-5 h-5" />;
    return <Factory className="w-5 h-5" />;
  };

  const getContributionColor = (contribution) => {
    switch (contribution.toLowerCase()) {
      case 'very high': return 'text-[#C62828] bg-red-400/10';
      case 'high': return 'text-[#C76A1C] bg-orange-400/10';
      case 'moderate': return 'text-[#A67A00] bg-yellow-400/10';
      default: return 'text-[#1E8A3D] bg-green-400/10';
    }
  };

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6 border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)' }}>
            <Brain className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <h3 className="section-title mb-0">AI-Powered Insights</h3>
            <p className="text-xs text-[#4A4A4A]">Analysis based on current conditions</p>
          </div>
        </div>
      </div>

      {/* Headline */}
      {insights.summary?.headline && (
        <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.08)]" style={{ background: 'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)' }}>
          <p className="text-lg font-display font-medium text-[#1A1A1A]">
            {insights.summary.headline}
          </p>
        </div>
      )}

      {/* Accordion Sections */}
      <div className="divide-y divide-[rgba(0,0,0,0.08)]">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                style={{ background: isExpanded ? 'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)' : 'white' }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#1A1A1A]" />
                  <span className="font-medium text-[#1A1A1A]">{section.title}</span>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-[#1A1A1A] transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      {/* Summary Section */}
                      {section.id === 'summary' && insights.summary && (
                        <div className="space-y-4">
                          <p className="text-[#1A1A1A] leading-relaxed">
                            {insights.summary.text}
                          </p>
                          {insights.summary.trend && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-[#4A4A4A]">Trend:</span>
                              <span 
                                className="capitalize font-semibold"
                                style={{
                                  color: insights.summary.trend.includes('increasing') ? '#C62828' :
                                         insights.summary.trend.includes('decreasing') ? '#1E8A3D' :
                                         '#1A1A1A'
                                }}
                              >
                                {insights.summary.trend}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sources Section */}
                      {section.id === 'sources' && insights.sourceAnalysis && (
                        <div className="space-y-3">
                          {insights.sourceAnalysis.allSources?.map((source, index) => {
                            const gradients = [
                              'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
                              'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
                              'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
                            ];
                            return (
                              <div 
                                key={index}
                                className="p-4 rounded-xl border"
                                style={{
                                  background: gradients[index % gradients.length],
                                  border: '1px solid rgba(0,0,0,0.08)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-[rgba(0,0,0,0.05)]">
                                    <div className="text-[#1A1A1A]">
                                      {getSourceIcon(source.source)}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-[#1A1A1A]">
                                        {source.source}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getContributionColor(source.contribution)}`}>
                                        {source.contribution}
                                      </span>
                                    </div>
                                    <p className="text-sm text-[#4A4A4A]">
                                      {source.description}
                                    </p>
                                    {source.indicators && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {source.indicators.map((ind, i) => (
                                          <span 
                                            key={i}
                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={{
                                              backgroundColor: 'white',
                                              border: '1px solid rgba(0,0,0,0.15)',
                                              color: '#1A1A1A'
                                            }}
                                          >
                                            {ind}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Warnings Section */}
                      {section.id === 'warnings' && (
                        <div className="space-y-3">
                          {insights.warnings?.length > 0 ? (
                            insights.warnings.map((warning, index) => (
                              <div 
                                key={index}
                                className={`alert-banner ${
                                  warning.type === 'emergency' ? 'alert-critical' :
                                  warning.type === 'alert' ? 'alert-warning' :
                                  'alert-info'
                                }`}
                              >
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">{warning.title}</p>
                                  <p className="text-sm mt-1 opacity-80">{warning.message}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[#4A4A4A] text-center py-4">
                              No active warnings at this time
                            </p>
                          )}
                        </div>
                      )}

                      {/* Prevention Section */}
                      {section.id === 'prevention' && insights.preventionSteps && (
                        <div className="space-y-3">
                          {insights.preventionSteps.map((step, index) => {
                            // Map prevention steps to appropriate emojis
                            const getEmoji = (stepTitle) => {
                              const title = stepTitle.toLowerCase();
                              if (title.includes('vehicle') || title.includes('car') || title.includes('transport')) return '🚗';
                              if (title.includes('burn') || title.includes('waste') || title.includes('garbage')) return '🔥';
                              if (title.includes('cooking') || title.includes('fuel') || title.includes('lpg')) return '🍳';
                              if (title.includes('tree') || title.includes('plant') || title.includes('green')) return '🌳';
                              if (title.includes('report') || title.includes('violation') || title.includes('authority')) return '📢';
                              if (title.includes('mask') || title.includes('protect')) return '😷';
                              if (title.includes('indoor') || title.includes('stay') || title.includes('home')) return '🏠';
                              if (title.includes('purifier') || title.includes('air')) return '💨';
                              if (title.includes('outdoor') || title.includes('avoid')) return '🚫';
                              return '💡'; // Default emoji
                            };
                            
                            const iconColors = {
                              'critical': '#DC2626',
                              'high': '#F97316',
                              'medium': '#F97316',
                              'low': '#16A34A',
                              'long-term': '#16A34A'
                            };
                            
                            return (
                              <div 
                                key={index}
                                className="glass-card p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl flex-shrink-0">
                                    {getEmoji(step.step)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-base mb-1" style={{ color: '#0F172A' }}>
                                      {step.step}
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: '#475569' }}>
                                      {step.description}
                                    </p>
                                    {step.impact && (
                                      <div className="mt-2">
                                        <span 
                                          className="text-xs px-2 py-1 rounded-full font-semibold"
                                          style={{
                                            backgroundColor: `rgba(${
                                              iconColors[step.impact] === '#DC2626' ? '220, 38, 38' :
                                              iconColors[step.impact] === '#F97316' ? '249, 115, 22' :
                                              '22, 163, 74'
                                            }, 0.08)`,
                                            color: iconColors[step.impact] || '#0F172A',
                                            border: `1px solid rgba(${
                                              iconColors[step.impact] === '#DC2626' ? '220, 38, 38' :
                                              iconColors[step.impact] === '#F97316' ? '249, 115, 22' :
                                              '22, 163, 74'
                                            }, 0.25)`
                                          }}
                                        >
                                          {step.impact === 'critical' ? 'Critical Impact' :
                                           step.impact === 'high' ? 'High Impact' :
                                           step.impact === 'medium' ? 'Medium Impact' :
                                           step.impact === 'long-term' ? 'Long-term Impact' :
                                           'Low Impact'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

