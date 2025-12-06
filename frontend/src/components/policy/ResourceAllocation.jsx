import { motion } from 'framer-motion';
import { Truck, Users, Building2, HeartPulse } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ResourceAllocation() {
  const { policyInsights, ncrAqi } = useApp();

  // Generate resource allocation based on AQI
  const generateAllocation = () => {
    if (!ncrAqi?.regions) return [];

    return Object.entries(ncrAqi.regions)
      .filter(([_, data]) => !data.error)
      .map(([key, data]) => ({
        zone: data.location?.name || key,
        aqi: data.aqi,
        waterTankers: data.aqi > 200 ? 10 : data.aqi > 150 ? 5 : 2,
        monitoringTeams: data.aqi > 200 ? 3 : data.aqi > 150 ? 2 : 1,
        healthCamps: data.aqi > 200,
      }))
      .sort((a, b) => b.aqi - a.aqi);
  };

  const allocations = policyInsights?.resourceAllocation ? 
    ncrAqi?.regions && Object.entries(ncrAqi.regions)
      .filter(([_, data]) => !data.error)
      .map(([key, data]) => ({
        zone: data.location?.name || key,
        aqi: data.aqi,
        waterTankers: policyInsights.resourceAllocation.waterTankers?.find(w => w.zone === (data.location?.name || key))?.count || 2,
        monitoringTeams: policyInsights.resourceAllocation.monitoringTeams?.find(m => m.zone === (data.location?.name || key))?.teams || 1,
        healthCamps: policyInsights.resourceAllocation.healthCamps?.some(h => h.zone === (data.location?.name || key)) || false,
      }))
      .sort((a, b) => b.aqi - a.aqi)
    : generateAllocation();

  const totals = allocations?.reduce((acc, zone) => ({
    waterTankers: acc.waterTankers + zone.waterTankers,
    monitoringTeams: acc.monitoringTeams + zone.monitoringTeams,
    healthCamps: acc.healthCamps + (zone.healthCamps ? 1 : 0),
  }), { waterTankers: 0, monitoringTeams: 0, healthCamps: 0 }) || { waterTankers: 0, monitoringTeams: 0, healthCamps: 0 };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-5 h-5 text-primary-400" />
        <h3 className="section-title mb-0">Resource Allocation</h3>
      </div>

      {/* Total Resources */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)] text-center" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <Truck className="w-6 h-6 text-[#1A1A1A] mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-[#D72638]">
            {totals.waterTankers}
          </p>
          <p className="text-xs text-[#4A4A4A] font-medium">Water Tankers</p>
        </div>
        <div className="p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)] text-center" style={{ background: 'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <Users className="w-6 h-6 text-[#1A1A1A] mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-[#D72638]">
            {totals.monitoringTeams}
          </p>
          <p className="text-xs text-[#4A4A4A] font-medium">Monitoring Teams</p>
        </div>
        <div className="p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)] text-center" style={{ background: 'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <HeartPulse className="w-6 h-6 text-[#1A1A1A] mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-[#D72638]">
            {totals.healthCamps}
          </p>
          <p className="text-xs text-[#4A4A4A] font-medium">Health Camps</p>
        </div>
      </div>

      {/* Zone-wise Allocation */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2 text-xs text-[#000000] font-semibold px-3">
          <span>Zone</span>
          <span className="text-center">Tankers</span>
          <span className="text-center">Teams</span>
          <span className="text-center">Health Camp</span>
        </div>
        
        {allocations?.slice(0, 6).map((zone, index) => (
          <motion.div
            key={zone.zone}
            className="grid grid-cols-4 gap-2 items-center p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)] transition-colors"
            style={{ 
              background: [
                'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
                'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
                'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)'
              ][index % 3],
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">{zone.zone}</p>
              <p className="text-xs text-[#4A4A4A] font-medium">AQI: {zone.aqi}</p>
            </div>
            <div className="text-center">
              <span className={`text-lg font-bold ${
                zone.waterTankers >= 10 ? 'text-[#C62828]' :
                zone.waterTankers >= 5 ? 'text-[#A67A00]' :
                'text-[#1E8A3D]'
              }`}>
                {zone.waterTankers}
              </span>
            </div>
            <div className="text-center">
              <span className={`text-lg font-bold ${
                zone.monitoringTeams >= 3 ? 'text-[#C62828]' :
                zone.monitoringTeams >= 2 ? 'text-[#A67A00]' :
                'text-[#1E8A3D]'
              }`}>
                {zone.monitoringTeams}
              </span>
            </div>
            <div className="text-center">
              {zone.healthCamps ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20">
                  <HeartPulse className="w-4 h-4 text-[#C62828]" />
                </span>
              ) : (
                <span className="text-[#2A2A2A]">—</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-4 p-3 rounded-[18px] border border-[rgba(0,0,0,0.08)] bg-[#ECE6FF] text-center" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
        <p className="text-xs text-[#2A2A2A] font-medium">
          Allocations based on current AQI levels and zone priorities
        </p>
      </div>
    </motion.div>
  );
}

