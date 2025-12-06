const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Load QA data from JSON file
let QA = {};
const QA_PATH = path.join(__dirname, '..', '..', 'data', 'qa.json');

try {
  const qaData = fs.readFileSync(QA_PATH, 'utf-8');
  const qaArray = JSON.parse(qaData);
  // Convert array to object with id as key for fast lookup
  QA = qaArray.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
  logger.info(`[Chatbot] Loaded ${Object.keys(QA).length} Q&A pairs from qa.json`);
} catch (error) {
  logger.error(`[Chatbot] Error loading qa.json: ${error.message}`);
  // Fallback QA data
  QA = {
    q_fallback: {
      id: 'q_fallback',
      questions: [],
      answer: 'Sorry, I don\'t have an answer for that. Try simpler words or ask about AQI, masks, or health tips.'
    }
  };
}

/**
 * Handle selected question from frontend
 * POST /api/chat/selected
 * Body: { id: string, aqi?: number }
 */
exports.selectedChat = async (req, res) => {
  try {
    const { id, aqi } = req.body;

    // Validate question ID
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
    }

    // Check if question exists
    if (!QA[id]) {
      logger.warn(`[Chatbot] Invalid question ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Invalid question ID'
      });
    }

    // Get answer
    let answer = QA[id].answer;

    // Replace AQI placeholder if present
    if (answer.includes('{{aqi}}')) {
      const aqiValue = aqi !== null && aqi !== undefined ? String(aqi) : 'unavailable';
      answer = answer.replace(/\{\{aqi\}\}/g, aqiValue);
    }

    logger.info(`[Chatbot] Question ${id} answered, AQI: ${aqi || 'not provided'}`);

    return res.json({
      success: true,
      answer: answer
    });
  } catch (error) {
    logger.error(`[Chatbot] Error processing question: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Get all available questions (for frontend)
 * GET /api/chat/questions
 */
exports.getQuestions = (req, res) => {
  try {
    const questions = Object.values(QA)
      .filter(item => item.id !== 'q_fallback') // Exclude fallback
      .map(item => ({
        id: item.id,
        label: item.questions[0] || item.id // Use first question as label
      }));

    return res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error(`[Chatbot] Error getting questions: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Search questions using fuzzy matching (fallback for client-side search)
 * POST /api/chat/search
 * Body: { query: string, aqi?: number }
 */
exports.searchChat = async (req, res) => {
  try {
    const { query, aqi } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchTerm = query.toLowerCase().trim();

    // Simple fuzzy matching: check if query matches any question text
    let bestMatch = null;
    let bestScore = 0;

    for (const item of Object.values(QA)) {
      if (item.id === 'q_fallback') continue;

      // Check each question in the item
      for (const question of item.questions) {
        const questionLower = question.toLowerCase();
        
        // Exact match
        if (questionLower === searchTerm) {
          bestMatch = item;
          bestScore = 1.0;
          break;
        }
        
        // Contains match
        if (questionLower.includes(searchTerm) || searchTerm.includes(questionLower)) {
          const score = Math.min(questionLower.length, searchTerm.length) / Math.max(questionLower.length, searchTerm.length);
          if (score > bestScore) {
            bestMatch = item;
            bestScore = score;
          }
        }
        
        // Word match
        const questionWords = questionLower.split(/\s+/);
        const queryWords = searchTerm.split(/\s+/);
        const matchingWords = queryWords.filter(qw => questionWords.some(qw2 => qw2.includes(qw) || qw.includes(qw2))).length;
        const wordScore = matchingWords / Math.max(queryWords.length, 1);
        if (wordScore > bestScore && wordScore > 0.3) {
          bestMatch = item;
          bestScore = wordScore;
        }
      }

      if (bestScore >= 1.0) break;
    }

    // If no good match found, return fallback
    if (!bestMatch || bestScore < 0.3) {
      bestMatch = QA.q_fallback || {
        id: 'q_fallback',
        answer: 'Sorry, I don\'t have an answer for that. Try simpler words or ask about AQI, masks, or health tips.'
      };
    }

    // Get answer
    let answer = bestMatch.answer;

    // Replace AQI placeholder if present
    if (answer.includes('{{aqi}}')) {
      const aqiValue = aqi !== null && aqi !== undefined ? String(aqi) : 'unavailable';
      answer = answer.replace(/\{\{aqi\}\}/g, aqiValue);
    }

    logger.info(`[Chatbot] Search query "${query}" matched ${bestMatch.id} with score ${bestScore.toFixed(2)}`);

    return res.json({
      success: true,
      answer: answer,
      matchedId: bestMatch.id,
      score: bestScore
    });
  } catch (error) {
    logger.error(`[Chatbot] Error searching: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

