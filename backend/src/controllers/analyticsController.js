const Report = require('../models/Report');
const logger = require('../utils/logger');
const { getAQIByLocation } = require('./aqiController');

/**
 * Get historic AQI data based on filters
 * GET /api/analytics/historic
 */
async function getHistoric(req, res) {
  try {
    const filters = buildFilters(req.query);
    const isDefault = req.query.default === 'true' || req.query.default === true;
    
    const reports = await Report.find(filters.query).sort({ createdAt: -1 }).limit(1000);
    
    logger.info(`Found ${reports.length} reports for historic analytics`);
    
    // Calculate AQI based on report data
    // Category weights: industrial=high, burning=very high, construction=moderate, traffic=moderate, pollution=high, other=low
    const categoryWeights = {
      'industrial': 250,
      'burning': 300,
      'construction': 180,
      'traffic': 200,
      'pollution': 220,
      'other': 150,
    };
    
    // Group by date and calculate AQI from reports
    const grouped = {};
    reports.forEach(report => {
      const date = new Date(report.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { aqiSum: 0, count: 0, categories: {} };
      }
      
      // Calculate AQI contribution from this report
      const baseAQI = categoryWeights[report.category] || 150;
      // Adjust based on severity (if available) or use base
      const reportAQI = baseAQI;
      
      grouped[date].aqiSum += reportAQI;
      grouped[date].count += 1;
      grouped[date].categories[report.category] = (grouped[date].categories[report.category] || 0) + 1;
    });
    
    // Calculate average AQI per day, with some variation
    const historic = Object.entries(grouped)
      .filter(([date, data]) => data.count > 0)
      .map(([date, data]) => {
        // Average AQI with some variation based on report count and mix
        let avgAqi = Math.round(data.aqiSum / data.count);
        
        // Adjust based on report volume (more reports = slightly higher AQI)
        const volumeMultiplier = Math.min(1 + (data.count / 50), 1.2); // Max 20% increase
        avgAqi = Math.round(avgAqi * volumeMultiplier);
        
        // Ensure AQI is within valid range
        avgAqi = Math.max(50, Math.min(500, avgAqi));
        
        return {
          date,
          aqi: avgAqi,
          category: getAQICategory(avgAqi),
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    logger.info(`Processed ${historic.length} historic data points`);
    
    // Return with default info if applicable
    if (isDefault) {
      const now = new Date();
      const endDate = new Date();
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1); // Go back one month
      res.json({
        defaultApplied: true,
        range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        data: historic,
      });
    } else {
      res.json(historic);
    }
  } catch (error) {
    logger.error(`Analytics historic error: ${error.message}`, error);
    res.status(500).json({ error: 'Failed to fetch historic data' });
  }
}

/**
 * Get pollutant trends based on filters
 * GET /api/analytics/pollutants
 */
async function getPollutants(req, res) {
  try {
    const filters = buildFilters(req.query);
    const isDefault = req.query.default === 'true' || req.query.default === true;
    const reports = await Report.find(filters.query).sort({ createdAt: -1 }).limit(1000);
    
    // Generate pollutant data based on report categories
    // Map categories to typical pollutant levels
    const categoryPollutants = {
      'industrial': { PM25: 120, PM10: 180, NO2: 80, SO2: 60, O3: 50, CO: 2.5, NH3: 200 },
      'burning': { PM25: 180, PM10: 250, NO2: 60, SO2: 40, O3: 45, CO: 3.0, NH3: 250 },
      'construction': { PM25: 100, PM10: 200, NO2: 50, SO2: 30, O3: 40, CO: 1.5, NH3: 150 },
      'traffic': { PM25: 90, PM10: 150, NO2: 100, SO2: 50, O3: 60, CO: 2.0, NH3: 100 },
      'pollution': { PM25: 150, PM10: 220, NO2: 70, SO2: 55, O3: 55, CO: 2.2, NH3: 180 },
      'other': { PM25: 70, PM10: 120, NO2: 40, SO2: 25, O3: 35, CO: 1.0, NH3: 80 },
    };
    
    // Aggregate pollutant data from reports
    const pollutants = {};
    
    reports.forEach(report => {
      const categoryData = categoryPollutants[report.category] || categoryPollutants['other'];
      Object.entries(categoryData).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        if (!pollutants[normalizedKey]) {
          pollutants[normalizedKey] = { values: [], limit: getPollutantLimit(normalizedKey) };
        }
        pollutants[normalizedKey].values.push(value);
      });
    });
    
    // Calculate averages
    const result = Object.entries(pollutants).map(([key, data]) => {
      const avgValue = data.values.length > 0 
        ? Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length)
        : 0;
      const percentage = data.limit > 0 
        ? Math.round((avgValue / data.limit) * 100)
        : 0;
      
      return {
        pollutant: key.toUpperCase(),
        value: avgValue,
        limit: data.limit,
        percentage: percentage,
      };
    });
    
    res.json(result);
  } catch (error) {
    logger.error(`Analytics pollutants error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch pollutant data' });
  }
}

/**
 * Get source contribution based on filters
 * GET /api/analytics/sources
 */
async function getSources(req, res) {
  try {
    const filters = buildFilters(req.query);
    const reports = await Report.find(filters.query);
    
    // Count by source type
    const sources = {};
    reports.forEach(report => {
      const source = report.source || report.category || 'Other';
      if (!sources[source]) {
        sources[source] = 0;
      }
      sources[source] += 1;
    });
    
    const total = Object.values(sources).reduce((a, b) => a + b, 0);
    const result = Object.entries(sources).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / total) * 100),
    })).sort((a, b) => b.count - a.count);
    
    res.json(result);
  } catch (error) {
    logger.error(`Analytics sources error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch source data' });
  }
}

/**
 * Get filtered reports for analytics table
 * GET /api/analytics/reports
 */
async function getReports(req, res) {
  try {
    const filters = buildFilters(req.query);
    const reports = await Report.find(filters.query)
      .sort({ createdAt: -1 })
      .limit(500)
      .select('createdAt region category source severity aqi description');
    
    const result = reports.map(report => ({
      id: report._id,
      date: report.createdAt,
      region: report.region || 'Unknown',
      type: report.category || 'Unknown',
      source: report.source || report.category || 'Unknown',
      severity: report.severity || 'Moderate',
      aqi: report.aqi || null,
      description: report.description,
    }));
    
    res.json(result);
  } catch (error) {
    logger.error(`Analytics reports error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

/**
 * Helper: Get season from month
 */
function getSeason(month) {
  if ([11, 12, 0, 1].includes(month)) return 'Winter';
  if ([2, 3, 4, 5].includes(month)) return 'Summer';
  if ([6, 7, 8].includes(month)) return 'Monsoon';
  if ([9, 10].includes(month)) return 'Post-Monsoon';
  return 'Pre-Monsoon';
}

/**
 * Helper: Get day type (weekday/weekend)
 */
function getDayType(date) {
  const day = date.getDay();
  return (day === 0 || day === 6) ? 'Weekend' : 'Weekday';
}

/**
 * Helper: Get AQI category and color
 */
function getAQICategoryAndColor(aqi) {
  if (aqi <= 50) return { category: 'Good', color: '#00B050' };
  if (aqi <= 100) return { category: 'Satisfactory', color: '#92D050' };
  if (aqi <= 200) return { category: 'Moderate', color: '#FFC107' };
  if (aqi <= 300) return { category: 'Poor', color: '#FF9900' };
  if (aqi <= 400) return { category: 'Very Poor', color: '#DC2626' };
  return { category: 'Severe', color: '#7E0023' };
}

/**
 * Helper: Calculate AQI trend (comparing with previous day)
 */
function getAQITrend(currentAQI, previousAQI) {
  if (!previousAQI) return 'Stable';
  const diff = currentAQI - previousAQI;
  if (diff > 10) return 'Increase';
  if (diff < -10) return 'Decrease';
  return 'Stable';
}

/**
 * Export analytics data as CSV
 * GET /api/analytics/export
 * Returns: Complete dataset with all fields per region per day/hour
 */
async function exportCSV(req, res) {
  try {
    const config = require('../config');
    const aqiService = require('../services/aqiService');
    
    const isDefault = req.query.default === 'true' || req.query.default === true;
    const hasFilters = req.query.startDate || req.query.endDate || 
                      req.query.regions || req.query.seasons || 
                      req.query.pollutants || req.query.sourceTypes ||
                      req.query.severityLevels || req.query.reportTypes ||
                      req.query.startTime || req.query.endTime;
    
    // Determine date range
    let startDate, endDate;
    if (isDefault && !hasFilters) {
      // Default: first day of current month to today
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (req.query.startDate || req.query.endDate) {
      startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Fallback: first day of current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Get all NCR regions with full location data
    const ncrRegions = Object.keys(config.locations).map(key => ({
      key,
      name: config.locations[key].name,
      lat: config.locations[key].lat,
      lon: config.locations[key].lon,
    }));
    
    // Build query for reports with filters
    const filters = buildFilters(req.query);
    const query = filters.query;
    
    // Apply time range filter if specified
    const normalizeArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return [value];
      return [];
    };
    
    const filterRegions = normalizeArray(req.query.regions);
    const filterSeasons = normalizeArray(req.query.seasons);
    const filterPollutants = normalizeArray(req.query.pollutants);
    const filterSourceTypes = normalizeArray(req.query.sourceTypes);
    const filterSeverityLevels = normalizeArray(req.query.severityLevels);
    const filterReportTypes = normalizeArray(req.query.reportTypes);
    
    // Fetch all reports in date range
    const reports = await Report.find(query)
      .sort({ createdAt: 1 })
      .select('createdAt region category source severity description location');
    
    // Category to pollutant mapping (same as in getPollutants)
    const categoryPollutants = {
      'industrial': { PM25: 120, PM10: 180, NO2: 80, SO2: 60, O3: 50, CO: 2.5, NH3: 200 },
      'burning': { PM25: 180, PM10: 250, NO2: 60, SO2: 40, O3: 45, CO: 3.0, NH3: 250 },
      'construction': { PM25: 100, PM10: 200, NO2: 50, SO2: 30, O3: 40, CO: 1.5, NH3: 150 },
      'traffic': { PM25: 90, PM10: 150, NO2: 100, SO2: 50, O3: 60, CO: 2.0, NH3: 100 },
      'pollution': { PM25: 150, PM10: 220, NO2: 70, SO2: 55, O3: 55, CO: 2.2, NH3: 180 },
      'other': { PM25: 70, PM10: 120, NO2: 40, SO2: 25, O3: 35, CO: 1.0, NH3: 80 },
    };
    
    // Category to AQI mapping
    const categoryWeights = {
      'industrial': 250,
      'burning': 300,
      'construction': 180,
      'traffic': 200,
      'pollution': 220,
      'other': 150,
    };
    
    // Helper to determine region from report location or region field
    const getReportRegion = (report) => {
      if (report.region) {
        const found = ncrRegions.find(nr => 
          nr.name.toLowerCase() === report.region.toLowerCase() || 
          nr.key === report.region.toLowerCase()
        );
        if (found) return found.key;
      }
      // Try to match by location coordinates (simplified - use first matching region)
      if (report.location && report.location.lat && report.location.lng) {
        // Find closest region by distance (simplified - use first matching)
        const reportLat = report.location.lat;
        const reportLon = report.location.lng;
        let closestRegion = ncrRegions[0];
        let minDistance = Infinity;
        
        ncrRegions.forEach(region => {
          const distance = Math.sqrt(
            Math.pow(region.lat - reportLat, 2) + 
            Math.pow(region.lon - reportLon, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestRegion = region;
          }
        });
        return closestRegion.key;
      }
      return 'delhi'; // Default
    };
    
    // Generate all date-region combinations with comprehensive data structure
    const dateRegionData = {};
    const currentDate = new Date(startDate);
    const previousDayAQI = {}; // Track AQI trends
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dateObj = new Date(currentDate);
      const season = getSeason(dateObj.getMonth());
      const dayType = getDayType(dateObj);
      
      // Apply season filter if specified
      if (filterSeasons.length > 0 && !filterSeasons.includes(season.toLowerCase())) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      ncrRegions.forEach(region => {
        // Apply region filter if specified
        if (filterRegions.length > 0) {
          const regionMatch = filterRegions.some(fr => 
            fr.toLowerCase() === region.name.toLowerCase() || 
            fr.toLowerCase() === region.key.toLowerCase()
          );
          if (!regionMatch) return;
        }
        
        const key = `${dateStr}_${region.key}`;
        dateRegionData[key] = {
          date: dateStr,
          time: '00:00:00', // Daily aggregation - use midnight
          season: season,
          dayType: dayType,
          region: region.name,
          latitude: region.lat,
          longitude: region.lon,
          aqi: 0,
          aqiCount: 0,
          pollutants: { pm25: 0, pm10: 0, no2: 0, so2: 0, o3: 0, co: 0, nh3: 0, pollutantCount: 0 },
          sources: { traffic: 0, industrial: 0, dust: 0, burning: 0, weather: 0 },
          totalReports: 0,
          reportCategories: new Set(),
          reportSeverity: { low: 0, moderate: 0, high: 0, critical: 0 },
          sourceCategory: '',
          weather: null, // Will be fetched
          dataProvider: 'OWM', // Default
          lastUpdated: new Date().toISOString(),
        };
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Process reports and assign to date-region combinations
    reports.forEach(report => {
      const reportDate = new Date(report.createdAt);
      const dateStr = reportDate.toISOString().split('T')[0];
      const timeStr = reportDate.toTimeString().split(' ')[0];
      
      // Apply time range filter if specified
      if (req.query.startTime || req.query.endTime) {
        const reportHour = reportDate.getHours();
        const reportMin = reportDate.getMinutes();
        const reportTime = reportHour * 60 + reportMin;
        
        if (req.query.startTime) {
          const [startH, startM] = req.query.startTime.split(':').map(Number);
          const startTime = startH * 60 + (startM || 0);
          if (reportTime < startTime) return;
        }
        if (req.query.endTime) {
          const [endH, endM] = req.query.endTime.split(':').map(Number);
          const endTime = endH * 60 + (endM || 0);
          if (reportTime > endTime) return;
        }
      }
      
      const regionKey = getReportRegion(report);
      const key = `${dateStr}_${regionKey}`;
      
      if (!dateRegionData[key]) return;
      
      const category = report.category || 'other';
      
      // Apply source type filter
      if (filterSourceTypes.length > 0) {
        const sourceMatch = filterSourceTypes.some(ft => 
          ft.toLowerCase() === category.toLowerCase()
        );
        if (!sourceMatch) return;
      }
      
      // Apply report type filter
      if (filterReportTypes.length > 0) {
        const typeMatch = filterReportTypes.some(ft => 
          ft.toLowerCase() === category.toLowerCase()
        );
        if (!typeMatch) return;
      }
      
      const data = dateRegionData[key];
      data.totalReports += 1;
      
      // Add category
      if (report.category) {
        data.reportCategories.add(report.category);
      }
      
      // Add severity (map to low/moderate/high/critical)
      const severity = report.severity || 'Moderate';
      
      // Apply severity filter
      if (filterSeverityLevels.length > 0) {
        const severityMatch = filterSeverityLevels.some(fs => 
          fs.toLowerCase() === severity.toLowerCase()
        );
        if (!severityMatch) return;
      }
      
      if (severity.toLowerCase().includes('low') || severity === 'Satisfactory' || severity === 'Good') {
        data.reportSeverity.low += 1;
      } else if (severity.toLowerCase().includes('moderate') || severity === 'Moderate') {
        data.reportSeverity.moderate += 1;
      } else if (severity.toLowerCase().includes('high') || severity === 'Poor' || severity === 'Very Poor') {
        data.reportSeverity.high += 1;
      } else if (severity.toLowerCase().includes('critical') || severity === 'Severe') {
        data.reportSeverity.critical += 1;
      } else {
        data.reportSeverity.moderate += 1;
      }
      
      // Calculate AQI contribution
      const baseAQI = categoryWeights[category] || 150;
      data.aqi += baseAQI;
      data.aqiCount += 1;
      
      // Calculate pollutant contributions
      const catPollutants = categoryPollutants[category] || categoryPollutants['other'];
      Object.entries(catPollutants).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        if (data.pollutants[normalizedKey] !== undefined) {
          data.pollutants[normalizedKey] += value;
          data.pollutants.pollutantCount += 1;
        }
      });
      
      // Calculate source contributions
      if (category === 'traffic') data.sources.traffic += 1;
      else if (category === 'industrial') data.sources.industrial += 1;
      else if (category === 'construction') data.sources.dust += 1;
      else if (category === 'burning') data.sources.burning += 1;
      // Weather is always a small contribution
      data.sources.weather += 0.1;
      
      // Set source category (most common)
      if (!data.sourceCategory || data.sources[category] > data.sources[data.sourceCategory]) {
        data.sourceCategory = category;
      }
    });
    
    // Fetch weather data for each region (in parallel, with caching)
    const weatherPromises = [];
    const uniqueRegionKeys = [...new Set(Object.keys(dateRegionData).map(k => k.split('_')[1]))];
    
    for (const regionKey of uniqueRegionKeys) {
      const region = ncrRegions.find(r => r.key === regionKey);
      if (region) {
        weatherPromises.push(
          aqiService.getWeatherData(region.lat, region.lon)
            .then(weather => ({ regionKey, weather }))
            .catch(() => ({ regionKey, weather: aqiService.getSampleWeather() }))
        );
      }
    }
    
    const weatherData = await Promise.all(weatherPromises);
    const weatherMap = {};
    weatherData.forEach(({ regionKey, weather }) => {
      weatherMap[regionKey] = weather;
    });
    
    // Assign weather data to all date-region combinations
    Object.keys(dateRegionData).forEach(key => {
      const regionKey = key.split('_')[1];
      dateRegionData[key].weather = weatherMap[regionKey] || aqiService.getSampleWeather();
    });
    
    // Calculate averages and percentages, generate comprehensive rows
    const rows = Object.values(dateRegionData).map((data, index) => {
      const reportCount = data.totalReports;
      
      // Average AQI
      const avgAqi = data.aqiCount > 0 ? Math.round(data.aqi / data.aqiCount) : (reportCount > 0 ? 150 : 0);
      // Ensure valid range
      const finalAqi = Math.max(0, Math.min(500, avgAqi));
      
      // Get AQI category and color
      const { category: aqiCategory, color: aqiColor } = getAQICategoryAndColor(finalAqi);
      
      // Calculate AQI trend (compare with previous day)
      const dateKey = data.date;
      const regionKey = data.region;
      const prevKey = Object.keys(dateRegionData).find(k => {
        const [d, r] = k.split('_');
        const prevDate = new Date(d);
        prevDate.setDate(prevDate.getDate() - 1);
        return prevDate.toISOString().split('T')[0] === dateKey && r === regionKey.split(' ')[0].toLowerCase();
      });
      const previousAQI = prevKey && dateRegionData[prevKey] ? 
        (dateRegionData[prevKey].aqiCount > 0 ? Math.round(dateRegionData[prevKey].aqi / dateRegionData[prevKey].aqiCount) : 0) : null;
      const aqiTrend = getAQITrend(finalAqi, previousAQI);
      
      // Average pollutants (only if filter allows or no filter)
      const shouldIncludePollutant = (key) => {
        if (filterPollutants.length === 0) return true;
        return filterPollutants.some(fp => fp.toLowerCase() === key.toLowerCase());
      };
      
      const avgPollutant = (key) => {
        if (!shouldIncludePollutant(key)) return 0;
        const count = data.pollutants.pollutantCount || reportCount;
        return count > 0 ? Math.round(data.pollutants[key] / count) : 0;
      };
      
      // Source contribution percentages
      const totalSourceCount = Object.values(data.sources).reduce((a, b) => a + b, 0);
      const sourcePercent = (key) => {
        return totalSourceCount > 0 
          ? Math.round((data.sources[key] / totalSourceCount) * 100) 
          : 0;
      };
      
      // Weather data
      const weather = data.weather || {};
      const temperature = weather.temp ? Math.round(weather.temp * 10) / 10 : 0;
      const humidity = weather.humidity || 0;
      const windSpeed = weather.windSpeed ? Math.round(weather.windSpeed * 10) / 10 : 0;
      const windDirection = weather.windDir || 0;
      const aod = 0; // AOD not available in current weather data, set to 0
      
      // Report categories (comma-separated)
      const categoriesStr = Array.from(data.reportCategories).join(',') || '';
      
      // Report severity split (JSON format)
      const severityStr = `low:${data.reportSeverity.low}, moderate:${data.reportSeverity.moderate}, high:${data.reportSeverity.high}, critical:${data.reportSeverity.critical}`;
      
      // Source category (most common)
      const sourceCategory = data.sourceCategory || '';
      
      // Data provider
      const dataProvider = 'OWM'; // OpenWeatherMap
      
      // Last updated
      const lastUpdated = data.lastUpdated;
      
      return [
        data.date,                    // Date (wide format)
        data.time,                    // Time
        data.season,                  // Season
        data.dayType,                 // Day Type
        data.region,                  // Region
        data.latitude,                 // Latitude
        data.longitude,                // Longitude
        finalAqi,                      // AQI
        aqiCategory,                   // AQI Category
        aqiColor,                      // AQI Color
        aqiTrend,                      // AQI Trend
        avgPollutant('pm25'),          // PM2.5
        avgPollutant('pm10'),          // PM10
        avgPollutant('no2'),           // NO2
        avgPollutant('so2'),           // SO2
        avgPollutant('o3'),            // O3
        avgPollutant('co'),            // CO
        avgPollutant('nh3'),           // NH3
        temperature,                   // Temperature
        humidity,                      // Humidity
        windSpeed,                     // Wind Speed
        windDirection,                 // Wind Direction
        aod,                           // AOD
        sourcePercent('traffic'),      // Traffic Contribution
        sourcePercent('industrial'),    // Industrial Contribution
        sourcePercent('dust'),         // Dust Contribution
        sourcePercent('burning'),       // Burning Contribution
        sourcePercent('weather'),       // Weather Influence
        reportCount,                   // Report Count
        categoriesStr,                 // Report Types
        severityStr,                   // Report Severity Split
        sourceCategory,                // Source Category
        dataProvider,                  // Data Provider
        lastUpdated,                   // Last Updated
      ];
    }).filter(row => {
      // Filter out rows with no data if filters are applied
      if (hasFilters && row[38] === 0 && row[7] === 0) return false; // No reports and no AQI
      return true;
    }).sort((a, b) => {
      // Sort by date, then by region
      if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
      return a[4].localeCompare(b[4]);
    });
    
    // Build metadata section
    const metadata = [];
    metadata.push('# Analytics Export Metadata');
    metadata.push(`# Generated: ${new Date().toISOString()}`);
    metadata.push(`# Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    if (isDefault && !hasFilters) {
      metadata.push('# Filter: Default (Current Month)');
    } else {
      if (req.query.startDate) metadata.push(`# Filter: Start Date, ${req.query.startDate}`);
      if (req.query.endDate) metadata.push(`# Filter: End Date, ${req.query.endDate}`);
      if (req.query.regions) {
        const regions = normalizeArray(req.query.regions);
        metadata.push(`# Filter: Regions, ${regions.join(',')}`);
      }
      if (req.query.seasons) {
        const seasons = normalizeArray(req.query.seasons);
        metadata.push(`# Filter: Seasons, ${seasons.join(',')}`);
      }
      if (req.query.pollutants) {
        const pollutants = normalizeArray(req.query.pollutants);
        metadata.push(`# Filter: Pollutants, ${pollutants.join(',')}`);
      }
      if (req.query.sourceTypes) {
        const sourceTypes = normalizeArray(req.query.sourceTypes);
        metadata.push(`# Filter: Source Types, ${sourceTypes.join(',')}`);
      }
      if (req.query.severityLevels) {
        const severityLevels = normalizeArray(req.query.severityLevels);
        metadata.push(`# Filter: Severity Levels, ${severityLevels.join(',')}`);
      }
      if (req.query.reportTypes) {
        const reportTypes = normalizeArray(req.query.reportTypes);
        metadata.push(`# Filter: Report Types, ${reportTypes.join(',')}`);
      }
      if (req.query.startTime) metadata.push(`# Filter: Start Time, ${req.query.startTime}`);
      if (req.query.endTime) metadata.push(`# Filter: End Time, ${req.query.endTime}`);
    }
    metadata.push('');
    
    // CSV headers - comprehensive list matching all fields
    const headers = [
      'Date',
      'Time',
      'Season',
      'Day Type',
      'Region',
      'Latitude',
      'Longitude',
      'AQI',
      'AQI Category',
      'AQI Color',
      'AQI Trend',
      'PM2.5',
      'PM10',
      'NO2',
      'SO2',
      'O3',
      'CO',
      'NH3',
      'Temperature (°C)',
      'Humidity (%)',
      'Wind Speed (m/s)',
      'Wind Direction (°)',
      'AOD',
      'Traffic Contribution (%)',
      'Industrial Contribution (%)',
      'Dust Contribution (%)',
      'Burning Contribution (%)',
      'Weather Influence (%)',
      'Report Count',
      'Report Types',
      'Report Severity Split',
      'Source Category',
      'Data Provider',
      'Last Updated',
    ];
    
    // Generate filename
    let filename;
    if (isDefault && !hasFilters) {
      const monthName = startDate.toLocaleString('default', { month: 'long' });
      filename = `delhi-analytics-${monthName.toLowerCase()}-${startDate.getFullYear()}.csv`;
    } else {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      filename = `delhi-analytics-filtered-${timestamp}.csv`;
    }
    
    // Build CSV
    const csv = [
      ...metadata,
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')),
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    logger.error(`Analytics export error: ${error.message}`, error);
    res.status(500).json({ error: 'Failed to export data' });
  }
}

// Helper functions
function buildFilters(query) {
  const queryObj = {};
  
  // Default to previous 1 month (same day one month ago) if no filters and default=true
  const isDefault = query.default === 'true' || query.default === true;
  const hasDateFilter = query.startDate || query.endDate;
  const hasAnyFilter = query.seasons || query.regions || query.pollutants || 
                       query.sourceTypes || query.severityLevels || query.reportTypes ||
                       query.startTime || query.endTime;
  
  if (isDefault && !hasDateFilter && !hasAnyFilter) {
    // Set default range: same day one month ago to today
    // Apply NO other filters - show all data for this range
    const now = new Date();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1); // Go back one month
    startDate.setHours(0, 0, 0, 0);
    
    queryObj.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
    // No other filters applied - return all data in this date range
    return { query: queryObj };
  }
  
  // If date filters are provided, use them
  if (query.startDate || query.endDate) {
    queryObj.createdAt = {};
    if (query.startDate) {
      queryObj.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryObj.createdAt.$lte = endDate;
    }
  }
  
  // Time range (if provided, filter by hour)
  if (query.startTime || query.endTime) {
    // This would require more complex date manipulation
    // For now, we'll skip time filtering or implement it later
  }
  
  // Helper to normalize array params (Express may send as string or array)
  const normalizeArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  };
  
  // Seasons
  const seasons = normalizeArray(query.seasons);
  if (seasons.length > 0) {
    const seasonMonths = {
      'winter': [12, 1, 2],
      'summer': [3, 4, 5, 6],
      'monsoon': [7, 8, 9],
      'post-monsoon': [10, 11],
      'pre-monsoon': [2, 3],
    };
    const months = new Set();
    seasons.forEach(season => {
      if (seasonMonths[season]) {
        seasonMonths[season].forEach(m => months.add(m));
      }
    });
    if (months.size > 0) {
      queryObj.$expr = {
        $in: [{ $month: '$createdAt' }, Array.from(months)],
      };
    }
  }
  
  // Regions
  const regions = normalizeArray(query.regions);
  if (regions.length > 0) {
    queryObj.region = { $in: regions };
  }
  
  // Source types
  const sourceTypes = normalizeArray(query.sourceTypes);
  if (sourceTypes.length > 0) {
    queryObj.$or = [
      { source: { $in: sourceTypes } },
      { category: { $in: sourceTypes } },
    ];
  }
  
  // Severity levels
  const severityLevels = normalizeArray(query.severityLevels);
  if (severityLevels.length > 0) {
    queryObj.severity = { $in: severityLevels };
  }
  
  // Report types
  const reportTypes = normalizeArray(query.reportTypes);
  if (reportTypes.length > 0) {
    if (!queryObj.$or) queryObj.$or = [];
    queryObj.$or.push({ category: { $in: reportTypes } });
  }
  
  return { query: queryObj };
}

function getAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

function getPollutantLimit(pollutant) {
  const limits = {
    pm25: 60,
    pm10: 100,
    no2: 80,
    o3: 100,
    so2: 80,
    co: 4,
    nh3: 400,
  };
  return limits[pollutant.toLowerCase()] || 100;
}

module.exports = {
  getHistoric,
  getPollutants,
  getSources,
  getReports,
  exportCSV,
};

