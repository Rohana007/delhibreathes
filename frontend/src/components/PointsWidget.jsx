import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getGamificationSummary } from '../services/api';
import { Award, Leaf } from 'lucide-react';

export default function PointsWidget() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchSummary = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getGamificationSummary();
        // Check if data exists and has success property
        if (data && typeof data === 'object' && data.success) {
          setSummary(data);
        } else {
          console.error('Failed to fetch gamification summary:', data?.error || data?.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching gamification summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    // Refresh every 30 seconds to keep points updated
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, [token, user]);

  // Don't show if user is not logged in
  if (!token || !user) {
    return null;
  }

  // Default to 10 GP if no summary yet
  const displayGP = summary?.gp ?? 10;
  const displayLevel = summary?.level ?? 1;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold shadow-lg transition-all cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        color: '#065f46',
        border: '2px solid #10B981',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        minWidth: '160px',
        cursor: 'pointer',
      }}
      onClick={() => {
        navigate('/green-points');
      }}
      title="Click to view Green Points details"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold" style={{ color: '#065f46' }}>Loading...</span>
        </div>
      ) : (
        <>
          <span className="text-xl">🌿</span>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" style={{ color: '#065f46' }} />
            <span className="text-base font-bold" style={{ color: '#065f46' }}>
              {displayGP} GP
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Leaf className="w-4 h-4" style={{ color: '#065f46' }} />
            <span className="text-sm font-semibold" style={{ color: '#065f46' }}>
              Lv {displayLevel}
            </span>
          </div>
        </>
      )}
    </motion.button>
  );
}


