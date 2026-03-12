import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ALERTS_UPDATED_EVENT } from '@/utils/alertsEngine';
import '@/styles/alerts.css';

/**
 * Top Slide-In Alert Banner Component
 * Shows alerts sliding down from the top of the page
 */
export default function TopSlideAlert({ alerts = [], autoHideDelay = 6000 }) {
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alertQueue, setAlertQueue] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstant, setIsInstant] = useState(false);

  // Listen for force update events - triggers instant alert display
  useEffect(() => {
    function handleForceUpdate(event) {
      if (event.detail && event.detail.force === true) {
        setIsInstant(true);
        // Use current alerts prop or wait a tiny bit for prop update
        // This ensures we show alerts even if prop hasn't updated yet
        setTimeout(() => {
          const alertsToUse = alerts && alerts.length > 0 ? alerts : [];
          if (alertsToUse.length > 0) {
            // Sort by severity: danger > warning > info
            const sortedAlerts = [...alertsToUse].sort((a, b) => {
              const severityOrder = { danger: 3, warning: 2, info: 1 };
              return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            });
            setCurrentAlert(sortedAlerts[0]);
            setIsVisible(true);
            setAlertQueue(sortedAlerts.slice(1));
          }
        }, 0); // Use setTimeout(0) to ensure alerts prop is updated
      }
    }
    
    window.addEventListener(ALERTS_UPDATED_EVENT, handleForceUpdate);
    return () => window.removeEventListener(ALERTS_UPDATED_EVENT, handleForceUpdate);
  }, [alerts]);

  // Process alert queue
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Add new alerts to queue (avoid duplicates)
      setAlertQueue(prev => {
        const existingIds = new Set(prev.map(a => a.timestamp));
        const newAlerts = alerts.filter(a => !existingIds.has(a.timestamp));
        return [...prev, ...newAlerts];
      });
    }
  }, [alerts]);

  // Show next alert from queue (only if not in instant mode)
  useEffect(() => {
    if (alertQueue.length > 0 && !currentAlert && !isInstant) {
      const nextAlert = alertQueue[0];
      setCurrentAlert(nextAlert);
      setIsVisible(true);
      setAlertQueue(prev => prev.slice(1));
    }
  }, [alertQueue, currentAlert, isInstant]);
  
  // Reset instant flag after alert is shown
  useEffect(() => {
    if (isInstant && currentAlert) {
      const timer = setTimeout(() => {
        setIsInstant(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInstant, currentAlert]);

  // Auto-hide current alert
  useEffect(() => {
    if (currentAlert && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentAlert(null);
        }, 400); // Wait for exit animation
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [currentAlert, autoHideDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentAlert(null);
    }, 400);
  };

  if (!currentAlert) return null;

  const getStyles = () => {
    switch (currentAlert.severity) {
      case 'danger':
        return {
          bg: 'bg-red-500',
          icon: <AlertTriangle className="w-5 h-5" />,
          iconColor: 'text-white',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-white',
        };
      default:
        return {
          bg: 'bg-blue-500',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-white',
        };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={isInstant ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
          className={`fixed top-0 left-0 right-0 z-[60] ${styles.bg} text-white shadow-lg ${isInstant ? 'instant' : ''}`}
          style={{ marginTop: '64px' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={styles.iconColor} style={{ flexShrink: 0 }}>
                  {styles.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-1">{currentAlert.title}</h4>
                  <p className="text-xs sm:text-sm" style={{ wordBreak: 'break-word' }}>
                    {currentAlert.message}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close alert"
                style={{ minWidth: '32px', minHeight: '32px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

