import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Loader2, AlertCircle, ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getProfile } from '../../services/api';

export default function PolicyProfile() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        navigate('/policy-login');
        return;
      }

      const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
          const result = await getProfile();
          console.log('Profile fetch result:', result);
          // Check if result exists and has success property
          if (result && typeof result === 'object' && result.success && result.user) {
            setProfile(result.user);
          } else if (result && typeof result === 'object') {
            // Result exists but doesn't have success or user
            setError(result.error || result.message || 'Failed to load profile');
          } else {
            // Result is undefined or null
            setError('Failed to load profile. Please try again.');
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError(err.message || 'An error occurred while loading profile');
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#DC2626' }} />
          <p className="text-lg font-semibold mb-2" style={{ color: '#DC2626' }}>Error</p>
          <p style={{ color: '#64748B' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-6 md:p-8"
        style={{ borderColor: '#E2E8F0' }}
      >

            <h1 className="text-3xl font-bold mb-6" style={{ color: '#0F172A' }}>
              My Profile
            </h1>

            {!profile && !error && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#3B82F6' }} />
                <p style={{ color: '#64748B' }}>Loading profile...</p>
              </div>
            )}

            {profile && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover border-4"
                      style={{ borderColor: '#3B82F6' }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      {profile.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>
                      {profile.name}
                    </h2>
                    <button
                      onClick={() => navigate('/policy-dashboard/profile/edit')}
                      className="px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2"
                      style={{ backgroundColor: '#3B82F6' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                    >
                      <Settings className="w-4 h-4" />
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
          </motion.div>
    </div>
  );
}

