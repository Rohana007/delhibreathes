/**
 * Source Identification Routes
 * GET /api/source-identification - Identify pollution sources
 */

const express = require('express');
const router = express.Router();
const sourceIdentificationController = require('../controllers/sourceIdentificationController');

/**
 * @route GET /api/source-identification
 * @desc Identify pollution sources at given location
 * @query {number} lat - Latitude (optional, defaults to Delhi center)
 * @query {number} lng - Longitude (optional, defaults to Delhi center)
 * @query {number} pm25 - PM2.5 value (optional)
 * @query {number} pm10 - PM10 value (optional)
 * @query {number} no2 - NO2 value (optional)
 * @query {number} co - CO value (optional)
 * @query {number} so2 - SO2 value (optional)
 * @query {number} windSpeed - Wind speed in m/s (optional)
 * @query {number} windDirection - Wind direction in degrees (optional)
 * @query {string} trafficLevel - Traffic level: 'free', 'moderate', 'heavy', 'jammed' (optional)
 * @query {string} roadType - Road type: 'highway', 'major', 'minor', 'residential' (optional)
 * @query {number} distance_km - Distance to nearest major road in km (optional)
 * @query {number} humidity - Relative humidity 0-100 (optional)
 * @returns {Object} - Source identification results with contributions and confidence
 */
router.get('/', sourceIdentificationController.identifySources);

module.exports = router;

