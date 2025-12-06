import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import AchievementBadge from '../components/AchievementBadge';
import { getAllAchievements, getUnlockedAchievements } from '../utils/achievementsEngine';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState([]);
  const [all, setAll] = useState([]);

  useEffect(() => {
    setAll(getAllAchievements());
    setUnlocked(getUnlockedAchievements());
  }, []);

  const unlockedIds = new Set(unlocked.map((a) => a.id));

  const unlockedList = all.filter((a) => unlockedIds.has(a.id));
  const lockedList = all.filter((a) => !unlockedIds.has(a.id));

  const total = all.length;
  const unlockedCount = unlockedList.length;
  const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
              <Trophy className="w-8 h-8" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#0F172A' }}>
                🏆 My Achievements
              </h1>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Your journey towards a cleaner Delhi
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full md:w-72 mt-4 md:mt-0">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#64748B' }}>
              <span>{unlockedCount} / {total} unlocked</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${percent}%`,
                  background: 'linear-gradient(135deg, #22c55e, #86efac)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Unlocked Achievements */}
        {unlockedCount === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0F172A' }}>
              No Achievements Yet
            </h2>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Start reporting pollution, checking AQI and using safe routes to unlock badges.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
              style={{ backgroundColor: '#2563EB' }}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#111827' }}>
              Unlocked Achievements
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedList.map((ach) => (
                <AchievementBadge key={ach.id} achievement={ach} locked={false} />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedList.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#111827' }}>
              Locked Achievements
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
              {lockedList.map((ach) => (
                <AchievementBadge key={ach.id} achievement={ach} locked={true} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

