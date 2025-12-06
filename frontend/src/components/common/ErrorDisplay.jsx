import { AlertTriangle } from 'lucide-react';
import { FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function ErrorDisplay({ error, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-200 mb-2" data-translate="Something went wrong">
        Something went wrong
      </h3>
      
      <p className="text-gray-400 text-sm mb-6 max-w-md" data-translate={error ? undefined : 'Failed to load data. Please check your connection and try again.'}>
        {error || 'Failed to load data. Please check your connection and try again.'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center gap-2"
          style={{ cursor: 'pointer' }}
          data-translate="Try Again"
        >
          <FiRefreshCw 
            className="refresh-icon"
            style={{ 
              width: '18px', 
              height: '18px',
              transition: 'transform 0.2s ease'
            }} 
          />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

