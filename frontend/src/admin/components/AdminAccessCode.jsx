import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertCircle, Loader2, Clock } from 'lucide-react';

const ADMIN_ACCESS_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'DelhiBreathesPolicy2025';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function AdminAccessCode({ onSuccess }) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check if user is already locked out
  useEffect(() => {
    const lockoutEnd = localStorage.getItem('adminAccessLockout');
    if (lockoutEnd) {
      const endTime = parseInt(lockoutEnd);
      const now = Date.now();
      if (now < endTime) {
        setIsLocked(true);
        setLockoutTime(endTime);
        setRemainingTime(Math.ceil((endTime - now) / 1000));
      } else {
        // Lockout expired, clear it
        localStorage.removeItem('adminAccessLockout');
        localStorage.removeItem('adminAccessAttempts');
      }
    }

    // Restore attempts count
    const savedAttempts = localStorage.getItem('adminAccessAttempts');
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked || !lockoutTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((lockoutTime - now) / 1000);
      
      if (remaining <= 0) {
        setIsLocked(false);
        setLockoutTime(null);
        setRemainingTime(0);
        setAttempts(0);
        localStorage.removeItem('adminAccessLockout');
        localStorage.removeItem('adminAccessAttempts');
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Access locked. Please wait ${formatTime(remainingTime)} before trying again.`);
      return;
    }

    if (accessCode.trim() === '') {
      setError('Please enter the access code');
      return;
    }

    // Verify access code
    if (accessCode.trim() === ADMIN_ACCESS_CODE) {
      // Success - clear attempts and set verified
      localStorage.removeItem('adminAccessAttempts');
      sessionStorage.setItem('adminAccessVerified', 'true');
      onSuccess();
    } else {
      // Wrong code - increment attempts
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('adminAccessAttempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock out for 10 minutes
        const lockoutEnd = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem('adminAccessLockout', lockoutEnd.toString());
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
        setRemainingTime(Math.ceil(LOCKOUT_DURATION / 1000));
        setError(`Too many failed attempts. Access locked for 10 minutes.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Invalid access code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
          <Shield className="w-8 h-8" style={{ color: '#2563EB' }} />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
          Admin Access Required
        </h1>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Enter the admin access code to continue
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' }}>
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Lockout Message */}
      {isLocked && (
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
              Access Locked
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Please wait {formatTime(remainingTime)} before trying again.
            </p>
          </div>
        </div>
      )}

      {/* Access Code Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
            Admin Access Code
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              disabled={isLocked}
              required
              className="w-full pl-10 pr-4 py-2 rounded-lg border input-field disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: '#E2E8F0' }}
              placeholder="Enter admin access code"
              autoFocus
            />
          </div>
        </div>

        {/* Attempts Counter */}
        {attempts > 0 && !isLocked && (
          <p className="text-xs text-center" style={{ color: '#64748B' }}>
            Attempts: {attempts}/{MAX_ATTEMPTS}
          </p>
        )}

        <button
          type="submit"
          disabled={isLocked || accessCode.trim() === ''}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield className="w-4 h-4" />
          Verify Access Code
        </button>
      </form>

      {/* Security Note */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: '#64748B' }}>
          This is a secure admin area. Unauthorized access is prohibited.
        </p>
      </div>
    </motion.div>
  );
}

