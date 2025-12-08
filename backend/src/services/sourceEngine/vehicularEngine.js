/**
 * Vehicular Pollution Source Identification Engine
 * Implements microscopic vehicular pollution calculation using VAHAN and CPCB data
 * 
 * Formula: For each vehicle type:
 *   typeShare × emissionFactor(type) × ageFactor × fuelFactor × congestionFactor × 
 *   idlingFactor × roadTypeFactor × distanceDecay
 * 
 * vehicularScore = sum(all types) × validationWeight(CPCB)
 */

const utils = require('./utils');

// Age factor mapping: older vehicles emit more
const AGE_FACTORS = {
  '0_5': 1.0,    // New vehicles (0-5 years)
  '5_10': 1.3,   // Moderate age (5-10 years)
  '10_15': 1.6,  // Older vehicles (10-15 years)
  '15_plus': 2.0 // Very old vehicles (15+ years)
};

// Fuel factor mapping: diesel emits more than petrol/CNG/electric
const FUEL_FACTORS = {
  'petrol': 1.0,
  'diesel': 1.8,
  'CNG': 0.7,
  'electric': 0.1
};

/**
 * Calculates vehicular pollution contribution score
 * @param {Object} params - Input parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {Object} params.aqi - AQI data with PM25, NO2, CO
 * @param {string} params.trafficLevel - Traffic level: 'free', 'moderate', 'heavy', 'jammed'
 * @param {string} params.roadType - Road type: 'highway', 'major', 'minor', 'residential'
 * @param {number} params.distance_km - Distance to nearest major road (km)
 * @param {Object} params.vahanData - VAHAN vehicle mix data (optional, loaded if not provided)
 * @param {Object} params.cpcbData - CPCB emission factors (optional, loaded if not provided)
 * @param {Object} params.validationWeights - Validation weights (optional, loaded if not provided)
 * @returns {Object} - { score, rawScoreBreakdown, dieselSignatureScore, confidence, warnings }
 */
function calculateVehicularContribution(params = {}) {
  const warnings = [];
  
  try {
    // Load static data files
    const vahanData = params.vahanData || utils.loadJSONSafe('data/vahanProcessed.json', {});
    const cpcbData = params.cpcbData || utils.loadJSONSafe('data/cpcbEmissionFactors.json', {});
    const validationWeights = params.validationWeights || utils.loadJSONSafe('data/validationWeights.json', {});
    
    // Validate inputs with safe defaults
    const lat = utils.safeNumber(params.lat, 28.6139);
    const lng = utils.safeNumber(params.lng, 77.2090);
    const trafficLevel = params.trafficLevel || 'moderate';
    const roadType = params.roadType || 'major';
    const distanceKm = utils.safeNumber(params.distance_km, 0);
    
    // Extract AQI data with safe defaults
    const aqi = params.aqi || {};
    const pm25 = utils.safeNumber(aqi.pm25, 100);
    const no2 = utils.safeNumber(aqi.no2, 50);
    const co = utils.safeNumber(aqi.co, 2.0);
    
    // Get factors
    const congestionFactor = utils.congestionToFactor(trafficLevel);
    const idlingFactorValue = utils.idlingFactor(trafficLevel);
    const roadTypeFactorValue = utils.roadTypeFactor(roadType);
    const distanceDecayValue = utils.distanceDecay(distanceKm);
    const timeFactor = utils.timeOfDayFactor(new Date());
    
    // Get vehicle mix from VAHAN data
    const vehicleMix = vahanData.vehicleMix || {
      twoW: 0.38,
      fourW: 0.31,
      LCV: 0.11,
      HCV: 0.07,
      bus: 0.03
    };
    
    // Get fuel mix
    const fuelMix = vahanData.fuelMix || {
      petrol: 0.37,
      diesel: 0.41,
      CNG: 0.18,
      electric: 0.04
    };
    
    // Get age mix
    const ageMix = vahanData.ageMix || {
      '0_5': 0.22,
      '5_10': 0.34,
      '10_15': 0.27,
      '15_plus': 0.17
    };
    
    // Get emission factors from CPCB
    const pm25Factors = cpcbData.PM25 || {};
    const noxFactors = cpcbData.NOx || {};
    
    // Calculate average age factor (weighted by age mix)
    let avgAgeFactor = 0;
    for (const [ageRange, share] of Object.entries(ageMix)) {
      const ageFactor = AGE_FACTORS[ageRange] || 1.0;
      avgAgeFactor += ageFactor * utils.safeNumber(share, 0);
    }
    avgAgeFactor = utils.safeNumber(avgAgeFactor, 1.0);
    
    // Calculate average fuel factor (weighted by fuel mix)
    let avgFuelFactor = 0;
    for (const [fuelType, share] of Object.entries(fuelMix)) {
      const fuelFactor = FUEL_FACTORS[fuelType] || 1.0;
      avgFuelFactor += fuelFactor * utils.safeNumber(share, 0);
    }
    avgFuelFactor = utils.safeNumber(avgFuelFactor, 1.0);
    
    // Calculate raw score breakdown by vehicle type
    const rawScoreBreakdown = {};
    let totalRawScore = 0;
    
    // Process each vehicle type
    const vehicleTypes = [
      { key: 'twoW', cpcbKey: '2W', name: 'Two-Wheeler' },
      { key: 'fourW', cpcbKey: '4W_Petrol', name: 'Four-Wheeler (Petrol)' },
      { key: 'fourW', cpcbKey: '4W_Diesel', name: 'Four-Wheeler (Diesel)' },
      { key: 'LCV', cpcbKey: 'LCV', name: 'Light Commercial Vehicle' },
      { key: 'HCV', cpcbKey: 'HCV', name: 'Heavy Commercial Vehicle' },
      { key: 'bus', cpcbKey: 'Bus', name: 'Bus' }
    ];
    
    for (const vehicleType of vehicleTypes) {
      const typeShare = utils.safeNumber(vehicleMix[vehicleType.key], 0);
      const emissionFactor = utils.safeNumber(pm25Factors[vehicleType.cpcbKey], 0.1);
      
      // Calculate contribution for this vehicle type
      const contribution = typeShare * 
                          emissionFactor * 
                          avgAgeFactor * 
                          avgFuelFactor * 
                          congestionFactor * 
                          idlingFactorValue * 
                          roadTypeFactorValue * 
                          distanceDecayValue * 
                          timeFactor;
      
      rawScoreBreakdown[vehicleType.name] = utils.safeNumber(contribution, 0);
      totalRawScore += contribution;
    }
    
    // Apply validation weight
    const cpcbWeight = utils.safeNumber(validationWeights.CPCB, 0.95);
    const finalScore = totalRawScore * cpcbWeight;
    
    // Calculate diesel signature score
    // Formula: (NO2_rise / (CO_rise + 0.01)) × baselineDieselRatio × congestionFactor × roadTypeFactor × timeFactor
    const baselineDieselRatio = utils.safeNumber(fuelMix.diesel, 0.41);
    const no2Rise = Math.max(0, no2 - 30); // Baseline NO2 ~30
    const coRise = Math.max(0.01, co - 1.0); // Baseline CO ~1.0
    const dieselSignatureRatio = no2Rise / coRise;
    const dieselSignatureScore = dieselSignatureRatio * 
                                 baselineDieselRatio * 
                                 congestionFactor * 
                                 roadTypeFactorValue * 
                                 timeFactor;
    
    // Calculate confidence based on data availability
    let confidence = 0.85; // Base confidence
    if (!vahanData || Object.keys(vahanData).length === 0) {
      confidence -= 0.15;
      warnings.push('VAHAN data not available, using defaults');
    }
    if (!cpcbData || Object.keys(cpcbData).length === 0) {
      confidence -= 0.10;
      warnings.push('CPCB emission factors not available, using defaults');
    }
    if (distanceKm === 0) {
      confidence -= 0.05;
      warnings.push('Distance to road not provided, assuming on-road');
    }
    confidence = utils.clamp(confidence, 0.5, 1.0);
    
    return {
      score: utils.safeNumber(finalScore, 0),
      rawScoreBreakdown,
      dieselSignatureScore: utils.safeNumber(dieselSignatureScore, 0),
      confidence: utils.safeNumber(confidence, 0.7),
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        factors: {
          congestionFactor,
          idlingFactor: idlingFactorValue,
          roadTypeFactor: roadTypeFactorValue,
          distanceDecay: distanceDecayValue,
          timeFactor,
          avgAgeFactor,
          avgFuelFactor
        },
        vehicleMix,
        fuelMix,
        ageMix
      }
    };
    
  } catch (error) {
    // Return safe defaults on any error
    return {
      score: 0,
      rawScoreBreakdown: {},
      dieselSignatureScore: 0,
      confidence: 0.3,
      warnings: [`Error in vehicular calculation: ${error.message}`],
      metadata: {}
    };
  }
}

module.exports = {
  calculateVehicularContribution
};

