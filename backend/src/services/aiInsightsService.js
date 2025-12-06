const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');
const hotspotService = require('./hotspotService');
const predictionService = require('./predictionService');
const { getAqiLevel, getHealthRecommendations } = require('../utils/aqiHelpers');

class AIInsightsService {
  constructor() {
    // Knowledge base for insights generation
    this.pollutionSources = {
      traffic: {
        indicators: ['morning peak', 'evening peak', 'NO2 high', 'CO high'],
        weight: 0.35,
      },
      industrial: {
        indicators: ['SO2 high', 'continuous elevation', 'industrial zones'],
        weight: 0.25,
      },
      dust: {
        indicators: ['PM10 high', 'dry season', 'construction activity'],
        weight: 0.20,
      },
      biomass: {
        indicators: ['stubble burning season', 'hotspots detected', 'rural influence'],
        weight: 0.15,
      },
      weather: {
        indicators: ['inversion', 'low wind', 'high humidity'],
        weight: 0.05,
      },
    };
  }

  /**
   * Generate comprehensive AI insights for a location
   */
  async generateInsights(lat, lon, locationName = 'Delhi') {
    const cacheKey = `insights_${lat}_${lon}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Gather all data
      const [aqiData, hotspotsData, predictionsData] = await Promise.all([
        aqiService.getAQIByLocation(lat, lon),
        hotspotService.getHotspots(1),
        predictionService.getPredictions(lat, lon, locationName),
      ]);

      // Generate insights
      const insights = {
        summary: this.generateSummary(aqiData, predictionsData),
        sourceAnalysis: this.analyzeSource(aqiData, hotspotsData),
        warnings: this.generateWarnings(aqiData, predictionsData, hotspotsData),
        recommendations: this.generateRecommendations(aqiData, predictionsData),
        preventionSteps: this.getPreventionSteps(aqiData.aqi),
        cityAdvice: this.getCityLevelAdvice(aqiData, predictionsData),
        timestamp: new Date().toISOString(),
      };

      cache.set(cacheKey, insights, 300);
      return insights;
    } catch (error) {
      logger.error(`Insights generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate executive summary
   */
  generateSummary(aqiData, predictions) {
    const aqi = aqiData.aqi;
    const level = getAqiLevel(aqi);
    const trend = predictions.trends?.shortTerm || 'stable';
    
    let summaryText = '';
    
    if (aqi <= 50) {
      summaryText = `Air quality is ${level.label.toLowerCase()} with AQI at ${aqi}. Outdoor activities are safe for all groups.`;
    } else if (aqi <= 100) {
      summaryText = `Air quality is ${level.label.toLowerCase()} at AQI ${aqi}. Most activities are safe, but unusually sensitive individuals may experience symptoms.`;
    } else if (aqi <= 150) {
      summaryText = `Air quality is ${level.label.toLowerCase()} at AQI ${aqi}. Sensitive groups including children, elderly, and those with respiratory conditions should limit prolonged outdoor exposure.`;
    } else if (aqi <= 200) {
      summaryText = `Air quality is ${level.label.toLowerCase()} at AQI ${aqi}. Everyone may experience health effects. Sensitive groups should avoid outdoor activities.`;
    } else if (aqi <= 300) {
      summaryText = `ALERT: Air quality is ${level.label.toLowerCase()} at AQI ${aqi}. Health warnings of emergency conditions. All populations are likely to be affected.`;
    } else {
      summaryText = `EMERGENCY: Air quality is ${level.label.toLowerCase()} at AQI ${aqi}. Serious health effects for entire population. Avoid all outdoor activities.`;
    }

    // Add trend information
    if (trend.includes('increasing')) {
      summaryText += ` Air quality is deteriorating.`;
    } else if (trend.includes('decreasing')) {
      summaryText += ` Conditions are improving.`;
    }

    // Add prediction insight
    if (predictions.sixHour) {
      const diff = predictions.sixHour.aqi - aqi;
      if (Math.abs(diff) > 20) {
        summaryText += ` Expected to ${diff > 0 ? 'worsen to' : 'improve to'} AQI ${predictions.sixHour.aqi} in 6 hours.`;
      }
    }

    return {
      text: summaryText,
      aqi,
      level: level.level,
      trend,
      headline: this.getHeadline(aqi, trend),
    };
  }

  /**
   * Get headline for current conditions
   */
  getHeadline(aqi, trend) {
    if (aqi <= 50) return '🌿 Clear Skies - Enjoy the Fresh Air';
    if (aqi <= 100) return '☁️ Moderate Air Quality - Most Activities Safe';
    if (aqi <= 150) return '⚠️ Caution Advised for Sensitive Groups';
    if (aqi <= 200) return '🚨 Unhealthy Air - Limit Outdoor Exposure';
    if (aqi <= 300) return '⛔ Very Unhealthy - Avoid Outdoor Activities';
    return '🆘 Hazardous Air Quality - Stay Indoors';
  }

  /**
   * Analyze pollution sources
   */
  analyzeSource(aqiData, hotspotsData) {
    const pollutants = aqiData.pollutants || {};
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    
    const sources = [];
    
    // Traffic analysis
    const isTrafficHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
    const highNO2 = pollutants.no2 > 40;
    const highCO = pollutants.co > 2;
    
    if (isTrafficHour || highNO2 || highCO) {
      sources.push({
        source: 'Vehicular Traffic',
        contribution: isTrafficHour && highNO2 ? 'High' : 'Moderate',
        confidence: 0.85,
        indicators: ['Peak traffic hours', highNO2 && 'Elevated NO₂', highCO && 'Elevated CO'].filter(Boolean),
        description: 'Vehicle emissions are a primary contributor, especially during rush hours.',
      });
    }

    // Dust analysis
    const pm10Ratio = pollutants.pm10 && pollutants.pm25 ? pollutants.pm10 / pollutants.pm25 : 1;
    if (pm10Ratio > 2 || pollutants.pm10 > 150) {
      sources.push({
        source: 'Dust & Construction',
        contribution: pm10Ratio > 3 ? 'High' : 'Moderate',
        confidence: 0.75,
        indicators: ['High PM10/PM2.5 ratio', 'Construction season'],
        description: 'Road dust and construction activities are contributing to particulate matter.',
      });
    }

    // Biomass/Stubble burning analysis
    const isStubbleSeason = month >= 9 && month <= 11;
    const hasHotspots = hotspotsData.summary?.total > 0;
    
    if (isStubbleSeason || hasHotspots) {
      sources.push({
        source: 'Biomass Burning',
        contribution: hasHotspots && isStubbleSeason ? 'Very High' : hasHotspots ? 'Moderate' : 'Low',
        confidence: hasHotspots ? 0.9 : 0.6,
        indicators: [isStubbleSeason && 'Stubble burning season', hasHotspots && `${hotspotsData.summary.total} fire hotspots detected`].filter(Boolean),
        description: 'Agricultural burning and fires in NCR region are affecting air quality.',
      });
    }

    // Industrial analysis
    const highSO2 = pollutants.so2 > 20;
    if (highSO2) {
      sources.push({
        source: 'Industrial Emissions',
        contribution: 'Moderate',
        confidence: 0.7,
        indicators: ['Elevated SO₂ levels'],
        description: 'Industrial activity and power generation contributing to pollution.',
      });
    }

    // Weather factors
    const isWinter = month >= 10 || month <= 1;
    if (isWinter && aqiData.aqi > 150) {
      sources.push({
        source: 'Weather Conditions',
        contribution: 'Contributing',
        confidence: 0.8,
        indicators: ['Winter season', 'Possible temperature inversion'],
        description: 'Cold weather and low wind speeds are trapping pollutants near the ground.',
      });
    }

    // Sort by contribution
    const contributionOrder = { 'Very High': 4, 'High': 3, 'Moderate': 2, 'Low': 1, 'Contributing': 1.5 };
    sources.sort((a, b) => (contributionOrder[b.contribution] || 0) - (contributionOrder[a.contribution] || 0));

    return {
      primarySource: sources[0] || { source: 'Multiple factors', contribution: 'Various' },
      allSources: sources,
      dominantPollutant: aqiData.dominantPollutant,
      pollutantBreakdown: this.getPollutantBreakdown(pollutants),
    };
  }

  /**
   * Get pollutant breakdown with descriptions
   */
  getPollutantBreakdown(pollutants) {
    const breakdown = [];
    
    if (pollutants.pm25) {
      breakdown.push({
        name: 'PM2.5',
        value: pollutants.pm25,
        unit: 'μg/m³',
        status: this.getPollutantStatus(pollutants.pm25, [0, 12, 35.4, 55.4, 150.4, 250.4]),
        description: 'Fine particles that can penetrate deep into lungs',
      });
    }
    
    if (pollutants.pm10) {
      breakdown.push({
        name: 'PM10',
        value: pollutants.pm10,
        unit: 'μg/m³',
        status: this.getPollutantStatus(pollutants.pm10, [0, 54, 154, 254, 354, 424]),
        description: 'Inhalable particles including dust and pollen',
      });
    }
    
    if (pollutants.no2) {
      breakdown.push({
        name: 'NO₂',
        value: pollutants.no2,
        unit: 'ppb',
        status: this.getPollutantStatus(pollutants.no2, [0, 53, 100, 360, 649, 1249]),
        description: 'From vehicle and industrial combustion',
      });
    }
    
    if (pollutants.o3) {
      breakdown.push({
        name: 'O₃',
        value: pollutants.o3,
        unit: 'ppb',
        status: this.getPollutantStatus(pollutants.o3, [0, 54, 70, 85, 105, 200]),
        description: 'Ground-level ozone from chemical reactions',
      });
    }
    
    if (pollutants.so2) {
      breakdown.push({
        name: 'SO₂',
        value: pollutants.so2,
        unit: 'ppb',
        status: this.getPollutantStatus(pollutants.so2, [0, 35, 75, 185, 304, 604]),
        description: 'From fossil fuel combustion',
      });
    }
    
    if (pollutants.co) {
      breakdown.push({
        name: 'CO',
        value: pollutants.co,
        unit: 'mg/m³',
        status: this.getPollutantStatus(pollutants.co, [0, 4.4, 9.4, 12.4, 15.4, 30.4]),
        description: 'From incomplete combustion',
      });
    }
    
    return breakdown;
  }

  /**
   * Get status for a pollutant value
   */
  getPollutantStatus(value, thresholds) {
    if (value <= thresholds[1]) return 'good';
    if (value <= thresholds[2]) return 'moderate';
    if (value <= thresholds[3]) return 'unhealthy-sensitive';
    if (value <= thresholds[4]) return 'unhealthy';
    if (value <= thresholds[5]) return 'very-unhealthy';
    return 'hazardous';
  }

  /**
   * Generate warnings
   */
  generateWarnings(aqiData, predictions, hotspotsData) {
    const warnings = [];
    const aqi = aqiData.aqi;
    
    // Current AQI warnings
    if (aqi > 300) {
      warnings.push({
        type: 'emergency',
        title: 'Emergency Air Quality Alert',
        message: 'AQI has reached hazardous levels. All outdoor activities should be avoided.',
        priority: 1,
      });
    } else if (aqi > 200) {
      warnings.push({
        type: 'alert',
        title: 'Very Unhealthy Air Quality',
        message: 'Air quality is very poor. Everyone should limit outdoor exposure.',
        priority: 2,
      });
    } else if (aqi > 150) {
      warnings.push({
        type: 'warning',
        title: 'Unhealthy for Sensitive Groups',
        message: 'Children, elderly, and those with respiratory conditions should limit outdoor activities.',
        priority: 3,
      });
    }

    // Prediction-based warnings
    if (predictions.sixHour && predictions.sixHour.aqi > aqi + 50) {
      warnings.push({
        type: 'forecast',
        title: 'Air Quality Deterioration Expected',
        message: `AQI predicted to rise to ${predictions.sixHour.aqi} in the next 6 hours. Plan indoor activities.`,
        priority: 2,
      });
    }

    // Hotspot warnings
    if (hotspotsData.summary?.total > 5) {
      warnings.push({
        type: 'hotspot',
        title: 'Multiple Fire Hotspots Detected',
        message: `${hotspotsData.summary.total} active fire hotspots detected in NCR region. Expect elevated pollution levels.`,
        priority: 3,
      });
    }

    // Time-based warnings
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      warnings.push({
        type: 'info',
        title: 'Peak Traffic Hours',
        message: 'Currently in peak traffic hours. AQI may be elevated in traffic-heavy areas.',
        priority: 4,
      });
    }

    return warnings.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(aqiData, predictions) {
    const aqi = aqiData.aqi;
    const recommendations = [];

    // Outdoor activity recommendations
    if (aqi <= 50) {
      recommendations.push({
        category: 'outdoor',
        title: 'Outdoor Activities',
        message: 'Great day for outdoor activities! Enjoy parks, sports, and walks.',
        icon: '🏃',
      });
    } else if (aqi <= 100) {
      recommendations.push({
        category: 'outdoor',
        title: 'Outdoor Activities',
        message: 'Outdoor activities are generally safe. Sensitive individuals should monitor symptoms.',
        icon: '🚶',
      });
    } else if (aqi <= 150) {
      recommendations.push({
        category: 'outdoor',
        title: 'Limit Strenuous Activities',
        message: 'Reduce prolonged or heavy outdoor exertion. Take more breaks during outdoor activities.',
        icon: '⚠️',
      });
    } else {
      recommendations.push({
        category: 'outdoor',
        title: 'Avoid Outdoor Activities',
        message: 'Move activities indoors. If you must go out, keep it brief.',
        icon: '🏠',
      });
    }

    // Mask recommendations
    if (aqi > 100) {
      const maskType = aqi > 200 ? 'N95/N99' : 'N95';
      recommendations.push({
        category: 'protection',
        title: 'Wear a Mask',
        message: `Use ${maskType} mask when outdoors. Ensure proper fit for maximum protection.`,
        icon: '😷',
      });
    }

    // Indoor recommendations
    if (aqi > 150) {
      recommendations.push({
        category: 'indoor',
        title: 'Indoor Air Quality',
        message: 'Run air purifiers, keep windows closed. Consider indoor plants for natural air filtering.',
        icon: '🌱',
      });
    }

    // Timing recommendations
    if (predictions.hourlyForecast) {
      const bestHours = predictions.hourlyForecast
        .filter(h => h.hour <= 12)
        .sort((a, b) => a.aqi - b.aqi)
        .slice(0, 3);
      
      if (bestHours.length > 0 && bestHours[0].aqi < aqi) {
        recommendations.push({
          category: 'timing',
          title: 'Best Time for Outdoors',
          message: `Lowest pollution expected around ${new Date(bestHours[0].timestamp).getHours()}:00 (AQI ~${bestHours[0].aqi})`,
          icon: '⏰',
        });
      }
    }

    // Health recommendations
    recommendations.push({
      category: 'health',
      title: 'Stay Hydrated',
      message: 'Drink plenty of water. It helps your body flush out toxins.',
      icon: '💧',
    });

    return recommendations;
  }

  /**
   * Get prevention steps
   */
  getPreventionSteps(aqi) {
    const steps = [
      {
        step: 'Reduce vehicle use',
        description: 'Use public transport, carpool, or cycle for short distances',
        impact: 'high',
      },
      {
        step: 'Avoid burning waste',
        description: 'Never burn garbage, leaves, or other materials',
        impact: 'high',
      },
      {
        step: 'Use clean cooking fuel',
        description: 'Switch to LPG or electric cooking instead of solid fuels',
        impact: 'medium',
      },
      {
        step: 'Plant trees',
        description: 'Trees absorb pollutants and produce oxygen',
        impact: 'long-term',
      },
      {
        step: 'Report violations',
        description: 'Report industrial pollution and illegal burning to authorities',
        impact: 'medium',
      },
    ];

    if (aqi > 200) {
      steps.unshift({
        step: 'Avoid outdoor burning completely',
        description: 'Any open burning significantly worsens already critical air quality',
        impact: 'critical',
      });
    }

    return steps;
  }

  /**
   * Get city-level advice
   */
  getCityLevelAdvice(aqiData, predictions) {
    const aqi = aqiData.aqi;
    const trend = predictions.trends?.shortTerm || 'stable';
    
    const advice = {
      forCitizens: [],
      forSchools: [],
      forBusinesses: [],
      forGovernment: [],
    };

    // Citizens
    if (aqi > 200) {
      advice.forCitizens.push('Work from home if possible');
      advice.forCitizens.push('Keep children indoors');
      advice.forCitizens.push('Stock up on N95 masks');
    } else if (aqi > 100) {
      advice.forCitizens.push('Limit outdoor activities for sensitive family members');
      advice.forCitizens.push('Check AQI before planning outdoor events');
    }
    advice.forCitizens.push('Stay informed through official channels');

    // Schools
    if (aqi > 300) {
      advice.forSchools.push('Consider school closure or online classes');
    } else if (aqi > 200) {
      advice.forSchools.push('Cancel outdoor sports and activities');
      advice.forSchools.push('Keep students indoors during breaks');
    } else if (aqi > 150) {
      advice.forSchools.push('Move PE classes indoors');
      advice.forSchools.push('Shorten outdoor recess time');
    }

    // Businesses
    if (aqi > 200) {
      advice.forBusinesses.push('Enable work-from-home policies');
      advice.forBusinesses.push('Provide masks for essential outdoor workers');
    }
    advice.forBusinesses.push('Ensure good indoor air quality');

    // Government
    if (aqi > 300) {
      advice.forGovernment.push('Implement GRAP Stage IV measures');
      advice.forGovernment.push('Consider construction ban');
      advice.forGovernment.push('Increase public transport frequency');
    } else if (aqi > 200) {
      advice.forGovernment.push('Implement GRAP Stage III measures');
      advice.forGovernment.push('Enhance dust control on roads');
    }

    return advice;
  }

  /**
   * Generate policy maker insights
   */
  async generatePolicyInsights() {
    const cacheKey = 'policy_insights';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [ncrAqi, hotspots, predictions] = await Promise.all([
        aqiService.getAllNCRAQI(),
        hotspotService.getHotspots(1),
        predictionService.getPolicyPredictions(),
      ]);

      const insights = {
        overview: this.generatePolicyOverview(ncrAqi, predictions),
        zoneAnalysis: this.analyzeZones(ncrAqi),
        actionItems: this.generateActionItems(ncrAqi, hotspots, predictions),
        resourceAllocation: this.suggestResourceAllocation(ncrAqi, hotspots),
        earlyWarning: predictions.alerts,
        grapRecommendation: this.recommendGRAPStage(ncrAqi.summary.averageAqi),
        timestamp: new Date().toISOString(),
      };

      cache.set(cacheKey, insights, 300);
      return insights;
    } catch (error) {
      logger.error(`Policy insights error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate policy overview
   */
  generatePolicyOverview(ncrAqi, predictions) {
    const avgAqi = ncrAqi.summary.averageAqi;
    const level = getAqiLevel(avgAqi);
    
    return {
      currentStatus: level.label,
      ncrAverageAqi: avgAqi,
      affectedPopulation: this.estimateAffectedPopulation(avgAqi),
      economicImpact: this.estimateEconomicImpact(avgAqi),
      healthBurden: this.estimateHealthBurden(avgAqi),
      trend: predictions.aggregate ? 
        (predictions.aggregate.avg6Hour > avgAqi ? 'Deteriorating' : 'Improving') : 
        'Stable',
    };
  }

  /**
   * Analyze zones for policy
   */
  analyzeZones(ncrAqi) {
    const zones = Object.entries(ncrAqi.regions)
      .filter(([_, data]) => !data.error)
      .map(([key, data]) => ({
        zone: data.location.name,
        aqi: data.aqi,
        level: data.level,
        priority: data.aqi > 200 ? 'high' : data.aqi > 150 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.aqi - a.aqi);

    return {
      criticalZones: zones.filter(z => z.aqi > 300),
      highPriorityZones: zones.filter(z => z.aqi > 200 && z.aqi <= 300),
      moderateZones: zones.filter(z => z.aqi > 100 && z.aqi <= 200),
      safeZones: zones.filter(z => z.aqi <= 100),
      ranking: zones,
    };
  }

  /**
   * Generate action items for policy makers
   */
  generateActionItems(ncrAqi, hotspots, predictions) {
    const avgAqi = ncrAqi.summary.averageAqi;
    const actions = [];

    if (avgAqi > 300) {
      actions.push({
        priority: 'immediate',
        action: 'Activate Emergency Response Protocol',
        department: 'DPCC / CPCB',
        timeline: 'Now',
      });
      actions.push({
        priority: 'immediate',
        action: 'Issue public health emergency advisory',
        department: 'Health Department',
        timeline: 'Within 1 hour',
      });
    }

    if (hotspots.summary?.total > 3) {
      actions.push({
        priority: 'high',
        action: `Investigate ${hotspots.summary.total} fire hotspots`,
        department: 'Environment Ministry',
        timeline: 'Within 24 hours',
      });
    }

    if (avgAqi > 200) {
      actions.push({
        priority: 'high',
        action: 'Increase water sprinkling on roads',
        department: 'Municipal Corporation',
        timeline: 'Within 6 hours',
      });
      actions.push({
        priority: 'high',
        action: 'Deploy additional air quality monitors',
        department: 'DPCC',
        timeline: 'Within 24 hours',
      });
    }

    actions.push({
      priority: 'ongoing',
      action: 'Monitor and update public on air quality',
      department: 'All agencies',
      timeline: 'Continuous',
    });

    return actions;
  }

  /**
   * Suggest resource allocation
   */
  suggestResourceAllocation(ncrAqi, hotspots) {
    const zones = Object.entries(ncrAqi.regions)
      .filter(([_, data]) => !data.error)
      .map(([key, data]) => ({
        zone: data.location.name,
        aqi: data.aqi,
        allocation: data.aqi > 200 ? 'High' : data.aqi > 150 ? 'Medium' : 'Normal',
      }));

    return {
      waterTankers: zones.map(z => ({
        zone: z.zone,
        count: z.aqi > 200 ? 10 : z.aqi > 150 ? 5 : 2,
      })),
      monitoringTeams: zones.map(z => ({
        zone: z.zone,
        teams: z.aqi > 200 ? 3 : z.aqi > 150 ? 2 : 1,
      })),
      healthCamps: zones.filter(z => z.aqi > 200).map(z => ({
        zone: z.zone,
        needed: true,
      })),
    };
  }

  /**
   * Recommend GRAP stage
   */
  recommendGRAPStage(avgAqi) {
    // GRAP - Graded Response Action Plan
    if (avgAqi > 400) {
      return {
        stage: 'Stage IV - Severe+',
        color: '#7e0023',
        actions: [
          'Stop entry of trucks (except essential)',
          'Stop construction work',
          'Close brick kilns and hot mix plants',
          'Maximize public transport',
          'Consider odd-even vehicle scheme',
        ],
      };
    } else if (avgAqi > 300) {
      return {
        stage: 'Stage III - Severe',
        color: '#8f3f97',
        actions: [
          'Stop construction work',
          'Mechanized sweeping of roads',
          'Intensify public transport',
          'Stop use of coal in industries',
        ],
      };
    } else if (avgAqi > 200) {
      return {
        stage: 'Stage II - Very Poor',
        color: '#ff0000',
        actions: [
          'Enhance parking fees',
          'Increase bus and metro frequency',
          'Sprinkle water on roads',
          'Stop use of diesel gensets',
        ],
      };
    } else if (avgAqi > 100) {
      return {
        stage: 'Stage I - Poor',
        color: '#ff7e00',
        actions: [
          'Stop garbage burning',
          'Enforce PUC norms',
          'Control dust at construction sites',
        ],
      };
    }
    
    return {
      stage: 'Normal Operations',
      color: '#00e400',
      actions: ['Continue regular monitoring', 'Maintain preventive measures'],
    };
  }

  /**
   * Estimate affected population (in millions)
   */
  estimateAffectedPopulation(aqi) {
    const ncrPopulation = 46; // million (approximate)
    if (aqi > 300) return `${ncrPopulation}M (Entire NCR)`;
    if (aqi > 200) return `${Math.round(ncrPopulation * 0.8)}M (Most areas)`;
    if (aqi > 150) return `${Math.round(ncrPopulation * 0.5)}M (Urban centers)`;
    return `${Math.round(ncrPopulation * 0.2)}M (Sensitive groups)`;
  }

  /**
   * Estimate economic impact
   */
  estimateEconomicImpact(aqi) {
    if (aqi > 300) return 'Severe - Estimated productivity loss: ₹5000+ Cr/day';
    if (aqi > 200) return 'High - Estimated productivity loss: ₹2000-5000 Cr/day';
    if (aqi > 150) return 'Moderate - Estimated productivity loss: ₹500-2000 Cr/day';
    return 'Low - Normal economic activity';
  }

  /**
   * Estimate health burden
   */
  estimateHealthBurden(aqi) {
    if (aqi > 300) return 'Critical - Expected surge in hospital admissions';
    if (aqi > 200) return 'High - Increased respiratory cases expected';
    if (aqi > 150) return 'Moderate - Sensitive groups at risk';
    return 'Low - Minimal health impact expected';
  }
}

module.exports = new AIInsightsService();

