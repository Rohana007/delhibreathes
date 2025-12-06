import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import './ReportBloomPopup.css';

export default function ReportBloomPopup({ visible, onClose, onViewReports, achievement }) {
  const [animateTrophy, setAnimateTrophy] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const autoCloseTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (visible) {
      // Trigger trophy animation
      setTimeout(() => {
        setAnimateTrophy(true);
      }, 100);

      // REMOVED auto-close - popup must be manually closed
    } else {
      // Reset state when hidden
      setAnimateTrophy(false);
      setIsClosing(false);
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [visible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      setIsClosing(false);
      setAnimateTrophy(false);
    }, 300);
  };

  const handleViewReports = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      if (onViewReports) {
        onViewReports();
      } else {
        navigate('/my-reports');
      }
      setIsClosing(false);
      setAnimateTrophy(false);
    }, 300);
  };

  const handleBackToHome = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      navigate('/');
      setIsClosing(false);
      setAnimateTrophy(false);
    }, 300);
  };

  // REMOVED backdrop click handler - popup can only be closed via X button
  const handleBackdropClick = (e) => {
    // Do nothing - prevent closing on backdrop click
    e.stopPropagation();
  };

  if (!visible && !isClosing) return null;

  return (
    <div 
      className={`rb-backdrop ${isClosing ? 'rb-closing' : ''}`}
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div 
        className={`rb-popup ${isClosing ? 'rb-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bloom glow effect */}
        <div className="rb-petals"></div>

        {/* Close button */}
        <button 
          className="rb-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Emoji header */}
        <div className="rb-emoji-header">
          {achievement ? '🏆🌸✨💚' : '📊🌸✨💚'}
        </div>

        {/* Trophy with animation */}
        <div className={`rb-trophy ${animateTrophy ? 'rb-trophy-pop' : ''}`}>
          {achievement?.icon || '🏆'}
        </div>

        {/* Hero text */}
        <h2 className="rb-hero-text">
          {achievement ? 'Achievement Unlocked!' : 'You did it, Legend! 💚'}
        </h2>

        {/* Subtext */}
        <p className="rb-subtext">
          {achievement ? (
            <>
              <strong>{achievement.icon} {achievement.title}</strong>
              <br />
              {achievement.description}
              <br />
              <span style={{ color: '#16A34A', fontWeight: 600 }}>
                +{achievement.rewardPoints} Green Points
              </span>
            </>
          ) : (
            <>
              Your pollution report has been successfully recorded.
              <br />
              Small actions like yours create big change. 🌱
            </>
          )}
        </p>

        {/* Achievement Tag */}
        {!achievement && (
          <div className="rb-achievement-tag">
            🎉 Achievement Unlocked: Pollution Warrior
          </div>
        )}

        {/* Buttons */}
        <div className="rb-buttons">
          <button 
            className="rb-btn rb-btn-mint"
            onClick={handleViewReports}
          >
            📊 View My Reports
          </button>
          <button 
            className="rb-btn rb-btn-blush"
            onClick={handleBackToHome}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

