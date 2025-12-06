import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Floating animation keyframes
const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export default function StartPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleUserLogin = () => {
    navigate('/login?mode=user');
  };

  const handlePolicyLogin = () => {
    navigate('/policy-login');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)'
          : 'linear-gradient(135deg, #E0F2FE 0%, #B3E5FC 50%, #81D4FA 100%)',
      }}
    >
      {/* Animated background particles/glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
            animation: 'pulse 5s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}
            data-translate="Delhi Breathes"
          >
            Delhi Breathes
          </h1>
          <p 
            className="text-lg md:text-xl"
            style={{ color: isDark ? '#94A3B8' : '#475569' }}
            data-translate="Real-Time Air Intelligence Platform"
          >
            Real-Time Air Intelligence Platform
          </p>
        </motion.div>

        {/* Login Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* User Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
            transition={{ 
              opacity: { duration: 0.6, delay: 0.2 },
              x: { duration: 0.6, delay: 0.2 },
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="p-8 rounded-2xl shadow-2xl cursor-pointer transition-all"
              style={{
                background: isDark
                  ? 'rgba(15, 23, 42, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)'}`,
                boxShadow: isDark
                  ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 40px rgba(16, 185, 129, 0.1)',
              }}
              onClick={handleUserLogin}
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                  }}
                >
                  <User className="w-10 h-10" style={{ color: '#10B981' }} />
                </div>
              </div>

              {/* Title */}
              <h2
                className="text-2xl font-bold text-center mb-3"
                style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}
                data-translate="Citizen Login"
              >
                Citizen Login
              </h2>

              {/* Description */}
              <p
                className="text-center mb-6 text-sm leading-relaxed"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                data-translate="Login with your email and password to access real-time air quality data, personalized health recommendations, and pollution reports."
              >
                Login with your email and password to access real-time air quality data, personalized health recommendations, and pollution reports.
              </p>

              {/* Button */}
              <button
                className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <span data-translate="Continue">Continue</span>
                <ArrowRight className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            </motion.div>
          </motion.div>

          {/* Policymaker Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="p-8 rounded-2xl shadow-2xl cursor-pointer transition-all"
              style={{
                background: isDark
                  ? 'rgba(15, 23, 42, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)'}`,
                boxShadow: isDark
                  ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.1)'
                  : '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 40px rgba(59, 130, 246, 0.1)',
              }}
              onClick={handlePolicyLogin}
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  }}
                >
                  <Briefcase className="w-10 h-10" style={{ color: '#3B82F6' }} />
                </div>
              </div>

              {/* Title */}
              <h2
                className="text-2xl font-bold text-center mb-3"
                style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}
                data-translate="Policymaker Login"
              >
                Policymaker Login
              </h2>

              {/* Description */}
              <p
                className="text-center mb-6 text-sm leading-relaxed"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                data-translate="Login with your email and password to access advanced analytics, hotspot management, policy simulation tools, and comprehensive air quality reports."
              >
                Login with your email and password to access advanced analytics, hotspot management, policy simulation tools, and comprehensive air quality reports.
              </p>

              {/* Button */}
              <button
                className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                <span data-translate="Continue">Continue</span>
                <ArrowRight className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Add CSS animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

