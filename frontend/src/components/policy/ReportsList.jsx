import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, MapPin, Calendar, Filter, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { getReports } from '../../services/api';

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await getReports(filters);
      if (response.success) {
        setReports(response.data.reports || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: { bg: 'rgba(37, 99, 235, 0.08)', text: '#2563EB', border: 'rgba(37, 99, 235, 0.25)' },
      reviewed: { bg: 'rgba(22, 163, 74, 0.08)', text: '#16A34A', border: 'rgba(22, 163, 74, 0.25)' },
      dismissed: { bg: 'rgba(220, 38, 38, 0.08)', text: '#DC2626', border: 'rgba(220, 38, 38, 0.25)' },
    };
    const style = styles[status] || styles.new;
    return (
      <span
        className="text-xs px-2 py-1 rounded-full font-semibold"
        style={style}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      pollution: '💨',
      burning: '🔥',
      construction: '🏗️',
      industrial: '🏭',
      traffic: '🚗',
      other: '📍',
    };
    return icons[category] || '📍';
  };

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-64 bg-[#F1F5F9] rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" style={{ color: '#2563EB' }} />
          <h2 className="text-xl font-display font-bold" style={{ color: '#0F172A' }}>
            Public Reports
          </h2>
        </div>
        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
          >
            <option value="">All Categories</option>
            <option value="pollution">Pollution</option>
            <option value="burning">Burning</option>
            <option value="construction">Construction</option>
            <option value="industrial">Industrial</option>
            <option value="traffic">Traffic</option>
          </select>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#64748B' }} />
          <p className="text-sm" style={{ color: '#64748B' }}>No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <motion.div
              key={report._id || report.id}
              className="glass-card p-4 cursor-pointer hover:scale-[1.01] transition-all"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getCategoryIcon(report.category)}</span>
                    <span className="font-semibold" style={{ color: '#0F172A' }}>
                      {report.reportId || report.id}
                    </span>
                    {getStatusBadge(report.status)}
                  </div>
                  <p className="text-sm mb-2" style={{ color: '#475569' }}>
                    {report.description?.slice(0, 100)}
                    {report.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#64748B' }}>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{report.address?.slice(0, 40) || 'Location unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(report.submittedAt || report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {(report.email || report.userEmail) && (
                      <div className="flex items-center gap-1">
                        <span>{report.email || report.userEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
                {report.images && report.images.length > 0 && (
                  <div className="ml-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border" style={{ borderColor: '#E2E8F0' }}>
                      <img
                        src={report.images[0]}
                        alt="Report"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#0F172A' }}>
                  Report {selectedReport.reportId || selectedReport.id}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-lg"
                  style={{ color: '#64748B' }}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#64748B' }}>Description</p>
                  <p className="text-sm" style={{ color: '#0F172A' }}>{selectedReport.description}</p>
                </div>
                
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#64748B' }}>Location</p>
                  <p className="text-sm" style={{ color: '#0F172A' }}>{selectedReport.address}</p>
                </div>
                
                {(selectedReport.email || selectedReport.userEmail) && (
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#64748B' }}>Email</p>
                    <p className="text-sm" style={{ color: '#0F172A' }}>
                      {selectedReport.email || selectedReport.userEmail}
                    </p>
                  </div>
                )}
                
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#64748B' }}>Images</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Report ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

