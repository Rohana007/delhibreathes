import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Search, X, Bot, Loader2, MessageCircle } from 'lucide-react';
import qaData from '../../data/qa.json';
import './chatbotSearch.css';

const HEALTH_GROUPS = {
  normal: { label: 'General', tip: '' },
  child: { label: 'Child', tip: 'For children, limit outdoor play when AQI > 100. Keep windows closed during high pollution.' },
  elderly: { label: 'Elderly', tip: 'For elderly, avoid outdoor activities when AQI > 150. Use air purifiers indoors.' },
  pregnant: { label: 'Pregnant', tip: 'For expecting mothers, avoid outdoor exposure when AQI > 100. Stay in well-ventilated indoor spaces.' },
  asthma: { label: 'Asthma', tip: 'For asthma patients, carry inhaler always. Avoid outdoor activities when AQI > 100.' },
  heart_patient: { label: 'Heart Patient', tip: 'For heart patients, avoid strenuous activities when AQI > 100. Monitor symptoms closely.' },
  sensitive: { label: 'Sensitive', tip: 'For sensitive individuals, wear N95 mask when AQI > 50. Limit outdoor time.' },
};

export default function ChatbotSearch({ aqi }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedHealthGroup, setSelectedHealthGroup] = useState('normal');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [fuse, setFuse] = useState(null);
  const searchInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Fuse.js
  useEffect(() => {
    const fuseOptions = {
      keys: ['questions'],
      threshold: 0.45,
      includeScore: true,
      minMatchCharLength: 2,
    };
    setFuse(new Fuse(qaData, fuseOptions));
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.chatbot-search-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Search suggestions
  useEffect(() => {
    if (!fuse || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const results = fuse.search(searchQuery);
    const limitedResults = results.slice(0, 5).map(result => ({
      id: result.item.id,
      label: result.item.questions[0] || result.item.id,
      score: result.score,
    }));

    setSuggestions(limitedResults);
  }, [searchQuery, fuse]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery('');
    setSuggestions([]);
    setIsOpen(true);

    // Add user message
    const userMessage = { type: 'user', text: suggestion.label, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/chat/selected`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: suggestion.id, aqi: aqi || null }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        let answer = data.answer;

        // Append health group tip if available
        const healthTip = HEALTH_GROUPS[selectedHealthGroup]?.tip;
        if (healthTip) {
          answer += `\n\n💡 ${HEALTH_GROUPS[selectedHealthGroup].label} Tip: ${healthTip}`;
        }

        const botMessage = { type: 'bot', text: answer, timestamp: new Date() };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get answer');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMessage = { 
        type: 'bot', 
        text: 'Assistant unavailable. Please try again.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsOpen(true);
    setLoading(true);

    // Add user message
    const userMessage = { type: 'user', text: searchQuery, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/chat/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, aqi: aqi || null }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.answer) {
        let answer = data.answer;

        // Append health group tip if available
        const healthTip = HEALTH_GROUPS[selectedHealthGroup]?.tip;
        if (healthTip) {
          answer += `\n\n💡 ${HEALTH_GROUPS[selectedHealthGroup].label} Tip: ${healthTip}`;
        }

        const botMessage = { type: 'bot', text: answer, timestamp: new Date() };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('No answer found');
      }
    } catch (err) {
      console.error('Fallback search error:', err);
      const errorMessage = { 
        type: 'bot', 
        text: 'Assistant unavailable. Please try again.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    } else if (e.key === 'Enter' && searchQuery.trim()) {
      handleFallbackSearch();
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* Floating Chatbot Toggle Button */}
      {!isOpen && (
        <button
          className="chatbot-search-toggle-btn"
          onClick={toggleChat}
          aria-label="Open chatbot search"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-search-container">
          <div className="chatbot-search-window">
            {/* Header */}
            <div className="chatbot-search-header">
              <div className="chatbot-search-header-left">
                <Bot className="chatbot-search-header-icon" />
                <h2 className="chatbot-search-title">DelhiBreathes Assistant</h2>
              </div>
              <button onClick={toggleChat} className="chatbot-search-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Health Group Selector */}
            <div className="chatbot-search-health-selector">
              <label className="chatbot-search-health-label">Health Group:</label>
              <select
                value={selectedHealthGroup}
                onChange={(e) => setSelectedHealthGroup(e.target.value)}
                className="chatbot-search-health-select"
              >
                {Object.entries(HEALTH_GROUPS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="chatbot-search-input-wrapper">
              <Search className="chatbot-search-input-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                placeholder="Type to search questions..."
                className="chatbot-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="chatbot-search-clear-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="chatbot-search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="chatbot-search-suggestion-item"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Messages Area */}
            <div className="chatbot-search-messages">
              {messages.length === 0 && !loading && (
                <div className="chatbot-search-welcome">
                  <Bot className="welcome-icon" />
                  <p>Hi! I'm your air quality assistant. Type a question or select from suggestions above.</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`chatbot-search-message ${msg.type}`}>
                  <div className={`chatbot-search-bubble ${msg.type}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chatbot-search-message bot">
                  <div className="chatbot-search-bubble bot chatbot-search-typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

