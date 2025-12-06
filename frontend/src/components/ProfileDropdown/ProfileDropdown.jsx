import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, FileText, LogOut, Award, Gift, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { getGamificationSummary } from '../../services/api';

export default function ProfileDropdown({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  // Fetch gamification summary
  useEffect(() => {
    if (isOpen && token) {
      const fetchSummary = async () => {
        try {
          setLoading(true);
          const result = await getGamificationSummary();
          // Check if result exists and has success property
          if (result && typeof result === 'object' && result.success) {
            setSummary(result);
          } else {
            console.error('Failed to fetch gamification summary:', result?.error || result?.message || 'Unknown error');
          }
        } catch (error) {
          console.error('Error fetching gamification summary:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSummary();
    }
  }, [isOpen, token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    onClose();
    navigate('/start');
    window.location.reload();
  };

  if (!user || !token) return null;

  const textColor = isDark ? '#E2E8F0' : '#0F172A';
  const textSubtle = isDark ? '#94A3B8' : '#64748B';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const hoverBg = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl border z-50"
          style={{
            background: cardBg,
            backdropFilter: 'blur(20px)',
            borderColor: borderColor,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* User Info Header */}
          <div className="p-4 border-b" style={{ borderColor: borderColor }}>
            <div className="flex items-center gap-3">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: textColor }}>
                  {user.name}
                </p>
                <p className="text-xs truncate" style={{ color: textSubtle }}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* GP and Level Display */}
            {loading ? (
              <div className="mt-3 text-xs" style={{ color: textSubtle }}>
                Loading...
              </div>
            ) : summary ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: textSubtle }}>
                      Green Points:
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#10B981' }}>
                      {summary.gp || 0}
                    </span>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                    }}
                  >
                    Level {summary.level || 1}
                  </div>
                </div>

                {/* Badges Preview */}
                {summary.badges && summary.badges.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Award className="w-3 h-3" style={{ color: '#FBBF24' }} />
                    <div className="flex gap-1">
                      {summary.badges.slice(0, 3).map((badge, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center text-xs"
                          style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)' }}
                          title={badge}
                        >
                          🏆
                        </div>
                      ))}
                      {summary.badges.length > 3 && (
                        <span className="text-xs" style={{ color: textSubtle }}>
                          +{summary.badges.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Rewards Preview */}
                {summary.rewards && summary.rewards.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Gift className="w-3 h-3" style={{ color: '#8B5CF6' }} />
                    <div className="flex gap-1">
                      {summary.rewards.slice(0, 3).map((reward, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs"
                          style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
                          title={reward}
                        >
                          🎁
                        </div>
                      ))}
                      {summary.rewards.length > 3 && (
                        <span className="text-xs" style={{ color: textSubtle }}>
                          +{summary.rewards.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: '#10B981' }} />
                <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                  {user.greenPoints || 0} Green Points
                </span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: textColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <User className="w-4 h-4" />
              View Profile
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/profile/edit');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: textColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/my-reports');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: textColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FileText className="w-4 h-4" />
              My Reports
            </button>
            <div className="border-t my-1" style={{ borderColor: borderColor }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#DC2626' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

