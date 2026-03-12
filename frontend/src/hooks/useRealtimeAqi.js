import { useState, useEffect, useRef } from 'react';
import { getRealtimeAQI } from '../services/api';

/**
 * Hook to fetch real-time AQI data with synchronized 2-minute refresh cycle
 * Polls backend every 2 minutes to get synchronized bundle
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} Real-time AQI bundle with loading/error states
 */
export function useRealtimeAqi(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Validate inputs
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      setError('Invalid coordinates');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchData() {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch backend AQI bundle (CPCB, AQICN, OpenWeather)
        const response = await getRealtimeAQI(lat, lon);
        
        if (!isMounted) return;

        // Response structure: { success: true, timestamp_global, datasets: { cpcb, aqicn, openweather }, warnings }
        setData(response);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Realtime AQI fetch failed:', err);
        setError(err.message || 'Failed to fetch real-time AQI');
        // Don't clear data on error - keep showing last known data
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Helper function to calculate freshness (same logic as backend)
    function calculateFreshness(timestamp) {
      if (!timestamp) return 'very_stale';
      const now = new Date();
      const dataTime = new Date(timestamp);
      const ageMinutes = (now - dataTime) / (1000 * 60);
      
      if (ageMinutes <= 5) return 'fresh';
      if (ageMinutes <= 15) return 'slightly_stale';
      if (ageMinutes <= 60) return 'old';
      return 'very_stale';
    }

    // Initial fetch
    fetchData();

    // Set up 2-minute polling interval (120000 ms)
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 120000); // 2 minutes

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lat, lon]);

  return { data, loading, error };
}

