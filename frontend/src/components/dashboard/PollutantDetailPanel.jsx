import { motion } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, TrendingDown, Minus, Info, ExternalLink } from 'lucide-react';
import { POLLUTANT_INFO } from '../../utils/helpers';

export default function PollutantDetailPanel({ data, onClose }) {
  if (!data) return null;

  const pollutants = data.pollutants || {};
  const pollutantDetails = data.pollutantDetails || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#E2E8F0', backgroundColor: 'rgba(220, 38, 38, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold" style={{ color: '#DC2626' }}>
                Pollutant Breakdown
              </h2>
              <p className="text-sm mt-1" style={{ color: '#475569' }}>
                {data.location?.name || 'Current Location'} • Detailed Analysis
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#64748B' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scroll" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-3 rounded-lg glass-card">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16A34A' }} />
              <span style={{ color: '#475569' }}>Within CPCB Limit</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F97316' }} />
              <span style={{ color: '#475569' }}>Near Limit</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }} />
              <span style={{ color: '#475569' }}>Exceeds Limit</span>
            </div>
          </div>

          {/* Pollutant Cards */}
          <div className="grid gap-4">
            {Object.entries(POLLUTANT_INFO).map(([key, info]) => {
              const value = pollutants[key];
              const details = pollutantDetails[key];
              
              if (value == null && !details) return null;
              
              const displayValue = details?.value ?? value;
              const cpcbExceedance = details?.cpcbExceedance ?? 
                (info.cpcbLimit ? (displayValue / info.cpcbLimit) * 100 : 0);
              const whoExceedance = details?.whoExceedance ?? 
                (info.whoLimit ? (displayValue / info.whoLimit) * 100 : 0);
              
              const status = cpcbExceedance > 100 ? 'exceeds' : 
                            cpcbExceedance > 80 ? 'near' : 'good';
              const statusColor = status === 'exceeds' ? '#EF4444' : 
                                 status === 'near' ? '#F59E0B' : '#10B981';

              return (
                <motion.div
                  key={key}
                  className="glass-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${info.color}20` }}
                      >
                        <span className="font-bold text-sm" style={{ color: info.color }}>
                          {info.name}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium" style={{ color: '#0F172A' }}>{info.fullName}</h3>
                        <p className="text-xs" style={{ color: '#64748B' }}>{info.description}</p>
                      </div>
                    </div>
                    
                    {/* Trend */}
                    <div className="flex items-center gap-1">
                      {details?.trend === 'rising' && <TrendingUp className="w-4 h-4" style={{ color: '#DC2626' }} />}
                      {details?.trend === 'falling' && <TrendingDown className="w-4 h-4" style={{ color: '#16A34A' }} />}
                      {details?.trend === 'stable' && <Minus className="w-4 h-4" style={{ color: '#64748B' }} />}
                    </div>
                  </div>

                  {/* Value Display */}
                  <div className="flex items-end gap-4 mb-3">
                    <div>
                      <span 
                        className="text-3xl font-display font-bold"
                        style={{ color: info.color }}
                      >
                        {Math.round(displayValue * 10) / 10}
                      </span>
                      <span className="text-sm ml-1" style={{ color: '#64748B' }}>{info.unit}</span>
                    </div>
                    
                    <div 
                      className="px-2 py-1 rounded-full text-xs flex items-center gap-1 font-semibold"
                      style={{ 
                        backgroundColor: `rgba(${statusColor === '#EF4444' ? '220, 38, 38' : statusColor === '#F59E0B' ? '249, 115, 22' : '22, 163, 74'}, 0.08)`,
                        color: statusColor,
                        border: `1px solid rgba(${statusColor === '#EF4444' ? '220, 38, 38' : statusColor === '#F59E0B' ? '249, 115, 22' : '22, 163, 74'}, 0.25)`
                      }}
                    >
                      {status === 'exceeds' && <AlertTriangle className="w-3 h-3" />}
                      {status === 'exceeds' ? 'Exceeds CPCB' : 
                       status === 'near' ? 'Near Limit' : 'Safe'}
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2">
                    {/* CPCB Limit */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: '#475569' }}>CPCB Limit: {info.cpcbLimit} {info.unit}</span>
                        <span className="font-semibold" style={{ color: statusColor }}>
                          {Math.round(cpcbExceedance)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${Math.min(100, cpcbExceedance)}%`,
                            backgroundColor: statusColor 
                          }}
                        />
                      </div>
                    </div>

                    {/* WHO Limit */}
                    {info.whoLimit && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: '#475569' }}>WHO Limit: {info.whoLimit} {info.unit}</span>
                          <span className="font-semibold" style={{ color: whoExceedance > 100 ? '#DC2626' : '#16A34A' }}>
                            {Math.round(whoExceedance)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${Math.min(100, whoExceedance)}%`,
                              backgroundColor: whoExceedance > 100 ? '#EF4444' : '#10B981'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E2E8F0' }}>
                    <p className="text-xs" style={{ color: '#64748B' }}>
                      <span style={{ color: '#475569' }}>Main Sources:</span> {info.sources.join(', ')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <p className="text-xs" style={{ color: '#64748B' }}>
            Data from CPCB/DPCC monitoring stations
          </p>
          <a 
            href="https://cpcb.nic.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: '#2563EB' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#2563EB'}
          >
            CPCB Standards <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

