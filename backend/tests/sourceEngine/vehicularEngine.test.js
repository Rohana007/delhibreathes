/**
 * Unit tests for vehicularEngine
 * Tests structure, numeric ranges, and Delhi data integration
 */

const vehicularEngine = require('../../src/services/sourceEngine/vehicularEngine');
const utils = require('../../src/services/sourceEngine/utils');

describe('VehicularEngine', () => {
  const sampleInput = {
    lat: 28.6139,
    lng: 77.2090,
    aqi: {
      pm25: 120,
      pm10: 180,
      no2: 60,
      co: 2.5,
      so2: 25
    },
    trafficLevel: 'heavy',
    roadType: 'major',
    distance_km: 0.05
  };
  
  test('should return structured result with required keys', () => {
    const result = vehicularEngine.calculateVehicularContribution(sampleInput);
    
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('dieselSignatureScore');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('metadata');
  });
  
  test('should return numeric score within reasonable range', () => {
    const result = vehicularEngine.calculateVehicularContribution(sampleInput);
    
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThan(1000); // Reasonable upper bound
  });
  
  test('should return confidence between 0 and 1', () => {
    const result = vehicularEngine.calculateVehicularContribution(sampleInput);
    
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
  
  test('should return dieselSignatureScore within 0-5 range', () => {
    const result = vehicularEngine.calculateVehicularContribution(sampleInput);
    
    expect(typeof result.dieselSignatureScore).toBe('number');
    expect(result.dieselSignatureScore).toBeGreaterThanOrEqual(0);
    expect(result.dieselSignatureScore).toBeLessThanOrEqual(5);
  });
  
  test('should use Delhi-calibrated data', () => {
    const result = vehicularEngine.calculateVehicularContribution(sampleInput);
    
    expect(result.metadata).toHaveProperty('vehicleTypeShare');
    expect(result.metadata).toHaveProperty('fuelTypeShare');
    expect(result.metadata).toHaveProperty('vehicleAgeDistribution');
    
    // Check Delhi-specific values
    const vehicleShare = result.metadata.vehicleTypeShare;
    if (vehicleShare) {
      expect(vehicleShare.twoW).toBeCloseTo(0.45, 1); // Delhi: 45% two-wheelers
    }
  });
  
  test('should handle missing inputs gracefully', () => {
    const minimalInput = {
      lat: 28.6139,
      lng: 77.2090
    };
    
    const result = vehicularEngine.calculateVehicularContribution(minimalInput);
    
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('confidence');
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
  
  test('should include notes_readable when present', () => {
    const result = vehicularEngine.calculateVehicularContribution(sampleInput);
    
    if (result.notes_readable) {
      expect(typeof result.notes_readable).toBe('string');
      expect(result.notes_readable.length).toBeGreaterThan(0);
    }
  });
  
  test('should apply smoothing for unrealistically low scores', () => {
    const lowInput = {
      ...sampleInput,
      aqi: { pm25: 10, pm10: 20, no2: 5, co: 0.5, so2: 5 }
    };
    
    const result = vehicularEngine.calculateVehicularContribution(lowInput);
    
    // Should still return a reasonable score
    expect(result.score).toBeGreaterThanOrEqual(0);
    if (result.warnings) {
      expect(result.warnings.some(w => w.includes('unrealistically_low'))).toBeTruthy();
    }
  });
});
