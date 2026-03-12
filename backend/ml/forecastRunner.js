/**
 * ML Forecasting Safe Runner
 * Provides a safe entrypoint to run ML forecasting with validation and fallbacks
 * 
 * Usage:
 *   node backend/ml/forecastRunner.js --dryrun  (validates pipeline without modifying production)
 *   node backend/ml/forecastRunner.js           (runs forecast)
 */

const fs = require('fs');
const path = require('path');

/**
 * Validates input shape for ML forecasting
 * @param {Object} input - Input data
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateInputShape(input) {
  const errors = [];
  
  try {
    if (!input || typeof input !== 'object') {
      errors.push('Input must be an object');
      return { valid: false, errors };
    }
    
    // Check for required fields (adjust based on your model)
    const requiredFields = ['pm25', 'pm10', 'no2', 'co', 'so2'];
    for (const field of requiredFields) {
      if (input[field] === undefined || input[field] === null) {
        errors.push(`Missing required field: ${field}`);
      } else if (typeof input[field] !== 'number' || isNaN(input[field])) {
        errors.push(`Invalid value for field ${field}: must be a number`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

/**
 * Loads model weights if available
 * @returns {Object|null} - Model weights or null if not available
 */
function loadModelWeights() {
  try {
    const weightsPath = path.join(__dirname, 'model_weights.json');
    if (fs.existsSync(weightsPath)) {
      const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
      return weights;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Lightweight fallback AR(1) / exponential smoothing predictor
 * This will never crash and returns forecasts
 * @param {Object} input - Input AQI data
 * @param {number} horizon - Forecast horizon in hours (default: 24)
 * @returns {Object} - Forecast results
 */
function fallbackForecast(input, horizon = 24) {
  try {
    const pm25 = input.pm25 || 100;
    const pm10 = input.pm10 || 150;
    const no2 = input.no2 || 50;
    const co = input.co || 2.0;
    const so2 = input.so2 || 20;
    
    // Simple exponential smoothing: forecast = alpha * current + (1-alpha) * previous
    // For simplicity, assume slight decay over time
    const alpha = 0.7; // Smoothing parameter
    const decayFactor = 0.95; // Per hour decay
    
    const forecasts = [];
    for (let h = 1; h <= horizon; h++) {
      const hourDecay = Math.pow(decayFactor, h);
      forecasts.push({
        hour: h,
        pm25: pm25 * hourDecay,
        pm10: pm10 * hourDecay,
        no2: no2 * hourDecay,
        co: co * hourDecay,
        so2: so2 * hourDecay,
        confidence: Math.max(0.5, 1.0 - (h / horizon) * 0.3) // Decreasing confidence
      });
    }
    
    return {
      forecasts,
      method: 'exponential_smoothing_fallback',
      confidence: 0.6,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // Ultimate fallback: return constant values
    return {
      forecasts: Array.from({ length: horizon }, (_, i) => ({
        hour: i + 1,
        pm25: 100,
        pm10: 150,
        no2: 50,
        co: 2.0,
        so2: 20,
        confidence: 0.5
      })),
      method: 'constant_fallback',
      confidence: 0.3,
      timestamp: new Date().toISOString(),
      warning: `Fallback forecast used due to error: ${error.message}`
    };
  }
}

/**
 * Runs ML forecasting with safe fallbacks
 * @param {Object} input - Input AQI data
 * @param {Object} options - Options { horizon: number, dryrun: boolean }
 * @returns {Object} - Forecast results
 */
function runForecast(input, options = {}) {
  const warnings = [];
  const horizon = options.horizon || 24;
  const dryrun = options.dryrun || false;
  
  try {
    // Validate input
    const validation = validateInputShape(input);
    if (!validation.valid) {
      warnings.push(`Input validation failed: ${validation.errors.join(', ')}`);
      return {
        ...fallbackForecast(input, horizon),
        warnings: [...warnings, 'ml_forecast_fallback_used']
      };
    }
    
    if (dryrun) {
      return {
        valid: true,
        message: 'Dry run successful - input shape validated',
        inputShape: Object.keys(input),
        horizon,
        timestamp: new Date().toISOString()
      };
    }
    
    // Try to load model weights
    const modelWeights = loadModelWeights();
    
    if (!modelWeights) {
      warnings.push('Model weights not found, using fallback predictor');
      return {
        ...fallbackForecast(input, horizon),
        warnings: [...warnings, 'ml_forecast_fallback_used']
      };
    }
    
    // Here you would run your actual ML model
    // For now, we'll use fallback as the model implementation is in Python
    // In production, you'd call the Python model via subprocess or API
    
    warnings.push('ML model not implemented in JS, using fallback predictor');
    return {
      ...fallbackForecast(input, horizon),
      warnings: [...warnings, 'ml_forecast_fallback_used']
    };
    
  } catch (error) {
    warnings.push(`Forecast error: ${error.message}`);
    return {
      ...fallbackForecast(input, horizon),
      warnings: [...warnings, 'ml_forecast_fallback_used']
    };
  }
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  const dryrun = args.includes('--dryrun');
  
  // Sample input for testing
  const sampleInput = {
    pm25: 120,
    pm10: 180,
    no2: 60,
    co: 2.5,
    so2: 25
  };
  
  console.log('[ML Forecast] Starting forecast runner...');
  console.log(`[ML Forecast] Mode: ${dryrun ? 'DRY RUN' : 'PRODUCTION'}`);
  
  const result = runForecast(sampleInput, { horizon: 24, dryrun });
  
  console.log('[ML Forecast] Result:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.warnings && result.warnings.length > 0) {
    console.log('\n[ML Forecast] Warnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runForecast,
  validateInputShape,
  fallbackForecast,
  loadModelWeights
};

