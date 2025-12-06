import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAqiColor, getAqiLabel } from '../../utils/helpers';

export default function RegionCards() {
  const { ncrAqi, selectedRegion, setSelectedRegion, getAqiClass } = useApp();

  if (!ncrAqi?.regions) {
    return (
      <div className="glass-card">
        <div className="grid grid-cols-1 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  const regions = Object.entries(ncrAqi.regions).filter(([_, data]) => !data.error);

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">Delhi NCR Regions</h3>
        <span className="text-xs" style={{ color: '#64748B' }}>Click to select</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {regions.map(([key, data], index) => {
          const isSelected = selectedRegion === key;
          const aqi = data.aqi;
          const color = getAqiColor(aqi);
          const label = getAqiLabel(aqi);
          
          return (
            <motion.button
              key={key}
              onClick={() => setSelectedRegion(key)}
              className="relative p-4 rounded-xl border transition-all text-left"
              style={{
                borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                borderWidth: isSelected ? '2px' : '1px',
                backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                boxShadow: isSelected 
                  ? '0 4px 12px rgba(37, 99, 235, 0.2)' 
                  : '0 1px 3px rgba(15, 23, 42, 0.08)'
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: isSelected 
                  ? '0 4px 12px rgba(37, 99, 235, 0.25)' 
                  : '0 2px 6px rgba(15, 23, 42, 0.12)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col gap-2">
                {/* Region Name */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#475569' }} />
                  <span className="text-sm font-semibold truncate" style={{ color: '#000000', fontWeight: '700' }}>
                    {data.location?.name || key}
                  </span>
                </div>

                {/* AQI Value and Status */}
                <div className="flex items-center justify-between">
                  <span 
                    className="text-2xl font-display font-bold"
                    style={{ color: color }}
                  >
                    {aqi}
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#1F2937', fontWeight: '600' }}>AQI</span>
                </div>

                {/* Status Badge */}
                <div className="flex justify-start">
                  <span className={`aqi-badge text-xs font-semibold px-2.5 py-1 ${getAqiClass(aqi)}`}>
                    {label}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

