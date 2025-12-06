import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Calendar, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getMyReports } from '../services/api';
import { formatDateTime, REPORT_CATEGORIES } from '../utils/helpers';

const CATEGORY_LABELS = {
  pollution: 'General Pollution',
  burning: 'Waste/Stubble Burning',
  construction: 'Construction Dust',
  industrial: 'Industrial Emission',
  traffic: 'Vehicle Pollution',
  other: 'Other',
};

const CATEGORY_ICONS = {
  pollution: '💨',
  burning: '🔥',
  construction: '🏗️',
  industrial: '🏭',
  traffic: '🚗',
  other: '📍',
};


export default function MyReports() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/login');
    }
  }, [authLoading, token, navigate]);

  // Load reports
  useEffect(() => {
    if (token && !authLoading) {
      loadReports();
    }
  }, [token, authLoading]);

  // Refetch reports when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token && !authLoading) {
        loadReports();
      }
    };

    const handleFocus = () => {
      if (token && !authLoading) {
        loadReports();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, authLoading]);

  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMyReports();
      if (response.success) {
        setReports(response.reports || []);
      } else {
        setError(response.error || 'Failed to load reports');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || (loading && reports.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#2563EB' }} />
          <p className="text-sm" style={{ color: '#64748B' }} data-translate="Loading your reports...">Loading your reports...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6 transition-colors"
          style={{ 
            color: '#64748B',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <ArrowLeft size={20} />
          <span className="font-medium" data-translate="Back to Dashboard">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2" style={{ color: '#0F172A' }} data-translate="My Reports">
              My Reports
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }} data-translate="View and track all your pollution reports">
              View and track all your pollution reports
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
            <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && reports.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2563EB' }} />
            <span className="ml-3 text-sm" style={{ color: '#64748B' }} data-translate="Loading reports...">Loading reports...</span>
          </div>
        )}

        {/* Reports List */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4 mb-8">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
                      {CATEGORY_ICONS[report.category] || '📍'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1" style={{ color: '#0F172A' }}>
                        {CATEGORY_LABELS[report.category] || report.category || 'Pollution Report'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#64748B' }}>
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(new Date(report.createdAt))}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ 
                    backgroundColor: report.status === 'Reviewed' ? 'rgba(22, 163, 74, 0.08)' : 
                                    report.status === 'Action Taken' ? 'rgba(37, 99, 235, 0.08)' : 
                                    'rgba(245, 158, 11, 0.08)',
                    color: report.status === 'Reviewed' ? '#16A34A' : 
                           report.status === 'Action Taken' ? '#2563EB' : 
                           '#F59E0B'
                  }}>
                    {report.status || 'Pending'}
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: '#475569' }}>
                  {report.description}
                </p>

                {report.location && (
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#64748B' }}>
                    <MapPin className="w-3 h-3" />
                    {report.location}
                  </div>
                )}

                {report.photo && (
                  <div className="mt-4">
                    <img 
                      src={report.photo} 
                      alt="Report" 
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#94A3B8' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="No reports yet">
              No reports yet
            </h3>
            <p className="text-sm" style={{ color: '#64748B' }} data-translate="You haven't submitted any pollution reports yet.">
              You haven't submitted any pollution reports yet.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

