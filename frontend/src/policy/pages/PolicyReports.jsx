import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, AlertCircle, Loader2, 
  ChevronLeft, ChevronRight, Filter, X, ArrowLeft, Download, CheckCircle, Clock, TrendingUp
} from 'lucide-react';
import { getReports, getReportStats, updateReportStatus } from '../../services/api';
import { adminReports } from '../../admin/api/adminApi'; // For admin-only features
import { formatDateTime } from '../../utils/helpers';
import axios from 'axios';

const CATEGORY_LABELS = {
  pollution: 'General Pollution',
  burning: 'Waste/Stubble Burning',
  construction: 'Construction Dust',
  industrial: 'Industrial Emission',
  traffic: 'Vehicle Pollution',
  other: 'Other',
};

const STATUS_OPTIONS = ['Pending', 'Reviewed', 'Action Taken'];

export default function PolicyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [exportError, setExportError] = useState('');
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState('');
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    actionTaken: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // User email cache: userId -> email
  const [userEmailCache, setUserEmailCache] = useState(new Map());
  const [loadingEmails, setLoadingEmails] = useState(new Set());
  
  // Check if user is admin (for admin-only features)
  const isAdmin = localStorage.getItem('adminToken') || localStorage.getItem('policyAccess') === 'true';
  
  // Extract unique user IDs from reports that need email lookup
  const userIds = useMemo(() => {
    const ids = new Set();
    reports.forEach(report => {
      // Only fetch if report doesn't already have email
      const hasEmail = report.email || report.userEmail;
      if (!hasEmail) {
        const userId = report.userId || report.user_id || report.user?.id || report.user?._id;
        if (userId && !userEmailCache.has(userId) && !loadingEmails.has(userId)) {
          ids.add(userId);
        }
      }
    });
    return Array.from(ids);
  }, [reports, userEmailCache, loadingEmails]);
  
  // Fetch user emails for reports that don't have email
  useEffect(() => {
    if (userIds.length === 0) return;
    
    const fetchUserEmails = async () => {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      
      // Mark as loading
      setLoadingEmails(prev => {
        const next = new Set(prev);
        userIds.forEach(id => next.add(id));
        return next;
      });
      
      // Fetch emails in parallel (limit to 10 at a time to avoid overwhelming server)
      const fetchPromises = userIds.slice(0, 10).map(async (userId) => {
        try {
          let email = null;
          
          // Try to fetch user by ID using available endpoints
          // Attempt 1: Try GET /api/user/:userId (if endpoint exists)
          try {
            const response = await axios.get(`${API_BASE}/user/${userId}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {},
              timeout: 3000,
            });
            if (response.data?.success && response.data?.user?.email) {
              email = response.data.user.email;
            } else if (response.data?.email) {
              email = response.data.email;
            } else if (response.data?.data?.email) {
              email = response.data.data.email;
            }
          } catch (err) {
            // Endpoint might not exist - that's okay, try next method
            if (err.response?.status !== 404) {
              console.log(`User endpoint attempt for ${userId}:`, err.message);
            }
          }
          
          // Attempt 2: If admin, try admin reports endpoint which might include user data
          if (!email && isAdmin) {
            try {
              // Some admin endpoints might return user info with reports
              // This is a fallback attempt
            } catch (err) {
              // Ignore
            }
          }
          
          // Update cache if email found
          if (email) {
            setUserEmailCache(prev => {
              const next = new Map(prev);
              next.set(userId, email);
              return next;
            });
          }
        } catch (error) {
          // Silently handle errors - don't break UI
          console.log(`Could not fetch email for userId ${userId}`);
        } finally {
          // Remove from loading set
          setLoadingEmails(prev => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      });
      
      await Promise.allSettled(fetchPromises);
    };
    
    fetchUserEmails();
  }, [userIds, isAdmin]);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    email: '',
    fromDate: '',
    toDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load reports first, then stats will be calculated from the response
    loadReports(1);
    // Delay stats loading slightly to avoid rate limiting
    setTimeout(() => {
      loadStats();
    }, 500);
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      // FIX: corrected reports endpoint for user-facing dashboard
      // Use public reports API to get stats - fetch first page with larger limit for stats calculation
      const response = await getReports({ limit: 1000, page: 1 });
      if (response.success) {
        const allReports = response.data?.reports || response.reports || [];
        const pagination = response.data?.pagination || response.pagination || {};
        setStats({
          total: pagination.total || allReports.length,
          pending: allReports.filter(r => (r.status || 'Pending') === 'Pending').length,
          reviewed: allReports.filter(r => r.status === 'Reviewed').length,
          actionTaken: allReports.filter(r => r.status === 'Action Taken').length,
        });
      } else {
        // FIX: prevent 0 0 0 counters if API fails - set to null to show "—"
        setStats({
          total: null,
          pending: null,
          reviewed: null,
          actionTaken: null,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // FIX: prevent 0 0 0 counters if API fails - set to null to show "—"
      setStats({
        total: null,
        pending: null,
        reviewed: null,
        actionTaken: null,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadReports = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      // FIX: corrected reports endpoint for user-facing dashboard
      // Use public reports API - no authentication required
      console.log('Loading reports with filters:', { ...filters, page, limit: 20 });
      const response = await getReports({
        ...filters,
        page,
        limit: 20,
      });

      console.log('Reports API response:', response);

      if (response && response.success) {
        const reports = response.data?.reports || response.reports || [];
        // Log first report structure for debugging
        if (reports.length > 0) {
          console.log('Sample report structure:', {
            hasEmail: !!reports[0].email,
            hasUserId: !!(reports[0].userId || reports[0].user_id),
            keys: Object.keys(reports[0]),
          });
        }
        setReports(reports);
        const paginationData = response.data?.pagination || response.pagination || { page: 1, limit: 20, total: reports.length, pages: 1 };
        setPagination(paginationData);
        setCurrentPage(page);
        // Update stats from current response
        setStats({
          total: paginationData.total || reports.length,
          pending: reports.filter(r => (r.status || 'Pending') === 'Pending').length,
          reviewed: reports.filter(r => r.status === 'Reviewed').length,
          actionTaken: reports.filter(r => r.status === 'Action Taken').length,
        });
      } else {
        // Handle error response (interceptor returns error object instead of throwing)
        const errorMsg = response?.error || response?.message || 'Failed to load reports';
        console.error('Reports API returned error:', errorMsg, response);
        setError(errorMsg);
        // FIX: prevent 0 0 0 counters if API fails - set to null to show "—"
        setStats({
          total: null,
          pending: null,
          reviewed: null,
          actionTaken: null,
        });
      }
    } catch (err) {
      console.error('Error loading reports (exception):', err);
      setError(err.response?.data?.error || err.message || 'Failed to load reports');
      // FIX: prevent 0 0 0 counters if API fails - set to null to show "—"
      setStats({
        total: null,
        pending: null,
        reviewed: null,
        actionTaken: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    setStatusUpdateSuccess('');
    setStatusUpdateError('');
    try {
      // Use public endpoint (for policy makers)
      const response = await updateReportStatus(reportId, newStatus);
      
      if (response.success) {
        // Show success message via UI instead of alert
        if (response.notify) {
          setStatusUpdateSuccess('Status updated successfully! SMS notification sent to user.');
        } else {
          setStatusUpdateSuccess('Status updated successfully!');
        }
        // Auto-hide success message after 3 seconds
        setTimeout(() => setStatusUpdateSuccess(''), 3000);
        // Reload reports and stats to show updated status
        loadReports(currentPage);
        loadStats();
      } else {
        setStatusUpdateError(response.error || response.message || 'Failed to update status');
        setTimeout(() => setStatusUpdateError(''), 5000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setStatusUpdateError(err.response?.data?.message || err.message || 'Failed to update status');
      // Auto-hide error message after 5 seconds
      setTimeout(() => setStatusUpdateError(''), 5000);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadReports(newPage);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setExportError('');
    setExportSuccess('');

    try {
      const blob = await adminReports.exportReports(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      link.download = `delhi-breathes-reports-${date}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportSuccess('Reports exported successfully!');
      setTimeout(() => setExportSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting reports:', err);
      setExportError(err.response?.data?.error || err.message || 'Failed to export reports');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadReports(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      status: '',
      email: '',
      fromDate: '',
      toDate: '',
    });
    loadReports(1);
  };

  const statCards = [
    {
      label: 'Total Reports',
      value: stats.total,
      icon: FileText,
      color: '#2563EB',
      bgColor: 'rgba(37, 99, 235, 0.08)',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.08)',
    },
    {
      label: 'Reviewed',
      value: stats.reviewed,
      icon: CheckCircle,
      color: '#16A34A',
      bgColor: 'rgba(22, 163, 74, 0.08)',
    },
    {
      label: 'Action Taken',
      value: stats.actionTaken,
      icon: TrendingUp,
      color: '#2563EB',
      bgColor: 'rgba(37, 99, 235, 0.08)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => {
            window.location.href = '/policy-dashboard';
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors btn-ghost"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bgColor }}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <h3 className="text-3xl font-display font-bold mb-1" style={{ color: '#0F172A' }}>
                {statsLoading ? '...' : (stat.value === null || stat.value === undefined ? '—' : stat.value)}
              </h3>
              <p className="text-sm" style={{ color: '#64748B' }}>
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {(filters.category || filters.status || filters.email || filters.fromDate || filters.toDate) && (
            <button
              onClick={clearFilters}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              >
                <option value="">All Categories</option>
                <option value="pollution">General Pollution</option>
                <option value="burning">Waste/Stubble Burning</option>
                <option value="construction">Construction Dust</option>
                <option value="industrial">Industrial Emission</option>
                <option value="traffic">Vehicle Pollution</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                Email
              </label>
              <input
                type="text"
                value={filters.email || filters.phone || ''}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Search email..."
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>
          </div>
        )}

        {showFilters && (
          <div className="mt-4 flex justify-end">
            <button onClick={applyFilters} className="btn-primary">
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Success Message - Export */}
      {exportSuccess && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
          <CheckCircle className="w-5 h-5" style={{ color: '#16A34A' }} />
          <span className="text-sm font-semibold" style={{ color: '#16A34A' }}>{exportSuccess}</span>
        </div>
      )}

      {/* Error Message - Export */}
      {exportError && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{exportError}</span>
        </div>
      )}

      {/* Success Message - Status Update */}
      {statusUpdateSuccess && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
          <CheckCircle className="w-5 h-5" style={{ color: '#16A34A' }} />
          <span className="text-sm font-semibold" style={{ color: '#16A34A' }}>{statusUpdateSuccess}</span>
        </div>
      )}

      {/* Error Message - Status Update */}
      {statusUpdateError && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{statusUpdateError}</span>
        </div>
      )}

      {/* Error Message */}
      {/* FIX: user-friendly retry UI */}
      {error && (
        <div className="p-4 rounded-lg flex items-center justify-between gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
            <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</span>
          </div>
          <button
            onClick={() => loadReports(currentPage)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ 
              backgroundColor: '#2563EB', 
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && reports.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2563EB' }} />
        </div>
      )}

      {/* Reports Table */}
      {!loading && reports.length > 0 && (
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E2E8F0' }}>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>ID</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Email</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Category</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Description</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Status</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Date</th>
                {isAdmin && (
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const reportId = report._id || report.id || 'N/A';
                const reportIdShort = typeof reportId === 'string' && reportId.length > 8 
                  ? reportId.slice(-8) 
                  : reportId;
                
                return (
                  <tr key={reportId} className="border-b hover:bg-[#F8FAFC]" style={{ borderColor: '#E2E8F0' }}>
                    <td className="p-4 text-xs font-mono" style={{ color: '#64748B' }}>
                      {reportIdShort}
                    </td>
                    <td className="p-4 text-sm" style={{ color: '#0F172A' }}>
                      {(() => {
                        // Priority: 1. Direct email from report, 2. Cached email, 3. Fallback
                        const directEmail = report.email || report.userEmail;
                        if (directEmail) return directEmail;
                        
                        const userId = report.userId || report.user_id || report.user?.id || report.user?._id;
                        if (userId && userEmailCache.has(userId)) {
                          return userEmailCache.get(userId);
                        }
                        
                        // Show loading indicator if we're fetching
                        if (userId && loadingEmails.has(userId)) {
                          return <span style={{ color: '#64748B', fontStyle: 'italic' }}>Loading...</span>;
                        }
                        
                        // Final fallback
                        return <span style={{ color: '#64748B' }}>No Email Available</span>;
                      })()}
                    </td>
                    <td className="p-4 text-sm" style={{ color: '#0F172A' }}>
                      {CATEGORY_LABELS[report.category] || report.category || 'Unknown'}
                    </td>
                    <td className="p-4 text-sm max-w-xs truncate" style={{ color: '#475569' }}>
                      {report.description || 'No description'}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{
                        backgroundColor: report.status === 'Pending' ? 'rgba(245, 158, 11, 0.08)' :
                                        report.status === 'Reviewed' ? 'rgba(22, 163, 74, 0.08)' :
                                        'rgba(37, 99, 235, 0.08)',
                        color: report.status === 'Pending' ? '#F59E0B' :
                               report.status === 'Reviewed' ? '#16A34A' :
                               '#2563EB',
                      }}>
                        {report.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-xs" style={{ color: '#64748B' }}>
                      {report.createdAt ? formatDateTime(new Date(report.createdAt)) : 'N/A'}
                    </td>
                    <td className="p-4">
                      {/* Only show admin actions if user is admin */}
                      {isAdmin ? (
                        <div className="flex gap-2">
                          {report.status !== 'Reviewed' && (
                            <button
                              onClick={() => handleStatusUpdate(reportId, 'Reviewed')}
                              className="px-3 py-1 text-xs rounded-lg font-semibold transition-colors"
                              style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)', color: '#16A34A' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.08)'}
                            >
                              Review
                            </button>
                          )}
                          {report.status !== 'Action Taken' && (
                            <button
                              onClick={() => handleStatusUpdate(reportId, 'Action Taken')}
                              className="px-3 py-1 text-xs rounded-lg font-semibold transition-colors"
                              style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'}
                            >
                              Action
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: '#64748B' }}>View Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && !error && (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#94A3B8' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#0F172A' }}>
            No reports found
          </h3>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Try adjusting your filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && reports.length > 0 && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              Page {currentPage} of {pagination.pages}
            </span>
            <span className="text-xs" style={{ color: '#64748B' }}>
              ({pagination.total} total)
            </span>
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages || loading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Export CSV Button - Only for admins */}
      {!loading && reports.length > 0 && isAdmin && (
        <div className="flex justify-center">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {exportLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export CSV
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

