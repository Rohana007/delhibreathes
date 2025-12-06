import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Award, Calendar, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfile, getGamificationSummary } from '../services/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import RewardsBadges from '../components/RewardsBadges/RewardsBadges';

export default function Profile() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [gamificationSummary, setGamificationSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        navigate('/login');
        return;
      }

      const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
          // Fetch both profile and gamification data in parallel
          const [profileResult, gamificationResult] = await Promise.all([
            getProfile(),
            getGamificationSummary().catch(err => {
              console.error('Error fetching gamification summary:', err);
              return { success: false, gp: 0, level: 1 };
            })
          ]);

          // Check if profileResult exists and has success property
          if (profileResult && typeof profileResult === 'object' && profileResult.success && profileResult.user) {
            setProfile(profileResult.user);
          } else {
            setError(profileResult?.error || profileResult?.message || 'Failed to load profile');
          }

          // Check if gamificationResult exists and has success property
          if (gamificationResult && typeof gamificationResult === 'object' && gamificationResult.success) {
            setGamificationSummary(gamificationResult);
          }
        } catch (err) {
          setError(err.message || 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [authUser, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#10B981' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#DC2626' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: '#DC2626' }}>Error</p>
            <p style={{ color: '#64748B' }}>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
              style={{
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-3xl font-bold mb-6" style={{ color: '#0F172A' }}>
              My Profile
            </h1>

            {profile && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover border-4"
                      style={{ borderColor: '#10B981' }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>
                      {profile.name}
                    </h2>
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="px-4 py-2 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                    <Mail className="w-5 h-5" style={{ color: '#64748B' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Email</p>
                      <p style={{ color: '#0F172A' }}>{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                    <Award className="w-5 h-5" style={{ color: '#10B981' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Green Points</p>
                      <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                        {gamificationSummary?.gp ?? profile?.greenPoints ?? 10}
                      </p>
                      {gamificationSummary?.level && (
                        <p className="text-xs font-semibold mt-1" style={{ color: '#2563EB' }}>
                          Level {gamificationSummary.level}
                        </p>
                      )}
                    </div>
                  </div>

                  {profile.region && (
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                      <User className="w-5 h-5" style={{ color: '#64748B' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Region</p>
                        <p style={{ color: '#0F172A' }}>{profile.region}</p>
                      </div>
                    </div>
                  )}

                  {profile.createdAt && (
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                      <Calendar className="w-5 h-5" style={{ color: '#64748B' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Member Since</p>
                        <p style={{ color: '#0F172A' }}>
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Badges and Rewards Section */}
            <div className="mt-8">
              <RewardsBadges />
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

