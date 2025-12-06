import HotspotHeatmap from '../../components/policy/HotspotHeatmap';

export default function PolicyHotspots() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
          Pollution Hotspots
        </h2>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Real-time fire, emission, and dust hotspot detection
        </p>
      </div>
      <HotspotHeatmap />
    </div>
  );
}

