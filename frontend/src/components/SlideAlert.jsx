import { useEffect, useState } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SlideAlert - Slide-from-top alert banner component
 * @param {string} message - Alert message to display
 * @param {string} type - Alert type: "warning" | "danger" | "info"
 * @param {function} onClose - Callback when alert is closed
 * @param {number} autoHideDelay - Auto-hide delay in ms (default: 6000)
 */
export default function SlideAlert({ message, type = 'info', onClose, autoHideDelay = 6000 }) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after delay
  useEffect(() => {
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 400); // Wait for animation to complete
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHideDelay, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400); // Wait for animation to complete
  };

  // Get styles based on type
  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-500',
          icon: <AlertTriangle className="w-5 h-5" />,
          iconColor: 'text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-white'
        };
      default:
        return {
          bg: 'bg-blue-500',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-white'
        };
    }
  };

  const styles = getStyles();

  if (!message || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="slide-alert"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-[60] ${styles.bg} text-white shadow-lg`}
        style={{ marginTop: '64px' }} // Push below navbar (header is h-16 = 64px)
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={styles.iconColor} style={{ flexShrink: 0 }}>
                {styles.icon}
              </div>
              <p className="text-sm sm:text-base font-medium flex-1" style={{ wordBreak: 'break-word' }} data-translate={message}>
                {message}
              </p>
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
    </AnimatePresence>
  );
}

