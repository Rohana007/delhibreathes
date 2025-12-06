import React, { useState } from 'react';
import { X, Loader2, Bot } from 'lucide-react';
import './AQIChatbot.css';

// Predefined questions matching backend qa.json
const QUESTIONS = [
  { id: 'q_aqi_today', label: 'What is AQI today?' },
  { id: 'q_what_is_aqi', label: 'What is AQI?' },
  { id: 'q_mask', label: 'Should I wear a mask today?' },
  { id: 'q_for_asthma', label: 'Is it safe for asthma patients?' },
  { id: 'q_sources', label: 'Why is Delhi polluted?' }
];

export default function AQIChatbot({ aqi }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = async (id) => {
    setLoading(true);
    setError(null);

    // Find the question label
    const question = QUESTIONS.find(q => q.id === id);
    const questionText = question ? question.label : '';

    // Add user message
    const userMessage = { type: 'user', text: questionText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/chat/selected`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aqi: aqi || null })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        // Add bot message
        const botMessage = { type: 'bot', text: data.answer, timestamp: new Date() };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMsg = data.error || 'Failed to get answer';
        setError(errorMsg);
        const errorMessage = { type: 'bot', text: errorMsg, isError: true, timestamp: new Date() };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg = 'Unable to connect to server. Please try again.';
      setError(errorMsg);
      const errorMessage = { type: 'bot', text: errorMsg, isError: true, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <Bot className="chatbot-header-icon" size={20} />
              <h2 className="chatbot-header-title">DelhiBreathes Assistant</h2>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-content">
                  <Bot className="chatbot-welcome-icon" size={24} style={{ color: '#009769' }} />
                  <p className="chatbot-welcome-text">Hi! I'm your air quality assistant.</p>
                  <p className="chatbot-welcome-subtext">Select a question below to get started.</p>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.type === 'user' ? 'chatbot-message-user' : 'chatbot-message-bot'}`}
              >
                <div className={`chatbot-bubble ${msg.isError ? 'chatbot-bubble-error' : ''}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message chatbot-message-bot">
                <div className="chatbot-bubble chatbot-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* Questions Area */}
          <div className="chatbot-questions">
            <div className="chatbot-questions-label">Quick Questions:</div>
            <div className="chatbot-questions-list">
              {QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => ask(q.id)}
                  className="chatbot-question-btn"
                  disabled={loading}
                >
                  <span className="chatbot-question-icon">?</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

