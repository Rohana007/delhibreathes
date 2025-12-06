import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, MapPin, Calendar, AlertCircle, Loader2, 
  ChevronLeft, ChevronRight, CheckCircle, TrendingUp, Filter, X
} from 'lucide-react';
import { adminReports } from '../api/adminApi';
import { formatDateTime } from '../../utils/helpers';

const CATEGORY_LABELS = {
  pollution: 'General Pollution',
  burning: 'Waste/Stubble Burning',
  construction: 'Construction Dust',
  industrial: 'Industrial Emission',
  traffic: 'Vehicle Pollution',
  other: 'Other',
};

const STATUS_OPTIONS = ['Pending', 'Reviewed', 'Action Taken'];

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    phone: '',
    fromDate: '',
    toDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadReports(1);
  }, []);

  const loadReports = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await adminReports.getReports({
        ...filters,
        page,
        limit: 20,
      });

      if (response.success) {
        setReports(response.reports);
        setPagination(response.pagination);
        setCurrentPage(page);
      } else {
        setError(response.error || 'Failed to load reports');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
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
      phone: '',
      fromDate: '',
      toDate: '',
    });
    loadReports(1);
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const response = await adminReports.updateStatus(reportId, newStatus);
      if (response.success) {
        // Show success message
        if (response.notify) {
          alert(`Status updated successfully! SMS notification sent to user.`);
        } else {
          alert('Status updated successfully!');
        }
        // Reload reports
        loadReports(currentPage);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadReports(newPage);
    }
  };

  return (
    <div className="space-y-6">
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
          {(filters.category || filters.status || filters.phone || filters.fromDate || filters.toDate) && (
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
                Phone
              </label>
              <input
                type="text"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="Search phone..."
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

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</span>
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
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Phone</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Category</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Description</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Status</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Date</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: '#0F172A' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b hover:bg-[#F8FAFC]" style={{ borderColor: '#E2E8F0' }}>
                  <td className="p-4 text-xs font-mono" style={{ color: '#64748B' }}>
                    {report.id.slice(-8)}
                  </td>
                  <td className="p-4 text-sm" style={{ color: '#0F172A' }}>
                    {report.phone}
                  </td>
                  <td className="p-4 text-sm" style={{ color: '#0F172A' }}>
                    {CATEGORY_LABELS[report.category] || report.category}
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate" style={{ color: '#475569' }}>
                    {report.description}
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
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs" style={{ color: '#64748B' }}>
                    {formatDateTime(new Date(report.createdAt))}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {report.status !== 'Reviewed' && (
                        <button
                          onClick={() => handleStatusUpdate(report.id, 'Reviewed')}
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
                          onClick={() => handleStatusUpdate(report.id, 'Action Taken')}
                          className="px-3 py-1 text-xs rounded-lg font-semibold transition-colors"
                          style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'}
                        >
                          Action
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}

