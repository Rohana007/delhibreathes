/**
 * Calculates normalized contributions and overall confidence
 * from individual source scores
 */

const utils = require('./utils');

/**
 * Normalizes raw scores to percentage contributions
 * @param {Object} rawScores - Object with source scores
 * @returns {Object} - Normalized contributions (percentages)
 */
function normalizeContributions(rawScores) {
  try {
    const sources = ['vehicular', 'industrial', 'construction', 'biomass'];
    const scores = {};
    let total = 0;
    
    // Extract scores and calculate total
    for (const source of sources) {
      const score = utils.safeNumber(rawScores[source]?.score || rawScores[source] || 0, 0);
      scores[source] = score;
      total += score;
    }
    
    // Normalize to percentages
    const contributions = {};
    if (total > 0) {
      for (const source of sources) {
        contributions[source] = (scores[source] / total) * 100;
      }
    } else {
      // If all scores are zero, distribute equally
      for (const source of sources) {
        contributions[source] = 25.0;
      }
    }
    
    return contributions;
  } catch (error) {
    // Return equal distribution on error
    return {
      vehicular: 25.0,
      industrial: 25.0,
      construction: 25.0,
      biomass: 25.0
    };
  }
}

/**
 * Calculates weighted average confidence from all sources
 * @param {Object} sourceResults - Object with source results containing confidence
 * @returns {number} - Overall confidence (0 to 1)
 */
function calculateOverallConfidence(sourceResults) {
  try {
    const sources = ['vehicular', 'industrial', 'construction', 'biomass'];
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const source of sources) {
      const result = sourceResults[source];
      if (result && result.confidence !== undefined) {
        const score = utils.safeNumber(result.score, 0);
        const confidence = utils.safeNumber(result.confidence, 0.5);
        
        // Weight confidence by score (higher scores have more weight)
        const weight = score;
        weightedSum += confidence * weight;
        totalWeight += weight;
      }
    }
    
    if (totalWeight > 0) {
      return utils.clamp(weightedSum / totalWeight, 0, 1);
    }
    
    // If no scores, return average of confidences
    let confidenceSum = 0;
    let count = 0;
    for (const source of sources) {
      const result = sourceResults[source];
      if (result && result.confidence !== undefined) {
        confidenceSum += utils.safeNumber(result.confidence, 0.5);
        count++;
      }
    }
    
    return count > 0 ? utils.clamp(confidenceSum / count, 0, 1) : 0.5;
  } catch (error) {
    return 0.5; // Default confidence
  }
}

/**
 * Determines the highest contributing source
 * @param {Object} contributions - Normalized contributions (percentages)
 * @returns {string} - Source name with highest contribution
 */
function getHighestSource(contributions) {
  try {
    const sources = ['vehicular', 'industrial', 'construction', 'biomass'];
    let maxSource = 'vehicular';
    let maxValue = utils.safeNumber(contributions.vehicular, 0);
    
    for (const source of sources) {
      const value = utils.safeNumber(contributions[source], 0);
      if (value > maxValue) {
        maxValue = value;
        maxSource = source;
      }
    }
    
    return maxSource;
  } catch (error) {
    return 'vehicular'; // Default
  }
}

/**
 * Calculates total contribution summary from all source results
 * @param {Object} sourceResults - Object with results from all engines
 * @returns {Object} - { contributions, overallConfidence, highestSource, summary }
 */
function calculateTotalContribution(sourceResults) {
  try {
    // Load calibration baselines
    const calibrationBaselines = utils.loadJSONSafe('data/calibration_baselines.json', {});
    const expectedRanges = calibrationBaselines.expectedContributionRange || {};
    
    // Extract raw scores
    const rawScores = {
      vehicular: sourceResults.vehicular?.score || 0,
      industrial: sourceResults.industrial?.score || 0,
      construction: sourceResults.construction?.score || 0,
      biomass: sourceResults.biomass?.score || 0
    };
    
    // Normalize to percentages
    let contributions = normalizeContributions(rawScores);
    
    // Apply calibration smoothing if results are unrealistic
    const calibrationWarnings = [];
    
    // Check each source against expected ranges
    for (const [source, contribution] of Object.entries(contributions)) {
      const expectedRange = expectedRanges[source];
      if (expectedRange && Array.isArray(expectedRange) && expectedRange.length === 2) {
        const [minExpected, maxExpected] = expectedRange;
        const contributionPercent = contribution / 100; // Convert to 0-1 range
        
        if (contributionPercent < minExpected || contributionPercent > maxExpected) {
          // Apply smoothing: blend 85% computed + 15% baseline mean
          const baselineMean = (minExpected + maxExpected) / 2;
          const smoothed = 0.85 * contributionPercent + 0.15 * baselineMean;
          contributions[source] = smoothed * 100;
          calibrationWarnings.push(`${source}_outside_expected_range`);
        }
      }
    }
    
    // Special check for unrealistically low vehicular (e.g., < 3%)
    if (contributions.vehicular < 3.0) {
      const vehicularRange = expectedRanges.vehicular || [0.30, 0.45];
      const baselineMean = (vehicularRange[0] + vehicularRange[1]) / 2;
      contributions.vehicular = 0.85 * (contributions.vehicular / 100) + 0.15 * baselineMean;
      contributions.vehicular = contributions.vehicular * 100;
      calibrationWarnings.push('vehicular_unrealistically_low');
    }
    
    // Re-normalize after smoothing to ensure percentages sum to 100
    const total = Object.values(contributions).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const key in contributions) {
        contributions[key] = (contributions[key] / total) * 100;
      }
    }
    
    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(sourceResults);
    
    // Determine highest source
    const highestSource = getHighestSource(contributions);
    
    // Create summary
    const summary = {
      highest: highestSource,
      overallConfidence: utils.safeNumber(overallConfidence, 0.5),
      timestamp: new Date().toISOString(),
      contributions: {
        vehicular: utils.safeNumber(contributions.vehicular, 0),
        industrial: utils.safeNumber(contributions.industrial, 0),
        construction: utils.safeNumber(contributions.construction, 0),
        biomass: utils.safeNumber(contributions.biomass, 0)
      },
      rawScores: {
        vehicular: utils.safeNumber(rawScores.vehicular, 0),
        industrial: utils.safeNumber(rawScores.industrial, 0),
        construction: utils.safeNumber(rawScores.construction, 0),
        biomass: utils.safeNumber(rawScores.biomass, 0)
      },
      calibrationWarnings: calibrationWarnings.length > 0 ? calibrationWarnings : undefined
    };
    
    return {
      contributions,
      overallConfidence,
      highestSource,
      summary
    };
  } catch (error) {
    // Return safe defaults on error
    return {
      contributions: {
        vehicular: 25.0,
        industrial: 25.0,
        construction: 25.0,
        biomass: 25.0
      },
      overallConfidence: 0.5,
      highestSource: 'vehicular',
      summary: {
        highest: 'vehicular',
        overallConfidence: 0.5,
        timestamp: new Date().toISOString(),
        contributions: {
          vehicular: 25.0,
          industrial: 25.0,
          construction: 25.0,
          biomass: 25.0
        },
        rawScores: {
          vehicular: 0,
          industrial: 0,
          construction: 0,
          biomass: 0
        }
      }
    };
  }
}

module.exports = {
  calculateTotalContribution,
  normalizeContributions,
  calculateOverallConfidence,
  getHighestSource
};

