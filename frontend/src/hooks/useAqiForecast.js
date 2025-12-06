import { useState, useEffect } from 'react';
import { getAqiForecast24h } from '../services/api';
import { getAqiColor, getAqiLevel } from '../utils/helpers';

/**
 * Shared hook to fetch and manage ML-based AQI forecast data
 * Provides forecast data for both TrendsChart and PredictionCard
 * 
 * @param {number} currentAQI - Current AQI value for trend calculation
 * @param {string} selectedRegion - Selected region (for future region-specific forecasts)
 * @returns {Object} { forecast24h, forecast6h, forecast24hPoint, trendDirection, expectedChange6h, loading, error, usingFallback }
 */
export function useAqiForecast(currentAQI = null, selectedRegion = null) {
  const [forecast24h, setForecast24h] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadForecast() {
      setLoading(true);
      setError(null);
      setUsingFallback(false);

      try {
        // Fetch from ML API (no cache - always fresh data)
        const forecasts = await getAqiForecast24h();

        if (!isMounted) return;

        if (!forecasts || forecasts.length === 0) {
          throw new Error('No forecast data received');
        }

        // Store raw forecast data
        setForecast24h(forecasts);
        setUsingFallback(false);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('ML Forecast failed:', err);
        setError(err.message);
        setForecast24h([]);
        setUsingFallback(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadForecast();

    return () => {
      isMounted = false;
    };
  }, [selectedRegion]); // Re-fetch when region changes

  // Extract specific forecast points
  const forecast6h = forecast24h.find(f => f.hour_ahead === 6) || null;
  const forecast24hPoint = forecast24h.find(f => f.hour_ahead === 24) || null;

  // Calculate trend direction
  // If last point (24h) > current AQI → "Increasing"
  // If last point (24h) < current AQI → "Decreasing"
  let trendDirection = 'stable';
  if (forecast24h.length > 0 && currentAQI !== null) {
    const lastPoint = forecast24hPoint?.AQI || forecast24h[forecast24h.length - 1]?.AQI;
    if (lastPoint > currentAQI) {
      trendDirection = 'increasing';
    } else if (lastPoint < currentAQI) {
      trendDirection = 'decreasing';
    }
  }

  // Calculate expected change in 6 hours
  const expectedChange6h = forecast6h && currentAQI !== null
    ? Math.round(forecast6h.AQI - currentAQI)
    : 0;

  return {
    forecast24h,           // Full array of 1h → 24h predictions
    forecast6h,             // Prediction at hour_ahead: 6
    forecast24hPoint,       // Prediction at hour_ahead: 24
    trendDirection,         // 'increasing' | 'decreasing' | 'stable'
    expectedChange6h,       // forecast6h.AQI - currentAQI
    loading,
    error,
    usingFallback,
  };
}

