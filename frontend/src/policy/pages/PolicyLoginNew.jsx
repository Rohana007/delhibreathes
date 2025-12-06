import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Shield, Key } from 'lucide-react';

const POLICYMAKER_ACCESS_CODE = import.meta.env.VITE_POLICYMAKER_ACCESS_CODE || 'DelhiBreathesPolicy2025!';

export default function PolicyLoginNew() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    const policyAccess = localStorage.getItem('policyAccess');
    if (policyAccess === 'true') {
      window.location.href = '/policy-dashboard';
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate access code
    if (accessCode.trim() !== POLICYMAKER_ACCESS_CODE) {
      setError('Invalid access code. Please check and try again.');
      setLoading(false);
      return;
    }

    // Set policy access and redirect
    localStorage.setItem('policyAccess', 'true');
    window.location.href = '/policy-dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
              <Shield className="w-8 h-8" style={{ color: '#2563EB' }} />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
              Policymaker Access
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Enter Policymaker Access Code to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' }}>
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Code */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                Enter Policymaker Access Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border input-field"
                  style={{ borderColor: '#E2E8F0' }}
                  placeholder="Enter access code"
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: '#64748B' }}>
              For authorized personnel only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

