import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GRAPStatus() {
  const { policyInsights } = useApp();

  const grap = policyInsights?.grapRecommendation || {
    stage: 'Stage I - Poor',
    color: '#ff7e00',
    actions: [
      'Stop garbage burning',
      'Enforce PUC norms',
      'Control dust at construction sites',
    ],
  };

  const getStageNumber = (stage) => {
    if (stage.includes('IV')) return 4;
    if (stage.includes('III')) return 3;
    if (stage.includes('II')) return 2;
    if (stage.includes('I')) return 1;
    return 0;
  };

  const stageNum = getStageNumber(grap.stage);
  const stages = ['Normal', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'];
  const stageColors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#7e0023'];

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-primary-400" />
        <h3 className="section-title mb-0">GRAP Status</h3>
        <span className="text-xs text-[#2A2A2A] ml-2">Graded Response Action Plan</span>
      </div>

      {/* Current Stage */}
      <div 
        className="p-4 rounded-xl mb-6"
        style={{ 
          backgroundColor: `${grap.color}15`,
          borderLeft: `4px solid ${grap.color}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#2A2A2A] font-medium">Current Recommendation</span>
          {stageNum >= 3 && (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
        </div>
        <p 
          className="text-xl font-display font-bold"
          style={{ color: grap.color }}
        >
          {grap.stage}
        </p>
      </div>

      {/* Stage Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {stages.map((stage, index) => (
            <div 
              key={stage}
              className={`text-xs font-semibold ${index <= stageNum ? 'text-[#0A1F24]' : 'text-[#1E3A40]'}`}
            >
              {index === 0 ? '✓' : index}
            </div>
          ))}
        </div>
        <div className="h-2 bg-[rgba(0,150,160,0.1)] rounded-full overflow-hidden flex">
          {stages.map((_, index) => (
            <div
              key={index}
              className="flex-1 transition-colors duration-300"
              style={{
                backgroundColor: index <= stageNum ? stageColors[index] : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {/* Required Actions */}
      <div>
        <h4 className="text-sm font-semibold text-[#121212] mb-3">Required Actions</h4>
        <div className="space-y-2">
          {grap.actions.map((action, index) => {
            const gradients = [
              'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
              'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
              'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
            ];
            return (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)]"
                style={{ 
                  background: gradients[index % gradients.length],
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#1A1A1A] font-medium">{action}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

