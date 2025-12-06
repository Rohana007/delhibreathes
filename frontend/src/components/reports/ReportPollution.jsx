import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, MapPin, Send, X, AlertTriangle, CheckCircle, 
  Loader2, Navigation, FileText
} from 'lucide-react';
import ReportBloomPopup from '../ReportBloomPopup';
import { submitReport } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { REPORT_CATEGORIES } from '../../utils/helpers';
import { recordReportSubmitted } from '../../utils/pointsEngine';
import { checkAchievements } from '../../utils/achievementsEngine';

export default function ReportPollution({ onClose }) {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  
  // Step management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locating, setLocating] = useState(false);
  
  // Success - Bloom Popup
  const [showBloomPopup, setShowBloomPopup] = useState(false);
  const [reportId, setReportId] = useState('');
  const [unlockedAchievement, setUnlockedAchievement] = useState(null);

  const fileInputRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/login');
      onClose();
    }
  }, [authLoading, token, navigate, onClose]);

  // FIX: Reverse geocoding using Google Maps Geocoding API
  async function reverseGeocode(lat, lng) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Using coordinates as fallback.');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return "Location unavailable";
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // Get location
  const getCurrentLocation = () => {
    setLocating(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          
          // FIX: Use Google Maps Geocoding API for reverse geocoding
          try {
            const formattedAddress = await reverseGeocode(latitude, longitude);
            setAddress(formattedAddress);
          } catch (error) {
            console.error('Error getting address:', error);
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          
          setLocating(false);
        },
        (error) => {
          setError('Unable to get location. Please enable location services.');
          setLocating(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };

  // Step 3: Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > 3) {
      setError('Maximum 3 images allowed');
      return;
    }

    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Submit report
  const handleSubmit = async () => {
    if (!category || !description || !location) {
      setError('Please fill all required fields');
      return;
    }

    if (!token) {
      setError('Please login to submit a report');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get address from location
      const locationString = address || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;
      
      // FIX: Include user profile info and idempotency key
      const idempotencyKey = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const profileEmail = user?.email || null;
      const profileName = user?.name || null;
      
      const reportData = {
        category,
        description,
        location: locationString,
        photo: images.length > 0 ? images[0] : null, // Use first image as photo
        profile_email: profileEmail, // Optional - backend will fetch if missing
        profile_name: profileName,   // Optional - backend will fetch if missing
        idempotency_key: idempotencyKey, // Prevent duplicate submissions
      };

      const response = await submitReport(reportData);
      if (response.success) {
        setReportId(response.reportId || response.data?.reportId || 'N/A');

        // Points & achievements
        recordReportSubmitted();
        const newlyUnlocked = checkAchievements('report_submitted');
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          setUnlockedAchievement(newlyUnlocked[0]);
        } else {
          setUnlockedAchievement(null);
        }

        setShowBloomPopup(true);
      } else {
        setError(response.error || 'Failed to submit report');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Bloom Success Popup - Show this instead of the form when report is submitted
  if (showBloomPopup) {
    return (
      <ReportBloomPopup
        visible={showBloomPopup}
        onClose={() => {
          setShowBloomPopup(false);
          onClose();
        }}
        onViewReports={() => {
          setShowBloomPopup(false);
          navigate('/my-reports');
        }}
        achievement={unlockedAchievement}
      />
    );
  }

  // Show loading if checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#10B981' }} />
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!token || !user) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="glass-card w-full max-w-lg max-h-[90vh] overflow-hidden"
          style={{
            zIndex: 10000,
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0', backgroundColor: 'rgba(220, 38, 38, 0.08)' }}>
            <div>
              <h2 className="text-lg font-display font-bold" style={{ color: '#DC2626' }} data-translate="Report Pollution">
                Report Pollution
              </h2>
              <p className="text-xs" style={{ color: '#475569' }} data-translate="Help improve air quality monitoring">Help improve air quality monitoring</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#64748B' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[60vh]" style={{ backgroundColor: '#FFFFFF' }}>
            {error && (
              <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' }}>
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Report Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5" style={{ color: '#2563EB' }} />
                <h3 className="font-semibold" style={{ color: '#0F172A' }} data-translate="Report Details">Report Details</h3>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }} data-translate="Type of Pollution *">Type of Pollution *</label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                        category === cat.id ? 'border-[#2563EB]' : ''
                      }`}
                      style={{
                        backgroundColor: category === cat.id ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                        borderColor: category === cat.id ? '#2563EB' : '#E2E8F0',
                        color: '#0F172A',
                      }}
                    >
                      <span className="text-lg mr-2">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }} data-translate="Location *">Location *</label>
                <button
                  onClick={getCurrentLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors"
                  style={{ borderColor: '#E2E8F0' }}
                >
                  {locating ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#2563EB' }} />
                  ) : (
                    <Navigation className="w-5 h-5" style={{ color: '#2563EB' }} />
                  )}
                  <span style={{ color: '#0F172A' }} data-translate={location ? 'Location captured' : 'Get Current Location'}>
                    {location ? 'Location captured' : 'Get Current Location'}
                  </span>
                </button>
                {address && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#64748B' }}>
                    <MapPin className="w-3 h-3" /> {address.slice(0, 60)}...
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }} data-translate="Description *">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you observed..."
                  data-translate="Describe what you observed..."
                  rows={3}
                  className="input-field resize-none"
                  maxLength={500}
                />
                <p className="text-xs mt-1" style={{ color: '#64748B' }}>{description.length}/500</p>
              </div>

              {/* Images */}
              <div>
                <label className="text-sm mb-2 block font-semibold" style={{ color: '#0F172A' }} data-translate="Photos (optional, max 3)">Photos (optional, max 3)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 flex items-center justify-center rounded-lg border-2 border-dashed"
                      style={{ borderColor: '#E2E8F0' }}
                    >
                      <Camera className="w-6 h-6" style={{ color: '#64748B' }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t flex items-center justify-end" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <button
                onClick={handleSubmit}
                disabled={loading || !category || !description || !location}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span data-translate="Submit Report">Submit Report</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
