import HotspotHeatmap from '../components/policy/HotspotHeatmap';

/**
 * User Hotspots Page
 * Displays the hotspot map for authenticated users
 */
export default function UserHotspots() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <HotspotHeatmap />
    </div>
  );
}

