const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

/**
 * Selectable Question Chatbot Routes
 * 
 * POST /api/chat/selected - Get answer for selected question
 * GET /api/chat/questions - Get all available questions
 */

// Handle selected question
router.post('/selected', chatbotController.selectedChat);

// Get all available questions
router.get('/questions', chatbotController.getQuestions);

// Search questions (fallback for client-side search)
router.post('/search', chatbotController.searchChat);

module.exports = router;

