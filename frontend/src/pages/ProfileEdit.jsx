import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfile, updateProfile } from '../services/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function ProfileEdit() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
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
          const result = await getProfile();
          // Check if result exists and has success property
          if (result && typeof result === 'object' && result.success && result.user) {
            setProfile(result.user);
            setName(result.user.name || '');
            setPhotoPreview(result.user.profilePhoto);
          } else {
            setError(result?.error || result?.message || 'Failed to load profile');
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const result = await updateProfile({ name, photo });
      // Check if result exists and has success property
      if (result && typeof result === 'object' && result.success && result.user) {
        setSuccess('Profile updated successfully!');
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        // Redirect to profile page after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setError(result?.error || result?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#10B981' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
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
              Edit Profile
            </h1>

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

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981' }}
              >
                <CheckCircle className="w-4 h-4" />
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-4"
                      style={{ borderColor: '#10B981' }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      {name.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                      style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}
                    >
                      <Camera className="w-4 h-4" />
                      {photo ? 'Change Photo' : 'Upload Photo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              {profile && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 rounded-lg border"
                      style={{ borderColor: '#E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                    Email cannot be changed
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-lg font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#10B981' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

