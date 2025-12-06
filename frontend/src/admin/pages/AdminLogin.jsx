import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle, Shield } from 'lucide-react';
import { adminAuth } from '../api/adminApi';
import AdminAccessCode from '../components/AdminAccessCode';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [accessCodeVerified, setAccessCodeVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if access code is already verified
  useEffect(() => {
    const verified = sessionStorage.getItem('adminAccessVerified');
    if (verified === 'true') {
      setAccessCodeVerified(true);
    }

    // If user is already logged in, redirect to policy dashboard
    const token = localStorage.getItem('adminToken');
    if (token && verified === 'true') {
      navigate('/policy/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAuth.login(email, password);
      
      if (response.success) {
        // Store token
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('admin', JSON.stringify(response.admin));
        
        // Redirect to policy dashboard
        navigate('/policy/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeSuccess = () => {
    setAccessCodeVerified(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Show Access Code Screen First */}
          {!accessCodeVerified ? (
            <AdminAccessCode onSuccess={handleAccessCodeSuccess} />
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
                  <Shield className="w-8 h-8" style={{ color: '#2563EB' }} />
                </div>
                <h1 className="text-2xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
                  DelhiBreathes Admin Panel
                </h1>
                <p className="text-sm" style={{ color: '#64748B' }}>
                  Sign in to manage pollution reports
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
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border input-field"
                  style={{ borderColor: '#E2E8F0' }}
                  placeholder="admin@delhibreathes.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border input-field"
                  style={{ borderColor: '#E2E8F0' }}
                  placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

