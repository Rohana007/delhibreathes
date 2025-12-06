import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Flame, Layers, Factory, Car, Construction } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polygon } from 'react-leaflet';
import { useApp } from '../../context/AppContext';
import { getAqiColor, getAqiLabel, NCR_LOCATIONS, INDIAN_AQI_LEVELS } from '../../utils/helpers';
import 'leaflet/dist/leaflet.css';

// Map center (Delhi NCR center)
const center = [28.55, 77.25];

// CPCB-style white map tiles
const MAP_TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

function MapController({ selectedRegion }) {
  const map = useMap();
  
  if (selectedRegion && NCR_LOCATIONS[selectedRegion]) {
    const loc = NCR_LOCATIONS[selectedRegion];
    map.flyTo([loc.lat, loc.lon], 12, { duration: 1 });
  }
  
  return null;
}

export default function AQIMap() {
  const { ncrAqi, hotspots, selectedRegion, setSelectedRegion, mode } = useApp();
  const [showSources, setShowSources] = useState(false);
  const [mapStyle, setMapStyle] = useState('light');

  if (!ncrAqi?.regions) {
    return (
      <div className="glass-card p-6">
        <div className="skeleton h-[400px] rounded-xl"></div>
      </div>
    );
  }

  const regions = Object.entries(ncrAqi.regions).filter(([_, data]) => !data.error);

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-400" />
            <h3 className="section-title mb-0">Delhi NCR Air Quality</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Map Style Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setMapStyle('light')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  mapStyle === 'light' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  mapStyle === 'dark' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                Dark
              </button>
            </div>
            
            {/* Source Toggle */}
            {mode === 'policymaker' && (
              <button
                onClick={() => setShowSources(!showSources)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  showSources ? 'bg-primary-600 text-white' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Factory className="w-3 h-3" />
                Sources
              </button>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
              <Layers className="w-4 h-4" />
              <span>{regions.length} stations</span>
              {hotspots?.summary?.total > 0 && (
                <>
                  <span>•</span>
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>{hotspots.summary.total}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[420px]">
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url={MAP_TILES[mapStyle]}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <MapController selectedRegion={selectedRegion} />

          {/* AQI Circle Markers */}
          {regions.map(([key, data]) => {
            const loc = data.location || NCR_LOCATIONS[key];
            if (!loc) return null;
            
            const aqi = data.aqi;
            const color = getAqiColor(aqi);
            const isSelected = selectedRegion === key;
            const lat = loc.lat || loc.geo?.[0];
            const lon = loc.lon || loc.geo?.[1];

            return (
              <CircleMarker
                key={key}
                center={[lat, lon]}
                radius={isSelected ? 25 : 18}
                pathOptions={{
                  color: mapStyle === 'light' ? '#333' : '#fff',
                  fillColor: color,
                  fillOpacity: 0.85,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedRegion(key),
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <h4 className="font-semibold text-gray-100">
                        {loc.name || key}
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span 
                        className="text-3xl font-display font-bold"
                        style={{ color }}
                      >
                        {aqi}
                      </span>
                      <span className="text-gray-400 text-sm">AQI</span>
                    </div>
                    <p 
                      className="text-sm px-2 py-1 rounded-full inline-block"
                      style={{ 
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      {getAqiLabel(aqi)}
                    </p>
                    {data.pollutants && (
                      <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400 space-y-1">
                        <p>PM2.5: {data.pollutants.pm25?.toFixed(1) || '--'} µg/m³</p>
                        <p>PM10: {data.pollutants.pm10?.toFixed(1) || '--'} µg/m³</p>
                        {data.pollutants.no2 && <p>NO₂: {data.pollutants.no2?.toFixed(1)} µg/m³</p>}
                      </div>
                    )}
                    {data.cpcbId && (
                      <p className="text-xs text-gray-500 mt-2">
                        Station: {data.cpcbId}
                      </p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Fire Hotspots */}
          {hotspots?.hotspots?.map((hotspot, index) => (
            <CircleMarker
              key={`hotspot-${index}`}
              center={[hotspot.latitude, hotspot.longitude]}
              radius={6 + (hotspot.confidence / 20)}
              pathOptions={{
                color: '#ff4500',
                fillColor: '#ff4500',
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <Popup>
                <div className="min-w-[140px]">
                  <h4 className="font-semibold text-orange-400 mb-1 flex items-center gap-1">
                    <Flame className="w-4 h-4" /> Fire Hotspot
                  </h4>
                  <p className="text-sm text-gray-300">
                    Confidence: {hotspot.confidence}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Brightness: {Math.round(hotspot.brightness)} K
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Source: {hotspot.satellite || 'NASA FIRMS'}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* CPCB-Style Legend */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Object.entries(INDIAN_AQI_LEVELS).map(([key, level]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div 
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-xs text-gray-400">
                {level.label} ({level.min}-{level.max})
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-400">Fire Hotspot</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
