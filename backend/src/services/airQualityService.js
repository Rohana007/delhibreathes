const axios = require('axios');
const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');

/**
 * Consolidated Air Quality Service
 * Provides validated, fresh, smoothed AQI data with fallbacks
 */
class AirQualityService {
  constructor() {
    this.openWeatherClient = axios.create({
      baseURL: config.apis.openWeather.baseUrl,
      timeout: 8000,
    });
    
    this.waqiClient = axios.create({
      baseURL: config.apis.waqi.baseUrl,
      timeout: 8000,
    });

    // Store recent readings for smoothing (last 3 readings per location)
    this.recentReadings = new Map();
    
    // Freshness threshold: 10 minutes
    this.FRESHNESS_THRESHOLD_MS = 10 * 60 * 1000;
    
    // AQI validation bounds
    this.MIN_AQI = 0;
    this.MAX_AQI = 800;
    
    // Smoothing threshold: if AQI changes > 20 units in 1 min, apply median filter
    this.SMOOTHING_THRESHOLD = 20;
  }

  /**
   * Get validated, fresh AQI with fallbacks
   * Returns: { aqi, category, last_updated, source, confidence }
   */
  async getCurrentAQI(lat, lon) {
    const cacheKey = `aqi_current_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    
    // Check cache freshness
    if (cached && this.isFresh(cached.last_updated)) {
      logger.info(`[AirQuality] Cache hit for ${lat}, ${lon}`);
      return cached;
    }

    logger.info(`[AirQuality] Fetching fresh AQI for ${lat}, ${lon}`);

    // Try sources in priority order
    const sources = [
      { name: 'OpenWeather', fetch: () => this.fetchFromOpenWeather(lat, lon) },
      { name: 'WAQI', fetch: () => this.fetchFromWAQI(lat, lon) },
      { name: 'NearestSensor', fetch: () => this.fetchNearestSensor(lat, lon) },
      { name: 'ForecastModel', fetch: () => this.fetchFromForecastModel(lat, lon) },
    ];

    let bestReading = null;
    let sourceUsed = null;
    let confidence = 0;

    for (const source of sources) {
      try {
        const reading = await source.fetch();
        if (reading && this.isValidAQI(reading.aqi)) {
          // Check freshness
          if (this.isFresh(reading.last_updated)) {
            bestReading = reading;
            sourceUsed = source.name;
            confidence = this.calculateConfidence(reading, source.name);
            logger.info(`[AirQuality] Successfully fetched from ${source.name} with confidence ${confidence.toFixed(2)}`);
            break;
          } else {
            logger.warn(`[AirQuality] ${source.name} reading is stale (${reading.last_updated})`);
          }
        }
      } catch (error) {
        logger.warn(`[AirQuality] ${source.name} fetch failed: ${error.message}`);
        continue;
      }
    }

    // If no valid reading found, return unavailable but don't break UI
    if (!bestReading) {
      logger.error(`[AirQuality] All sources failed for ${lat}, ${lon}`);
      return {
        aqi: null,
        category: 'Unavailable',
        last_updated: new Date().toISOString(),
        source: 'none',
        confidence: 0,
        unavailable: true,
        message: 'Live AQI temporarily unavailable. Showing nearest sensor value.',
      };
    }

    // Apply smoothing if needed
    const smoothedReading = this.applySmoothing(lat, lon, bestReading);

    // Normalize and categorize
    const normalized = this.normalizeAQI(smoothedReading);
    normalized.source = sourceUsed;
    normalized.confidence = confidence;

    // Cache for 10 seconds (as per requirements)
    cache.set(cacheKey, normalized, 10);

    logger.info(`[AirQuality] Final AQI: ${normalized.aqi}, Category: ${normalized.category}, Source: ${sourceUsed}, Confidence: ${confidence.toFixed(2)}`);

    return normalized;
  }

  /**
   * Fetch from OpenWeather (primary source)
   */
  async fetchFromOpenWeather(lat, lon) {
    const apiKey = config.apis.openWeather.key;
    if (!apiKey || apiKey.includes('your_')) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await this.openWeatherClient.get('/air_pollution', {
      params: { lat, lon, appid: apiKey },
    });

    if (!response.data || !response.data.list || response.data.list.length === 0) {
      throw new Error('No data from OpenWeather');
    }

    const data = response.data.list[0];
    const components = data.components;

    // Calculate AQI from components (Indian AQI standard)
    const aqi = aqiService.calculateIndianAQI({
      pm2_5: components.pm2_5,
      pm25: components.pm2_5,
      pm10: components.pm10,
      no2: components.no2,
      so2: components.so2,
      co: components.co,
      o3: components.o3,
      nh3: components.nh3,
    });

    return {
      aqi: Math.round(aqi),
      category: this.categorizeAQI(aqi),
      last_updated: new Date(data.dt * 1000).toISOString(),
      pollutants: components,
      sensor_id: `ow_${lat.toFixed(2)}_${lon.toFixed(2)}`,
    };
  }

  /**
   * Fetch from WAQI (fallback)
   */
  async fetchFromWAQI(lat, lon) {
    const token = config.apis.waqi.token;
    if (!token || token.includes('your_')) {
      throw new Error('WAQI API token not configured');
    }

    const response = await this.waqiClient.get('/feed/geo:', {
      params: { lat, lon, token },
    });

    if (!response.data || response.data.status !== 'ok') {
      throw new Error('WAQI API error');
    }

    const data = response.data.data;
    const aqi = data.aqi;

    return {
      aqi: Math.round(aqi),
      category: this.categorizeAQI(aqi),
      last_updated: new Date(data.time.iso).toISOString(),
      pollutants: data.iaqi || {},
      sensor_id: data.idx?.toString() || `waqi_${lat.toFixed(2)}_${lon.toFixed(2)}`,
    };
  }

  /**
   * Fetch from nearest sensor (fallback)
   */
  async fetchNearestSensor(lat, lon) {
    // Use existing aqiService to get nearest station data
    try {
      const ncrData = await aqiService.getAllNCRAQI();
      if (!ncrData || !ncrData.regions) {
        throw new Error('No NCR data available');
      }

      // Find nearest region
      let nearest = null;
      let minDistance = Infinity;

      for (const [key, region] of Object.entries(ncrData.regions)) {
        if (region.error || !region.aqi) continue;

        const regionLat = region.location?.lat || region.station?.geo?.[0];
        const regionLon = region.location?.lon || region.station?.geo?.[1];

        if (!regionLat || !regionLon) continue;

        const distance = this.haversineDistance(lat, lon, regionLat, regionLon);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = region;
        }
      }

      if (!nearest) {
        throw new Error('No nearest sensor found');
      }

      return {
        aqi: Math.round(nearest.aqi),
        category: this.categorizeAQI(nearest.aqi),
        last_updated: nearest.timestamp || new Date().toISOString(),
        pollutants: nearest.pollutants || {},
        sensor_id: nearest.cpcbId || `sensor_${nearest.location?.name || 'unknown'}`,
        is_fallback: true,
        distance_km: minDistance,
      };
    } catch (error) {
      throw new Error(`Nearest sensor fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch from forecast model (last resort fallback)
   */
  async fetchFromForecastModel(lat, lon) {
    // Use prediction service if available
    try {
      const predictionService = require('./predictionService');
      const forecast = await predictionService.get24HourForecast(lat, lon);
      
      if (forecast && forecast.forecasts && forecast.forecasts.length > 0) {
        // Use first hour forecast as current estimate
        const firstHour = forecast.forecasts[0];
        return {
          aqi: Math.round(firstHour.AQI),
          category: this.categorizeAQI(firstHour.AQI),
          last_updated: new Date().toISOString(),
          pollutants: {},
          sensor_id: 'forecast_model',
          is_forecast: true,
        };
      }
    } catch (error) {
      logger.warn(`[AirQuality] Forecast model unavailable: ${error.message}`);
    }

    throw new Error('Forecast model unavailable');
  }

  /**
   * Validate AQI value
   */
  isValidAQI(aqi) {
    if (aqi === null || aqi === undefined || isNaN(aqi)) {
      return false;
    }
    return aqi >= this.MIN_AQI && aqi <= this.MAX_AQI;
  }

  /**
   * Check if timestamp is fresh (within 10 minutes)
   */
  isFresh(timestamp) {
    if (!timestamp) return false;
    const timestampMs = new Date(timestamp).getTime();
    const now = Date.now();
    const age = now - timestampMs;
    return age < this.FRESHNESS_THRESHOLD_MS;
  }

  /**
   * Apply smoothing if AQI fluctuates > 20 units
   */
  applySmoothing(lat, lon, reading) {
    const key = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const recent = this.recentReadings.get(key) || [];

    // Add current reading
    recent.push({
      aqi: reading.aqi,
      timestamp: Date.now(),
    });

    // Keep only last 3 readings
    if (recent.length > 3) {
      recent.shift();
    }

    this.recentReadings.set(key, recent);

    // If we have at least 2 readings, check for fluctuation
    if (recent.length >= 2) {
      const aqiValues = recent.map(r => r.aqi);
      const minAqi = Math.min(...aqiValues);
      const maxAqi = Math.max(...aqiValues);
      const fluctuation = maxAqi - minAqi;

      // If fluctuation > threshold, apply median filter
      if (fluctuation > this.SMOOTHING_THRESHOLD) {
        const sorted = [...aqiValues].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        logger.info(`[AirQuality] Applied smoothing: ${reading.aqi} -> ${median} (fluctuation: ${fluctuation})`);
        
        return {
          ...reading,
          aqi: median,
          smoothed: true,
        };
      }
    }

    return reading;
  }

  /**
   * Normalize AQI response format
   */
  normalizeAQI(reading) {
    return {
      aqi: Math.round(reading.aqi),
      category: reading.category || this.categorizeAQI(reading.aqi),
      last_updated: reading.last_updated || new Date().toISOString(),
      source: reading.source || 'unknown',
      confidence: reading.confidence || 0.5,
      pollutants: reading.pollutants || {},
      sensor_id: reading.sensor_id,
      is_fallback: reading.is_fallback || false,
      is_forecast: reading.is_forecast || false,
      smoothed: reading.smoothed || false,
    };
  }

  /**
   * Categorize AQI value
   */
  categorizeAQI(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  }

  /**
   * Calculate confidence score (0-1)
   */
  calculateConfidence(reading, sourceName) {
    let confidence = 0.5;

    // Base confidence by source
    if (sourceName === 'OpenWeather') confidence = 0.9;
    else if (sourceName === 'WAQI') confidence = 0.85;
    else if (sourceName === 'NearestSensor') confidence = 0.7;
    else if (sourceName === 'ForecastModel') confidence = 0.6;

    // Boost confidence if reading is very fresh (< 2 minutes)
    if (this.isFresh(reading.last_updated)) {
      const age = Date.now() - new Date(reading.last_updated).getTime();
      if (age < 2 * 60 * 1000) {
        confidence = Math.min(1.0, confidence + 0.1);
      }
    }

    // Reduce confidence if it's a fallback
    if (reading.is_fallback) {
      confidence *= 0.8;
    }

    // Reduce confidence if it's a forecast
    if (reading.is_forecast) {
      confidence *= 0.7;
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Haversine distance calculation
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new AirQualityService();

