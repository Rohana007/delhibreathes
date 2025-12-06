import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { signup } from '../services/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(name, email, password);

      if (result.success && result.token) {
        // Store token and user data
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(result.error || result.message || 'Signup failed. Please try again.');
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0F172A' }} data-translate="Create Account">
              Create Account
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }} data-translate="Sign up to start reporting pollution">
              Sign up to start reporting pollution
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
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="Name">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  data-translate="Enter your name"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                />
              </div>
            </div>

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
                  placeholder="Enter your password (min 6 characters)"
                  data-translate="Enter your password (min 6 characters)"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="Confirm Password">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  data-translate="Confirm your password"
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
                  <span data-translate="Creating account...">Creating account...</span>
                </>
              ) : (
                <span data-translate="Sign Up">Sign Up</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748B' }}>
              <span data-translate="Already have an account?">Already have an account?</span>{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#10B981' }} data-translate="Sign in">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

