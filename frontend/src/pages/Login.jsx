import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, User, Briefcase } from 'lucide-react';
import { login } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'user'; // Default to 'user' if no mode specified

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success && result.token) {
        // Store token and user data
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Redirect based on mode
        if (mode === 'policy') {
          navigate('/policy-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {mode === 'policy' ? (
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <Briefcase className="w-8 h-8" style={{ color: '#3B82F6' }} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <User className="w-8 h-8" style={{ color: '#10B981' }} />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0F172A' }} data-translate={mode === 'policy' ? 'Policymaker Login' : 'Citizen Login'}>
              {mode === 'policy' ? 'Policymaker Login' : 'Citizen Login'}
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }} data-translate="Sign in with your email and password to continue">
              Sign in with your email and password to continue
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#DC2626' }}
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="Email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  data-translate="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="Password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  data-translate="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#10B981' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span data-translate="Signing in...">Signing in...</span>
                </>
              ) : (
                <span data-translate="Sign In">Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748B' }}>
              <span data-translate="Don't have an account?">Don't have an account?</span>{' '}
              <Link to="/signup" className="font-semibold" style={{ color: '#10B981' }} data-translate="Sign up">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

