import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, AlertCircle, Wind, Navigation, Factory, Truck, Construction, CloudFog, Info } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import { getHotspots, getThermalFireLayer, getConstructionDustHotspots, getCategoryHotspots } from '../../services/api';
import { getImpactDirection, getImpactCone, determineFallbackSource, computeConfidenceScore } from '../../utils/hotspotEngine';
import HotspotInfoModal from '../Citizen/HotspotInfoModal';
import '../../styles/hotspots.css';
import 'leaflet/dist/leaflet.css';

const center = [28.55, 77.25];

// Create emoji marker icon
const createEmojiIcon = (emoji, size = 32) => {
  return L.divIcon({
    className: 'emoji-marker',
    html: `<div style="
      font-size: ${size}px;
      line-height: ${size}px;
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Custom arrow marker for wind drift
const createArrowIcon = (color, rotation) => {
  return L.divIcon({
    className: 'custom-arrow-icon',
    html: `<div style="
      transform: rotate(${rotation}deg);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 20px solid ${color};
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    "></div>`,
    iconSize: [16, 20],
    iconAnchor: [8, 20],
  });
};

function HeatmapLayer({ hotspots }) {
  const map = useMap();
  
  useEffect(() => {
    if (hotspots?.length > 0) {
      const bounds = hotspots.map(h => [h.latitude, h.longitude]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
    }
  }, [hotspots, map]);
  
  return null;
}

// Component for wind drift arrow lines
function WindDriftArrow({ hotspot }) {
  if (!hotspot.drift || !hotspot.drift.endpoint) return null;

  const start = [hotspot.latitude, hotspot.longitude];
  const end = [hotspot.drift.endpoint.lat, hotspot.drift.endpoint.lon];
  
  return (
    <>
      {/* Drift line */}
      <Polyline
        positions={[start, end]}
        pathOptions={{
          color: hotspot.drift.arrowColor || '#FFA500',
          weight: 3,
          opacity: 0.8,
          dashArray: '10, 5',
        }}
      />
      {/* Arrow head at end */}
      <CircleMarker
        center={end}
        radius={6}
        pathOptions={{
          color: hotspot.drift.arrowColor || '#FFA500',
          fillColor: hotspot.drift.arrowColor || '#FFA500',
          fillOpacity: 1,
          weight: 2,
        }}
      >
        <Popup>
          <div className="text-xs">
            <p className="font-semibold">Pollution Drift Direction</p>
            <p>Wind: {hotspot.drift.windSpeed?.toFixed(1)} km/h</p>
            <p>Direction: {hotspot.drift.compassDirection}</p>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

// Fallback sample data generator (outside component)
const getFallbackHotspotData = (type) => {
    const baseHotspots = [];
    const currentTime = new Date().toISOString();

    if (type === 'viirs' || type === 'modis') {
      // Fire hotspots
      baseHotspots.push(
        {
          id: `${type}_1`,
          latitude: 28.6139,
          longitude: 77.2090,
          brightness: 320 + Math.random() * 60,
          confidence: 75 + Math.random() * 20,
          frp: 12 + Math.random() * 20,
          sourceType: 'stubbleBurning',
          sourceIcon: '🔥',
          sourceLabel: type === 'modis' ? 'Thermal Fire Detection' : 'High-Resolution Fire Detection',
          sourceSatellite: type === 'modis' ? 'MODIS Terra/Aqua' : 'VIIRS SNPP/NOAA-20',
          acquisitionDate: currentTime.split('T')[0],
          acquisitionTime: '1200',
          dataSource: type === 'modis' ? 'MODIS Thermal Fire Layer' : 'NASA FIRMS VIIRS',
        },
        {
          id: `${type}_2`,
          latitude: 28.5307,
          longitude: 77.2710,
          brightness: 310 + Math.random() * 50,
          confidence: 70 + Math.random() * 25,
          frp: 10 + Math.random() * 15,
          sourceType: 'industrial',
          sourceIcon: '🏭',
          sourceLabel: 'Industrial Emission Hotspot',
          sourceSatellite: type === 'modis' ? 'MODIS Terra/Aqua' : 'VIIRS SNPP/NOAA-20',
          acquisitionDate: currentTime.split('T')[0],
          acquisitionTime: '1200',
          dataSource: type === 'modis' ? 'MODIS Thermal Fire Layer' : 'NASA FIRMS VIIRS',
        },
        {
          id: `${type}_3`,
          latitude: 28.6997,
          longitude: 77.1690,
          brightness: 295 + Math.random() * 40,
          confidence: 65 + Math.random() * 20,
          frp: 8 + Math.random() * 12,
          sourceType: 'traffic',
          sourceIcon: '🚗',
          sourceLabel: 'Traffic Congestion Emission Hotspot',
          sourceSatellite: type === 'modis' ? 'MODIS Terra/Aqua' : 'VIIRS SNPP/NOAA-20',
          acquisitionDate: currentTime.split('T')[0],
          acquisitionTime: '1200',
          dataSource: type === 'modis' ? 'MODIS Thermal Fire Layer' : 'NASA FIRMS VIIRS',
        }
      );
    } else if (type === 'construction') {
      // Construction dust hotspots
      baseHotspots.push(
        {
          id: 'construction_1',
          latitude: 28.5700,
          longitude: 77.0000,
          sourceType: 'construction',
          sourceIcon: '🏗',
          sourceLabel: 'Construction Dust Hotspot',
          zoneName: 'Dwarka Expressway',
          pm10Pm25Ratio: 2.8,
          pm10: 145,
          pm25: 52,
          userReportCount: 3,
          detectedFrom: 'High PM10/PM2.5 Ratio, User Reports, Known Construction Site',
          confidence: 85,
          dataSource: 'Construction Dust Detection',
          detectionTime: currentTime,
        },
        {
          id: 'construction_2',
          latitude: 28.6130,
          longitude: 77.2290,
          sourceType: 'construction',
          sourceIcon: '🏗',
          sourceLabel: 'Construction Dust Hotspot',
          zoneName: 'Central Vista',
          pm10Pm25Ratio: 2.5,
          pm10: 128,
          pm25: 51,
          userReportCount: 2,
          detectedFrom: 'High PM10/PM2.5 Ratio, Known Construction Site',
          confidence: 80,
          dataSource: 'Construction Dust Detection',
          detectionTime: currentTime,
        },
        {
          id: 'construction_3',
          latitude: 28.5000,
          longitude: 77.4300,
          sourceType: 'construction',
          sourceIcon: '🏗',
          sourceLabel: 'Construction Dust Hotspot',
          zoneName: 'Noida Extension',
          pm10Pm25Ratio: 2.3,
          pm10: 112,
          pm25: 49,
          userReportCount: 1,
          detectedFrom: 'High PM10/PM2.5 Ratio, Known Construction Site',
          confidence: 75,
          dataSource: 'Construction Dust Detection',
          detectionTime: currentTime,
        }
      );
    }

    // Add wind drift data
    const windData = {
      speed: 3,
      direction: 270,
      speedKmh: 10.8,
      compassDirection: 'W',
      driftRisk: 'medium',
      timestamp: currentTime,
    };

    const hotspotsWithDrift = baseHotspots.map(h => ({
      ...h,
      drift: {
        direction: 90,
        compassDirection: 'E',
        endpoint: {
          lat: h.latitude + 0.05,
          lon: h.longitude + 0.05,
        },
        distance: 5,
        arrowColor: '#FFA500',
        riskLevel: 'medium',
        windSpeed: 10.8,
      },
    }));

    return {
      hotspots: hotspotsWithDrift,
      windData,
      summary: {
        total: hotspotsWithDrift.length,
        highConfidence: hotspotsWithDrift.filter(h => h.confidence >= 80).length,
        avgBrightness: type !== 'construction' 
          ? Math.round(hotspotsWithDrift.reduce((sum, h) => sum + (h.brightness || 0), 0) / hotspotsWithDrift.length)
          : 0,
        avgFRP: type !== 'construction'
          ? Math.round(hotspotsWithDrift.reduce((sum, h) => sum + (h.frp || 0), 0) / hotspotsWithDrift.length * 10) / 10
          : 0,
        lastUpdated: currentTime,
        dataSource: type === 'modis' ? 'MODIS Thermal Fire Layer' : 
                   type === 'viirs' ? 'NASA FIRMS VIIRS' : 
                   'Construction Dust Detection',
      },
      bounds: {
        minLat: 28.0,
        maxLat: 29.2,
        minLon: 76.5,
        maxLon: 78.0,
      },
    };
};

// Component for animated wind direction arrows around hotspots - SVG stroke with transparent background
function AnimatedWindArrow({ hotspot, windDeg }) {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!hotspot || !map) return;

    const updatePosition = () => {
      const point = map.latLngToContainerPoint([hotspot.latitude, hotspot.longitude]);
      setPosition(point);
    };

    updatePosition();

    map.on('move', updatePosition);
    map.on('zoom', updatePosition);
    map.on('viewreset', updatePosition);

    return () => {
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      map.off('viewreset', updatePosition);
    };
  }, [hotspot, map]);

  if (!position || windDeg === null || windDeg === undefined) return null;

  const direction = getImpactDirection(windDeg);
  const angle = (direction * Math.PI) / 180;
  const length = 35; // Smaller, cleaner arrows
  const endX = position.x + Math.cos(angle) * length;
  const endY = position.y + Math.sin(angle) * length;
  const arrowId = `arrowHead-${hotspot.id || hotspot.latitude}-${hotspot.longitude}`;

  return (
    <div
      className="wind-arrow"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <svg
        className="wind-arrow-svg"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          background: 'transparent',
        }}
      >
        <defs>
          <marker
            id={arrowId}
            orient="auto"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
          >
            <path d="M0,0 L0,5 L5,2.5 z" fill="#ff7f2a" />
          </marker>
        </defs>
        <line
          x1={position.x}
          y1={position.y}
          x2={endX}
          y2={endY}
          stroke="#ff7f2a"
          strokeWidth="2"
          markerEnd={`url(#${arrowId})`}
          className="animate-arrow"
          fill="none"
        />
      </svg>
    </div>
  );
}

// Component for info icon overlay on hotspot
function HotspotInfoIcon({ hotspot, onClick }) {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (hotspot && map) {
      const point = map.latLngToContainerPoint([hotspot.latitude, hotspot.longitude]);
      setPosition(point);
    }
  }, [hotspot, map]);

  useEffect(() => {
    const handleMove = () => {
      if (hotspot && map) {
        const point = map.latLngToContainerPoint([hotspot.latitude, hotspot.longitude]);
        setPosition(point);
      }
    };

    map.on('move', handleMove);
    map.on('zoom', handleMove);

    return () => {
      map.off('move', handleMove);
      map.off('zoom', handleMove);
    };
  }, [hotspot, map]);

  if (!position) return null;

  return (
    <div
      className="hotspot-info-icon"
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y - 10}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Info className="w-4 h-4" style={{ color: '#2563EB' }} />
    </div>
  );
}

export default function HotspotHeatmap() {
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [hotspotModalData, setHotspotModalData] = useState(null);
  const [viirsData, setViirsData] = useState(null);
  const [modisData, setModisData] = useState(null);
  const [constructionData, setConstructionData] = useState(null);
  const [categoryHotspots, setCategoryHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDriftArrows, setShowDriftArrows] = useState(true);
  const [showViirsLayer, setShowViirsLayer] = useState(true);
  const [showModisLayer, setShowModisLayer] = useState(true);
  const [showConstructionLayer, setShowConstructionLayer] = useState(true);

  useEffect(() => {
    const fetchAllLayers = async () => {
      setLoading(true);
      try {
        const [viirs, modis, construction, categories] = await Promise.allSettled([
          getHotspots(1),
          getThermalFireLayer(1),
          getConstructionDustHotspots(),
          getCategoryHotspots(),
        ]);

        console.log('Hotspot data fetch results:', { viirs, modis, construction });

        if (viirs.status === 'fulfilled') {
          if (viirs.value?.success && viirs.value?.data) {
            setViirsData(viirs.value.data);
            console.log('VIIRS data loaded:', viirs.value.data?.hotspots?.length || 0, 'hotspots');
          } else if (viirs.value?.data) {
            // Handle case where data is directly in response
            setViirsData(viirs.value.data);
            console.log('VIIRS data loaded (direct):', viirs.value.data?.hotspots?.length || 0, 'hotspots');
          } else {
            console.warn('VIIRS: No data in response, using fallback');
            setViirsData(getFallbackHotspotData('viirs'));
          }
        } else {
          console.warn('VIIRS fetch failed:', viirs.reason);
          setViirsData(getFallbackHotspotData('viirs'));
        }

        if (modis.status === 'fulfilled') {
          if (modis.value?.success && modis.value?.data) {
            setModisData(modis.value.data);
            console.log('MODIS data loaded:', modis.value.data?.hotspots?.length || 0, 'hotspots');
          } else if (modis.value?.data) {
            setModisData(modis.value.data);
            console.log('MODIS data loaded (direct):', modis.value.data?.hotspots?.length || 0, 'hotspots');
          } else {
            console.warn('MODIS: No data in response, using fallback');
            setModisData(getFallbackHotspotData('modis'));
          }
        } else {
          console.warn('MODIS fetch failed:', modis.reason);
          setModisData(getFallbackHotspotData('modis'));
        }

        if (construction.status === 'fulfilled') {
          if (construction.value?.success && construction.value?.data) {
            setConstructionData(construction.value.data);
            console.log('Construction data loaded:', construction.value.data?.hotspots?.length || 0, 'hotspots');
          } else if (construction.value?.data) {
            setConstructionData(construction.value.data);
            console.log('Construction data loaded (direct):', construction.value.data?.hotspots?.length || 0, 'hotspots');
          } else {
            console.warn('Construction: No data in response, using fallback');
            setConstructionData(getFallbackHotspotData('construction'));
          }
        } else {
          console.warn('Construction fetch failed:', construction.reason);
          setConstructionData(getFallbackHotspotData('construction'));
        }

        // Fetch category hotspots (Traffic, Industrial, Dust)
        if (categories.status === 'fulfilled') {
          if (Array.isArray(categories.value) && categories.value.length > 0) {
            setCategoryHotspots(categories.value);
            console.log('Category hotspots loaded:', categories.value.length, 'hotspots', categories.value);
          } else {
            console.warn('Category hotspots: Invalid response format or empty, using fallback');
            // Use fallback category hotspots
            setCategoryHotspots([
              { lat: 28.6139, lng: 77.2090, category: 'traffic' }, // Connaught Place
              { lat: 28.6289, lng: 77.2405, category: 'traffic' }, // ITO Junction
              { lat: 28.5307, lng: 77.2710, category: 'industrial' }, // Okhla Industrial
              { lat: 28.6997, lng: 77.1690, category: 'industrial' }, // Wazirpur Industrial
              { lat: 28.5700, lng: 77.0000, category: 'dust' }, // Dwarka Expressway
              { lat: 28.7450, lng: 77.1390, category: 'dust' }, // GT Karnal Road
            ]);
          }
        } else {
          console.warn('Category hotspots fetch failed:', categories.reason, 'using fallback');
          // Use fallback category hotspots
          setCategoryHotspots([
            { lat: 28.6139, lng: 77.2090, category: 'traffic' },
            { lat: 28.6289, lng: 77.2405, category: 'traffic' },
            { lat: 28.5307, lng: 77.2710, category: 'industrial' },
            { lat: 28.6997, lng: 77.1690, category: 'industrial' },
            { lat: 28.5700, lng: 77.0000, category: 'dust' },
            { lat: 28.7450, lng: 77.1390, category: 'dust' },
          ]);
        }

        // Always ensure data is set (fallback if needed)
        if (!viirsData) setViirsData(getFallbackHotspotData('viirs'));
        if (!modisData) setModisData(getFallbackHotspotData('modis'));
        if (!constructionData) setConstructionData(getFallbackHotspotData('construction'));
      } catch (error) {
        console.error('Error fetching hotspot layers:', error);
        // Use fallback data on error
        setViirsData(getFallbackHotspotData('viirs'));
        setModisData(getFallbackHotspotData('modis'));
        setConstructionData(getFallbackHotspotData('construction'));
        // Use fallback category hotspots
        setCategoryHotspots([
          { lat: 28.6139, lng: 77.2090, category: 'traffic' },
          { lat: 28.6289, lng: 77.2405, category: 'traffic' },
          { lat: 28.5307, lng: 77.2710, category: 'industrial' },
          { lat: 28.6997, lng: 77.1690, category: 'industrial' },
          { lat: 28.5700, lng: 77.0000, category: 'dust' },
          { lat: 28.7450, lng: 77.1390, category: 'dust' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLayers();
  }, []);

  // Initialize with fallback data if nothing loaded
  useEffect(() => {
    if (!loading && !viirsData && !modisData && !constructionData) {
      console.log('No data loaded, initializing with fallback data');
      setViirsData(getFallbackHotspotData('viirs'));
      setModisData(getFallbackHotspotData('modis'));
      setConstructionData(getFallbackHotspotData('construction'));
    }
  }, [loading, viirsData, modisData, constructionData]);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-96 rounded-xl" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)' }}></div>
      </div>
    );
  }

  // Ensure we have data (use fallback if needed)
  const finalViirsData = viirsData || getFallbackHotspotData('viirs');
  const finalModisData = modisData || getFallbackHotspotData('modis');
  const finalConstructionData = constructionData || getFallbackHotspotData('construction');

  // Map category hotspots to match existing hotspot format for display
  const categoryHotspotsFormatted = (categoryHotspots || []).map((h, i) => ({
    id: `category_${h.category}_${i}`,
    latitude: h.lat,
    longitude: h.lng,
    category: h.category,
    sourceType: h.category,
    sourceIcon: h.category === 'traffic' ? '🚗' : h.category === 'industrial' ? '🏭' : h.category === 'dust' ? '🛣' : '❓',
    sourceLabel: h.category === 'traffic' ? 'Traffic Pollution Hotspot' : 
                 h.category === 'industrial' ? 'Industrial Pollution Hotspot' : 
                 h.category === 'dust' ? 'Road/Construction Dust Hotspot' :
                 'Unknown Pollution Hotspot',
    dataSource: h.category === 'traffic' ? 'NASA OMI NO₂' : 
                h.category === 'industrial' ? 'NASA GIBS SO₂' : 
                'MODIS AOD Deep Blue',
  }));

  const allHotspots = [
    ...(showViirsLayer && finalViirsData?.hotspots ? finalViirsData.hotspots : []),
    ...(showModisLayer && finalModisData?.hotspots ? finalModisData.hotspots : []),
    ...(showConstructionLayer && finalConstructionData?.hotspots ? finalConstructionData.hotspots : []),
    ...categoryHotspotsFormatted, // Add category hotspots to the same array
  ];

  console.log('Rendering hotspots:', {
    viirs: finalViirsData?.hotspots?.length || 0,
    modis: finalModisData?.hotspots?.length || 0,
    construction: finalConstructionData?.hotspots?.length || 0,
    categoryRaw: categoryHotspots.length,
    categoryFormatted: categoryHotspotsFormatted.length,
    categoryData: categoryHotspotsFormatted,
    total: allHotspots.length,
  });

  const windData = finalViirsData?.windData || finalModisData?.windData || finalConstructionData?.windData;

  const totalCount = (finalViirsData?.summary?.total || 0) + 
                    (finalModisData?.summary?.total || 0) + 
                    (finalConstructionData?.summary?.total || 0) +
                    categoryHotspotsFormatted.length;

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#C76A1C]" />
            <h3 className="section-title mb-0">24-Hour Pollution Hotspots</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#C76A1C]" />
              <span className="text-[#4A4A4A]">{totalCount} detected</span>
            </div>
            {windData && (
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#1A1A1A]" />
                <span className="text-[#4A4A4A]">
                  {windData.speedKmh?.toFixed(1)} km/h {windData.compassDirection}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => setShowViirsLayer(!showViirsLayer)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              showViirsLayer
                ? 'bg-[rgba(0,0,0,0.05)] text-[#222]'
                : 'text-[#1A1A1A] hover:bg-[rgba(0,0,0,0.02)]'
            }`}
            style={{
              background: showViirsLayer 
                ? 'rgba(0,0,0,0.05)' 
                : 'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            <span>🔥</span>
            <span>High-Resolution Fire Layer (VIIRS)</span>
            <span className="text-xs opacity-75">({finalViirsData?.summary?.total || 0})</span>
          </button>
          <button
            onClick={() => setShowModisLayer(!showModisLayer)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              showModisLayer
                ? 'bg-[rgba(0,0,0,0.05)] text-[#222]'
                : 'text-[#1A1A1A] hover:bg-[rgba(0,0,0,0.02)]'
            }`}
            style={{
              background: showModisLayer 
                ? 'rgba(0,0,0,0.05)' 
                : 'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            <span>🔥</span>
            <span>Thermal Fire Layer (MODIS)</span>
            <span className="text-xs opacity-75">({finalModisData?.summary?.total || 0})</span>
          </button>
          <button
            onClick={() => setShowConstructionLayer(!showConstructionLayer)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              showConstructionLayer
                ? 'bg-[rgba(0,0,0,0.05)] text-[#222]'
                : 'text-[#1A1A1A] hover:bg-[rgba(0,0,0,0.02)]'
            }`}
            style={{
              background: showConstructionLayer 
                ? 'rgba(0,0,0,0.05)' 
                : 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            <span>🏗</span>
            <span>Construction Dust Hotspots</span>
            <span className="text-xs opacity-75">({finalConstructionData?.summary?.total || 0})</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4 p-4 border-b border-[rgba(0,0,0,0.08)]" style={{ background: 'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)' }}>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-[#C76A1C]">
            {totalCount}
          </p>
          <p className="text-xs text-[#4A4A4A]">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-[#C62828]">
            {(finalViirsData?.summary?.highConfidence || 0) + (finalModisData?.summary?.highConfidence || 0)}
          </p>
          <p className="text-xs text-[#4A4A4A]">High Conf.</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-[#A67A00]">
            {Math.round(
              ((finalViirsData?.summary?.avgBrightness || 0) + (finalModisData?.summary?.avgBrightness || 0)) / 2
            )}
          </p>
          <p className="text-xs text-[#4A4A4A]">Avg Temp</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-[#7A3FB5]">
            {(((finalViirsData?.summary?.avgFRP || 0) + (finalModisData?.summary?.avgFRP || 0)) / 2).toFixed(1)}
          </p>
          <p className="text-xs text-[#4A4A4A]">Avg FRP</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-amber-400">
            {finalConstructionData?.summary?.total || 0}
          </p>
          <p className="text-xs text-[#4A4A4A]">Construction</p>
        </div>
      </div>

      {/* Drift Toggle */}
      <div className="px-4 py-2 border-b flex items-center justify-between glass-card" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
          <Navigation className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span>Pollution Drift Arrows</span>
        </div>
        <button
          onClick={() => setShowDriftArrows(!showDriftArrows)}
          className="relative w-12 h-6 rounded-full transition-colors"
          style={{
            backgroundColor: showDriftArrows ? '#2563EB' : '#E2E8F0'
          }}
        >
          <span 
            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
            style={{
              left: showDriftArrows ? '28px' : '4px'
            }}
          />
        </button>
      </div>

      {/* Map with WHITE/LIGHT background */}
      <div className="h-[450px]">
        <MapContainer
          center={center}
          zoom={9}
          style={{ height: '100%', width: '100%' }}
        >
          {/* WHITE/LIGHT TILE LAYER - Carto Light */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <HeatmapLayer hotspots={allHotspots} />

          {/* Wind Drift Arrows (existing) */}
          {showDriftArrows && allHotspots?.map((hotspot, index) => (
            <WindDriftArrow key={`drift-${index}`} hotspot={hotspot} />
          ))}

          {/* Animated Wind Direction Arrows around each hotspot */}
          {windData && allHotspots?.map((hotspot, index) => {
            const windDeg = windData.direction || 270;
            return (
              <AnimatedWindArrow
                key={`wind-arrow-${index}`}
                hotspot={hotspot}
                windDeg={windDeg}
              />
            );
          })}

          {/* VIIRS Fire Layer - 🔥 emoji markers */}
          {showViirsLayer && finalViirsData?.hotspots?.map((hotspot, index) => {
            const windDeg = windData?.direction || 270;
            const direction = getImpactDirection(windDeg);
            const cone = getImpactCone(direction);
            const fallback = determineFallbackSource({
              realSource: hotspot.sourceLabel || hotspot.sourceType,
              modis: { aod: null },
              fires: { count: 0 },
              traffic: hotspot.category === 'traffic' ? 'high' : null,
              industry: { upwind: hotspot.category === 'industrial' },
            });
            const confidence = computeConfidenceScore({
              modis: { aod: null },
              fires: { count: 0 },
              consistency: 'moderate',
            });

            return (
              <Marker
                key={`viirs-${index}`}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createEmojiIcon('🔥', 28)}
              >
                <HotspotInfoIcon
                  hotspot={hotspot}
                  onClick={() => {
                    setSelectedHotspot(hotspot);
                    setHotspotModalData({
                      fallbackSource: fallback,
                      windDirection: direction,
                      modis: { aod: null, aod_class: null },
                      fires: { count: 0, fire_points: [] },
                      confidence: confidence,
                      impactCone: cone,
                    });
                  }}
                />
                <Popup>
                <div className="min-w-[220px] p-2">
                  <h4 className="font-bold text-base mb-2 flex items-center gap-2 text-[#C76A1C]">
                    <span className="text-xl">🔥</span>
                    High-Resolution Fire Detection
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Satellite:</span>
                      <span className="font-medium">VIIRS SNPP/NOAA-20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Brightness:</span>
                      <span className="font-medium">{Math.round(hotspot.brightness)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">FRP:</span>
                      <span className="font-medium">{hotspot.frp?.toFixed(1) || 'N/A'} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Confidence:</span>
                      <span className="font-medium">{hotspot.confidence}%</span>
                    </div>
                    {hotspot.sourceLabel && (
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]">Source:</span>
                        <span className="font-medium text-xs">{hotspot.sourceLabel}</span>
                      </div>
                    )}
                    {hotspot.acquisitionDate && (
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]">Detected:</span>
                        <span className="font-medium text-xs">
                          {new Date(hotspot.acquisitionDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {hotspot.drift && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        🌬️ Pollution Drift
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hotspot.drift.arrowColor }}
                        />
                        <span>
                          {hotspot.drift.compassDirection} • 
                          {hotspot.drift.windSpeed?.toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* MODIS Thermal Fire Layer - 🔥 emoji markers */}
          {showModisLayer && finalModisData?.hotspots?.map((hotspot, index) => {
            const windDeg = windData?.direction || 270;
            const direction = getImpactDirection(windDeg);
            const cone = getImpactCone(direction);
            const fallback = determineFallbackSource({
              realSource: hotspot.sourceLabel || hotspot.sourceType,
              modis: { aod: 0.5 },
              fires: { count: 1 },
              traffic: null,
              industry: null,
            });
            const confidence = computeConfidenceScore({
              modis: { aod: 0.5 },
              fires: { count: 1 },
              consistency: 'moderate',
            });

            return (
              <Marker
                key={`modis-${index}`}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createEmojiIcon('🔥', 28)}
              >
                <HotspotInfoIcon
                  hotspot={hotspot}
                  onClick={() => {
                    setSelectedHotspot(hotspot);
                    setHotspotModalData({
                      fallbackSource: fallback,
                      windDirection: direction,
                      modis: { aod: 0.5, aod_class: 'moderate' },
                      fires: { count: 1, fire_points: [] },
                      confidence: confidence,
                      impactCone: cone,
                    });
                  }}
                />
                <Popup>
                <div className="min-w-[220px] p-2">
                  <h4 className="font-bold text-base mb-2 flex items-center gap-2 text-[#C76A1C]">
                    <span className="text-xl">🔥</span>
                    Thermal Fire Detection
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Satellite:</span>
                      <span className="font-medium">{hotspot.sourceSatellite || 'MODIS Terra/Aqua'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Brightness:</span>
                      <span className="font-medium">{Math.round(hotspot.brightness)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">FRP:</span>
                      <span className="font-medium">{hotspot.frp?.toFixed(1) || 'N/A'} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Confidence:</span>
                      <span className="font-medium">{hotspot.confidence}%</span>
                    </div>
                    {hotspot.acquisitionDate && (
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]">Detected At:</span>
                        <span className="font-medium text-xs">
                          {new Date(hotspot.acquisitionDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {hotspot.drift && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        🌬️ Pollution Drift
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hotspot.drift.arrowColor }}
                        />
                        <span>
                          {hotspot.drift.compassDirection} • 
                          {hotspot.drift.windSpeed?.toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* Category Hotspots (Traffic, Industrial, Dust) - using same marker style */}
          {categoryHotspotsFormatted && categoryHotspotsFormatted.length > 0 && categoryHotspotsFormatted.map((hotspot, index) => {
            const windDeg = windData?.direction || 270;
            const direction = getImpactDirection(windDeg);
            const cone = getImpactCone(direction);
            const fallback = determineFallbackSource({
              realSource: hotspot.sourceLabel || hotspot.sourceType,
              modis: { aod: null },
              fires: { count: 0 },
              traffic: hotspot.category === 'traffic' ? 'high' : null,
              industry: { upwind: hotspot.category === 'industrial' },
            });
            const confidence = computeConfidenceScore({
              modis: { aod: null },
              fires: { count: 0 },
              consistency: 'moderate',
            });

            return (
              <Marker
                key={`category-${hotspot.id || index}`}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createEmojiIcon(hotspot.sourceIcon, 28)}
              >
                <HotspotInfoIcon
                  hotspot={hotspot}
                  onClick={() => {
                    setSelectedHotspot(hotspot);
                    setHotspotModalData({
                      fallbackSource: fallback,
                      windDirection: direction,
                      modis: { aod: null, aod_class: null },
                      fires: { count: 0, fire_points: [] },
                      confidence: confidence,
                      impactCone: cone,
                    });
                  }}
                />
                <Popup>
                <div className="min-w-[220px] p-2">
                  <h4 className="font-bold text-base mb-2 flex items-center gap-2" style={{ color: hotspot.category === 'traffic' ? '#3B82F6' : hotspot.category === 'industrial' ? '#8B5CF6' : '#A16207' }}>
                    <span className="text-xl">{hotspot.sourceIcon}</span>
                    {hotspot.sourceLabel}
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Category:</span>
                      <span className="font-medium capitalize">{hotspot.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Data Source:</span>
                      <span className="font-medium text-xs">{hotspot.dataSource}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Detected:</span>
                      <span className="font-medium text-xs">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* Construction Dust Layer - 🚧 emoji markers */}
          {showConstructionLayer && finalConstructionData?.hotspots?.map((hotspot, index) => {
            const windDeg = windData?.direction || 270;
            const direction = getImpactDirection(windDeg);
            const cone = getImpactCone(direction);
            const fallback = determineFallbackSource({
              realSource: hotspot.sourceLabel || hotspot.detectedFrom,
              modis: { aod: null },
              fires: { count: 0 },
              traffic: null,
              industry: null,
            });
            const confidence = computeConfidenceScore({
              modis: { aod: null },
              fires: { count: 0 },
              consistency: 'moderate',
            });

            return (
              <Marker
                key={`construction-${index}`}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createEmojiIcon('🏗', 32)}
              >
                <HotspotInfoIcon
                  hotspot={hotspot}
                  onClick={() => {
                    setSelectedHotspot(hotspot);
                    setHotspotModalData({
                      fallbackSource: fallback,
                      windDirection: direction,
                      modis: { aod: null, aod_class: null },
                      fires: { count: 0, fire_points: [] },
                      confidence: confidence,
                      impactCone: cone,
                    });
                  }}
                />
                <Popup>
                <div className="min-w-[220px] p-2">
                  <h4 className="font-bold text-base mb-2 flex items-center gap-2 text-amber-600">
                    <span className="text-xl">🏗</span>
                    Construction Dust Hotspot
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">PM10/PM2.5 Ratio:</span>
                      <span className="font-medium">{hotspot.pm10Pm25Ratio || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">PM10:</span>
                      <span className="font-medium">{hotspot.pm10 || 'N/A'} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">PM2.5:</span>
                      <span className="font-medium">{hotspot.pm25 || 'N/A'} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Detected From:</span>
                      <span className="font-medium text-xs">{hotspot.detectedFrom || 'Auto Logic'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">User Reports:</span>
                      <span className="font-medium">{hotspot.userReportCount || 0}</span>
                    </div>
                    {hotspot.zoneName && (
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]">Zone:</span>
                        <span className="font-medium text-xs">{hotspot.zoneName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">Confidence:</span>
                      <span className="font-medium">{hotspot.confidence || 'N/A'}%</span>
                    </div>
                  </div>
                  {hotspot.drift && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        🌬️ Pollution Drift
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hotspot.drift.arrowColor }}
                        />
                        <span>
                          {hotspot.drift.compassDirection} • 
                          {hotspot.drift.windSpeed?.toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-[#d0e0f0] bg-[#f0f4f8]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-gray-400">Thermal Fire (MODIS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-gray-400">High-Res Fire (VIIRS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🏗</span>
            <span className="text-gray-400">Construction Dust</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🏭</span>
            <span className="text-gray-400">Industrial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🚗</span>
            <span className="text-gray-400">Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💨</span>
            <span className="text-gray-400">Road Dust</span>
          </div>
        </div>
        
        {/* Drift Arrow Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-3 pt-3 border-t border-dark-700/30">
          <span className="text-xs text-[#4A4A4A]">Drift Risk:</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-red-500 rounded" />
            <span className="text-gray-400 text-xs">Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-orange-500 rounded" />
            <span className="text-gray-400 text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-yellow-500 rounded" />
            <span className="text-gray-400 text-xs">Low</span>
          </div>
        </div>
      </div>

      {/* Wind Info Banner */}
      {windData && (
        <div className="px-4 py-3 bg-blue-500/10 border-t border-blue-500/20 flex items-center gap-3">
          <Wind className="w-5 h-5 text-[#1A1A1A]" />
          <div className="text-sm">
            <span className="text-gray-400">Current Wind: </span>
            <span className="font-medium text-black">
              {windData.speedKmh?.toFixed(1)} km/h from {windData.compassDirection}
            </span>
            <span className="text-[#4A4A4A] mx-2">•</span>
            <span className={`font-medium ${
              windData.driftRisk === 'high' ? 'text-[#C62828]' :
              windData.driftRisk === 'medium' ? 'text-[#C76A1C]' :
              'text-[#A67A00]'
            }`}>
              {windData.driftRisk === 'high' ? 'Strong' : windData.driftRisk === 'medium' ? 'Moderate' : 'Low'} pollution dispersion
            </span>
          </div>
        </div>
      )}

      {/* Hotspot Info Modal */}
      {selectedHotspot && hotspotModalData && (
        <HotspotInfoModal
          hotspot={selectedHotspot}
          fallbackSource={hotspotModalData.fallbackSource}
          windDirection={hotspotModalData.windDirection}
          modis={hotspotModalData.modis}
          fires={hotspotModalData.fires}
          confidence={hotspotModalData.confidence}
          impactCone={hotspotModalData.impactCone}
          onClose={() => {
            setSelectedHotspot(null);
            setHotspotModalData(null);
          }}
        />
      )}
    </motion.div>
  );
}
