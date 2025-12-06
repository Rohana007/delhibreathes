import { motion } from 'framer-motion';
import { ClipboardList, Clock, Building, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ActionCards() {
  const { policyInsights } = useApp();

  const actions = policyInsights?.actionItems || [
    {
      priority: 'immediate',
      action: 'Deploy water tankers for road sprinkling',
      department: 'Municipal Corporation',
      timeline: 'Within 2 hours',
    },
    {
      priority: 'high',
      action: 'Increase patrolling for garbage burning',
      department: 'Environment Dept',
      timeline: 'Within 4 hours',
    },
    {
      priority: 'high',
      action: 'Issue public health advisory',
      department: 'Health Department',
      timeline: 'Within 6 hours',
    },
    {
      priority: 'ongoing',
      action: 'Monitor construction site compliance',
      department: 'DPCC',
      timeline: 'Continuous',
    },
  ];

  const getPriorityStyle = (priority, index) => {
    const gradients = [
      'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
      'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
      'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
    ];
    switch (priority) {
      case 'immediate':
        return {
          bg: gradients[index % gradients.length],
          border: 'border-[rgba(198,40,40,0.3)]',
          badge: 'bg-[#C62828] text-white',
          text: '#C62828',
        };
      case 'high':
        return {
          bg: gradients[index % gradients.length],
          border: 'border-[rgba(199,106,28,0.3)]',
          badge: 'bg-[#C76A1C] text-white',
          text: '#C76A1C',
        };
      case 'ongoing':
        return {
          bg: gradients[index % gradients.length],
          border: 'border-[rgba(0,0,0,0.15)]',
          badge: 'bg-[#1A1A1A] text-white',
          text: '#1A1A1A',
        };
      default:
        return {
          bg: gradients[index % gradients.length],
          border: 'border-[rgba(0,0,0,0.15)]',
          badge: 'bg-[#1A1A1A] text-white',
          text: '#1A1A1A',
        };
    }
  };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="section-title mb-0">Priority Action Items</h3>
        </div>
        <span className="text-xs text-[#4A4A4A]">{actions.length} pending</span>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const style = getPriorityStyle(action.priority, index);

          return (
            <motion.div
              key={index}
              className="p-4 rounded-xl border"
              style={{
                background: style.bg,
                border: `1px solid ${style.border.includes('rgba') ? style.border.replace('border-', '') : 'rgba(0,0,0,0.08)'}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.badge}`}>
                    {action.priority.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1A1A1A] mb-2">
                    {action.action}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-[#4A4A4A]">
                      <Building className="w-4 h-4" />
                      <span>{action.department}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#4A4A4A]">
                      <Clock className="w-4 h-4" />
                      <span>{action.timeline}</span>
                    </div>
                  </div>
                </div>

                <button className="flex-shrink-0 p-2 rounded-lg hover:bg-[rgba(0,0,0,0.05)] transition-colors group">
                  <CheckCircle2 className="w-5 h-5 text-[#4A4A4A] group-hover:text-[#1E8A3D] transition-colors" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-[rgba(0,0,0,0.08)] grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xl font-display font-bold text-[#C62828]">
            {actions.filter(a => a.priority === 'immediate').length}
          </p>
          <p className="text-xs text-[#4A4A4A]">Immediate</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-[#C76A1C]">
            {actions.filter(a => a.priority === 'high').length}
          </p>
          <p className="text-xs text-[#4A4A4A]">High Priority</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-[#1A1A1A]">
            {actions.filter(a => a.priority === 'ongoing').length}
          </p>
          <p className="text-xs text-[#4A4A4A]">Ongoing</p>
        </div>
      </div>
    </motion.div>
  );
}

