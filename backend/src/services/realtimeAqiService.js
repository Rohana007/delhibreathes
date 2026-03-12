const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');
const cache = require('../utils/cache');
const validationEngine = require('./validationEngine');

/**
 * Real-time AQI Service
 * Fetches AQI data from CPCB, AQICN, and OpenWeather
 * Implements synchronized 2-minute refresh cycle with caching
 */
class RealtimeAqiService {
  constructor() {
    this.openWeatherClient = axios.create({
      baseURL: config.apis.openWeather.baseUrl,
      timeout: 5000, // 5 seconds per source
    });

    this.aqicnClient = axios.create({
      baseURL: 'https://api.waqi.info',
      timeout: 5000, // 5 seconds per source
    });

    // Cache TTL: 120 seconds (2 minutes)
    this.CACHE_TTL = 120;
  }

  /**
   * Convert OpenWeather AQI (1-5 scale) to Indian AQI
   * OpenWeather uses 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
   */
  convertOpenWeatherToIndianAQI(owAqi, pollutants) {
    if (!owAqi || !pollutants) return null;

    // Calculate Indian AQI from pollutants (more accurate)
    if (pollutants.pm2_5 || pollutants.pm10) {
      return aqiService.calculateIndianAQI({
        pm2_5: pollutants.pm2_5,
        pm25: pollutants.pm2_5,
        pm10: pollutants.pm10,
        no2: pollutants.no2,
        so2: pollutants.so2,
        co: pollutants.co,
        o3: pollutants.o3,
      });
    }

    // Fallback: rough conversion from OpenWeather scale
    const conversionMap = {
      1: 50,   // Good
      2: 100,  // Fair
      3: 200,  // Moderate
      4: 300,  // Poor
      5: 400,  // Very Poor
    };

    return conversionMap[owAqi] || null;
  }

  /**
   * Calculate freshness label based on timestamp age
   */
  calculateFreshness(timestamp) {
    if (!timestamp) return 'very_stale';

    try {
      const age = Date.now() - new Date(timestamp).getTime();
      const ageMinutes = Math.floor(age / (60 * 1000));

      if (ageMinutes <= 5) return 'fresh';
      if (ageMinutes <= 15) return 'slightly_stale';
      if (ageMinutes <= 60) return 'old';
      return 'very_stale';
    } catch {
      return 'very_stale';
    }
  }

  /**
   * Fetch CPCB AQI data
   * Uses nearest station from NCR data
   * Returns standardized format with status
   */
  async fetchCPCB(lat, lon) {
    try {
      // Get NCR data and find nearest station
      const ncrData = await aqiService.getAllNCRAQI();
      
      if (!ncrData || !ncrData.regions) {
        return {
          aqi: null,
          pollutants: {},
          timestamp: new Date().toISOString(),
          status: 'error',
          freshness: 'very_stale',
          error: 'No CPCB data available'
        };
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
        return {
          aqi: null,
          pollutants: {},
          timestamp: new Date().toISOString(),
          status: 'error',
          freshness: 'very_stale',
          error: 'No nearby CPCB station'
        };
      }

      const timestamp = nearest.timestamp || nearest.last_updated || new Date().toISOString();
      const freshness = this.calculateFreshness(timestamp);

      return {
        aqi: Math.round(nearest.aqi),
        pollutants: nearest.pollutants || {},
        timestamp,
        status: 'ok',
        freshness,
        station: nearest.location?.name || nearest.station?.name,
        distance: minDistance,
      };
    } catch (error) {
      logger.error(`CPCB fetch error: ${error.message}`);
      return {
        aqi: null,
        pollutants: {},
        timestamp: new Date().toISOString(),
        status: 'error',
        freshness: 'very_stale',
        error: error.message
      };
    }
  }

  /**
   * Fetch AQICN data
   * Returns standardized format with status
   */
  async fetchAQICN(lat, lon) {
    try {
      const apiKey = process.env.AQICN_API_KEY;
      
      if (!apiKey) {
        return {
          aqi: null,
          pollutants: {},
          timestamp: new Date().toISOString(),
          status: 'error',
          freshness: 'very_stale',
          error: 'AQICN API key not configured'
        };
      }

      const response = await this.aqicnClient.get(`/feed/geo:${lat};${lon}/`, {
        params: { token: apiKey },
      });

      if (!response.data || response.data.status !== 'ok') {
        return {
          aqi: null,
          pollutants: {},
          timestamp: new Date().toISOString(),
          status: 'error',
          freshness: 'very_stale',
          error: 'AQICN API error'
        };
      }

      const data = response.data.data;
      const pollutants = {};

      // Extract pollutants from iaqi
      if (data.iaqi) {
        Object.keys(data.iaqi).forEach(key => {
          const value = data.iaqi[key];
          if (value && typeof value === 'object' && value.v !== undefined) {
            pollutants[key.toLowerCase()] = value.v;
          } else if (typeof value === 'number') {
            pollutants[key.toLowerCase()] = value;
          }
        });
      }

      const timestamp = data.time?.iso || new Date().toISOString();
      const freshness = this.calculateFreshness(timestamp);

      return {
        aqi: data.aqi ? Math.round(data.aqi) : null,
        pollutants,
        timestamp,
        status: 'ok',
        freshness,
        station: data.city?.name,
      };
    } catch (error) {
      logger.error(`AQICN fetch error: ${error.message}`);
      return {
        aqi: null,
        pollutants: {},
        timestamp: new Date().toISOString(),
        status: 'error',
        freshness: 'very_stale',
        error: error.message
      };
    }
  }

  /**
   * Fetch OpenWeather Air Pollution data
   * Returns standardized format with status
   */
  async fetchOpenWeather(lat, lon) {
    try {
      const apiKey = config.apis.openWeather.key;
      
      if (!apiKey || apiKey.includes('your_')) {
        return {
          aqi: null,
          pollutants: {},
          timestamp: new Date().toISOString(),
          status: 'error',
          freshness: 'very_stale',
          error: 'OpenWeather API key not configured'
        };
      }

      const response = await this.openWeatherClient.get('/air_pollution', {
        params: { lat, lon, appid: apiKey },
      });

      if (!response.data || !response.data.list || response.data.list.length === 0) {
        return {
          aqi: null,
          pollutants: {},
          timestamp: new Date().toISOString(),
          status: 'error',
          freshness: 'very_stale',
          error: 'No data from OpenWeather'
        };
      }

      const data = response.data.list[0];
      const components = data.components;

      // Convert OpenWeather AQI to Indian AQI
      const indianAqi = this.convertOpenWeatherToIndianAQI(data.main.aqi, components);
      const timestamp = new Date(data.dt * 1000).toISOString();
      const freshness = this.calculateFreshness(timestamp);

      return {
        aqi: indianAqi ? Math.round(indianAqi) : null,
        pollutants: {
          pm25: components.pm2_5,
          pm10: components.pm10,
          no2: components.no2,
          so2: components.so2,
          o3: components.o3,
          co: components.co / 1000, // Convert from µg/m³ to mg/m³
          nh3: components.nh3,
        },
        timestamp,
        status: 'ok',
        freshness,
        owAqi: data.main.aqi, // Keep original OpenWeather AQI for reference
      };
    } catch (error) {
      logger.error(`OpenWeather fetch error: ${error.message}`);
      return {
        aqi: null,
        pollutants: {},
        timestamp: new Date().toISOString(),
        status: 'error',
        freshness: 'very_stale',
        error: error.message
      };
    }
  }

  /**
   * Wrapper to add timeout to a promise
   */
  async withTimeout(promise, timeoutMs, errorMessage) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    );
    
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Fetch all sources in parallel with 5-second timeout each
   * Returns standardized dataset results
   */
  async fetchAllSources(lat, lon) {
    const serverTime = new Date().toISOString();

    // Helper to create error result
    const createErrorResult = (errorMsg) => ({
      aqi: null,
      pollutants: {},
      timestamp: serverTime,
      status: 'error',
      freshness: 'very_stale',
      error: errorMsg
    });

    // Fetch all sources in parallel with 5-second timeout each
    const [cpcbResult, aqicnResult, openweatherResult] = await Promise.allSettled([
      this.withTimeout(
        this.fetchCPCB(lat, lon),
        5000,
        'CPCB request timeout'
      ).catch(err => createErrorResult(err.message || 'CPCB fetch failed')),
      
      this.withTimeout(
        this.fetchAQICN(lat, lon),
        5000,
        'AQICN request timeout'
      ).catch(err => createErrorResult(err.message || 'AQICN fetch failed')),
      
      this.withTimeout(
        this.fetchOpenWeather(lat, lon),
        5000,
        'OpenWeather request timeout'
      ).catch(err => createErrorResult(err.message || 'OpenWeather fetch failed')),
    ]);

    // Extract results (all should be fulfilled due to catch handlers)
    const cpcb = cpcbResult.status === 'fulfilled' ? cpcbResult.value : createErrorResult('CPCB fetch failed');
    const aqicn = aqicnResult.status === 'fulfilled' ? aqicnResult.value : createErrorResult('AQICN fetch failed');
    const openweather = openweatherResult.status === 'fulfilled' ? openweatherResult.value : createErrorResult('OpenWeather fetch failed');

    return {
      cpcb,
      aqicn,
      openweather,
    };
  }

  /**
   * Get real-time AQI bundle with synchronized 2-minute refresh
   * Uses cache to ensure all clients get the same synchronized data
   */
  async getRealtimeAQI(lat, lon) {
    const cacheKey = `aqi:bundle:${lat.toFixed(4)}:${lon.toFixed(4)}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - new Date(cached.timestamp_global).getTime();
      const ageSeconds = Math.floor(age / 1000);
      
      // If cache is less than 120 seconds old, return it
      if (ageSeconds < this.CACHE_TTL) {
        logger.info(`[RealtimeAQI] Cache hit for ${lat}, ${lon} (age: ${ageSeconds}s)`);
        return cached;
      }
    }

    // Cache expired or doesn't exist - fetch fresh data
    logger.info(`[RealtimeAQI] Fetching fresh bundle for ${lat}, ${lon}`);
    const timestampGlobal = new Date().toISOString();

    // Fetch all sources in parallel
    const datasets = await this.fetchAllSources(lat, lon);

    // Build unified bundle
    const bundle = {
      timestamp_global: timestampGlobal,
      datasets: {
        cpcb: {
          aqi: datasets.cpcb.aqi,
          pollutants: datasets.cpcb.pollutants || {},
          timestamp: datasets.cpcb.timestamp,
          status: datasets.cpcb.status,
          freshness: datasets.cpcb.freshness,
          station: datasets.cpcb.station,
          distance: datasets.cpcb.distance,
          error: datasets.cpcb.error,
        },
        aqicn: {
          aqi: datasets.aqicn.aqi,
          pollutants: datasets.aqicn.pollutants || {},
          timestamp: datasets.aqicn.timestamp,
          status: datasets.aqicn.status,
          freshness: datasets.aqicn.freshness,
          station: datasets.aqicn.station,
          error: datasets.aqicn.error,
        },
        openweather: {
          aqi: datasets.openweather.aqi,
          pollutants: datasets.openweather.pollutants || {},
          timestamp: datasets.openweather.timestamp,
          status: datasets.openweather.status,
          freshness: datasets.openweather.freshness,
          owAqi: datasets.openweather.owAqi,
          error: datasets.openweather.error,
        },
      },
    };

    // Collect warnings
    const warnings = [];
    if (datasets.cpcb.status === 'error') warnings.push(`CPCB: ${datasets.cpcb.error || 'Unavailable'}`);
    if (datasets.aqicn.status === 'error') warnings.push(`AQICN: ${datasets.aqicn.error || 'Unavailable'}`);
    if (datasets.openweather.status === 'error') warnings.push(`OpenWeather: ${datasets.openweather.error || 'Unavailable'}`);

    if (warnings.length > 0) {
      bundle.warnings = warnings;
    }

    // Compute validated AQI using validation engine
    try {
      const validated = validationEngine.computeValidatedAQI(
        datasets.cpcb,
        datasets.aqicn,
        datasets.openweather
      );
      // Transform to match expected response structure
      bundle.validated = {
        aqi: validated.validated_aqi,
        weights: validated.weights,
        confidence: validated.confidence,
        consistency: validated.consistency,
        diagnostics: validated.diagnostics,
        formula_derivation: validated.formula_derivation,
      };
      logger.info(`[RealtimeAQI] Validated AQI computed: ${validated.validated_aqi} (confidence: ${validated.confidence}%)`);
    } catch (error) {
      logger.error(`[RealtimeAQI] Validation engine error: ${error.message}`);
      // Continue without validation - bundle still has raw datasets
      const fallback = validationEngine.getFallbackResult();
      bundle.validated = {
        aqi: fallback.validated_aqi,
        weights: fallback.weights,
        confidence: fallback.confidence,
        consistency: fallback.consistency,
        diagnostics: fallback.diagnostics,
        formula_derivation: fallback.formula_derivation,
      };
    }

    // Cache the bundle for 120 seconds (2 minutes)
    cache.set(cacheKey, bundle, this.CACHE_TTL);
    logger.info(`[RealtimeAQI] Cached bundle for ${lat}, ${lon} (TTL: ${this.CACHE_TTL}s)`);

    return bundle;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new RealtimeAqiService();

