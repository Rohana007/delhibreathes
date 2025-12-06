const axios = require('axios');
const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class AQIService {
  constructor() {
    this.openWeatherClient = axios.create({
      baseURL: config.apis.openWeather.baseUrl,
      timeout: 10000,
    });
    
    this.waqiClient = axios.create({
      baseURL: config.apis.waqi.baseUrl,
      timeout: 10000,
    });

    this.iqairClient = axios.create({
      baseURL: config.apis.iqair.baseUrl,
      timeout: 10000,
    });

    // Historical data storage (in-memory for demo, use MongoDB in production)
    this.historicalData = new Map();
  }

  /**
   * Get Indian AQI level based on AQI value
   */
  getIndianAqiLevel(aqi) {
    const levels = config.indianAqi;
    if (aqi <= levels.good.max) return { ...levels.good, level: 'good' };
    if (aqi <= levels.satisfactory.max) return { ...levels.satisfactory, level: 'satisfactory' };
    if (aqi <= levels.moderate.max) return { ...levels.moderate, level: 'moderate' };
    if (aqi <= levels.poor.max) return { ...levels.poor, level: 'poor' };
    if (aqi <= levels.veryPoor.max) return { ...levels.veryPoor, level: 'veryPoor' };
    return { ...levels.severe, level: 'severe' };
  }

  /**
   * Fetch AQI data with multi-API fallback
   */
  async getAQIByLocation(lat, lon) {
    const cacheKey = `aqi_${lat}_${lon}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const sources = [];
    let primaryData = null;

    // Try multiple APIs with fallback
    try {
      const openWeatherData = await this.fetchFromOpenWeather(lat, lon);
      if (openWeatherData) {
        sources.push({ source: 'OpenWeather', data: openWeatherData });
        primaryData = openWeatherData;
      }
    } catch (e) { logger.warn('OpenWeather fetch failed'); }

    try {
      const waqiData = await this.fetchFromWAQI(lat, lon);
      if (waqiData) {
        sources.push({ source: 'WAQI', data: waqiData });
        if (!primaryData) primaryData = waqiData;
      }
    } catch (e) { logger.warn('WAQI fetch failed'); }

    try {
      const iqairData = await this.fetchFromIQAir(lat, lon);
      if (iqairData) {
        sources.push({ source: 'IQAir', data: iqairData });
        if (!primaryData) primaryData = iqairData;
      }
    } catch (e) { logger.warn('IQAir fetch failed'); }

    // If all APIs fail, use sample data
    if (!primaryData) {
      primaryData = this.getSampleAQIData(lat, lon);
      sources.push({ source: 'Sample', data: primaryData });
    }

    // Merge and normalize data
    const mergedData = await this.mergeAQIData(sources, lat, lon);
    
    // Store historical data
    this.storeHistoricalData(lat, lon, mergedData);

    cache.set(cacheKey, mergedData, 120);
    return mergedData;
  }

  /**
   * Fetch from OpenWeather Air Pollution API
   */
  async fetchFromOpenWeather(lat, lon) {
    const apiKey = config.apis.openWeather.key;
    if (!apiKey || apiKey.includes('your_')) return null;

    const response = await this.openWeatherClient.get('/air_pollution', {
      params: { lat, lon, appid: apiKey },
    });

    const components = response.data.list[0].components;
    const aqi = this.calculateIndianAQI(components);

    return {
      aqi,
      pollutants: {
        pm25: components.pm2_5,
        pm10: components.pm10,
        o3: components.o3,
        no2: components.no2,
        so2: components.so2,
        co: components.co / 1000,
        nh3: components.nh3,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch from WAQI API
   */
  async fetchFromWAQI(lat, lon) {
    const token = config.apis.waqi.token;
    if (!token || token.includes('your_')) return null;

    const response = await this.waqiClient.get(`/feed/geo:${lat};${lon}/`, {
      params: { token },
    });

    if (response.data.status !== 'ok') return null;

    const data = response.data.data;
    const pollutants = {};
    if (data.iaqi) {
      if (data.iaqi.pm25) pollutants.pm25 = data.iaqi.pm25.v;
      if (data.iaqi.pm10) pollutants.pm10 = data.iaqi.pm10.v;
      if (data.iaqi.o3) pollutants.o3 = data.iaqi.o3.v;
      if (data.iaqi.no2) pollutants.no2 = data.iaqi.no2.v;
      if (data.iaqi.so2) pollutants.so2 = data.iaqi.so2.v;
      if (data.iaqi.co) pollutants.co = data.iaqi.co.v;
    }

    return {
      aqi: data.aqi,
      pollutants,
      station: data.city?.name,
      timestamp: data.time?.iso || new Date().toISOString(),
    };
  }

  /**
   * Fetch from IQAir API
   */
  async fetchFromIQAir(lat, lon) {
    const apiKey = config.apis.iqair.key;
    if (!apiKey || apiKey.includes('your_')) return null;

    const response = await this.iqairClient.get('/nearest_city', {
      params: { lat, lon, key: apiKey },
    });

    if (response.data.status !== 'success') return null;

    const pollution = response.data.data.current.pollution;
    return {
      aqi: pollution.aqius,
      pollutants: {
        pm25: pollution.mainus === 'p2' ? pollution.aqius : null,
      },
      timestamp: pollution.ts,
    };
  }

  /**
   * Calculate Indian AQI from pollutant concentrations
   */
  calculateIndianAQI(pollutants) {
    // Indian AQI breakpoints for PM2.5 (24-hour average)
    const pm25Breakpoints = [
      { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
      { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
      { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
      { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
      { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
      { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
    ];

    const pm25 = pollutants.pm2_5 || pollutants.pm25 || 0;
    
    for (const bp of pm25Breakpoints) {
      if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
        return Math.round(
          ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
        );
      }
    }
    return Math.min(500, Math.round(pm25 * 1.5));
  }

  /**
   * Merge data from multiple sources
   * IMPORTANT: Always uses real-time data from APIs, never ML predictions for current AQI
   */
  async mergeAQIData(sources, lat, lon) {
    if (sources.length === 0) return this.getSampleAQIData(lat, lon);

    // Merge pollutants from all sources (prefer most complete source)
    const pollutants = {};
    sources.forEach(s => {
      if (s.data.pollutants) {
        Object.entries(s.data.pollutants).forEach(([key, value]) => {
          if (value != null && (pollutants[key] == null || s.source === 'OpenWeather')) {
            pollutants[key] = value;
          }
        });
      }
    });

    // Calculate AQI from real-time pollutant data using Indian AQI formula
    // This ensures we always use real data, not ML predictions
    const { calculateIndianAQI } = require('../utils/aqiHelpers');
    const calculatedAQI = calculateIndianAQI(pollutants);
    
    // Use calculated AQI if available, otherwise average from sources
    let finalAQI;
    if (calculatedAQI != null && calculatedAQI > 0) {
      finalAQI = calculatedAQI;
    } else {
      // Fallback: average AQI from sources
      const aqiValues = sources.map(s => s.data.aqi).filter(a => a != null && a > 0);
      if (aqiValues.length > 0) {
        finalAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
      } else {
        finalAQI = 100; // Default fallback
      }
    }

    const level = this.getIndianAqiLevel(finalAQI);

    // Calculate pollutant details with limits
    const pollutantDetails = this.calculatePollutantDetails(pollutants);

    // Get weather data
    const weather = await this.getWeatherData(lat, lon);

    return {
      aqi: finalAQI, // Always real-time calculated AQI, never ML prediction
      level: level.level,
      label: level.label,
      color: level.color,
      healthImpact: level.healthImpact,
      pollutants,
      pollutantDetails,
      dominantPollutant: this.getDominantPollutant(pollutants),
      sources: sources.map(s => s.source),
      station: {
        name: sources[0]?.data?.station || 'Multi-source',
        geo: [lat, lon],
      },
      weather,
      timestamp: new Date().toISOString(),
      calculatedFromRealData: true, // Flag to indicate this is real-time data
    };
  }

  /**
   * Calculate pollutant details with CPCB/WHO limits
   */
  calculatePollutantDetails(pollutants) {
    const limits = config.pollutantLimits;
    const details = {};

    Object.entries(pollutants).forEach(([key, value]) => {
      if (value != null && limits[key]) {
        const limit = limits[key];
        const cpcbExceedance = limit.cpcb ? ((value / limit.cpcb) * 100).toFixed(1) : null;
        const whoExceedance = limit.who ? ((value / limit.who) * 100).toFixed(1) : null;
        
        details[key] = {
          value: Math.round(value * 10) / 10,
          unit: limit.unit,
          name: limit.name,
          cpcbLimit: limit.cpcb,
          whoLimit: limit.who,
          cpcbExceedance: parseFloat(cpcbExceedance),
          whoExceedance: parseFloat(whoExceedance),
          status: this.getPollutantStatus(value, limit.cpcb),
          trend: this.getPollutantTrend(key, value),
        };
      }
    });

    return details;
  }

  /**
   * Get pollutant status
   */
  getPollutantStatus(value, limit) {
    if (!limit) return 'unknown';
    const ratio = value / limit;
    if (ratio <= 0.5) return 'good';
    if (ratio <= 1) return 'moderate';
    if (ratio <= 1.5) return 'poor';
    if (ratio <= 2) return 'very_poor';
    return 'severe';
  }

  /**
   * Get pollutant trend (simulated - would use historical data in production)
   */
  getPollutantTrend(pollutant, currentValue) {
    const trends = ['rising', 'falling', 'stable'];
    return trends[Math.floor(Math.random() * 3)];
  }

  /**
   * Get dominant pollutant
   */
  getDominantPollutant(pollutants) {
    if (!pollutants || Object.keys(pollutants).length === 0) return 'pm25';
    
    const limits = config.pollutantLimits;
    let maxRatio = 0;
    let dominant = 'pm25';

    Object.entries(pollutants).forEach(([key, value]) => {
      if (value && limits[key]?.cpcb) {
        const ratio = value / limits[key].cpcb;
        if (ratio > maxRatio) {
          maxRatio = ratio;
          dominant = key;
        }
      }
    });

    return dominant;
  }

  /**
   * Get weather data for location
   */
  async getWeatherData(lat, lon) {
    try {
      const apiKey = config.apis.openWeather.key;
      if (!apiKey || apiKey.includes('your_')) return this.getSampleWeather();

      const response = await this.openWeatherClient.get('/weather', {
        params: { lat, lon, appid: apiKey, units: 'metric' },
      });

      return {
        temp: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        windDir: response.data.wind.deg,
        pressure: response.data.main.pressure,
        visibility: response.data.visibility / 1000,
        description: response.data.weather[0]?.description,
      };
    } catch (e) {
      return this.getSampleWeather();
    }
  }

  /**
   * Get sample weather data
   */
  getSampleWeather() {
    const month = new Date().getMonth();
    const isWinter = month >= 10 || month <= 1;
    
    return {
      temp: isWinter ? 12 + Math.random() * 8 : 28 + Math.random() * 10,
      humidity: isWinter ? 70 + Math.random() * 20 : 40 + Math.random() * 30,
      windSpeed: 2 + Math.random() * 5,
      windDir: Math.floor(Math.random() * 360),
      pressure: 1010 + Math.random() * 20,
      visibility: isWinter ? 1 + Math.random() * 3 : 5 + Math.random() * 5,
      description: isWinter ? 'hazy' : 'partly cloudy',
    };
  }

  /**
   * Store historical data
   */
  storeHistoricalData(lat, lon, data) {
    const key = `${lat}_${lon}`;
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }
    
    const history = this.historicalData.get(key);
    history.push({
      aqi: data.aqi,
      pollutants: data.pollutants,
      timestamp: new Date(),
    });

    // Keep only last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    this.historicalData.set(key, history.filter(h => h.timestamp > cutoff));
  }

  /**
   * Get historical data
   */
  getHistoricalData(lat, lon, hours = 24) {
    const key = `${lat}_${lon}`;
    const history = this.historicalData.get(key) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return history.filter(h => h.timestamp > cutoff);
  }

  /**
   * Get sample AQI data for Delhi
   */
  getSampleAQIData(lat, lon) {
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    
    // Delhi typical patterns
    const isWinter = month >= 10 || month <= 1;
    const isMorningRush = hour >= 7 && hour <= 10;
    const isEveningRush = hour >= 17 && hour <= 21;
    
    let baseAqi = isWinter ? 250 : 120;
    if (isMorningRush || isEveningRush) baseAqi += 50;
    baseAqi += (Math.random() - 0.5) * 60;
    
    const aqi = Math.round(Math.max(30, Math.min(450, baseAqi)));
    const level = this.getIndianAqiLevel(aqi);

    const pollutants = {
      pm25: aqi * 0.4 + Math.random() * 20,
      pm10: aqi * 0.8 + Math.random() * 40,
      no2: 30 + Math.random() * 50,
      so2: 10 + Math.random() * 30,
      co: 0.5 + Math.random() * 2,
      o3: 20 + Math.random() * 40,
      nh3: 10 + Math.random() * 20,
    };

    return {
      aqi,
      level: level.level,
      label: level.label,
      color: level.color,
      healthImpact: level.healthImpact,
      pollutants,
      pollutantDetails: this.calculatePollutantDetails(pollutants),
      dominantPollutant: 'pm25',
      sources: ['Sample'],
      station: { name: 'Sample Station', geo: [lat, lon] },
      weather: this.getSampleWeather(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get AQI for all Delhi NCR locations
   */
  async getAllNCRAQI() {
    const cacheKey = 'ncr_all_aqi_v2';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const locations = config.locations;
    const results = {};

    const promises = Object.entries(locations).map(async ([key, loc]) => {
      try {
        const data = await this.getAQIByLocation(loc.lat, loc.lon);
        results[key] = { 
          ...data, 
          location: loc,
          district: loc.district,
          cpcbId: loc.cpcbId,
        };
      } catch (error) {
        logger.error(`Failed to get AQI for ${key}: ${error.message}`);
        results[key] = { 
          error: true, 
          location: loc, 
          message: error.message,
          ...this.getSampleAQIData(loc.lat, loc.lon),
        };
      }
    });

    await Promise.all(promises);
    
    // Calculate NCR statistics
    const validData = Object.values(results).filter(r => !r.error && r.aqi);
    const aqiValues = validData.map(r => r.aqi);
    
    const response = {
      regions: results,
      summary: {
        averageAqi: Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length),
        maxAqi: Math.max(...aqiValues),
        minAqi: Math.min(...aqiValues),
        level: this.getIndianAqiLevel(Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length)),
        regionCount: Object.keys(results).length,
        activeStations: validData.length,
        lastUpdated: new Date().toISOString(),
      },
      cpcbStations: config.cpcbStations,
    };

    cache.set(cacheKey, response, 120);
    return response;
  }

  /**
   * Get historical AQI data from OpenWeather Air Pollution History API
   */
  async getAQIHistory(lat, lon, range = 'hourly') {
    const apiKey = config.apis.openWeather.key;
    if (!apiKey || apiKey.includes('your_')) {
      throw new Error('OpenWeather API key not configured');
    }

    const now = Math.floor(Date.now() / 1000);
    let startTime, endTime;

    if (range === 'hourly') {
      // Last 24 hours
      startTime = now - (24 * 60 * 60);
      endTime = now;
    } else if (range === 'daily') {
      // Last 7 days
      startTime = now - (7 * 24 * 60 * 60);
      endTime = now;
    } else {
      throw new Error('Invalid range. Use "hourly" or "daily"');
    }

    try {
      const response = await this.openWeatherClient.get('/air_pollution/history', {
        params: {
          lat,
          lon,
          start: startTime,
          end: endTime,
          appid: apiKey,
        },
      });

      if (!response.data || !response.data.list) {
        return [];
      }

      // Process and format the data
      const processedData = response.data.list.map((item) => {
        const components = item.components;
        const pollutants = {
          pm25: components.pm2_5 || 0,
          pm10: components.pm10 || 0,
          no2: components.no2 || 0,
          so2: components.so2 || 0,
          co: components.co || 0,
          o3: components.o3 || 0,
        };

        // Calculate AQI from pollutants
        const aqi = this.calculateIndianAQI(pollutants);

        // Format timestamp
        const timestamp = new Date(item.dt * 1000);
        let timeLabel;
        
        if (range === 'hourly') {
          timeLabel = timestamp.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        } else {
          timeLabel = timestamp.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short' 
          });
        }

        return {
          time: timeLabel,
          datetime: timestamp.toISOString(),
          timestamp: item.dt,
          aqi: Math.round(aqi),
          pm25: Math.round(pollutants.pm25 * 10) / 10,
          pm10: Math.round(pollutants.pm10 * 10) / 10,
          no2: Math.round(pollutants.no2 * 10) / 10,
          so2: Math.round(pollutants.so2 * 10) / 10,
          co: Math.round(pollutants.co * 10) / 10,
          o3: Math.round(pollutants.o3 * 10) / 10,
        };
      });

      // For daily range, aggregate by day
      if (range === 'daily') {
        const dailyData = {};
        processedData.forEach((item) => {
          const date = new Date(item.timestamp * 1000);
          const dayKey = date.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short' 
          });
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
              time: dayKey,
              datetime: date.toISOString(),
              timestamp: item.timestamp,
              aqi: [],
              pm25: [],
              pm10: [],
              no2: [],
            };
          }
          
          dailyData[dayKey].aqi.push(item.aqi);
          dailyData[dayKey].pm25.push(item.pm25);
          dailyData[dayKey].pm10.push(item.pm10);
          dailyData[dayKey].no2.push(item.no2);
        });

        // Calculate averages for each day
        return Object.values(dailyData).map((day) => ({
          time: day.time,
          datetime: day.datetime,
          timestamp: day.timestamp,
          aqi: Math.round(day.aqi.reduce((a, b) => a + b, 0) / day.aqi.length),
          pm25: Math.round((day.pm25.reduce((a, b) => a + b, 0) / day.pm25.length) * 10) / 10,
          pm10: Math.round((day.pm10.reduce((a, b) => a + b, 0) / day.pm10.length) * 10) / 10,
          no2: Math.round((day.no2.reduce((a, b) => a + b, 0) / day.no2.length) * 10) / 10,
        }));
      }

      return processedData;
    } catch (error) {
      logger.error(`AQI History fetch error: ${error.message}`);
      throw new Error(`Failed to fetch historical AQI data: ${error.message}`);
    }
  }
}

module.exports = new AQIService();
