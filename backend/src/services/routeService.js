const axios = require('axios');
const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const aqiService = require('./aqiService');
const hotspotService = require('./hotspotService');
const { calculateExposureScore, getMaskRecommendation, getAqiLevel } = require('../utils/aqiHelpers');

class RouteService {
  constructor() {
    this.orsClient = axios.create({
      baseURL: config.apis.openRouteService.baseUrl,
      timeout: 15000,
      headers: {
        'Authorization': config.apis.openRouteService.key,
        'Content-Type': 'application/json',
      },
    });

    // Penalty weights for route scoring
    this.penalties = {
      hotspotProximity: {
        veryClose: 50,    // 0-300m
        close: 30,        // 300-500m
        moderate: 15,     // 500-800m
        far: 5,           // 800m-1km
      },
      windDrift: {
        inPath: 40,       // Pollution drifting directly toward route
        nearPath: 20,     // Pollution drifting near route
      },
      aqi: {
        severe: 100,      // AQI > 400
        veryPoor: 60,     // AQI 301-400
        poor: 35,         // AQI 201-300
        moderate: 15,     // AQI 101-200
        satisfactory: 5,  // AQI 51-100
        good: 0,          // AQI 0-50
      },
    };
  }

  /**
   * Get safe route with hotspot and wind-aware scoring
   */
  async getSafeRoute(origin, destination, mode = 'driving-car') {
    const cacheKey = `route_v2_${origin.lat}_${origin.lon}_${destination.lat}_${destination.lon}_${mode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get multiple alternative routes
      const routes = await this.getRoutes(origin, destination, mode);
      
      if (routes.length === 0) {
        throw new Error('No routes found');
      }

      // Get combined hotspot data (VIIRS, MODIS, Construction Dust) for route analysis
      const allHotspots = await hotspotService.getCombinedHotspotsForRoutes();
      const hotspotsData = {
        hotspots: allHotspots,
        windData: await hotspotService.getWindData(),
      };

      // Evaluate each route with comprehensive scoring
      const evaluatedRoutes = await Promise.all(
        routes.map(route => this.evaluateRouteComprehensive(route, mode, hotspotsData))
      );

      // Sort by total score (lowest = safest)
      evaluatedRoutes.sort((a, b) => a.totalScore - b.totalScore);

      // Assign route classifications (green/yellow/red)
      const classifiedRoutes = this.classifyRoutes(evaluatedRoutes);

      const result = {
        safestRoute: classifiedRoutes[0],
        alternativeRoutes: classifiedRoutes.slice(1),
        comparison: this.compareRoutes(classifiedRoutes),
        recommendations: this.getRouteRecommendations(classifiedRoutes[0]),
        whyRecommended: this.generateWhyRecommended(classifiedRoutes[0], classifiedRoutes.slice(1)),
        windData: hotspotsData.windData,
        nearbyHotspots: this.findNearbyHotspots(origin, destination, hotspotsData.hotspots),
        timestamp: new Date().toISOString(),
      };

      cache.set(cacheKey, result, 180);
      return result;
    } catch (error) {
      logger.error(`Route calculation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Comprehensive route evaluation with hotspots and wind
   */
  async evaluateRouteComprehensive(route, mode, hotspotsData) {
    const waypoints = route.waypoints || [];
    const samplePoints = this.selectSamplePoints(waypoints, 8); // More sample points
    
    const aqiPoints = [];
    let totalAqiPenalty = 0;
    
    // Evaluate AQI at sample points
    for (const point of samplePoints) {
      try {
        const aqiData = await aqiService.getAQIByLocation(point[1], point[0]);
        const penalty = this.calculateAQIPenalty(aqiData.aqi);
        totalAqiPenalty += penalty;
        
        aqiPoints.push({
          lat: point[1],
          lon: point[0],
          aqi: aqiData.aqi,
          level: aqiData.level,
          penalty,
        });
      } catch (error) {
        aqiPoints.push({
          lat: point[1],
          lon: point[0],
          aqi: 150,
          level: 'moderate',
          penalty: this.penalties.aqi.moderate,
        });
        totalAqiPenalty += this.penalties.aqi.moderate;
      }
    }

    // Calculate hotspot proximity penalty
    const hotspotAnalysis = this.analyzeHotspotProximity(
      waypoints, 
      hotspotsData.hotspots || [], 
      hotspotsData.windData
    );
    
    // Count hotspots along route
    const routeHotspotCount = hotspotAnalysis.nearbyHotspots?.length || 0;

    // Calculate average AQI
    const avgAqi = aqiPoints.length > 0
      ? Math.round(aqiPoints.reduce((sum, p) => sum + p.aqi, 0) / aqiPoints.length)
      : 150;

    // Duration and exposure calculation
    const durationMinutes = route.duration / 60;
    const exposureScore = calculateExposureScore(aqiPoints, durationMinutes, mode);
    const maskRec = getMaskRecommendation(avgAqi, mode);

    // Total score calculation
    const normalizedAqiPenalty = totalAqiPenalty / samplePoints.length;
    const totalScore = normalizedAqiPenalty + hotspotAnalysis.totalPenalty + exposureScore;

    return {
      ...route,
      aqiPoints,
      avgAqi,
      aqiLevel: getAqiLevel(avgAqi),
      exposureScore,
      maskRecommendation: maskRec,
      pollutedSegments: this.identifyPollutedSegments(aqiPoints),
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMinutes: Math.round(durationMinutes),
      // New fields
      hotspotAnalysis: {
        ...hotspotAnalysis,
        routeHotspotCount: routeHotspotCount,
      },
      routeHotspotCount: routeHotspotCount,
      aqiPenalty: Math.round(normalizedAqiPenalty),
      hotspotPenalty: Math.round(hotspotAnalysis.totalPenalty),
      windDriftPenalty: Math.round(hotspotAnalysis.windDriftPenalty),
      totalScore: Math.round(totalScore),
      scoreBreakdown: {
        aqi: Math.round(normalizedAqiPenalty),
        hotspotProximity: Math.round(hotspotAnalysis.proximityPenalty),
        windDrift: Math.round(hotspotAnalysis.windDriftPenalty),
        exposure: Math.round(exposureScore),
        hotspotCount: routeHotspotCount,
      },
    };
  }

  /**
   * Calculate AQI-based penalty
   */
  calculateAQIPenalty(aqi) {
    if (aqi > 400) return this.penalties.aqi.severe;
    if (aqi > 300) return this.penalties.aqi.veryPoor;
    if (aqi > 200) return this.penalties.aqi.poor;
    if (aqi > 100) return this.penalties.aqi.moderate;
    if (aqi > 50) return this.penalties.aqi.satisfactory;
    return this.penalties.aqi.good;
  }

  /**
   * Analyze hotspot proximity and wind drift impact on route
   */
  analyzeHotspotProximity(waypoints, hotspots, windData) {
    let proximityPenalty = 0;
    let windDriftPenalty = 0;
    const affectedSegments = [];
    const nearbyHotspots = [];

    if (!hotspots || !waypoints || waypoints.length === 0) {
      return { proximityPenalty: 0, windDriftPenalty: 0, totalPenalty: 0, affectedSegments: [], nearbyHotspots: [] };
    }

    // Check each waypoint against hotspots
    waypoints.forEach((point, pointIndex) => {
      const [lon, lat] = point;

      hotspots.forEach(hotspot => {
        const distance = this.haversineDistance(lat, lon, hotspot.latitude, hotspot.longitude);

        // Proximity penalty (300-800m zone of influence)
        if (distance <= 0.3) { // 0-300m
          proximityPenalty += this.penalties.hotspotProximity.veryClose;
          affectedSegments.push({
            pointIndex,
            lat, lon,
            hotspot: {
              lat: hotspot.latitude,
              lon: hotspot.longitude,
              sourceType: hotspot.sourceType,
              sourceIcon: hotspot.sourceIcon,
            },
            distance: Math.round(distance * 1000),
            penalty: this.penalties.hotspotProximity.veryClose,
            severity: 'critical',
          });
        } else if (distance <= 0.5) { // 300-500m
          proximityPenalty += this.penalties.hotspotProximity.close;
          affectedSegments.push({
            pointIndex, lat, lon,
            hotspot: { lat: hotspot.latitude, lon: hotspot.longitude, sourceType: hotspot.sourceType },
            distance: Math.round(distance * 1000),
            penalty: this.penalties.hotspotProximity.close,
            severity: 'high',
          });
        } else if (distance <= 0.8) { // 500-800m
          proximityPenalty += this.penalties.hotspotProximity.moderate;
        } else if (distance <= 1) { // 800m-1km
          proximityPenalty += this.penalties.hotspotProximity.far;
        }

        // Wind drift penalty - check if pollution is drifting toward route
        if (distance <= 5 && hotspot.drift && windData) { // Within 5km
          const driftImpact = this.calculateWindDriftImpact(
            lat, lon,
            hotspot.latitude, hotspot.longitude,
            hotspot.drift,
            windData
          );

          if (driftImpact.isInPath) {
            windDriftPenalty += this.penalties.windDrift.inPath * driftImpact.factor;
            
            if (!nearbyHotspots.find(h => h.id === hotspot.id)) {
              nearbyHotspots.push({
                ...hotspot,
                distanceToRoute: Math.round(distance * 1000),
                driftImpact: 'direct',
              });
            }
          } else if (driftImpact.isNearPath) {
            windDriftPenalty += this.penalties.windDrift.nearPath * driftImpact.factor;
          }
        }
      });
    });

    // Normalize penalties by waypoint count
    const normalizedProximity = waypoints.length > 0 ? proximityPenalty / waypoints.length : 0;
    const normalizedDrift = waypoints.length > 0 ? windDriftPenalty / waypoints.length : 0;

    return {
      proximityPenalty: normalizedProximity,
      windDriftPenalty: normalizedDrift,
      totalPenalty: normalizedProximity + normalizedDrift,
      affectedSegments: affectedSegments.slice(0, 5), // Top 5 most affected
      nearbyHotspots: nearbyHotspots.slice(0, 5),
    };
  }

  /**
   * Calculate wind drift impact on a route point
   */
  calculateWindDriftImpact(routeLat, routeLon, hotspotLat, hotspotLon, drift, windData) {
    if (!drift || !drift.direction) {
      return { isInPath: false, isNearPath: false, factor: 0 };
    }

    // Calculate bearing from hotspot to route point
    const bearingToRoute = this.calculateBearing(hotspotLat, hotspotLon, routeLat, routeLon);
    
    // Calculate angular difference between drift direction and bearing to route
    let angleDiff = Math.abs(drift.direction - bearingToRoute);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // Wind speed factor (stronger wind = more impact)
    const speedFactor = Math.min(2, (windData.speedKmh || 5) / 10);

    // If wind is blowing toward the route (within 30 degrees)
    if (angleDiff <= 30) {
      return { isInPath: true, isNearPath: false, factor: speedFactor };
    }
    // If wind is blowing somewhat toward the route (30-60 degrees)
    if (angleDiff <= 60) {
      return { isInPath: false, isNearPath: true, factor: speedFactor * 0.5 };
    }

    return { isInPath: false, isNearPath: false, factor: 0 };
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360;
  }

  /**
   * Classify routes as green/yellow/red
   */
  classifyRoutes(routes) {
    if (routes.length === 0) return [];

    const minScore = routes[0].totalScore;
    const maxScore = routes[routes.length - 1].totalScore;
    const range = maxScore - minScore || 1;

    return routes.map((route, index) => {
      let classification;
      let classColor;
      
      // Relative scoring
      const normalizedScore = (route.totalScore - minScore) / range;
      
      // Absolute AQI-based classification
      if (route.avgAqi <= 100 && normalizedScore <= 0.3) {
        classification = 'recommended';
        classColor = '#10B981'; // Green
      } else if (route.avgAqi <= 200 && normalizedScore <= 0.6) {
        classification = 'moderate';
        classColor = '#FBBF24'; // Yellow
      } else {
        classification = 'avoid';
        classColor = '#EF4444'; // Red
      }

      // First route is always best available
      if (index === 0) {
        classification = 'recommended';
        classColor = '#10B981';
      }

      return {
        ...route,
        classification,
        classColor,
        classLabel: classification === 'recommended' ? 'Best Route' :
                    classification === 'moderate' ? 'Moderate Risk' : 'High Risk - Avoid',
        rank: index + 1,
      };
    });
  }

  /**
   * Generate "Why this route is recommended" message
   */
  generateWhyRecommended(bestRoute, alternatives) {
    const reasons = [];
    const metrics = [];

    // AQI comparison
    if (bestRoute.avgAqi <= 100) {
      reasons.push(`✅ Average AQI of ${bestRoute.avgAqi} is in the safe zone`);
    } else if (bestRoute.avgAqi <= 150) {
      reasons.push(`⚠️ Average AQI of ${bestRoute.avgAqi} is moderate - acceptable for short trips`);
    } else {
      reasons.push(`🔶 Average AQI of ${bestRoute.avgAqi} - consider N95 mask`);
    }

    // Hotspot avoidance
    if (bestRoute.hotspotAnalysis?.affectedSegments?.length === 0) {
      reasons.push('✅ Route avoids all pollution hotspots');
    } else if (bestRoute.hotspotAnalysis?.affectedSegments?.length <= 2) {
      reasons.push(`⚠️ Route passes near ${bestRoute.hotspotAnalysis.affectedSegments.length} hotspot(s) - maintain safe distance`);
    } else {
      reasons.push(`🔶 Multiple hotspots nearby - keep windows closed`);
    }

    // Wind drift consideration
    if (bestRoute.windDriftPenalty === 0) {
      reasons.push('✅ No pollution drift affecting this route');
    } else if (bestRoute.windDriftPenalty < 10) {
      reasons.push('⚠️ Minor pollution drift detected - limited impact');
    } else {
      reasons.push('🔶 Wind carrying pollution toward route - reduce exposure time');
    }

    // Compare with alternatives
    if (alternatives.length > 0) {
      const avgAltScore = alternatives.reduce((sum, r) => sum + r.totalScore, 0) / alternatives.length;
      const improvement = Math.round(((avgAltScore - bestRoute.totalScore) / avgAltScore) * 100);
      
      if (improvement > 0) {
        metrics.push(`📊 ${improvement}% lower pollution exposure than alternatives`);
      }

      const avgAltAqi = alternatives.reduce((sum, r) => sum + r.avgAqi, 0) / alternatives.length;
      const aqiDiff = Math.round(avgAltAqi - bestRoute.avgAqi);
      
      if (aqiDiff > 0) {
        metrics.push(`🌬️ ${aqiDiff} points lower AQI compared to other routes`);
      }
    }

    // Exposure score
    if (bestRoute.exposureScore < 30) {
      reasons.push('✅ Low overall pollution exposure for this journey');
    } else if (bestRoute.exposureScore < 60) {
      reasons.push('⚠️ Moderate pollution exposure - consider timing your trip');
    }

    return {
      summary: `This route has the lowest pollution score (${bestRoute.totalScore}) based on AQI levels, hotspot proximity, and wind patterns.`,
      reasons,
      metrics,
      disclaimer: 'Route recommendations are based on real-time data. Conditions may change - stay alert for visible smoke or unusual odors.',
    };
  }

  /**
   * Find hotspots near the route corridor
   */
  findNearbyHotspots(origin, destination, hotspots) {
    if (!hotspots) return [];

    const nearby = [];
    const routeCenter = {
      lat: (origin.lat + destination.lat) / 2,
      lon: (origin.lon + destination.lon) / 2,
    };

    hotspots.forEach(hotspot => {
      const distToCenter = this.haversineDistance(
        routeCenter.lat, routeCenter.lon,
        hotspot.latitude, hotspot.longitude
      );

      // Within 10km of route center
      if (distToCenter <= 10) {
        nearby.push({
          ...hotspot,
          distanceFromRoute: Math.round(distToCenter * 1000),
        });
      }
    });

    return nearby.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute).slice(0, 10);
  }

  /**
   * Get routes from OpenRouteService
   */
  async getRoutes(origin, destination, mode) {
    const orsMode = this.convertMode(mode);
    
    try {
      const apiKey = config.apis.openRouteService.key;
      
      if (!apiKey || apiKey.includes('your_')) {
        logger.warn('OpenRouteService API not configured, using sample routes');
        return this.getSampleRoutes(origin, destination, mode);
      }

      const response = await this.orsClient.post(`/v2/directions/${orsMode}`, {
        coordinates: [
          [origin.lon, origin.lat],
          [destination.lon, destination.lat],
        ],
        alternative_routes: {
          share_factor: 0.6,
          target_count: 3,
        },
        geometry: true,
        instructions: true,
      });

      return response.data.routes.map((route, index) => {
        // Extract route instructions and road names from segments
        const routeInstructions = this.extractRouteInstructions(route.segments);
        const roadNames = this.extractRoadNames(route.segments);
        
        return {
          id: `route_${index}`,
          distance: route.summary.distance,
          duration: route.summary.duration,
          geometry: route.geometry,
          segments: route.segments,
          waypoints: this.extractWaypoints(route.geometry),
          instructions: routeInstructions,
          roadNames: roadNames,
          majorIntersections: this.extractMajorIntersections(route.segments),
        };
      });
    } catch (error) {
      logger.error(`ORS API error: ${error.message}`);
      return this.getSampleRoutes(origin, destination, mode);
    }
  }

  /**
   * Convert mode to ORS format
   */
  convertMode(mode) {
    const modeMap = {
      'walking': 'foot-walking',
      'cycling': 'cycling-regular',
      'two-wheeler': 'cycling-regular',
      'car': 'driving-car',
      'bus': 'driving-car',
    };
    return modeMap[mode] || 'driving-car';
  }

  /**
   * Extract waypoints from geometry
   */
  extractWaypoints(geometry) {
    if (!geometry) return [];
    
    if (typeof geometry === 'string') {
      return this.decodePolyline(geometry);
    }
    
    return geometry.coordinates || [];
  }

  /**
   * Decode polyline to coordinates
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  }

  /**
   * Select evenly spaced sample points
   */
  selectSamplePoints(waypoints, count) {
    if (waypoints.length <= count) return waypoints;
    
    const result = [];
    const step = Math.floor(waypoints.length / count);
    
    for (let i = 0; i < count; i++) {
      result.push(waypoints[i * step]);
    }
    
    return result;
  }

  /**
   * Identify polluted segments
   */
  identifyPollutedSegments(aqiPoints) {
    return aqiPoints
      .filter(p => p.aqi > 150)
      .map(p => ({
        location: { lat: p.lat, lon: p.lon },
        aqi: p.aqi,
        level: p.level,
        warning: p.aqi > 200 ? 'High pollution area - consider alternate timing' : 'Elevated pollution',
      }));
  }

  /**
   * Compare routes
   */
  compareRoutes(routes) {
    if (routes.length < 2) return null;

    const safest = routes[0];
    const fastest = routes.reduce((min, r) => r.duration < min.duration ? r : min, routes[0]);
    const shortest = routes.reduce((min, r) => r.distance < min.distance ? r : min, routes[0]);

    return {
      safest: {
        id: safest.id,
        score: safest.totalScore,
        avgAqi: safest.avgAqi,
        classification: safest.classification,
      },
      fastest: {
        id: fastest.id,
        duration: fastest.durationMinutes,
        exposureDiff: ((fastest.totalScore - safest.totalScore) / (safest.totalScore || 1) * 100).toFixed(1),
      },
      shortest: {
        id: shortest.id,
        distance: shortest.distanceKm,
      },
      scoreSavings: routes.length > 1 
        ? ((routes[routes.length - 1].totalScore - safest.totalScore) / (routes[routes.length - 1].totalScore || 1) * 100).toFixed(1)
        : 0,
    };
  }

  /**
   * Get route recommendations
   */
  getRouteRecommendations(route) {
    const recommendations = [];
    
    if (route.avgAqi > 200) {
      recommendations.push({
        type: 'timing',
        message: 'Consider traveling during early morning (5-7 AM) when pollution is typically lower',
        priority: 'high',
      });
    }

    if (route.maskRecommendation?.required) {
      recommendations.push({
        type: 'protection',
        message: `Wear ${route.maskRecommendation.type} during this journey`,
        priority: route.avgAqi > 150 ? 'high' : 'medium',
      });
    }

    if (route.hotspotAnalysis?.affectedSegments?.length > 0) {
      recommendations.push({
        type: 'awareness',
        message: `Route passes near ${route.hotspotAnalysis.affectedSegments.length} pollution hotspot(s) - keep windows closed`,
        priority: 'high',
      });
    }

    if (route.windDriftPenalty > 10) {
      recommendations.push({
        type: 'wind',
        message: 'Wind is carrying pollution toward your route - minimize travel time',
        priority: 'medium',
      });
    }

    if (route.exposureScore > 50) {
      recommendations.push({
        type: 'alternative',
        message: 'Consider using AC-filtered transport (car/bus) to reduce exposure',
        priority: 'medium',
      });
    }

    recommendations.push({
      type: 'general',
      message: 'Keep windows closed while passing through industrial/traffic-heavy areas',
      priority: 'low',
    });

    return recommendations;
  }

  /**
   * Generate sample routes
   */
  getSampleRoutes(origin, destination, mode) {
    const directDistance = this.calculateDistance(origin, destination);
    
    // Generate sample route instructions
    const sampleInstructions = [
      { step: 1, instruction: 'Head northeast on Ring Road', roadName: 'Ring Road', distance: directDistance * 0.3 * 1000, duration: this.estimateDuration(directDistance * 0.3, mode) * 60, type: 'head', modifier: 'northeast' },
      { step: 2, instruction: 'Turn right onto NH48', roadName: 'NH48', distance: directDistance * 0.4 * 1000, duration: this.estimateDuration(directDistance * 0.4, mode) * 60, type: 'turn', modifier: 'right' },
      { step: 3, instruction: 'Continue straight through Dwarka Flyover', roadName: 'Dwarka Flyover', distance: directDistance * 0.2 * 1000, duration: this.estimateDuration(directDistance * 0.2, mode) * 60, type: 'continue', modifier: 'straight' },
      { step: 4, instruction: 'Turn left at destination', roadName: 'Local Road', distance: directDistance * 0.1 * 1000, duration: this.estimateDuration(directDistance * 0.1, mode) * 60, type: 'turn', modifier: 'left' },
    ];

    const sampleRoadNames = [
      { name: 'Ring Road', distance: directDistance * 0.3 * 1000 },
      { name: 'NH48', distance: directDistance * 0.4 * 1000 },
      { name: 'Dwarka Flyover', distance: directDistance * 0.2 * 1000 },
    ];

    const sampleIntersections = {
      intersections: [
        { type: 'turn', instruction: 'Turn right onto NH48', roadName: 'NH48', distance: directDistance * 0.4 * 1000 },
        { type: 'continue', instruction: 'Continue through Dwarka Flyover', roadName: 'Dwarka Flyover', distance: directDistance * 0.2 * 1000 },
      ],
      keySegments: sampleRoadNames,
    };
    
    return [
      {
        id: 'route_0',
        distance: directDistance * 1000,
        duration: this.estimateDuration(directDistance, mode) * 60,
        geometry: null,
        waypoints: this.interpolateWaypoints(origin, destination, 15),
        instructions: sampleInstructions,
        roadNames: sampleRoadNames,
        majorIntersections: sampleIntersections,
      },
      {
        id: 'route_1',
        distance: directDistance * 1.15 * 1000,
        duration: this.estimateDuration(directDistance * 1.15, mode) * 60,
        geometry: null,
        waypoints: this.interpolateWaypoints(origin, destination, 15, 0.02),
        instructions: sampleInstructions.map(i => ({ ...i, step: i.step + 10 })),
        roadNames: sampleRoadNames,
        majorIntersections: sampleIntersections,
      },
      {
        id: 'route_2',
        distance: directDistance * 1.25 * 1000,
        duration: this.estimateDuration(directDistance * 1.25, mode) * 60,
        geometry: null,
        waypoints: this.interpolateWaypoints(origin, destination, 15, -0.02),
        instructions: sampleInstructions.map(i => ({ ...i, step: i.step + 20 })),
        roadNames: sampleRoadNames,
        majorIntersections: sampleIntersections,
      },
    ];
  }

  /**
   * Calculate straight-line distance
   */
  calculateDistance(origin, destination) {
    return this.haversineDistance(origin.lat, origin.lon, destination.lat, destination.lon);
  }

  /**
   * Haversine distance
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Estimate travel duration
   */
  estimateDuration(distanceKm, mode) {
    const speeds = {
      walking: 5,
      cycling: 15,
      'two-wheeler': 25,
      car: 30,
      bus: 20,
    };
    const speed = speeds[mode] || 30;
    return (distanceKm / speed) * 60;
  }

  /**
   * Interpolate waypoints
   */
  interpolateWaypoints(origin, destination, count, offset = 0) {
    const waypoints = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      waypoints.push([
        origin.lon + (destination.lon - origin.lon) * t + offset * Math.sin(t * Math.PI),
        origin.lat + (destination.lat - origin.lat) * t + offset * Math.cos(t * Math.PI),
      ]);
    }
    return waypoints;
  }

  /**
   * Extract route instructions from ORS segments
   */
  extractRouteInstructions(segments) {
    if (!segments || !Array.isArray(segments)) return [];
    
    const instructions = [];
    segments.forEach((segment, index) => {
      if (segment.steps && Array.isArray(segment.steps)) {
        segment.steps.forEach((step, stepIndex) => {
          if (step.instruction) {
            instructions.push({
              step: instructions.length + 1,
              instruction: step.instruction,
              distance: step.distance || 0,
              duration: step.duration || 0,
              type: step.type || 'turn',
              modifier: step.modifier || '',
              roadName: step.name || '',
            });
          }
        });
      }
    });
    
    return instructions;
  }

  /**
   * Extract road names from route segments
   */
  extractRoadNames(segments) {
    if (!segments || !Array.isArray(segments)) return [];
    
    const roadNames = [];
    const seen = new Set();
    
    segments.forEach(segment => {
      if (segment.steps && Array.isArray(segment.steps)) {
        segment.steps.forEach(step => {
          const roadName = step.name || '';
          if (roadName && roadName.trim() && !seen.has(roadName)) {
            seen.add(roadName);
            roadNames.push({
              name: roadName,
              distance: step.distance || 0,
            });
          }
        });
      }
    });
    
    return roadNames;
  }

  /**
   * Extract major intersections and key segments
   */
  extractMajorIntersections(segments) {
    if (!segments || !Array.isArray(segments)) return [];
    
    const intersections = [];
    const keySegments = [];
    
    segments.forEach((segment, index) => {
      if (segment.steps && Array.isArray(segment.steps)) {
        segment.steps.forEach((step, stepIndex) => {
          // Major turns (90+ degrees) or named roads
          if (step.type && ['turn', 'roundabout', 'fork', 'merge'].includes(step.type)) {
            if (step.name) {
              intersections.push({
                type: step.type,
                instruction: step.instruction,
                roadName: step.name,
                distance: step.distance || 0,
              });
            }
          }
          
          // Key segments (named roads longer than 500m)
          if (step.name && step.distance > 500) {
            keySegments.push({
              roadName: step.name,
              distance: (step.distance / 1000).toFixed(2) + ' km',
              instruction: step.instruction,
            });
          }
        });
      }
    });
    
    return {
      intersections: intersections.slice(0, 10), // Top 10
      keySegments: keySegments.slice(0, 5), // Top 5 major roads
    };
  }
}

module.exports = new RouteService();
