import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getProfile, updateProfile } from '../../services/api';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PolicyProfileEdit() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        navigate('/policy-login');
        return;
      }

      const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
          const result = await getProfile();
          // Check if result exists and has success property
          if (result && result.success && result.user) {
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

  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(
      `${API_BASE}/auth/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password fields if password change is attempted
    const isChangingPassword = currentPassword || newPassword || confirmPassword;
    if (isChangingPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('All password fields are required to change password');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
    }

    setSaving(true);

    try {
      // Update profile (name and photo)
      const profileData = { name };
      if (photo) {
        profileData.photo = photo;
      }

      const profileResult = await updateProfile(profileData);
      
      if (!profileResult.success) {
        setError(profileResult.error || 'Failed to update profile');
        setSaving(false);
        return;
      }

      // Change password if provided
      if (isChangingPassword) {
        try {
          const passwordResult = await changePassword(currentPassword, newPassword);
          if (!passwordResult.success) {
            setError(passwordResult.error || 'Failed to change password');
            setSaving(false);
            return;
          }
        } catch (err) {
          setError(err.response?.data?.error || err.message || 'Failed to change password');
          setSaving(false);
          return;
        }
      }

      setSuccess('Profile updated successfully!');
      // Update localStorage
      if (profileResult.user) {
        localStorage.setItem('user', JSON.stringify(profileResult.user));
      }
      // Redirect to profile page after a short delay
      setTimeout(() => {
        navigate('/policy-dashboard/profile');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-6 md:p-8"
        style={{ borderColor: '#E2E8F0' }}
      >
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
                      style={{ borderColor: '#3B82F6' }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      {name.charAt(0).toUpperCase() || 'P'}
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

              {/* Password Change Section */}
              <div className="pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
                  Change Password
                </h2>
                <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                  Leave blank if you don't want to change your password
                </p>

                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border"
                      style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: '#64748B' }}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border"
                      style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: '#64748B' }}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border"
                      style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: '#64748B' }}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-lg font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#3B82F6' }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#2563EB')}
                  onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#3B82F6')}
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
                  onClick={() => navigate('/policy-dashboard/profile')}
                  className="px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
    </div>
  );
}

