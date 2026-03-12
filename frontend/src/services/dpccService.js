/**
 * DPCC Service - Frontend-only service to fetch DPCC station data from OpenAQ API
 * NO backend dependencies - all logic runs client-side
 */

/**
 * Calculate CPCB AQI from PM2.5 concentration (Indian AQI standard)
 * @param {number} pm25 - PM2.5 concentration in µg/m³
 * @returns {number} AQI value (0-500)
 */
function computeCpcbAqiFromPm25(pm25) {
  if (pm25 == null || isNaN(pm25) || pm25 < 0) {
    return null;
  }

  // Indian AQI breakpoints for PM2.5 (µg/m³)
  if (pm25 <= 30) {
    return Math.round((pm25 / 30) * 50);
  } else if (pm25 <= 60) {
    return Math.round(50 + ((pm25 - 30) / 30) * 50);
  } else if (pm25 <= 90) {
    return Math.round(100 + ((pm25 - 60) / 30) * 50);
  } else if (pm25 <= 120) {
    return Math.round(200 + ((pm25 - 90) / 30) * 100);
  } else if (pm25 <= 250) {
    return Math.round(300 + ((pm25 - 120) / 130) * 100);
  } else {
    return Math.round(400 + ((pm25 - 250) / 250) * 100);
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch DPCC AQI data from OpenAQ API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} DPCC dataset with aqi, pm25, timestamp, raw data
 */
export async function fetchDPCCAQI(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return { aqi: null, pm25: null, timestamp: null, raw: null };
  }

  // Fetch stations from OpenAQ with broader search
  // Increased radius to 35000m and limit to 50, filtering by city=Delhi
  const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=35000&limit=50&city=Delhi`;

  try {
    const resp = await fetch(url);
    
    if (!resp.ok) {
      console.warn('[DPCC] OpenAQ API error:', resp.status, resp.statusText);
      return { aqi: null, pm25: null, timestamp: null, raw: null };
    }

    const data = await resp.json();

    if (!data?.results || !Array.isArray(data.results) || data.results.length === 0) {
      return { aqi: null, pm25: null, timestamp: null, raw: data };
    }

    // Filter stations where name includes 'DPCC'
    const dpccStations = data.results.filter(
      (station) =>
        station.name?.toLowerCase().includes('dpcc') ||
        station.location?.toLowerCase().includes('dpcc')
    );

    if (dpccStations.length === 0) {
      return { aqi: null, pm25: null, timestamp: null, raw: data };
    }

    // Find the nearest DPCC station with valid PM2.5 measurement
    let nearestStation = null;
    let minDistance = Infinity;

    for (const station of dpccStations) {
      if (!station.measurements || !Array.isArray(station.measurements)) {
        continue;
      }

      // Check if station has PM2.5 measurement
      const pm25Measurement = station.measurements.find(
        (m) => (m.parameter === 'pm25' || m.parameter === 'PM2.5') && m.value != null
      );

      if (!pm25Measurement) {
        continue;
      }

      // Calculate distance to this station
      const distance = calculateDistance(
        lat,
        lon,
        station.coordinates?.latitude || station.latitude,
        station.coordinates?.longitude || station.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    // If no DPCC station with PM2.5 found, return null
    if (!nearestStation) {
      return { aqi: null, pm25: null, timestamp: null, raw: data };
    }

    // Extract PM2.5 measurement from nearest station
    const pm25Measurement = nearestStation.measurements.find(
      (m) => (m.parameter === 'pm25' || m.parameter === 'PM2.5') && m.value != null
    );

    if (!pm25Measurement || pm25Measurement.value == null) {
      return { aqi: null, pm25: null, timestamp: null, raw: data };
    }

    const pm25 = pm25Measurement.value;
    const aqi = computeCpcbAqiFromPm25(pm25);

    // Get timestamp from measurement
    const timestamp = pm25Measurement.lastUpdated || nearestStation.lastUpdated || new Date().toISOString();

    return {
      aqi,
      pm25,
      timestamp,
      raw: data,
      location: nearestStation.location,
      stationName: nearestStation.name || nearestStation.location,
      distance: minDistance / 1000, // Convert to km
    };
  } catch (err) {
    console.error('[DPCC] Fetch error:', err);
    return { aqi: null, pm25: null, timestamp: null, raw: null };
  }
}

