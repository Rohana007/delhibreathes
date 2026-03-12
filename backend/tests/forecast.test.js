/**
 * Unit tests for ML forecastRunner
 * Tests dry run and fallback behavior
 */

const forecastRunner = require('../ml/forecastRunner');

describe('ForecastRunner', () => {
  const sampleInput = {
    pm25: 120,
    pm10: 180,
    no2: 60,
    co: 2.5,
    so2: 25
  };
  
  test('dry run should validate input shape', () => {
    const result = forecastRunner.runForecast(sampleInput, { dryrun: true });
    
    expect(result).toHaveProperty('valid');
    expect(result.valid).toBe(true);
    expect(result).toHaveProperty('message');
    expect(result.message).toContain('Dry run successful');
  });
  
  test('should return expected JSON structure', () => {
    const result = forecastRunner.runForecast(sampleInput, { horizon: 24 });
    
    expect(result).toHaveProperty('forecasts');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('timestamp');
    
    expect(Array.isArray(result.forecasts)).toBe(true);
    expect(result.forecasts.length).toBe(24);
  });
  
  test('forecasts should have required fields', () => {
    const result = forecastRunner.runForecast(sampleInput, { horizon: 12 });
    
    result.forecasts.forEach((forecast, index) => {
      expect(forecast).toHaveProperty('hour');
      expect(forecast).toHaveProperty('pm25');
      expect(forecast).toHaveProperty('pm10');
      expect(forecast).toHaveProperty('no2');
      expect(forecast).toHaveProperty('co');
      expect(forecast).toHaveProperty('so2');
      expect(forecast).toHaveProperty('confidence');
      
      expect(forecast.hour).toBe(index + 1);
      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
    });
  });
  
  test('should use fallback on invalid input', () => {
    const invalidInput = { invalid: 'data' };
    const result = forecastRunner.runForecast(invalidInput);
    
    expect(result).toHaveProperty('forecasts');
    expect(result).toHaveProperty('warnings');
    expect(result.warnings).toContain('ml_forecast_fallback_used');
  });
  
  test('should never throw errors', () => {
    const invalidInputs = [
      null,
      undefined,
      {},
      { pm25: 'invalid' },
      { pm25: NaN }
    ];
    
    invalidInputs.forEach(input => {
      expect(() => {
        forecastRunner.runForecast(input);
      }).not.toThrow();
    });
  });
  
  test('fallback forecast should return valid structure', () => {
    const result = forecastRunner.fallbackForecast(sampleInput, 24);
    
    expect(result).toHaveProperty('forecasts');
    expect(result).toHaveProperty('method');
    expect(result.method).toContain('fallback');
    expect(result.forecasts.length).toBe(24);
  });
});

