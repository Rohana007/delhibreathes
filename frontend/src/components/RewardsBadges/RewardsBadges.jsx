import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Gift, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { getGamificationSummary } from '../../services/api';

// Badge definitions - matching gamification engine
const BADGE_DEFINITIONS = {
  NEW_USER: { name: 'New User', description: 'Welcome to Delhi Breathes!', icon: '🌱' },
  FIRST_REPORT: { name: 'First Report', description: 'Submitted your first pollution report', icon: '📝' },
  AIR_WARRIOR: { name: 'Air Warrior', description: 'Completed 10 clean routes', icon: '🗺️' },
  GREEN_GUARDIAN: { name: 'Green Guardian', description: '5 verified pollution reports', icon: '🛡️' },
  SMOKELESS_HERO: { name: 'Smokeless Hero', description: '7-day red-zone avoidance streak', icon: '🦸' },
  ECO_TRAVELLER: { name: 'Eco Traveller', description: '20 public transport days', icon: '🚌' },
  DATA_CONTRIBUTOR: { name: 'Data Contributor', description: '50 events logged', icon: '📊' },
  ECO_HERO: { name: 'Eco Hero', description: 'Reached level 5', icon: '🦸' },
};

// Reward definitions - matching gamification engine
const REWARD_DEFINITIONS = {
  METRO10: { name: 'Metro 10% Discount', description: '10% discount on metro ride (200 GP)', icon: '🚇' },
  BUSPASS_DAY: { name: 'DTC Day Pass', description: '1-day bus pass (150 GP)', icon: '🚌' },
  HEALTHCHK_DISCOUNT: { name: 'Health Check Discount', description: 'Discount on health checkup (300 GP)', icon: '🏥' },
  HEALTHMASK: { name: 'Health Mask', description: 'Unlocked at level 4', icon: '😷' },
  GREENPASS: { name: 'Green Pass', description: 'Unlocked at level 7', icon: '🎫' },
};

export default function RewardsBadges() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [badgesData, setBadgesData] = useState([]);
  const [rewardsData, setRewardsData] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const summaryResult = await getGamificationSummary().catch(err => {
            console.error('Error fetching gamification summary:', err);
            return { success: false, badges: [], rewards: [] };
          });

          if (summaryResult && summaryResult.success) {
            // FIX: Use badges with earned property from summary
            const badges = summaryResult.badges || [];
            setBadgesData(Array.isArray(badges) ? badges : []);
            
            // FIX: Use rewards with unlocked property from summary
            const rewards = summaryResult.rewards || [];
            setRewardsData(Array.isArray(rewards) ? rewards : []);
            
            // Store current points balance for reward display
            setCurrentPoints(summaryResult.current_points_balance || summaryResult.gp || 0);
          } else {
            // Fallback: empty arrays
            setBadgesData([]);
            setRewardsData([]);
            setCurrentPoints(0);
          }
        } catch (error) {
          console.error('Error fetching badges/rewards:', error);
          setBadgesData([]);
          setRewardsData([]);
          setCurrentPoints(0);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [token]);

  const textColor = isDark ? '#E2E8F0' : '#0F172A';
  const textSubtle = isDark ? '#94A3B8' : '#64748B';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  // Get all available badges and rewards
  const allBadges = Object.keys(BADGE_DEFINITIONS);
  const allRewards = Object.keys(REWARD_DEFINITIONS);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm" style={{ color: textSubtle }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Your Badges Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" style={{ color: '#FBBF24' }} />
          <h2 className="text-xl font-bold" style={{ color: textColor }}>
            Your Badges
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allBadges.map((badgeCode) => {
            // FIX: Check earned property from backend data
            const badgeData = badgesData.find(b => b.badge_code === badgeCode || b === badgeCode);
            const isUnlocked = typeof badgeData === 'object' ? (badgeData.earned === true) : 
                              (typeof badgeData === 'string' ? badgesData.includes(badgeCode) : false);
            const badge = BADGE_DEFINITIONS[badgeCode];

            return (
              <motion.div
                key={badgeCode}
                className="badge-card p-4 rounded-xl border text-center cursor-pointer transition-all"
                style={{
                  background: isUnlocked ? cardBg : (isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.5)'),
                  borderColor: isUnlocked ? borderColor : (isDark ? '#1E293B' : '#CBD5E1'),
                  opacity: isUnlocked ? 1 : 0.5,
                  filter: isUnlocked ? 'none' : 'grayscale(100%)',
                }}
                whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
                title={badge.name}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: isUnlocked ? textColor : textSubtle }}
                >
                  {badge.name}
                </h3>
                <p className="text-xs" style={{ color: textSubtle }}>
                  {badge.description}
                </p>
                {!isUnlocked && (
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" style={{ color: textSubtle }} />
                    <span className="text-xs" style={{ color: textSubtle }}>
                      Locked
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* All Rewards Section - Show unlocked and locked */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5" style={{ color: '#8B5CF6' }} />
          <h2 className="text-xl font-bold" style={{ color: textColor }}>
            Rewards
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allRewards.map((rewardCode) => {
            // FIX: Check unlocked property from backend data
            const rewardData = rewardsData.find(r => r.reward_code === rewardCode || r === rewardCode);
            const isUnlocked = typeof rewardData === 'object' ? (rewardData.unlocked === true) : 
                              (typeof rewardData === 'string' ? rewardsData.includes(rewardCode) : false);
            const reward = REWARD_DEFINITIONS[rewardCode];
            if (!reward) return null;

            // Determine if reward is available based on points/level
            const pointsCost = typeof rewardData === 'object' ? (rewardData.points_cost || 0) : 0;
            const levelRequired = typeof rewardData === 'object' ? (rewardData.level_required || 0) : 0;
            const canAfford = pointsCost === 0 || currentPoints >= pointsCost;

            return (
              <motion.div
                key={rewardCode}
                className="reward-card p-4 rounded-xl border text-center transition-all"
                style={{
                  background: isUnlocked ? cardBg : (isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.5)'),
                  borderColor: isUnlocked ? borderColor : (isDark ? '#1E293B' : '#CBD5E1'),
                  opacity: isUnlocked ? 1 : 0.5,
                  filter: isUnlocked ? 'none' : 'grayscale(100%)',
                  boxShadow: isUnlocked ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none',
                }}
                whileHover={{ scale: isUnlocked ? 1.05 : 1.02 }}
                title={reward.name}
              >
                <div className="text-4xl mb-2">{reward.icon}</div>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: isUnlocked ? textColor : textSubtle }}
                >
                  {reward.name}
                </h3>
                <p className="text-xs" style={{ color: textSubtle }}>
                  {reward.description}
                </p>
                {!isUnlocked && (
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" style={{ color: textSubtle }} />
                    <span className="text-xs" style={{ color: textSubtle }}>
                      {pointsCost > 0 ? `Need ${pointsCost} GP` : levelRequired > 0 ? `Level ${levelRequired}` : 'Locked'}
                    </span>
                  </div>
                )}
                {isUnlocked && pointsCost > 0 && (
                  <div className="mt-2 text-xs" style={{ color: '#16A34A' }}>
                    ✓ Available
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

