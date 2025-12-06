import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Loader2, AlertCircle, Filter, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminReports } from '../api/adminApi';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (status) => {
  const color = status === 'Pending' ? '#F59E0B' : status === 'Reviewed' ? '#16A34A' : '#2563EB';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function AdminMap() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Default center: Delhi
  const [mapCenter] = useState([28.6139, 77.2090]);
  const [mapZoom] = useState(11);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminReports.getMapData(filters);
      if (response.success) {
        setLocations(response.locations);
      } else {
        setError(response.error || 'Failed to load map data');
      }
    } catch (err) {
      console.error('Error loading map data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadMapData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      status: '',
      fromDate: '',
      toDate: '',
    });
    loadMapData();
  };

  // Calculate heatmap data (simple density calculation)
  const getHeatmapData = () => {
    const heatmapPoints = locations.map(loc => [loc.lat, loc.lng, 1]);
    return heatmapPoints;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {(filters.category || filters.status || filters.fromDate || filters.toDate) && (
            <button
              onClick={clearFilters}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              >
                <option value="">All Categories</option>
                <option value="pollution">General Pollution</option>
                <option value="burning">Waste/Stubble Burning</option>
                <option value="construction">Construction Dust</option>
                <option value="industrial">Industrial Emission</option>
                <option value="traffic">Vehicle Pollution</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Action Taken">Action Taken</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>
          </div>
        )}

        {showFilters && (
          <div className="mt-4 flex justify-end">
            <button onClick={applyFilters} className="btn-primary">
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</span>
        </div>
      )}

      {/* Map Stats */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              Total Locations: <span style={{ color: '#2563EB' }}>{locations.length}</span>
            </p>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
              <span style={{ color: '#64748B' }}>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16A34A' }}></div>
              <span style={{ color: '#64748B' }}>Reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2563EB' }}></div>
              <span style={{ color: '#64748B' }}>Action Taken</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="glass-card p-0 overflow-hidden" style={{ height: '600px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2563EB' }} />
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={createCustomIcon(location.status)}
                eventHandlers={{
                  click: () => setSelectedLocation(location),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <p className="text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                      Report ID: {location.id.slice(-8)}
                    </p>
                    <p className="text-xs mb-1" style={{ color: '#64748B' }}>
                      Category: {location.category}
                    </p>
                    <p className="text-xs" style={{ color: '#64748B' }}>
                      Status: {location.status}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

