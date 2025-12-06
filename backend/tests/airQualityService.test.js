const airQualityService = require('../src/services/airQualityService');
const sourceDetectionService = require('../src/services/sourceDetectionService');

describe('Air Quality Service', () => {
  describe('AQI Validation', () => {
    test('should reject AQI < 0', () => {
      expect(airQualityService.isValidAQI(-10)).toBe(false);
    });

    test('should reject AQI > 800', () => {
      expect(airQualityService.isValidAQI(900)).toBe(false);
    });

    test('should accept valid AQI', () => {
      expect(airQualityService.isValidAQI(150)).toBe(true);
      expect(airQualityService.isValidAQI(0)).toBe(true);
      expect(airQualityService.isValidAQI(500)).toBe(true);
    });

    test('should reject NaN and null', () => {
      expect(airQualityService.isValidAQI(NaN)).toBe(false);
      expect(airQualityService.isValidAQI(null)).toBe(false);
      expect(airQualityService.isValidAQI(undefined)).toBe(false);
    });
  });

  describe('Freshness Check', () => {
    test('should accept fresh timestamps (< 10 minutes)', () => {
      const freshTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(airQualityService.isFresh(freshTimestamp)).toBe(true);
    });

    test('should reject stale timestamps (> 10 minutes)', () => {
      const staleTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      expect(airQualityService.isFresh(staleTimestamp)).toBe(false);
    });

    test('should reject null/undefined timestamps', () => {
      expect(airQualityService.isFresh(null)).toBe(false);
      expect(airQualityService.isFresh(undefined)).toBe(false);
    });
  });

  describe('AQI Categorization', () => {
    test('should categorize AQI correctly', () => {
      expect(airQualityService.categorizeAQI(30)).toBe('Good');
      expect(airQualityService.categorizeAQI(80)).toBe('Satisfactory');
      expect(airQualityService.categorizeAQI(150)).toBe('Moderate');
      expect(airQualityService.categorizeAQI(250)).toBe('Poor');
      expect(airQualityService.categorizeAQI(350)).toBe('Very Poor');
      expect(airQualityService.categorizeAQI(450)).toBe('Severe');
    });
  });

  describe('Smoothing', () => {
    test('should apply smoothing when fluctuation > 20', () => {
      const lat = 28.6139;
      const lon = 77.209;
      
      // First reading
      const reading1 = { aqi: 150, last_updated: new Date().toISOString() };
      const smoothed1 = airQualityService.applySmoothing(lat, lon, reading1);
      expect(smoothed1.aqi).toBe(150); // No smoothing yet (only 1 reading)

      // Second reading with large jump
      const reading2 = { aqi: 180, last_updated: new Date().toISOString() };
      const smoothed2 = airQualityService.applySmoothing(lat, lon, reading2);
      expect(smoothed2.aqi).toBe(180); // Still no smoothing (only 2 readings, but fluctuation = 30)

      // Third reading
      const reading3 = { aqi: 140, last_updated: new Date().toISOString() };
      const smoothed3 = airQualityService.applySmoothing(lat, lon, reading3);
      // Should apply median filter: [150, 180, 140] -> median = 150
      expect(smoothed3.aqi).toBe(150);
      expect(smoothed3.smoothed).toBe(true);
    });
  });
});

describe('Source Detection Service', () => {
  describe('Source Detection Weights', () => {
    test('should calculate traffic score correctly', () => {
      const factors = {
        hour: 8, // Rush hour
        pollutants: { no2: 50, co: 2.5 },
        trafficDensity: 0.8,
        aqiRiseRate: 0.4,
      };
      
      const score = sourceDetectionService.calculateTrafficScore(factors);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    test('should calculate dust score correctly', () => {
      const factors = {
        pollutants: { pm10: 200, pm25: 80 }, // High PM10/PM2.5 ratio
        constructionSites: 0.6,
        windSpeed: 12,
      };
      
      const score = sourceDetectionService.calculateDustScore(factors);
      expect(score).toBeGreaterThan(0.5);
    });

    test('should calculate stubble score correctly during season', () => {
      const factors = {
        month: 10, // October (stubble season)
        pollutants: { pm25: 200 },
        fireHotspots: 0.7,
        seasonalWeight: 1.5,
        windSupport: 0.6,
      };
      
      const score = sourceDetectionService.calculateStubbleScore(factors);
      expect(score).toBeGreaterThan(0.6);
    });
  });

  describe('Stability Check', () => {
    test('should keep previous source if confidence difference < threshold', () => {
      sourceDetectionService.lastDetection = {
        primary_source: 'Traffic',
        confidence: 0.75,
      };
      
      const newSource = sourceDetectionService.applyStability('Dust', 0.78);
      // Confidence diff = 0.03 < 0.15, so should keep Traffic
      expect(newSource).toBe('Traffic');
    });

    test('should update source if confidence difference > threshold', () => {
      sourceDetectionService.lastDetection = {
        primary_source: 'Traffic',
        confidence: 0.5,
      };
      
      const newSource = sourceDetectionService.applyStability('Dust', 0.8);
      // Confidence diff = 0.3 > 0.15, so should update
      expect(newSource).toBe('Dust');
    });
  });

  describe('Debounce', () => {
    test('should respect debounce interval', async () => {
      const lat = 28.6139;
      const lon = 77.209;
      const aqiData = { aqi: 150, pollutants: {} };

      // First call
      const result1 = await sourceDetectionService.detectSource(lat, lon, aqiData);
      expect(result1).toBeDefined();

      // Second call immediately (should use cached)
      const result2 = await sourceDetectionService.detectSource(lat, lon, aqiData);
      expect(result2).toBeDefined();
      // Should be same result (debounced)
      expect(result2.primary_source).toBe(result1.primary_source);
    });
  });
});

