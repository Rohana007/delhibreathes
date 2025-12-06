const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');

class SeasonalService {
  constructor() {
    // Delhi seasonal factors affecting AQI
    this.seasonalFactors = {
      winter: {
        months: [11, 12, 1, 2],
        name: 'Winter',
        baseMultiplier: 1.8,
        factors: [
          { name: 'Temperature Inversion', impact: 'very_high', description: 'Cold air traps pollutants near ground level', contribution: 25 },
          { name: 'Low Wind Speed', impact: 'high', description: 'Average wind speed drops to 2-3 km/h, reducing dispersion', contribution: 20 },
          { name: 'Stable Atmosphere', impact: 'high', description: 'Vertical mixing is suppressed', contribution: 15 },
          { name: 'Stubble Burning Inflow', impact: 'very_high', description: 'Crop residue burning in Punjab/Haryana', contribution: 30 },
          { name: 'Festival Emissions', impact: 'moderate', description: 'Diwali fireworks and celebrations', contribution: 10 },
        ],
        recommendations: [
          'Use N95/N99 masks outdoors',
          'Run air purifiers indoors at maximum',
          'Avoid morning outdoor exercise',
          'Keep elderly and children indoors',
          'Use public transport to reduce emissions',
        ],
      },
      summer: {
        months: [3, 4, 5, 6],
        name: 'Summer',
        baseMultiplier: 0.9,
        factors: [
          { name: 'Dust Storms', impact: 'high', description: 'Western disturbances bring dust from Rajasthan/Pakistan', contribution: 35 },
          { name: 'High PM10', impact: 'moderate', description: 'Coarse particles dominate due to dry conditions', contribution: 25 },
          { name: 'Thermal Mixing', impact: 'positive', description: 'Hot weather promotes vertical mixing', contribution: -15 },
          { name: 'Ozone Formation', impact: 'moderate', description: 'Sunlight increases ground-level ozone', contribution: 15 },
        ],
        recommendations: [
          'Wear masks during dust storms',
          'Stay hydrated',
          'Avoid peak afternoon hours (12-4 PM)',
          'Keep windows closed during dust events',
          'Monitor ozone levels for outdoor activities',
        ],
      },
      monsoon: {
        months: [7, 8, 9],
        name: 'Monsoon',
        baseMultiplier: 0.5,
        factors: [
          { name: 'Rain Scavenging', impact: 'positive', description: 'Rain washes pollutants from atmosphere', contribution: -40 },
          { name: 'High Humidity', impact: 'moderate', description: 'Particles become heavier and settle faster', contribution: -15 },
          { name: 'Reduced Traffic', impact: 'positive', description: 'Heavy rains reduce vehicular movement', contribution: -10 },
          { name: 'Waterlogging', impact: 'low', description: 'Stagnant water can increase local pollution', contribution: 5 },
        ],
        recommendations: [
          'Best season for outdoor activities',
          'Still avoid heavily trafficked areas',
          'Watch for sudden dust after rain gaps',
          'Good time for respiratory recovery',
        ],
      },
      postMonsoon: {
        months: [10],
        name: 'Post-Monsoon',
        baseMultiplier: 1.5,
        factors: [
          { name: 'Stubble Burning Peak', impact: 'very_high', description: 'Peak paddy stubble burning in Punjab/Haryana', contribution: 45 },
          { name: 'Transition Weather', impact: 'high', description: 'Temperature dropping, wind patterns changing', contribution: 20 },
          { name: 'Festival Buildup', impact: 'moderate', description: 'Pre-Diwali activities and shopping traffic', contribution: 15 },
          { name: 'Reducing Humidity', impact: 'moderate', description: 'Drier air holds particles longer', contribution: 10 },
        ],
        recommendations: [
          'Prepare N95 masks and air purifiers',
          'Monitor SAFAR stubble burning forecasts',
          'Plan for Diwali with minimal crackers',
          'Consider air-purifying plants indoors',
        ],
      },
    };
  }

  /**
   * Get current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    
    for (const [key, season] of Object.entries(this.seasonalFactors)) {
      if (season.months.includes(month)) {
        return { key, ...season };
      }
    }
    return { key: 'winter', ...this.seasonalFactors.winter };
  }

  /**
   * Get seasonal forecast
   */
  async getSeasonalForecast(lat, lon) {
    const cacheKey = `seasonal_forecast_${lat}_${lon}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const currentAqi = await aqiService.getAQIByLocation(lat, lon);
      const currentSeason = this.getCurrentSeason();
      const weather = currentAqi.weather || {};

      const forecast = {
        currentSeason: {
          name: currentSeason.name,
          key: currentSeason.key,
          factors: currentSeason.factors,
          recommendations: currentSeason.recommendations,
        },
        current: {
          aqi: currentAqi.aqi,
          level: currentAqi.level,
          label: currentAqi.label,
          color: currentAqi.color,
          timestamp: new Date().toISOString(),
        },
        forecast24h: this.generateForecast(currentAqi.aqi, currentSeason, 24),
        forecast48h: this.generateForecast(currentAqi.aqi, currentSeason, 48),
        forecast72h: this.generateForecast(currentAqi.aqi, currentSeason, 72),
        hourlyForecast: this.generateHourlyForecast(currentAqi.aqi, currentSeason, 72),
        reasonAnalysis: this.analyzeReasons(currentAqi, currentSeason, weather),
        seasonalComparison: this.getSeasonalComparison(currentAqi.aqi),
        alerts: this.generateSeasonalAlerts(currentAqi, currentSeason),
      };

      cache.set(cacheKey, forecast, 300);
      return forecast;
    } catch (error) {
      logger.error(`Seasonal forecast error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate forecast for specific hours ahead
   */
  generateForecast(currentAqi, season, hoursAhead) {
    const hour = new Date().getHours();
    const futureHour = (hour + hoursAhead) % 24;
    
    // Diurnal pattern adjustment
    let diurnalFactor = 1;
    if (futureHour >= 6 && futureHour <= 10) diurnalFactor = 1.2; // Morning rush
    if (futureHour >= 17 && futureHour <= 21) diurnalFactor = 1.25; // Evening rush
    if (futureHour >= 12 && futureHour <= 16) diurnalFactor = 0.85; // Midday mixing
    if (futureHour >= 0 && futureHour <= 5) diurnalFactor = 1.1; // Night accumulation

    // Seasonal base adjustment
    const seasonalFactor = season.baseMultiplier;
    
    // Weather-based adjustment (simplified)
    const weatherFactor = 0.95 + Math.random() * 0.1;
    
    // Calculate predicted AQI
    let predictedAqi = currentAqi * diurnalFactor * weatherFactor;
    
    // Add some trend based on time of day and season
    if (season.key === 'winter' && futureHour >= 18) {
      predictedAqi *= 1.1; // Evening buildup in winter
    }
    
    predictedAqi = Math.round(Math.max(20, Math.min(500, predictedAqi)));
    
    const level = aqiService.getIndianAqiLevel(predictedAqi);
    const change = predictedAqi - currentAqi;
    
    return {
      aqi: predictedAqi,
      level: level.level,
      label: level.label,
      color: level.color,
      change: change,
      trend: change > 10 ? 'rising' : change < -10 ? 'falling' : 'stable',
      confidence: hoursAhead <= 24 ? 'high' : hoursAhead <= 48 ? 'moderate' : 'low',
      timestamp: new Date(Date.now() + hoursAhead * 3600000).toISOString(),
      reason: this.getPredictionReason(change, season, futureHour),
    };
  }

  /**
   * Generate hourly forecast
   */
  generateHourlyForecast(currentAqi, season, hours) {
    const forecast = [];
    
    for (let h = 1; h <= hours; h++) {
      const hourData = this.generateForecast(currentAqi, season, h);
      forecast.push({
        hour: h,
        ...hourData,
      });
    }
    
    return forecast;
  }

  /**
   * Get prediction reason
   */
  getPredictionReason(change, season, futureHour) {
    const reasons = [];
    
    if (change > 20) {
      if (futureHour >= 6 && futureHour <= 10) {
        reasons.push('Morning traffic emissions building up');
      }
      if (futureHour >= 17 && futureHour <= 21) {
        reasons.push('Evening rush hour and cooking emissions');
      }
      if (season.key === 'winter') {
        reasons.push('Winter temperature inversion trapping pollutants');
      }
      if (season.key === 'postMonsoon') {
        reasons.push('Stubble burning smoke inflow from northwest');
      }
    } else if (change < -20) {
      if (futureHour >= 12 && futureHour <= 16) {
        reasons.push('Midday solar heating improving atmospheric mixing');
      }
      if (season.key === 'monsoon') {
        reasons.push('Monsoon rain expected to wash pollutants');
      }
      reasons.push('Wind speed increase expected');
    } else {
      reasons.push('Stable atmospheric conditions expected');
    }

    return reasons.join('. ') || 'Normal variation expected';
  }

  /**
   * Analyze reasons for current AQI
   */
  analyzeReasons(aqiData, season, weather) {
    const reasons = [];
    const contributions = [];

    // Seasonal factors
    season.factors.forEach(factor => {
      if (factor.impact !== 'positive' && factor.contribution > 0) {
        contributions.push({
          source: factor.name,
          contribution: factor.contribution,
          description: factor.description,
          impact: factor.impact,
        });
      }
    });

    // Weather-based reasons
    if (weather.windSpeed && weather.windSpeed < 5) {
      reasons.push({
        type: 'weather',
        factor: 'Low Wind Speed',
        value: `${weather.windSpeed.toFixed(1)} km/h`,
        impact: 'Poor dispersion of pollutants',
      });
    }

    if (weather.humidity && weather.humidity > 70) {
      reasons.push({
        type: 'weather',
        factor: 'High Humidity',
        value: `${weather.humidity}%`,
        impact: 'Particles absorb moisture, stay suspended longer',
      });
    }

    if (weather.visibility && weather.visibility < 2) {
      reasons.push({
        type: 'weather',
        factor: 'Low Visibility',
        value: `${weather.visibility.toFixed(1)} km`,
        impact: 'Indicates high particulate concentration',
      });
    }

    // Time-based reasons
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      reasons.push({
        type: 'temporal',
        factor: 'Morning Rush Hour',
        value: 'Peak traffic period',
        impact: 'Increased vehicular emissions',
      });
    }

    return {
      primaryFactors: contributions.sort((a, b) => b.contribution - a.contribution).slice(0, 5),
      weatherFactors: reasons,
      overallAssessment: this.getOverallAssessment(aqiData.aqi, season),
    };
  }

  /**
   * Get overall assessment
   */
  getOverallAssessment(aqi, season) {
    if (aqi <= 50) {
      return `Air quality is good for ${season.name}. Enjoy outdoor activities!`;
    } else if (aqi <= 100) {
      return `Air quality is satisfactory. Sensitive individuals should take precautions.`;
    } else if (aqi <= 200) {
      return `Moderate pollution typical for ${season.name}. Reduce prolonged outdoor exertion.`;
    } else if (aqi <= 300) {
      return `Poor air quality. ${season.name} factors like ${season.factors[0]?.name} are contributing. Limit outdoor exposure.`;
    } else if (aqi <= 400) {
      return `Very poor air quality. ${season.name} conditions are severe. Avoid outdoor activities.`;
    }
    return `Severe pollution emergency. Stay indoors with air purification. Health risk for all.`;
  }

  /**
   * Get seasonal comparison
   */
  getSeasonalComparison(currentAqi) {
    return Object.entries(this.seasonalFactors).map(([key, season]) => {
      const typicalAqi = key === 'winter' ? 280 : 
                        key === 'summer' ? 140 : 
                        key === 'monsoon' ? 80 : 200;
      
      return {
        season: season.name,
        key,
        typicalAqi,
        current: currentAqi,
        comparison: currentAqi > typicalAqi ? 'above_average' : 
                   currentAqi < typicalAqi * 0.8 ? 'below_average' : 'average',
        months: season.months.map(m => {
          const date = new Date(2024, m - 1, 1);
          return date.toLocaleString('default', { month: 'short' });
        }).join(', '),
      };
    });
  }

  /**
   * Generate seasonal alerts
   */
  generateSeasonalAlerts(aqiData, season) {
    const alerts = [];
    const aqi = aqiData.aqi;

    // High pollution alert
    if (aqi > 300) {
      alerts.push({
        type: 'emergency',
        title: 'Severe Air Quality Alert',
        message: `AQI has reached ${aqi}. Avoid all outdoor activities.`,
        icon: '🚨',
      });
    } else if (aqi > 200) {
      alerts.push({
        type: 'warning',
        title: 'Poor Air Quality Warning',
        message: 'Sensitive groups should avoid prolonged outdoor exposure.',
        icon: '⚠️',
      });
    }

    // Season-specific alerts
    if (season.key === 'postMonsoon' || (season.key === 'winter' && new Date().getMonth() === 10)) {
      alerts.push({
        type: 'info',
        title: 'Stubble Burning Season',
        message: 'Monitor SAFAR for crop burning forecasts from Punjab/Haryana.',
        icon: '🔥',
      });
    }

    if (season.key === 'winter' && new Date().getMonth() === 10) {
      alerts.push({
        type: 'info',
        title: 'Diwali Period Advisory',
        message: 'Air quality typically worsens during festival period. Plan accordingly.',
        icon: '🪔',
      });
    }

    return alerts;
  }
}

module.exports = new SeasonalService();

