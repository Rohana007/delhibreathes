import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Activity, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getGamificationSummary } from '../services/api';
import { getHistory } from '../utils/pointsEngine';
import RewardsBadges from '../components/RewardsBadges/RewardsBadges';

const LEVEL_SIZE = 100; // Match backend level calculation

export default function GreenPointsPage() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState({ level: 1, current: 0, next: 100, percent: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!token || !user) {
        navigate('/login');
        return;
      }

      const fetchData = async () => {
        setLoading(true);
        try {
          // Get latest gamification data from backend
          const gamificationResult = await getGamificationSummary();
          if (gamificationResult.success) {
            const gp = gamificationResult.gp || 0;
            const userLevel = gamificationResult.level || 1;
            const totalPoints = gamificationResult.total_points || 0;
            
            setPoints(gp);
            setLevel(userLevel);
            
            // Calculate progress to next level
            const current = totalPoints % LEVEL_SIZE;
            const next = LEVEL_SIZE;
            const percent = (current / next) * 100;
            
            setProgress({ 
              level: userLevel, 
              current, 
              next, 
              percent 
            });
          } else {
            // Fallback to 0 if API fails
            setPoints(0);
            setLevel(1);
            setProgress({ level: 1, current: 0, next: LEVEL_SIZE, percent: 0 });
          }
          
          // History can still come from localStorage for now
          setHistory(getHistory().slice().reverse()); // newest first
        } catch (error) {
          console.error('Error fetching gamification data:', error);
          // Fallback to 0 if error
          setPoints(0);
          setLevel(1);
          setProgress({ level: 1, current: 0, next: LEVEL_SIZE, percent: 0 });
          setHistory(getHistory().slice().reverse());
        } finally {
          setLoading(false);
        }
      };

      fetchData();
      
      // Refresh data every 30 seconds to keep it updated
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, token, user, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#10B981' }} />
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#ECFDF5' }}>
            <Leaf className="w-8 h-8" style={{ color: '#16A34A' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#0F172A' }}>
              💚 Green Points
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Track your climate-positive actions
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div
          className="mb-8 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)',
            boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase mb-1" style={{ color: '#16A34A' }}>
                Total Green Points
              </div>
              <div className="text-4xl font-bold" style={{ color: '#0F172A' }}>
                {points}
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: '#16A34A' }}>
                Green Points
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#64748B' }}>
                <span>Level {progress.level}</span>
                <span>
                  {progress.current} / {progress.next} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/70 overflow-hidden">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${progress.percent}%`,
                    background: 'linear-gradient(135deg, #22c55e, #4ade80)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Badges and Rewards */}
        <section className="mb-8">
          <RewardsBadges />
        </section>

        {/* How to Earn More */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#111827' }}>
            How to Earn More?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <EarnCard title="+50 for each pollution report" description="Report visible pollution sources around you." />
            <EarnCard title="+10 daily login" description="Open Delhi Breathes once every day." />
            <EarnCard title="+5 per safe route" description="Use AirShield Navigator to find low-pollution routes." />
            <EarnCard title="+15 for sharing AQI" description="Share AQI info with friends and family." />
            <EarnCard title="+100 bonus for 5 reports" description="Stay consistent and report at least 5 times." />
            <EarnCard title="+70 weekly streak" description="Log in every day for a full week." />
          </div>
        </section>

        {/* History */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} style={{ color: '#2563EB' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>
              Recent Green Activity
            </h2>
          </div>

          {history.length === 0 ? (
            <p className="text-sm" style={{ color: '#6B7280' }}>
              No activity yet. Start by reporting pollution or using safe routes.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 25).map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: '#9CA3AF' }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#111827' }}>
                        {item.label || item.type}
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(item.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: '#16A34A' }}
                  >
                    +{item.amount} GP
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function EarnCard({ title, description }) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
    >
      <div className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>
        {title}
      </div>
      <div className="text-xs" style={{ color: '#6B7280' }}>
        {description}
      </div>
    </div>
  );
}


