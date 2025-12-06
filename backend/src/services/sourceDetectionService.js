const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const hotspotService = require('./hotspotService');
const sourceContributionService = require('./sourceContributionService');

/**
 * Source Detection Service
 * Implements weighted Bayesian scoring for real-time pollution source inference
 */
class SourceDetectionService {
  constructor() {
    // Weight configuration for Bayesian scoring
    this.weights = {
      traffic: 0.25,
      dust: 0.20,
      burning: 0.20,
      industrial: 0.15,
      stubble: 0.20,
    };

    // Stability threshold: don't change source unless score difference > 0.15
    this.STABILITY_THRESHOLD = 0.15;

    // Debounce: update max once every 30 seconds
    this.DEBOUNCE_MS = 30 * 1000;

    // Store last detection result for stability check
    this.lastDetection = null;
    this.lastDetectionTime = null;
  }

  /**
   * Detect primary pollution source with confidence
   * Returns: { primary_source, confidence, supporting_factors }
   */
  async detectSource(lat, lon, aqiData, options = {}) {
    const cacheKey = `source_detection_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    
    // Check debounce
    const now = Date.now();
    if (this.lastDetectionTime && (now - this.lastDetectionTime) < this.DEBOUNCE_MS) {
      if (this.lastDetection) {
        logger.info(`[SourceDetection] Using cached result (debounce: ${Math.round((this.DEBOUNCE_MS - (now - this.lastDetectionTime)) / 1000)}s remaining)`);
        return this.lastDetection;
      }
    }

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && this.isFresh(cached.last_updated)) {
      this.lastDetection = cached;
      this.lastDetectionTime = now;
      return cached;
    }

    logger.info(`[SourceDetection] Detecting source for ${lat}, ${lon}`);

    try {
      // Gather all input factors
      const factors = await this.gatherFactors(lat, lon, aqiData, options);

      // Calculate scores for each source type
      const scores = {
        traffic: this.calculateTrafficScore(factors),
        dust: this.calculateDustScore(factors),
        burning: this.calculateBurningScore(factors),
        industrial: this.calculateIndustrialScore(factors),
        stubble: this.calculateStubbleScore(factors),
      };

      // Apply weights
      const weightedScores = {
        traffic: scores.traffic * this.weights.traffic,
        dust: scores.dust * this.weights.dust,
        burning: scores.burning * this.weights.burning,
        industrial: scores.industrial * this.weights.industrial,
        stubble: scores.stubble * this.weights.stubble,
      };

      // Find primary source
      const primarySource = this.findPrimarySource(weightedScores);

      // Calculate confidence
      const confidence = this.calculateConfidence(weightedScores, primarySource);

      // Check stability (don't change unless significant difference)
      const stableSource = this.applyStability(primarySource, confidence);

      // Build supporting factors
      const supportingFactors = {
        wind_support: factors.windSupport,
        report_density: factors.reportDensity,
        aqi_rise_rate: factors.aqiRiseRate,
        traffic_density: factors.trafficDensity,
        construction_sites: factors.constructionSites,
        fire_hotspots: factors.fireHotspots,
        seasonal_weight: factors.seasonalWeight,
      };

      const result = {
        primary_source: stableSource,
        confidence: Math.round(confidence * 100) / 100,
        supporting_factors: supportingFactors,
        all_scores: weightedScores,
        raw_scores: scores,
        last_updated: new Date().toISOString(),
      };

      // Cache result
      cache.set(cacheKey, result, 30); // 30 seconds cache
      this.lastDetection = result;
      this.lastDetectionTime = now;

      logger.info(`[SourceDetection] Detected: ${stableSource} (confidence: ${confidence.toFixed(2)})`);

      return result;
    } catch (error) {
      logger.error(`[SourceDetection] Error: ${error.message}`);
      
      // Return fallback
      return {
        primary_source: 'Unknown',
        confidence: 0.3,
        supporting_factors: {},
        error: error.message,
        last_updated: new Date().toISOString(),
      };
    }
  }

  /**
   * Gather all input factors for source detection
   */
  async gatherFactors(lat, lon, aqiData, options) {
    const factors = {
      // AQI data
      aqi: aqiData?.aqi || 0,
      pollutants: aqiData?.pollutants || {},
      
      // Time-based factors
      hour: new Date().getHours(),
      month: new Date().getMonth(),
      
      // Wind data
      windSpeed: 0,
      windDirection: 0,
      windSupport: 0,
      
      // Traffic density (static + live if available)
      trafficDensity: 0,
      
      // Construction sites
      constructionSites: 0,
      
      // Fire hotspots
      fireHotspots: 0,
      
      // Report density
      reportDensity: 0,
      
      // AQI rise rate (if historical data available)
      aqiRiseRate: 0,
      
      // Seasonal weight
      seasonalWeight: 1.0,
    };

    // Get wind data
    try {
      const windData = await hotspotService.getWindData();
      if (windData && windData.wind) {
        factors.windSpeed = windData.wind.speed || 0;
        factors.windDirection = windData.wind.deg || 0;
        factors.windSupport = this.calculateWindSupport(windData.wind, lat, lon);
      }
    } catch (error) {
      logger.warn(`[SourceDetection] Wind data unavailable: ${error.message}`);
    }

    // Get source markers (traffic, construction, etc.)
    try {
      const sourceMarkers = await sourceContributionService.getSourceMarkers();
      if (sourceMarkers && sourceMarkers.markers) {
        // Count nearby traffic hotspots
        const trafficCount = this.countNearbyMarkers(
          sourceMarkers.markers.traffic || [],
          lat,
          lon,
          5 // 5km radius
        );
        factors.trafficDensity = Math.min(1.0, trafficCount / 10); // Normalize to 0-1

        // Count nearby construction sites
        const constructionCount = this.countNearbyMarkers(
          sourceMarkers.markers.construction || [],
          lat,
          lon,
          5
        );
        factors.constructionSites = Math.min(1.0, constructionCount / 5);

        // Count nearby industrial sites
        const industrialCount = this.countNearbyMarkers(
          sourceMarkers.markers.industrial || [],
          lat,
          lon,
          10 // 10km radius for industrial
        );
        factors.industrialDensity = Math.min(1.0, industrialCount / 3);
      }
    } catch (error) {
      logger.warn(`[SourceDetection] Source markers unavailable: ${error.message}`);
    }

    // Get fire hotspots
    try {
      const hotspots = await hotspotService.getHotspots(1); // Last 24 hours
      if (hotspots && hotspots.hotspots) {
        const nearbyFires = this.countNearbyMarkers(
          hotspots.hotspots,
          lat,
          lon,
          50 // 50km radius for stubble fires
        );
        factors.fireHotspots = Math.min(1.0, nearbyFires / 20);
      }
    } catch (error) {
      logger.warn(`[SourceDetection] Fire hotspots unavailable: ${error.message}`);
    }

    // Calculate seasonal weight
    factors.seasonalWeight = this.getSeasonalWeight(factors.month);

    // Calculate AQI rise rate (if we have historical data)
    if (options.historicalAQI && options.historicalAQI.length >= 2) {
      const recent = options.historicalAQI.slice(-3); // Last 3 readings
      const aqiValues = recent.map(r => r.aqi || 0);
      if (aqiValues.length >= 2) {
        const rise = aqiValues[aqiValues.length - 1] - aqiValues[0];
        factors.aqiRiseRate = Math.min(1.0, Math.max(0, rise / 50)); // Normalize
      }
    }

    return factors;
  }

  /**
   * Calculate traffic score
   */
  calculateTrafficScore(factors) {
    let score = 0;

    // Peak traffic hours (7-10 AM, 5-9 PM)
    const isTrafficHour = (factors.hour >= 7 && factors.hour <= 10) ||
                          (factors.hour >= 17 && factors.hour <= 21);
    if (isTrafficHour) score += 0.4;

    // High NO2 or CO indicates traffic
    const pollutants = factors.pollutants || {};
    if (pollutants.no2 > 40) score += 0.3;
    if (pollutants.co > 2) score += 0.2;

    // Traffic density from markers
    score += factors.trafficDensity * 0.3;

    // AQI rise during rush hours
    if (isTrafficHour && factors.aqiRiseRate > 0.3) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate dust score
   */
  calculateDustScore(factors) {
    let score = 0;

    const pollutants = factors.pollutants || {};
    
    // High PM10/PM2.5 ratio indicates dust
    if (pollutants.pm10 && pollutants.pm25) {
      const ratio = pollutants.pm10 / pollutants.pm25;
      if (ratio > 2) score += 0.4;
      if (ratio > 3) score += 0.2;
    }

    // High PM10 absolute value
    if (pollutants.pm10 > 150) score += 0.3;

    // Construction sites nearby
    score += factors.constructionSites * 0.3;

    // Wind speed (dust spreads with wind)
    if (factors.windSpeed > 10) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Calculate burning score (waste/garbage burning)
   */
  calculateBurningScore(factors) {
    let score = 0;

    const pollutants = factors.pollutants || {};

    // High PM2.5 with moderate PM10 indicates burning
    if (pollutants.pm25 > 100 && pollutants.pm10 < pollutants.pm25 * 1.5) {
      score += 0.4;
    }

    // High CO indicates incomplete combustion (burning)
    if (pollutants.co > 1.5) score += 0.3;

    // Report density (user reports of burning)
    score += factors.reportDensity * 0.3;

    // Evening/night burning is common
    if (factors.hour >= 18 || factors.hour <= 6) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate industrial score
   */
  calculateIndustrialScore(factors) {
    let score = 0;

    const pollutants = factors.pollutants || {};

    // High SO2 indicates industrial sources
    if (pollutants.so2 > 30) score += 0.4;

    // High NO2 can also indicate industrial
    if (pollutants.no2 > 50) score += 0.2;

    // Industrial density from markers
    score += (factors.industrialDensity || 0) * 0.4;

    // Consistent high AQI (industrial is steady)
    if (factors.aqi > 200 && factors.aqiRiseRate < 0.2) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate stubble burning score
   */
  calculateStubbleScore(factors) {
    let score = 0;

    // Stubble season (Oct-Nov)
    const isStubbleSeason = factors.month >= 9 && factors.month <= 11;
    if (isStubbleSeason) {
      score += 0.4;
      score += factors.seasonalWeight * 0.2;
    }

    // Fire hotspots nearby
    score += factors.fireHotspots * 0.4;

    // High PM2.5 during stubble season
    const pollutants = factors.pollutants || {};
    if (isStubbleSeason && pollutants.pm25 > 150) {
      score += 0.3;
    }

    // Wind direction from agricultural areas (simplified)
    if (factors.windSupport > 0.5 && isStubbleSeason) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Find primary source from weighted scores
   */
  findPrimarySource(weightedScores) {
    const sourceNames = {
      traffic: 'Traffic',
      dust: 'Dust',
      burning: 'Burning',
      industrial: 'Industrial',
      stubble: 'Stubble',
    };

    let maxScore = -1;
    let primarySource = 'Unknown';

    for (const [key, score] of Object.entries(weightedScores)) {
      if (score > maxScore) {
        maxScore = score;
        primarySource = sourceNames[key] || key;
      }
    }

    return primarySource;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(weightedScores, primarySource) {
    const scores = Object.values(weightedScores).sort((a, b) => b - a);
    
    if (scores.length < 2) return 0.5;

    const topScore = scores[0];
    const secondScore = scores[1];

    // Confidence is higher if top score is significantly higher than second
    const gap = topScore - secondScore;
    let confidence = 0.5 + (gap * 2); // Scale gap to confidence

    // Boost confidence if top score is high
    if (topScore > 0.3) {
      confidence += 0.2;
    }

    return Math.min(1.0, Math.max(0.3, confidence));
  }

  /**
   * Apply stability check (don't change unless significant difference)
   */
  applyStability(newSource, newConfidence) {
    if (!this.lastDetection) {
      return newSource;
    }

    const lastSource = this.lastDetection.primary_source;
    const lastConfidence = this.lastDetection.confidence;

    // If same source, keep it
    if (newSource === lastSource) {
      return newSource;
    }

    // If confidence difference is small, keep previous source
    const confidenceDiff = Math.abs(newConfidence - lastConfidence);
    if (confidenceDiff < this.STABILITY_THRESHOLD) {
      logger.info(`[SourceDetection] Keeping previous source ${lastSource} (confidence diff: ${confidenceDiff.toFixed(2)} < ${this.STABILITY_THRESHOLD})`);
      return lastSource;
    }

    // Significant difference, update
    return newSource;
  }

  /**
   * Calculate wind support (how much wind supports source transport)
   */
  calculateWindSupport(windData, lat, lon) {
    // Simplified: higher wind speed = more support for transport
    const windSpeed = windData.speed || 0;
    return Math.min(1.0, windSpeed / 15); // Normalize to 0-1
  }

  /**
   * Count nearby markers
   */
  countNearbyMarkers(markers, lat, lon, radiusKm) {
    let count = 0;
    for (const marker of markers) {
      const markerLat = marker.lat || marker.latitude;
      const markerLon = marker.lon || marker.longitude;
      if (!markerLat || !markerLon) continue;

      const distance = this.haversineDistance(lat, lon, markerLat, markerLon);
      if (distance <= radiusKm) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get seasonal weight
   */
  getSeasonalWeight(month) {
    // Stubble season (Oct-Nov) has higher weight
    if (month >= 9 && month <= 11) return 1.5;
    // Winter (Dec-Feb) has moderate weight
    if (month === 11 || month === 0 || month === 1 || month === 2) return 1.2;
    // Summer (Mar-Jun) has lower weight
    return 1.0;
  }

  /**
   * Check if timestamp is fresh
   */
  isFresh(timestamp) {
    if (!timestamp) return false;
    const age = Date.now() - new Date(timestamp).getTime();
    return age < 60 * 1000; // 1 minute freshness
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

module.exports = new SourceDetectionService();

