import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, User, Briefcase, Menu, X, FileText, AlertTriangle, Info, CheckCircle, Settings, LogOut, Award, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { getRelativeTime, getAqiColor } from '../../utils/helpers';
import FeatureQuickActions from '../user/FeatureQuickActions';
import ProfileDropdown from '../ProfileDropdown/ProfileDropdown';
import PointsWidget from '../PointsWidget';
import ReportPollution from '../reports/ReportPollution';
import LanguageSwitcher from '../LanguageSwitcher';
import { getGamificationSummary } from '../../services/api';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

export default function Header() {
  const { mode, setMode, ncrAqi, lastUpdated, fetchData, loading, insights, scrollToSection, showReportModal, setShowReportModal } = useApp();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const flags = useFeatureFlags();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [gamificationSummary, setGamificationSummary] = useState(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch gamification summary
  useEffect(() => {
    if (token && user) {
      const fetchSummary = async () => {
        try {
          const result = await getGamificationSummary();
          if (result && result.success) {
            setGamificationSummary(result);
          }
        } catch (error) {
          console.error('Error fetching gamification summary:', error);
        }
      };
      fetchSummary();
      // Refresh every 30 seconds
      const interval = setInterval(fetchSummary, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const avgAqi = ncrAqi?.summary?.averageAqi;
  
  const getAlertCount = () => {
    if (!avgAqi) return 0;
    if (avgAqi > 300) return 3;
    if (avgAqi > 200) return 2;
    if (avgAqi > 150) return 1;
    return 0;
  };

  const alertCount = getAlertCount();

  const aqiColor = avgAqi ? getAqiColor(avgAqi) : (theme === 'dark' ? '#E8EEF5' : '#0F172A');

  // Get notifications from insights
  const getNotifications = () => {
    const notifications = [];
    
    // AQI-based notifications
    if (avgAqi) {
      if (avgAqi > 300) {
        notifications.push({
          id: 'aqi-emergency',
          type: 'emergency',
          title: 'Emergency Air Quality Alert',
          titleKey: 'emergency_air_quality_alert',
          message: `AQI has reached hazardous levels (${avgAqi}). All outdoor activities should be avoided.`,
          messageKey: 'aqi_hazardous_levels',
          time: lastUpdated,
          priority: 1,
        });
      } else if (avgAqi > 200) {
        notifications.push({
          id: 'aqi-very-unhealthy',
          type: 'alert',
          title: 'Very Unhealthy Air Quality',
          titleKey: 'very_unhealthy_air_quality',
          message: `Air quality is very poor (AQI: ${avgAqi}). Everyone should limit outdoor exposure.`,
          messageKey: 'air_quality_very_poor',
          time: lastUpdated,
          priority: 2,
        });
      } else if (avgAqi > 150) {
        notifications.push({
          id: 'aqi-unhealthy',
          type: 'warning',
          title: 'Unhealthy for Sensitive Groups',
          titleKey: 'unhealthy_sensitive_groups',
          message: `AQI is ${avgAqi}. Children, elderly, and those with respiratory conditions should limit outdoor activities.`,
          messageKey: 'aqi_sensitive_groups_warning',
          time: lastUpdated,
          priority: 3,
        });
      }
    }

    // Add warnings from insights
    if (insights?.warnings) {
      insights.warnings.forEach((warning, index) => {
        notifications.push({
          id: `warning-${index}`,
          type: warning.type || 'info',
          title: warning.title || 'Air Quality Alert',
          message: warning.message || '',
          time: lastUpdated,
          priority: warning.priority || 4,
        });
      });
    }

    // Sort by priority
    return notifications.sort((a, b) => a.priority - b.priority);
  };

  const notifications = getNotifications();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Use CSS variables for theme-aware colors
  const headerBg = theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF';
  const headerBorder = theme === 'dark' ? 'var(--border-color)' : '#E2E8F0';
  const headerShadow = theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.08)';
  const textColor = theme === 'dark' ? 'var(--text-primary)' : '#0F172A';
  const textSecondary = theme === 'dark' ? 'var(--text-secondary)' : '#475569';
  const textSubtle = theme === 'dark' ? 'var(--text-subtle)' : '#64748B';
  const iconColor = theme === 'dark' ? 'var(--icon-default)' : '#334155';
  const hoverBg = theme === 'dark' ? 'var(--bg-secondary)' : '#F1F5F9';
  const cardBg = theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF';
  const borderColor = theme === 'dark' ? 'var(--border-color)' : '#E2E8F0';

  return (
    <motion.header 
      className="sticky top-0 z-50 border-b transition-colors backdrop-blur-md" 
      style={{ 
        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: headerBorder, 
        boxShadow: headerShadow,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: hoverBg }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img 
                src="/new_logo.png" 
                alt="Delhi Breathes Logo" 
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-lg" style={{ color: theme === 'dark' ? '#10B981' : '#15803D' }} data-translate="DELHI BREATHES">
                DELHI BREATHES
              </h1>
              <p className="text-[10px] -mt-1" style={{ color: textSubtle }} data-translate="Real-Time Air Intelligence">
                Real-Time Air Intelligence
              </p>
            </div>
          </div>

          {/* Live AQI Badge - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {avgAqi && (
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full border"
                style={{ 
                  backgroundColor: cardBg,
                  borderColor: borderColor, 
                  boxShadow: theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.08)'
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ backgroundColor: aqiColor }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: aqiColor }}></span>
                </span>
                <span className="text-sm" style={{ color: textSecondary }} data-translate="NCR Avg:">
                  NCR Avg:
                </span>
                <span 
                  className="font-display font-bold text-lg"
                  style={{ color: aqiColor }}
                >
                  {avgAqi}
                </span>
                <span className="text-xs" style={{ color: textSubtle }} data-translate="AQI">
                  AQI
                </span>
              </motion.div>
            )}

            {lastUpdated && (
              <div className="text-xs" style={{ color: textSubtle }}>
                <span data-translate="Updated">Updated</span> {getRelativeTime(lastUpdated)}
              </div>
            )}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="refresh-btn"
              title="Refresh data"
              data-translate="Refresh data"
            >
              <RotateCcw size={20} />
            </button>

            {/* Language Switcher - Disabled for Round 2 */}
            {flags.showLanguage && <LanguageSwitcher iconColor={iconColor} hoverBg={hoverBg} />}

            {/* Alerts - Notification Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="nav-icon relative p-2 rounded-lg transition-colors"
                style={{ color: iconColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-medium" style={{ backgroundColor: '#DC2626' }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notificationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl border z-50"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: borderColor,
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <div className="p-3 border-b" style={{ borderColor: borderColor }}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm" style={{ color: textColor }}>
                          <span data-translate="Notifications">Notifications</span> ({notifications.length})
                        </h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => setNotificationDropdownOpen(false)}
                            className="text-xs"
                            style={{ color: textSubtle }}
                            data-translate="Close"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2" style={{ color: textSubtle }} />
                          <p className="text-sm" style={{ color: textSubtle }} data-translate="No notifications">
                            No notifications
                          </p>
                          <p className="text-xs mt-1" style={{ color: textSubtle }} data-translate="Air quality is within safe limits">
                            Air quality is within safe limits
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const getNotificationIcon = () => {
                            switch (notification.type) {
                              case 'emergency':
                                return <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />;
                              case 'alert':
                                return <AlertTriangle className="w-5 h-5" style={{ color: '#F97316' }} />;
                              case 'warning':
                                return <AlertTriangle className="w-5 h-5" style={{ color: '#FBBF24' }} />;
                              default:
                                return <Info className="w-5 h-5" style={{ color: '#2563EB' }} />;
                            }
                          };

                          const getNotificationBg = () => {
                            switch (notification.type) {
                              case 'emergency':
                                return 'rgba(220, 38, 38, 0.08)';
                              case 'alert':
                                return 'rgba(249, 115, 22, 0.08)';
                              case 'warning':
                                return 'rgba(251, 191, 36, 0.08)';
                              default:
                                return 'rgba(37, 99, 235, 0.08)';
                            }
                          };

                          return (
                            <div
                              key={notification.id}
                              className="p-3 border-b transition-colors hover:bg-opacity-50"
                              style={{
                                borderColor: borderColor,
                                backgroundColor: getNotificationBg(),
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getNotificationIcon()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm mb-1" style={{ color: textColor }} data-translate={notification.titleKey || undefined}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-xs mb-2" style={{ color: textSecondary }} data-translate={notification.messageKey || undefined}>
                                    {notification.message}
                                  </p>
                                  {notification.time && (
                                    <p className="text-xs" style={{ color: textSubtle }}>
                                      {getRelativeTime(notification.time)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* My Reports Button */}
            <div className={!flags.showMyReports ? 'hidden-feature' : ''}>
              <button
                onClick={() => navigate('/my-reports')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  location.pathname === '/my-reports' ? 'chip active' : 'btn-ghost'
                }`}
                title="View my reports"
                data-translate="View my reports"
              >
                <FileText className="w-4 h-4" />
                <span data-translate="My Reports">My Reports</span>
              </button>
            </div>



            {/* Validation Link */}
            <Link
              to="/validation"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                location.pathname === '/validation' ? 'chip active' : 'btn-ghost'
              }`}
              title="Validation"
              data-translate="Validation"
            >
              <CheckCircle className="w-4 h-4" />
              <span data-translate="Validation">Validation</span>
            </Link>

            {/* Profile Dropdown */}
            {token && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{ color: iconColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-semibold" style={{ color: textColor }}>
                    {user.name}
                  </span>
                </button>

                <ProfileDropdown
                  isOpen={profileDropdownOpen}
                  onClose={() => setProfileDropdownOpen(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => navigate('/start')}
                className="px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: '#10B981' }}
                data-translate="Login"
              >
                Login
              </button>
            )}

            {/* Mode Toggle */}
            <div className="flex items-center rounded-lg p-1 border" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
              <button
                onClick={() => setMode('user')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'user' ? 'chip active' : 'chip'
                }`}
              >
                <User className="w-4 h-4" />
                <span data-translate="User">User</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: textColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Feature Quick Actions Row - Desktop */}
        <div className="hidden md:block border-t" style={{ borderColor: borderColor }}>
          <div className="py-3 flex items-center justify-center">
            <FeatureQuickActions scrollToSection={scrollToSection} />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t"
            style={{ borderColor: borderColor }}
          >
            {/* Live AQI */}
            {avgAqi && (
              <div className="flex items-center justify-between px-2 py-3 mb-3 rounded-lg glass-card">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: aqiColor }}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: aqiColor }}></span>
                  </span>
                  <span className="text-sm" style={{ color: textColor }} data-translate="NCR Average:">
                    NCR Average:
                  </span>
                </div>
                <span 
                  className="font-display font-bold text-xl"
                  style={{ color: aqiColor }}
                >
                  {avgAqi} AQI
                </span>
              </div>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setMode('user'); setMobileMenuOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  mode === 'user' ? 'chip active' : 'chip'
                }`}
              >
                <User className="w-4 h-4" />
                <span data-translate="User Mode">User Mode</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { fetchData(); setMobileMenuOpen(false); }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg disabled:opacity-50 btn-ghost"
              >
                <RotateCcw 
                  className={`refresh-icon ${loading ? 'animate-spin' : ''}`}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    transition: 'transform 0.2s ease'
                  }} 
                />
                <span data-translate="Refresh">Refresh</span>
              </button>
              <button 
                onClick={() => {
                  setNotificationDropdownOpen(!notificationDropdownOpen);
                  setMobileMenuOpen(false);
                }}
                className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg btn-ghost"
              >
                <Bell className="w-4 h-4" />
                <span data-translate="Alerts">Alerts</span>
                {notifications.length > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-medium" style={{ backgroundColor: '#DC2626' }}>
                    {notifications.length}
                  </span>
                )}
              </button>
              <div className={!flags.showMyReports ? 'hidden-feature' : ''}>
                <button
                  onClick={() => { navigate('/my-reports'); setMobileMenuOpen(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
                    location.pathname === '/my-reports' ? 'chip active' : 'btn-ghost'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span data-translate="My Reports">My Reports</span>
                </button>
              </div>
            </div>


            {lastUpdated && (
              <p className="text-xs text-center mt-3" style={{ color: textSubtle }}>
                <span data-translate="Last updated">Last updated</span> {getRelativeTime(lastUpdated)}
              </p>
            )}
          </motion.div>
        )}
      </div>
      
    </motion.header>
  );
}

// Render Report Pollution Modal outside header to avoid z-index issues
export function ReportPollutionModal() {
  const { showReportModal, setShowReportModal } = useApp();
  
  if (!showReportModal) return null;
  
  return (
    <ReportPollution onClose={() => setShowReportModal(false)} />
  );
}

