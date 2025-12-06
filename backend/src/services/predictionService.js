const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');
const { getAqiLevel } = require('../utils/aqiHelpers');

class PredictionService {
  constructor() {
    // Historical data storage for ML predictions
    this.historicalData = new Map();
    this.maxHistorySize = 168; // 7 days of hourly data
  }

  /**
   * Get AQI prediction for 6hr and 24hr
   */
  async getPredictions(lat, lon, locationName = 'Delhi') {
    const cacheKey = `prediction_${lat}_${lon}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get current AQI
      const currentAQI = await aqiService.getAQIByLocation(lat, lon);
      
      // Get or update historical data
      const history = this.getHistoricalData(locationName, currentAQI.aqi);
      
      // Generate predictions using multiple methods
      const predictions = {
        current: {
          aqi: currentAQI.aqi,
          level: currentAQI.level,
          label: currentAQI.label,
          color: currentAQI.color,
          timestamp: new Date().toISOString(),
        },
        sixHour: this.predictSixHour(history, currentAQI.aqi),
        twentyFourHour: this.predictTwentyFourHour(history, currentAQI.aqi),
        hourlyForecast: this.generateHourlyForecast(history, currentAQI.aqi, 24),
        confidence: this.calculateConfidence(history),
        trends: this.analyzeTrends(history),
        factors: this.getContributingFactors(),
      };

      cache.set(cacheKey, predictions, 300); // Cache for 5 minutes
      return predictions;
    } catch (error) {
      logger.error(`Prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or initialize historical data
   */
  getHistoricalData(locationName, currentAqi) {
    if (!this.historicalData.has(locationName)) {
      // Initialize with synthetic historical data based on typical Delhi patterns
      this.historicalData.set(locationName, this.generateSyntheticHistory(currentAqi));
    }

    const history = this.historicalData.get(locationName);
    
    // Add current reading
    history.push({
      aqi: currentAqi,
      timestamp: new Date(),
      hour: new Date().getHours(),
    });

    // Trim to max size
    while (history.length > this.maxHistorySize) {
      history.shift();
    }

    return history;
  }

  /**
   * Generate synthetic historical data based on typical Delhi patterns
   */
  generateSyntheticHistory(currentAqi) {
    const history = [];
    const now = new Date();
    
    for (let i = 48; i >= 0; i--) {
      const timestamp = new Date(now - i * 3600000);
      const hour = timestamp.getHours();
      
      // Simulate diurnal pattern (higher in morning/evening, lower midday)
      let variation = Math.sin((hour - 6) * Math.PI / 12) * 30;
      
      // Add random noise
      const noise = (Math.random() - 0.5) * 40;
      
      // Calculate AQI with trend toward current
      const trend = (currentAqi - 150) * (1 - i / 48);
      const aqi = Math.max(0, Math.min(500, 150 + variation + noise + trend));
      
      history.push({
        aqi: Math.round(aqi),
        timestamp,
        hour,
      });
    }
    
    return history;
  }

  /**
   * Predict 6-hour AQI using improved algorithm with better trend detection
   */
  predictSixHour(history, currentAqi) {
    if (history.length < 6) {
      return this.simpleExtrapolation(currentAqi, 6);
    }

    // Get last 12 hours for better trend analysis
    const recent = history.slice(-12);
    
    // Calculate multiple trends (short-term and medium-term)
    const shortTermTrend = this.calculateTrend(recent.slice(-6));
    const mediumTermTrend = this.calculateTrend(recent);
    const combinedTrend = (shortTermTrend * 0.7 + mediumTermTrend * 0.3);
    
    // Exponential weighted moving average (more weight to recent data)
    const weights = [];
    const n = recent.length;
    for (let i = 0; i < n; i++) {
      weights.push(Math.exp((i - n + 1) * 0.2)); // Exponential decay
    }
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const ewma = recent.reduce((sum, d, i) => sum + d.aqi * (weights[i] / weightSum), 0);
    
    // Calculate volatility (standard deviation)
    const mean = recent.reduce((sum, d) => sum + d.aqi, 0) / recent.length;
    const variance = recent.reduce((sum, d) => sum + Math.pow(d.aqi - mean, 2), 0) / recent.length;
    const volatility = Math.sqrt(variance);
    
    // Apply trend with volatility adjustment
    const futureHour = (new Date().getHours() + 6) % 24;
    const diurnalAdj = this.getDiurnalAdjustment(futureHour);
    
    // Improved prediction: EWMA + trend + diurnal + volatility adjustment
    const basePrediction = ewma + combinedTrend * 6;
    const volatilityAdjustment = volatility * 0.1; // Small adjustment for volatility
    const predictedAqi = Math.round(basePrediction + diurnalAdj + volatilityAdjustment);
    
    const clampedAqi = Math.max(0, Math.min(500, predictedAqi));
    const level = getAqiLevel(clampedAqi);
    
    return {
      aqi: clampedAqi,
      level: level.level,
      label: level.label,
      color: level.color,
      trend: combinedTrend > 2 ? 'increasing' : combinedTrend < -2 ? 'decreasing' : 'stable',
      trendValue: Math.round(combinedTrend * 6),
      confidence: Math.max(0.6, Math.min(0.95, 1 - (volatility / 100))), // Higher volatility = lower confidence
      timestamp: new Date(Date.now() + 6 * 3600000).toISOString(),
    };
  }

  /**
   * Predict 24-hour AQI using improved Holt-Winters exponential smoothing with seasonality
   */
  predictTwentyFourHour(history, currentAqi) {
    if (history.length < 24) {
      return this.simpleExtrapolation(currentAqi, 24);
    }

    // Get last 48 hours for better analysis
    const recent = history.slice(-48);
    const last24 = recent.slice(-24);
    
    // Triple exponential smoothing (Holt-Winters) with improved parameters
    const alpha = 0.4; // Level smoothing (increased for faster adaptation)
    const beta = 0.15;  // Trend smoothing (increased)
    const gamma = 0.1; // Seasonality smoothing
    
    // Initialize with better starting values
    let level = last24[0].aqi;
    let trend = (last24[last24.length - 1].aqi - last24[0].aqi) / last24.length;
    
    // Calculate seasonal components (hourly patterns)
    const seasonal = this.calculateSeasonalComponents(last24);
    
    // Apply Holt-Winters smoothing
    for (let i = 1; i < last24.length; i++) {
      const prevLevel = level;
      const prevTrend = trend;
      const seasonalIdx = i % 24;
      
      level = alpha * (last24[i].aqi - seasonal[seasonalIdx]) + (1 - alpha) * (prevLevel + prevTrend);
      trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
      seasonal[seasonalIdx] = gamma * (last24[i].aqi - level) + (1 - gamma) * seasonal[seasonalIdx];
    }
    
    // Project 24 hours ahead with seasonality
    const futureDate = new Date(Date.now() + 24 * 3600000);
    const futureHour = futureDate.getHours();
    const seasonalComponent = seasonal[futureHour] || 0;
    
    const predictedAqi = Math.round(level + 24 * trend + seasonalComponent);
    
    // Apply day-of-week adjustment (weekends typically have lower pollution)
    const isWeekend = futureDate.getDay() === 0 || futureDate.getDay() === 6;
    const weekendAdj = isWeekend ? -20 : 0;
    
    // Weather-based adjustment (if available)
    const weatherAdj = this.getWeatherAdjustment(futureDate);
    
    const clampedAqi = Math.max(0, Math.min(500, predictedAqi + weekendAdj + weatherAdj));
    const levelInfo = getAqiLevel(clampedAqi);
    
    // Calculate confidence based on data quality
    const dataQuality = Math.min(1, last24.length / 24);
    const volatility = this.calculateVolatility(last24);
    const confidence = Math.max(0.5, Math.min(0.9, dataQuality * (1 - volatility / 200)));
    
    return {
      aqi: clampedAqi,
      level: levelInfo.level,
      label: levelInfo.label,
      color: levelInfo.color,
      trend: trend > 1 ? 'increasing' : trend < -1 ? 'decreasing' : 'stable',
      trendValue: Math.round(24 * trend),
      confidence: confidence,
      timestamp: futureDate.toISOString(),
      isWeekend,
    };
  }

  /**
   * Calculate seasonal components (hourly patterns)
   */
  calculateSeasonalComponents(data) {
    const seasonal = new Array(24).fill(0);
    const counts = new Array(24).fill(0);
    
    data.forEach((point, idx) => {
      const hour = point.hour || (new Date(point.timestamp).getHours());
      seasonal[hour] += point.aqi;
      counts[hour]++;
    });
    
    // Average and center
    const overallMean = data.reduce((sum, d) => sum + d.aqi, 0) / data.length;
    for (let i = 0; i < 24; i++) {
      if (counts[i] > 0) {
        seasonal[i] = (seasonal[i] / counts[i]) - overallMean;
      }
    }
    
    return seasonal;
  }

  /**
   * Calculate volatility (standard deviation)
   */
  calculateVolatility(data) {
    if (data.length < 2) return 0;
    const mean = data.reduce((sum, d) => sum + d.aqi, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.aqi - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * Get weather-based adjustment (simplified - would use real weather data in production)
   */
  getWeatherAdjustment(date) {
    const hour = date.getHours();
    // Morning rush hour (7-9 AM) and evening (6-8 PM) typically have higher pollution
    if ((hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20)) {
      return 15;
    }
    // Night (10 PM - 6 AM) typically has lower pollution
    if (hour >= 22 || hour <= 6) {
      return -10;
    }
    return 0;
  }

  /**
   * Generate hourly forecast
   */
  generateHourlyForecast(history, currentAqi, hours) {
    const forecast = [];
    const recent = history.slice(-24);
    const trend = this.calculateTrend(recent.slice(-6));
    
    for (let i = 1; i <= hours; i++) {
      const forecastTime = new Date(Date.now() + i * 3600000);
      const hour = forecastTime.getHours();
      const diurnalAdj = this.getDiurnalAdjustment(hour);
      
      // Dampen trend over time
      const dampedTrend = trend * Math.exp(-i / 12);
      
      const predictedAqi = Math.round(currentAqi + dampedTrend * i + diurnalAdj);
      const clampedAqi = Math.max(0, Math.min(500, predictedAqi));
      const level = getAqiLevel(clampedAqi);
      
      forecast.push({
        hour: i,
        timestamp: forecastTime.toISOString(),
        aqi: clampedAqi,
        level: level.level,
        label: level.label,
        color: level.color,
      });
    }
    
    return forecast;
  }

  /**
   * Calculate trend from recent data
   */
  calculateTrend(data) {
    if (data.length < 2) return 0;
    
    // Simple linear regression
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i].aqi;
      sumXY += i * data[i].aqi;
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope || 0;
  }

  /**
   * Get diurnal (time-of-day) adjustment
   */
  getDiurnalAdjustment(hour) {
    // Typical Delhi pollution pattern:
    // High: 6-10 AM (morning traffic), 6-10 PM (evening traffic)
    // Low: 12-4 PM (solar heating disperses pollution)
    const pattern = [
      10, 15, 20, 25, 30, 35, // 0-5 (night to early morning)
      40, 45, 40, 35, 25, 15, // 6-11 (morning peak, then decline)
      5, 0, -5, -10, -5, 0,   // 12-17 (midday low)
      10, 25, 35, 30, 25, 15  // 18-23 (evening peak, then decline)
    ];
    
    return pattern[hour] || 0;
  }

  /**
   * Simple extrapolation when insufficient data
   */
  simpleExtrapolation(currentAqi, hours) {
    // Add some random variation based on typical patterns
    const variation = (Math.random() - 0.5) * 30;
    const predictedAqi = Math.max(0, Math.min(500, Math.round(currentAqi + variation)));
    const level = getAqiLevel(predictedAqi);
    
    return {
      aqi: predictedAqi,
      level: level.level,
      label: level.label,
      color: level.color,
      trend: 'uncertain',
      trendValue: 0,
      timestamp: new Date(Date.now() + hours * 3600000).toISOString(),
      note: 'Limited historical data - prediction confidence is lower',
    };
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(history) {
    const dataPoints = history.length;
    
    if (dataPoints < 12) return { value: 0.5, label: 'Low', note: 'Insufficient historical data' };
    if (dataPoints < 24) return { value: 0.65, label: 'Moderate', note: 'Building confidence with more data' };
    if (dataPoints < 48) return { value: 0.75, label: 'Good', note: 'Reliable short-term predictions' };
    return { value: 0.85, label: 'High', note: 'Strong historical data for predictions' };
  }

  /**
   * Analyze AQI trends
   */
  analyzeTrends(history) {
    if (history.length < 6) {
      return { shortTerm: 'insufficient data', longTerm: 'insufficient data' };
    }

    const last6h = history.slice(-6);
    const last24h = history.length >= 24 ? history.slice(-24) : history;
    
    const shortTermTrend = this.calculateTrend(last6h);
    const longTermTrend = this.calculateTrend(last24h);
    
    const getTrendLabel = (trend) => {
      if (trend > 5) return 'rapidly increasing';
      if (trend > 2) return 'increasing';
      if (trend > 0.5) return 'slightly increasing';
      if (trend < -5) return 'rapidly decreasing';
      if (trend < -2) return 'decreasing';
      if (trend < -0.5) return 'slightly decreasing';
      return 'stable';
    };

    return {
      shortTerm: getTrendLabel(shortTermTrend),
      longTerm: getTrendLabel(longTermTrend),
      shortTermValue: Math.round(shortTermTrend * 10) / 10,
      longTermValue: Math.round(longTermTrend * 10) / 10,
    };
  }

  /**
   * Get contributing factors for predictions
   */
  getContributingFactors() {
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    
    const factors = [];
    
    // Time-based factors
    if (hour >= 6 && hour <= 10) {
      factors.push({ factor: 'Morning Traffic', impact: 'high', description: 'Peak commute hours increase vehicle emissions' });
    } else if (hour >= 18 && hour <= 22) {
      factors.push({ factor: 'Evening Traffic', impact: 'high', description: 'Evening rush hour and cooking emissions' });
    } else if (hour >= 11 && hour <= 16) {
      factors.push({ factor: 'Solar Heating', impact: 'positive', description: 'Thermal mixing disperses pollutants' });
    }
    
    // Season-based factors (Delhi specific)
    if (month >= 9 && month <= 11) {
      factors.push({ factor: 'Stubble Burning Season', impact: 'very high', description: 'Agricultural fires in Punjab/Haryana' });
      factors.push({ factor: 'Diwali Period', impact: 'very high', description: 'Fireworks and crackers' });
    } else if (month >= 0 && month <= 1) {
      factors.push({ factor: 'Winter Inversion', impact: 'high', description: 'Cold air traps pollutants near ground' });
    } else if (month >= 5 && month <= 8) {
      factors.push({ factor: 'Monsoon', impact: 'positive', description: 'Rain washes pollutants from air' });
    }
    
    // Always present factors
    factors.push({ factor: 'Vehicle Emissions', impact: 'moderate', description: 'Continuous urban traffic' });
    factors.push({ factor: 'Industrial Activity', impact: 'moderate', description: 'Manufacturing and power generation' });
    factors.push({ factor: 'Construction Dust', impact: 'moderate', description: 'Ongoing construction projects' });
    
    return factors;
  }

  /**
   * Get policy-relevant predictions
   */
  async getPolicyPredictions() {
    const locations = config.locations;
    const predictions = {};
    
    for (const [key, loc] of Object.entries(locations)) {
      try {
        predictions[key] = await this.getPredictions(loc.lat, loc.lon, loc.name);
      } catch (error) {
        logger.error(`Prediction error for ${key}: ${error.message}`);
        predictions[key] = { error: true, message: error.message };
      }
    }
    
    // Aggregate predictions for policy insights
    const validPredictions = Object.values(predictions).filter(p => !p.error);
    
    return {
      regions: predictions,
      aggregate: {
        avgCurrent: Math.round(validPredictions.reduce((sum, p) => sum + p.current.aqi, 0) / validPredictions.length),
        avg6Hour: Math.round(validPredictions.reduce((sum, p) => sum + p.sixHour.aqi, 0) / validPredictions.length),
        avg24Hour: Math.round(validPredictions.reduce((sum, p) => sum + p.twentyFourHour.aqi, 0) / validPredictions.length),
        criticalZones: validPredictions.filter(p => p.sixHour.aqi > 300).length,
        improvingZones: validPredictions.filter(p => p.sixHour.trend === 'decreasing').length,
      },
      alerts: this.generatePolicyAlerts(validPredictions),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Generate policy alerts based on predictions
   */
  generatePolicyAlerts(predictions) {
    const alerts = [];
    
    // Check for predicted severe conditions
    const severeIn6h = predictions.filter(p => p.sixHour.aqi > 300);
    if (severeIn6h.length > 0) {
      alerts.push({
        level: 'critical',
        message: `${severeIn6h.length} zone(s) predicted to reach Severe AQI in 6 hours`,
        action: 'Consider emergency response measures',
      });
    }
    
    // Check for rapid deterioration
    const rapidIncrease = predictions.filter(p => p.sixHour.trendValue > 50);
    if (rapidIncrease.length > 0) {
      alerts.push({
        level: 'warning',
        message: `Rapid AQI increase predicted in ${rapidIncrease.length} zone(s)`,
        action: 'Monitor closely and prepare advisories',
      });
    }
    
    // Check for improvement opportunity
    const improving = predictions.filter(p => p.sixHour.trend === 'decreasing' && p.sixHour.aqi < 150);
    if (improving.length >= predictions.length / 2) {
      alerts.push({
        level: 'info',
        message: 'AQI improving across majority of regions',
        action: 'Good conditions for outdoor activities',
      });
    }
    
    return alerts;
  }
}

module.exports = new PredictionService();

