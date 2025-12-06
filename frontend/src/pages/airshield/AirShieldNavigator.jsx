import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Navigation, MapPin, ArrowLeft, Search, Shield, 
  TrendingDown, Clock, Route, Wind, AlertCircle, CheckCircle2 
} from 'lucide-react';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import { recordSafeRouteUse } from '../../utils/pointsEngine';
import { checkAchievements } from '../../utils/achievementsEngine';

// Google Maps API Loader
let mapsLoaded = false;
let mapsLoading = false;
let loadPromise = null;

function loadGoogleMaps(apiKey) {
  if (mapsLoaded) return Promise.resolve();
  if (mapsLoading) return loadPromise;

  mapsLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      if (window.google && window.google.maps) {
        mapsLoaded = true;
        mapsLoading = false;
        resolve();
        return;
      }
      existingScript.onload = () => {
        mapsLoaded = true;
        mapsLoading = false;
        resolve();
      };
      existingScript.onerror = reject;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      mapsLoaded = true;
      mapsLoading = false;
      resolve();
    };

    script.onerror = () => {
      mapsLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export default function AirShieldNavigator() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [source, setSource] = useState({ lat: '', lng: '', name: '', placeId: '' });
  const [destination, setDestination] = useState({ lat: '', lng: '', name: '', placeId: '' });
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const sourceAutocompleteRef = useRef(null);
  const destAutocompleteRef = useRef(null);
  const sourceAutocompleteInstanceRef = useRef(null);
  const destAutocompleteInstanceRef = useRef(null);

  // Use centralized Safe Route API URL and ensure it includes `/api`
  const rawApiBase =
    import.meta.env.VITE_SAFE_ROUTE_API_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api';

  // Normalize to always include `/api` segment
  const API_BASE = (() => {
    let base = rawApiBase.trim().replace(/\/+$/, '');
    if (!base.endsWith('/api')) {
      base = `${base}/api`;
    }
    return base;
  })();

  // Load Google Maps on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is required. Please set VITE_GOOGLE_MAPS_API_KEY in frontend/.env.local');
      return;
    }

    loadGoogleMaps(apiKey)
      .then(() => {
        setMapsReady(true);
        initializeMap();
      })
      .catch((err) => {
        setError(`Failed to load Google Maps: ${err.message}`);
      });
  }, []);

  // Initialize autocomplete when maps are ready and refs are available
  useEffect(() => {
    if (!mapsReady || !window.google?.maps?.places) return;
    if (!sourceAutocompleteRef.current || !destAutocompleteRef.current) return;

    // Initialize Source Autocomplete
    if (!sourceAutocompleteInstanceRef.current) {
      sourceAutocompleteInstanceRef.current = new window.google.maps.places.Autocomplete(
        sourceAutocompleteRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'in' }, // Restrict to India
          fields: ['place_id', 'geometry', 'formatted_address', 'name'],
        }
      );

      sourceAutocompleteInstanceRef.current.addListener('place_changed', () => {
        const place = sourceAutocompleteInstanceRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const placeName = place.formatted_address || place.name || '';
          const placeId = place.place_id || '';
          
          setSource({
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            name: placeName,
            placeId: placeId
          });
          
          // Update input value to show selected place name
          if (sourceAutocompleteRef.current) {
            sourceAutocompleteRef.current.value = placeName;
          }
        }
      });
    }

    // Initialize Destination Autocomplete
    if (!destAutocompleteInstanceRef.current) {
      destAutocompleteInstanceRef.current = new window.google.maps.places.Autocomplete(
        destAutocompleteRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'in' }, // Restrict to India
          fields: ['place_id', 'geometry', 'formatted_address', 'name'],
        }
      );

      destAutocompleteInstanceRef.current.addListener('place_changed', () => {
        const place = destAutocompleteInstanceRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const placeName = place.formatted_address || place.name || '';
          const placeId = place.place_id || '';
          
          setDestination({
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            name: placeName,
            placeId: placeId
          });
          
          // Update input value to show selected place name
          if (destAutocompleteRef.current) {
            destAutocompleteRef.current.value = placeName;
          }
        }
      });
    }
  }, [mapsReady]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.2090 }, // Delhi
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
  };

  const clearMap = () => {
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current = [];
    markersRef.current = [];
  };

  const drawRoute = (route, isRecommended = false) => {
    if (!mapInstanceRef.current || !route.polylines_by_color) return;

    const zIndex = isRecommended ? 1000 : 100;
    const strokeWeight = isRecommended ? 6 : 4;
    const opacity = isRecommended ? 1.0 : 0.7;

    // First, draw a base Google-style route polyline (blue for recommended, grey for alternatives)
    try {
      const allPoints = [];
      route.polylines_by_color.forEach((colorGroup) => {
        if (colorGroup.polyline && window.google.maps.geometry?.encoding) {
          try {
            const decoded = window.google.maps.geometry.encoding.decodePath(colorGroup.polyline);
            allPoints.push(...decoded);
          } catch {
            if (colorGroup.coords) {
              colorGroup.coords.forEach((coord) => {
                allPoints.push(new window.google.maps.LatLng(coord[0], coord[1]));
              });
            }
          }
        } else if (colorGroup.coords) {
          colorGroup.coords.forEach((coord) => {
            allPoints.push(new window.google.maps.LatLng(coord[0], coord[1]));
          });
        }
      });

      if (allPoints.length > 1) {
        const basePolyline = new window.google.maps.Polyline({
          path: allPoints,
          strokeColor: isRecommended ? '#4285F4' : '#AAB7B8',
          strokeOpacity: isRecommended ? 1.0 : 0.7,
          strokeWeight: isRecommended ? 6 : 4,
          zIndex: zIndex,
          map: mapInstanceRef.current,
        });
        polylinesRef.current.push(basePolyline);
      }
    } catch (e) {
      console.warn('Failed to draw base Google-style polyline', e);
    }

    // Then overlay AQI-colored segments on top of the base route
    route.polylines_by_color.forEach((colorGroup) => {
      let decodedPath;
      
      // Try to decode polyline
      if (colorGroup.polyline && window.google.maps.geometry && window.google.maps.geometry.encoding) {
        try {
          decodedPath = window.google.maps.geometry.encoding.decodePath(colorGroup.polyline);
        } catch (e) {
          console.warn('Failed to decode polyline:', e);
          if (colorGroup.coords) {
            decodedPath = colorGroup.coords.map(coord => 
              new window.google.maps.LatLng(coord[0], coord[1])
            );
          } else {
            return;
          }
        }
      } else if (colorGroup.coords) {
        decodedPath = colorGroup.coords.map(coord => 
          new window.google.maps.LatLng(coord[0], coord[1])
        );
      } else {
        console.warn('No polyline or coords found in colorGroup');
        return;
      }

      // Determine pollution-based color if avg_aqi is present
      let strokeColor = colorGroup.color || '#2563EB';
      const avgAqi = colorGroup.avg_aqi;
      if (typeof avgAqi === 'number') {
        if (avgAqi < 100) strokeColor = '#2ecc71'; // Good
        else if (avgAqi < 200) strokeColor = '#f1c40f'; // Moderate
        else if (avgAqi < 300) strokeColor = '#e67e22'; // Poor
        else strokeColor = '#e74c3c'; // Very poor
      }

      const polyline = new window.google.maps.Polyline({
        path: decodedPath,
        strokeColor,
        strokeOpacity: opacity,
        strokeWeight: isRecommended ? 5 : 3,
        zIndex: zIndex + 1,
        map: mapInstanceRef.current
      });

      // Add click listener for segment info
      polyline.addListener('click', (event) => {
        const content = `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">Segment Info</div>
            <div>Average AQI: ${Math.round(colorGroup.avg_aqi || 100)}</div>
            <div>Length: ${((colorGroup.total_length_m || 0) / 1000).toFixed(2)} km</div>
            <div>Duration: ${((colorGroup.total_duration_s || 0) / 60).toFixed(1)} min</div>
          </div>
        `;
        
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.setPosition(event.latLng);
          infoWindowRef.current.open(mapInstanceRef.current);
        }
      });

      polylinesRef.current.push(polyline);
    });

    // Add markers for start and end
    if (route.polylines_by_color && route.polylines_by_color.length > 0) {
      const firstGroup = route.polylines_by_color[0];
      const lastGroup = route.polylines_by_color[route.polylines_by_color.length - 1];
      
      // Get start coordinates from first segment
      let startCoords = null;
      let endCoords = null;
      
      if (firstGroup.polyline && window.google.maps.geometry && window.google.maps.geometry.encoding) {
        try {
          const decoded = window.google.maps.geometry.encoding.decodePath(firstGroup.polyline);
          if (decoded.length > 0) startCoords = decoded[0];
        } catch (e) {
          if (firstGroup.coords && firstGroup.coords.length > 0) {
            startCoords = { lat: firstGroup.coords[0][0], lng: firstGroup.coords[0][1] };
          }
        }
      } else if (firstGroup.coords && firstGroup.coords.length > 0) {
        startCoords = { lat: firstGroup.coords[0][0], lng: firstGroup.coords[0][1] };
      }
      
      if (lastGroup.polyline && window.google.maps.geometry && window.google.maps.geometry.encoding) {
        try {
          const decoded = window.google.maps.geometry.encoding.decodePath(lastGroup.polyline);
          if (decoded.length > 0) endCoords = decoded[decoded.length - 1];
        } catch (e) {
          if (lastGroup.coords && lastGroup.coords.length > 0) {
            const last = lastGroup.coords[lastGroup.coords.length - 1];
            endCoords = { lat: last[0], lng: last[1] };
          }
        }
      } else if (lastGroup.coords && lastGroup.coords.length > 0) {
        const last = lastGroup.coords[lastGroup.coords.length - 1];
        endCoords = { lat: last[0], lng: last[1] };
      }

      if (startCoords) {
        const startMarker = new window.google.maps.Marker({
          position: startCoords,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 1001,
          title: 'Start',
        });
        markersRef.current.push(startMarker);
      }

      if (endCoords) {
        const endMarker = new window.google.maps.Marker({
          position: endCoords,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 1001,
          title: 'End',
        });
        markersRef.current.push(endMarker);
      }
    }

    // Fit bounds
    if (polylinesRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      route.polylines_by_color.forEach(colorGroup => {
        if (colorGroup.polyline && window.google.maps.geometry && window.google.maps.geometry.encoding) {
          try {
            const decoded = window.google.maps.geometry.encoding.decodePath(colorGroup.polyline);
            decoded.forEach(point => bounds.extend(point));
          } catch (e) {
            if (colorGroup.coords) {
              colorGroup.coords.forEach(coord => {
                bounds.extend(new window.google.maps.LatLng(coord[0], coord[1]));
              });
            }
          }
        } else if (colorGroup.coords) {
          colorGroup.coords.forEach(coord => {
            bounds.extend(new window.google.maps.LatLng(coord[0], coord[1]));
          });
        }
      });
      
      if (!bounds.isEmpty()) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  };

  const handleFindRoute = async () => {
    if (!source.lat || !source.lng || !destination.lat || !destination.lng) {
      setError('Please select both source and destination locations');
      return;
    }

    setLoading(true);
    setError(null);
    clearMap();

    try {
      // Use main backend API - http://localhost:5000/api/safe-route/find
      const url = new URL(`${API_BASE}/safe-route/find`);
      url.searchParams.append('source_lat', source.lat);
      url.searchParams.append('source_lng', source.lng);
      url.searchParams.append('dest_lat', destination.lat);
      url.searchParams.append('dest_lng', destination.lng);
      url.searchParams.append('weight_distance', '0.6');
      url.searchParams.append('weight_pollution', '0.3');
      url.searchParams.append('weight_traffic', '0.1');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: response.statusText,
          message: `HTTP ${response.status}` 
        }));
        
        // Provide user-friendly error messages
        let errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
        if (errorData.message && errorData.message.includes('Google Maps API key')) {
          errorMessage = 'Google Maps API key is invalid or missing. Please check backend/.env file.';
        } else if (errorData.message && errorData.message.includes('REQUEST_DENIED')) {
          errorMessage = 'Google Maps API key is invalid or Directions API is not enabled.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to calculate route');
      }
      
      setRouteData(data);
      
      if (data.recommended_route) {
        setSelectedRoute(data.recommended_route);
        drawRoute(data.recommended_route, true);
      }

      // Draw other routes (faded)
      if (data.all_routes && Array.isArray(data.all_routes)) {
        data.all_routes.forEach((route) => {
          if (route.route_id !== data.recommended_route?.route_id) {
            drawRoute(route, false);
          }
        });
      }

      // Points & achievements for using safe route
      recordSafeRouteUse();
      checkAchievements('safe_route');

    } catch (err) {
      const errorMsg = err.message || 'Failed to calculate route';
      setError(errorMsg);
      console.error('Route calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setSource({
            lat,
            lng,
            name: 'Current Location',
            placeId: ''
          });
          
          // Update the autocomplete input
          if (sourceAutocompleteRef.current) {
            sourceAutocompleteRef.current.value = 'Current Location';
          }
        },
        (error) => {
          setError(`Geolocation error: ${error.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const formatDistance = (meters) => {
    if (!meters) return '0 m';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      <Header />
      
      <main className="flex-1 flex" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Left Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#EFF6FF' }}>
                <Shield className="w-6 h-6" style={{ color: '#2563EB' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
                  AirShield Navigator
                </h1>
                <p className="text-sm" style={{ color: '#64748B' }}>
                  Low Pollution Route AI
                </p>
              </div>
            </div>

            {/* Input Fields with Google Places Autocomplete */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  <MapPin size={14} className="inline mr-1" />
                  Source
                </label>
                <div className="flex gap-2">
                  <input
                    ref={sourceAutocompleteRef}
                    type="text"
                    placeholder="Search Source Location"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ width: '100%' }}
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Use current location"
                  >
                    <Navigation size={16} />
                  </button>
                </div>
                {source.lat && source.lng && (
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {source.name || `${source.lat}, ${source.lng}`}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  <MapPin size={14} className="inline mr-1" />
                  Destination
                </label>
                <input
                  ref={destAutocompleteRef}
                  type="text"
                  placeholder="Search Destination Location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {destination.lat && destination.lng && (
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {destination.name || `${destination.lat}, ${destination.lng}`}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleFindRoute}
              disabled={loading || !source.lat || !destination.lat}
              className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: (loading || !source.lat || !destination.lat) ? '#9CA3AF' : '#2563EB',
                cursor: (loading || !source.lat || !destination.lat) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                'Calculating Route...'
              ) : (
                <>
                  <Search size={18} className="inline mr-2" />
                  Find Low Pollution Route
                </>
              )}
            </button>

            {error && (
              <div className="p-4 rounded-lg mb-4 flex items-center gap-2" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Route Summary Card */}
            {routeData && routeData.recommended_route && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border-2 mb-4"
                style={{
                  backgroundColor: '#EFF6FF',
                  borderColor: '#2563EB',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={18} style={{ color: '#2563EB' }} />
                  <span className="font-semibold" style={{ color: '#2563EB' }}>
                    Recommended Route
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs" style={{ color: '#64748B' }}>Distance</div>
                    <div className="font-semibold" style={{ color: '#0F172A' }}>
                      {formatDistance(routeData.recommended_route.distance_m)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: '#64748B' }}>Duration</div>
                    <div className="font-semibold" style={{ color: '#0F172A' }}>
                      {formatDuration(routeData.recommended_route.duration_s)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: '#64748B' }}>PM2.5 Exposure</div>
                    <div className="font-semibold" style={{ color: '#0F172A' }}>
                      {routeData.recommended_route.exposure?.toFixed(1) || 'N/A'} µg/m³
                    </div>
                  </div>
                  {routeData.comparison && (
                    <div>
                      <div className="text-xs" style={{ color: '#64748B' }}>Exposure Reduction</div>
                      <div className="font-semibold" style={{ color: '#22C55E' }}>
                        {routeData.comparison.exposure_reduction_pct > 0 ? '-' : '+'}
                        {Math.abs(routeData.comparison.exposure_reduction_pct || 0).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>

                {routeData.reason && (
                  <div className="text-sm p-2 rounded" style={{ backgroundColor: '#F8F9FA', color: '#374151' }}>
                    <strong>Why recommended:</strong> {routeData.reason}
                  </div>
                )}
              </motion.div>
            )}

            {/* Alternative Routes */}
            {routeData && routeData.all_routes && routeData.all_routes.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                  Alternative Routes
                </h3>
                <div className="space-y-2">
                  {routeData.all_routes.map((route, index) => (
                    <div
                      key={route.route_id || index}
                      onClick={() => {
                        setSelectedRoute(route);
                        clearMap();
                        routeData.all_routes.forEach(r => {
                          drawRoute(r, r.route_id === route.route_id);
                        });
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRoute?.route_id === route.route_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Route {index + 1}</span>
                        <span className="text-xs" style={{ color: '#64748B' }}>
                          {formatDistance(route.distance_m)} • {formatDuration(route.duration_s)}
                        </span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                        Exposure: {route.exposure?.toFixed(1) || 'N/A'} µg/m³
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Safety Tips */}
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                QUICK SAFETY TIPS
              </h3>
              <ul className="space-y-2 text-xs" style={{ color: '#64748B' }}>
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Check AQI before outdoor activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Use N95 masks when AQI &gt; 150</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Keep indoor air clean with purifiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Stay hydrated to help flush toxins</span>
                </li>
              </ul>
            </div>

            {/* Google Attribution */}
            <div className="mt-6 p-3 rounded text-xs" style={{ backgroundColor: '#F8F9FA', color: '#64748B' }}>
              <div className="font-semibold mb-1">Attribution</div>
              <div>Maps data ©2024 Google</div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div
            ref={mapRef}
            className="w-full h-full"
          />

          {!mapsReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Loading Google Maps...</div>
                <div className="text-sm" style={{ color: '#64748B' }}>
                  Please wait while we load the map
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

