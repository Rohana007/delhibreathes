/**
 * Safe Route Service - Node.js wrapper for Python Safe Route service
 * Calls Python service via subprocess
 */
const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

const PYTHON_SERVICE_PATH = path.join(__dirname, '../safe_route/safeRouteService.py');
const PYTHON_CMD = process.env.PYTHON_CMD || 'python'; // Use 'python3' on Linux/Mac if needed
const config = require('../config');

/**
 * Initialize the Python Safe Route service
 * @returns {Promise<boolean>}
 */
async function initializeService() {
  return new Promise((resolve) => {
    // Get API key and ensure it's properly set
    const apiKey = (config.apis.googleMaps.key || process.env.GOOGLE_MAPS_API_KEY || '').trim();
    
    // Log API key status (without exposing the actual key)
    if (!apiKey) {
      logger.error('[Safe Route] GOOGLE_MAPS_API_KEY is missing or empty');
      logger.error('[Safe Route] Config value:', config.apis.googleMaps.key ? 'present' : 'missing');
      logger.error('[Safe Route] Env value:', process.env.GOOGLE_MAPS_API_KEY ? 'present' : 'missing');
    } else {
      logger.info('[Safe Route] GOOGLE_MAPS_API_KEY is set (length: ' + apiKey.length + ')');
    }
    
    // Ensure environment variables are passed to Python
    const env = {
      ...process.env,
      GOOGLE_MAPS_API_KEY: apiKey,
      MONGO_URI: config.mongo.uri,
      MONGODB_URI: config.mongo.uri,
      REDIS_URL: config.redis.url,
    };
    
    const pythonProcess = spawn(PYTHON_CMD, [PYTHON_SERVICE_PATH, 'init'], {
      env: env,
      cwd: path.join(__dirname, '../..'),
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          if (result.success) {
            logger.info('[Safe Route] Service initialized successfully');
            resolve(true);
          } else {
            logger.warn('[Safe Route] Service initialization returned false');
            resolve(false);
          }
        } catch (e) {
          logger.error('[Safe Route] Failed to parse initialization result:', e);
          resolve(false);
        }
      } else {
        logger.error(`[Safe Route] Service initialization failed with code ${code}`);
        logger.error('[Safe Route] Error output:', errorOutput);
        resolve(false);
      }
    });
  });
}

/**
 * Get safe route between two points
 * @param {number} sourceLat - Source latitude
 * @param {number} sourceLng - Source longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {number} weightDistance - Weight for distance (default: 0.6)
 * @param {number} weightPollution - Weight for pollution (default: 0.3)
 * @param {number} weightTraffic - Weight for traffic (default: 0.1)
 * @returns {Promise<Object>} Route data
 */
async function getSafeRoute(
  sourceLat,
  sourceLng,
  destLat,
  destLng,
  weightDistance = 0.6,
  weightPollution = 0.3,
  weightTraffic = 0.1,
  includeTraffic = false
) {
  return new Promise((resolve, reject) => {
    const args = [
      PYTHON_SERVICE_PATH,
      'route',
      sourceLat.toString(),
      sourceLng.toString(),
      destLat.toString(),
      destLng.toString(),
      weightDistance.toString(),
      weightPollution.toString(),
      weightTraffic.toString(),
    ];

    // Get API key and ensure it's properly set
    const apiKey = (config.apis.googleMaps.key || process.env.GOOGLE_MAPS_API_KEY || '').trim();
    
    if (!apiKey) {
      logger.error('[Safe Route] GOOGLE_MAPS_API_KEY is missing or empty');
      logger.error('[Safe Route] Config value:', config.apis.googleMaps.key ? 'present' : 'missing');
      logger.error('[Safe Route] Env value:', process.env.GOOGLE_MAPS_API_KEY ? 'present' : 'missing');
      return Promise.reject(new Error('GOOGLE_MAPS_API_KEY is missing. Please set it in backend/.env file.'));
    }
    
    // Ensure environment variables are passed to Python
    const env = {
      ...process.env,
      GOOGLE_MAPS_API_KEY: apiKey,
      MONGO_URI: config.mongo.uri,
      MONGODB_URI: config.mongo.uri,
      REDIS_URL: config.redis.url,
    };
    
    // Debug: Log environment variable status (without exposing the key)
    logger.info(`[Safe Route] Spawning Python process with API key length: ${apiKey.length}`);
    logger.info(`[Safe Route] Environment GOOGLE_MAPS_API_KEY present: ${!!env.GOOGLE_MAPS_API_KEY}`);
    logger.info(`[Safe Route] Environment GOOGLE_MAPS_API_KEY length: ${env.GOOGLE_MAPS_API_KEY ? env.GOOGLE_MAPS_API_KEY.length : 0}`);
    
    const pythonProcess = spawn(PYTHON_CMD, args, {
      env: env,
      cwd: path.join(__dirname, '../..'),
      timeout: 30000, // 30 second timeout
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('error', (error) => {
      logger.error('[Safe Route] Failed to spawn Python process:', error);
      reject(new Error(`Python service error: ${error.message}`));
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          if (result.success) {
            resolve(result.data);
          } else {
            logger.error('[Safe Route] Python service returned error:', result.error);
            reject(new Error(result.error || 'Unknown error from Python service'));
          }
        } catch (e) {
          logger.error('[Safe Route] Failed to parse result:', e);
          logger.error('[Safe Route] Raw output:', output);
          logger.error('[Safe Route] Error output:', errorOutput);
          reject(new Error(`Failed to parse Python service response: ${e.message}. Output: ${output.substring(0, 500)}`));
        }
      } else {
        logger.error(`[Safe Route] Python process exited with code ${code}`);
        logger.error('[Safe Route] Error output:', errorOutput);
        logger.error('[Safe Route] Standard output:', output);
        reject(new Error(`Python service exited with code ${code}. Error: ${errorOutput.substring(0, 500)}`));
      }
    });
  });
}

module.exports = {
  initializeService,
  getSafeRoute,
};

