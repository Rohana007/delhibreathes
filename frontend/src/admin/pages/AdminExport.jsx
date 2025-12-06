import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, AlertCircle, CheckCircle, Filter, X } from 'lucide-react';
import { adminReports } from '../api/adminApi';

export default function AdminExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    phone: '',
    fromDate: '',
    toDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      status: '',
      phone: '',
      fromDate: '',
      toDate: '',
    });
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

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
      
      setSuccess('Reports exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting reports:', err);
      setError(err.response?.data?.error || err.message || 'Failed to export reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
            <Download className="w-6 h-6" style={{ color: '#2563EB' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
              Export Reports
            </h2>
            <p className="text-sm mb-4" style={{ color: '#64748B' }}>
              Export pollution reports to CSV format. You can apply filters to export specific reports.
            </p>
            <button
              onClick={handleExport}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
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
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters (Optional)
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
                <option value="Pending">Pending</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Action Taken">Action Taken</option>
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
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
          <CheckCircle className="w-5 h-5" style={{ color: '#16A34A' }} />
          <span className="text-sm font-semibold" style={{ color: '#16A34A' }}>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</span>
        </div>
      )}

      {/* Export Info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
          Export Format
        </h3>
        <div className="space-y-2 text-sm" style={{ color: '#475569' }}>
          <p>The CSV file will include the following columns:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Report ID</li>
            <li>Phone (masked)</li>
            <li>Category</li>
            <li>Description</li>
            <li>Status</li>
            <li>Latitude & Longitude</li>
            <li>Created At & Updated At</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

