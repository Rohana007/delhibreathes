import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';

export default function LoadingSpinner({ size = 'default', message = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-primary-500 to-green-500 flex items-center justify-center`}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Wind className={`${iconSizes[size]} text-gray-100`} />
      </motion.div>
          {message && (
        <motion.p
          style={{ marginTop: '1rem', color: '#d1d5db', fontSize: '0.875rem' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          data-translate={message}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card ${className}`} style={{ padding: '1rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <div style={{ height: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem', width: '33%', marginBottom: '0.75rem' }}></div>
      <div style={{ height: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem', width: '66%', marginBottom: '0.5rem' }}></div>
      <div style={{ height: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem', width: '50%' }}></div>
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`glass-card ${className}`} style={{ padding: '1rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <div style={{ height: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem', width: '25%', marginBottom: '1rem' }}></div>
      <div style={{ height: '12rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem' }}></div>
    </div>
  );
}

