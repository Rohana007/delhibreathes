import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Google Maps API key - should be in environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Polyline decoder utility (Google's encoded polyline algorithm)
function decodePolyline(encoded) {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  return poly;
}

// Convert waypoints array to coordinates
function waypointsToCoordinates(waypoints) {
  if (!waypoints || !Array.isArray(waypoints)) return [];
  
  // Handle different formats: [lon, lat] or {lat, lng} or {lat, lon}
  return waypoints.map(wp => {
    if (Array.isArray(wp)) {
      return { lat: wp[1], lng: wp[0] }; // [lon, lat] format
    } else if (wp.lat && wp.lng) {
      return { lat: wp.lat, lng: wp.lng };
    } else if (wp.lat && wp.lon) {
      return { lat: wp.lat, lng: wp.lon };
    }
    return null;
  }).filter(Boolean);
}

// Extract coordinates from route - tries multiple sources
function extractRouteCoordinates(route) {
  // Try waypoints first
  if (route.waypoints && route.waypoints.length > 0) {
    return waypointsToCoordinates(route.waypoints);
  }

  // Try geometry (encoded polyline string)
  if (route.geometry) {
    if (typeof route.geometry === 'string') {
      return decodePolyline(route.geometry);
    } else if (route.geometry.coordinates) {
      return waypointsToCoordinates(route.geometry.coordinates);
    }
  }

  // Try overview_polyline
  if (route.overview_polyline) {
    if (typeof route.overview_polyline === 'string') {
      return decodePolyline(route.overview_polyline);
    } else if (route.overview_polyline.points) {
      return decodePolyline(route.overview_polyline.points);
    }
  }

  // Try legs[0].steps[].polyline.points
  if (route.legs && route.legs.length > 0 && route.legs[0].steps) {
    const allPoints = [];
    route.legs[0].steps.forEach(step => {
      if (step.polyline && step.polyline.points) {
        const decoded = decodePolyline(step.polyline.points);
        allPoints.push(...decoded);
      }
    });
    if (allPoints.length > 0) {
      return allPoints;
    }
  }

  return [];
}

// Check if a point is close to any point in the green route (overlap detection)
function isPointNearGreenRoute(point, greenRoute, threshold = 0.0001) {
  return greenRoute.some(greenPoint => {
    const latDiff = Math.abs(point.lat - greenPoint.lat);
    const lngDiff = Math.abs(point.lng - greenPoint.lng);
    return latDiff < threshold && lngDiff < threshold;
  });
}

// Filter out overlapping segments from alternative route
function filterOverlappingSegments(altRoute, greenRoute) {
  const altCoordinates = extractRouteCoordinates(altRoute);
  if (altCoordinates.length < 2) return [];

  // Filter out points that are too close to green route
  const filtered = altCoordinates.filter(point => 
    !isPointNearGreenRoute(point, greenRoute)
  );

  // If too many points were filtered, return empty (route overlaps too much)
  if (filtered.length < 2) {
    return [];
  }

  return filtered;
}

export default function SafeRouteMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const routeDataRef = useRef(null);

  // Get route data from location state
  useEffect(() => {
    const routeData = location.state?.routeData;
    if (routeData) {
      routeDataRef.current = routeData;
    } else {
      setError('No route data available. Please calculate a route first.');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [location, navigate]);

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key missing');
      setError('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
      setLoading(false);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setMapsLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  // Initialize map and draw routes
  useEffect(() => {
    if (!mapsLoaded || !window.google || !routeDataRef.current) return;

    const routeData = routeDataRef.current;
    const safestRoute = routeData.safestRoute;
    const alternativeRoutes = routeData.alternativeRoutes || [];

    if (!safestRoute) {
      setError('No route data available');
      setLoading(false);
      return;
    }

    try {
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: theme === 'dark' ? [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        ] : [],
      });

      mapInstanceRef.current = map;

      // Extract safe route coordinates (main route - GREEN)
      const safeRouteCoordinates = extractRouteCoordinates(safestRoute);
      
      if (safeRouteCoordinates.length < 2) {
        setError('Route data is incomplete. Unable to display map.');
        setLoading(false);
        return;
      }

      const startCoord = safeRouteCoordinates[0];
      const endCoord = safeRouteCoordinates[safeRouteCoordinates.length - 1];

      if (!startCoord || !endCoord) {
        setError('Invalid route coordinates');
        setLoading(false);
        return;
      }

      // Draw safe route as single continuous GREEN polyline
      const safePolyline = new window.google.maps.Polyline({
        path: safeRouteCoordinates,
        geodesic: true,
        strokeColor: '#00C853', // Green
        strokeOpacity: 1.0,
        strokeWeight: 6,
        map: map,
        zIndex: 10, // Higher zIndex to ensure it's on top
      });
      polylinesRef.current.push(safePolyline);

      // Draw alternative routes as RED polylines (avoid routes)
      alternativeRoutes.forEach((altRoute) => {
        // Filter out overlapping segments
        const filteredCoordinates = filterOverlappingSegments(altRoute, safeRouteCoordinates);
        
        if (filteredCoordinates.length >= 2) {
          const avoidPolyline = new window.google.maps.Polyline({
            path: filteredCoordinates,
            geodesic: true,
            strokeColor: '#D50000', // Red
            strokeOpacity: 1.0,
            strokeWeight: 6,
            map: map,
            zIndex: 5, // Lower zIndex so green is on top
          });
          polylinesRef.current.push(avoidPolyline);
        }
      });

      // Add start marker
      const startMarker = new window.google.maps.Marker({
        position: startCoord,
        map: map,
        title: 'Start',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
        label: {
          text: 'S',
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(startMarker);

      // Add end marker
      const endMarker = new window.google.maps.Marker({
        position: endCoord,
        map: map,
        title: 'Destination',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
        label: {
          text: 'E',
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(endMarker);

      // Fit map to show all routes
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add safe route
      safeRouteCoordinates.forEach(coord => bounds.extend(coord));
      
      // Add alternative routes
      alternativeRoutes.forEach(altRoute => {
        const altCoordinates = extractRouteCoordinates(altRoute);
        altCoordinates.forEach(coord => bounds.extend(coord));
      });
      
      // Add start and end points
      bounds.extend(startCoord);
      bounds.extend(endCoord);

      map.fitBounds(bounds);
      
      // Add padding to bounds
      const padding = 50;
      map.fitBounds(bounds, padding);

      setLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError(`Failed to initialize map: ${err.message}`);
      setLoading(false);
    }
  }, [mapsLoaded, theme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear polylines
      polylinesRef.current.forEach(polyline => {
        if (polyline.setMap) {
          polyline.setMap(null);
        }
      });
      polylinesRef.current = [];

      // Clear markers
      markersRef.current.forEach(marker => {
        if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: theme === 'dark' ? '#0F172A' : '#F8FAFC' }}>
      {/* Header Bar */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 flex items-center gap-4 p-4"
        style={{
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
          style={{ 
            color: theme === 'dark' ? '#E2E8F0' : '#0F172A',
            backgroundColor: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)',
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: theme === 'dark' ? '#E2E8F0' : '#0F172A' }}>
          Safe Route Map
        </h1>
      </div>

      {/* Legend - Only 2 items */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 p-4 rounded-xl shadow-lg"
        style={{
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
        }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: theme === 'dark' ? '#E2E8F0' : '#0F172A' }}>
          Route Legend
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded" style={{ backgroundColor: '#00C853' }}></div>
            <span className="text-xs" style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
              Safe Route (Recommended)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded" style={{ backgroundColor: '#D50000' }}></div>
            <span className="text-xs" style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
              Avoid Route (Not Recommended)
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ marginTop: '64px' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.9)',
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#10B981' }} />
            <p style={{ color: theme === 'dark' ? '#E2E8F0' : '#0F172A' }}>
              Loading map...
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.9)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl max-w-md mx-4"
            style={{
              background: theme === 'dark' ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#EF4444' }} />
              <div>
                <h3 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#E2E8F0' : '#0F172A' }}>
                  Error
                </h3>
                <p className="text-sm" style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
                  {error}
                </p>
                <button
                  onClick={() => navigate(-1)}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
