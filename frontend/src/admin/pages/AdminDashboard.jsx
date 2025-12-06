import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, MapPin, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { adminReports } from '../api/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    actionTaken: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get all reports for stats
      const allReports = await adminReports.getReports({ limit: 1000 });
      
      if (allReports.success) {
        const reports = allReports.reports;
        const statsData = {
          total: reports.length,
          pending: reports.filter(r => r.status === 'Pending').length,
          reviewed: reports.filter(r => r.status === 'Reviewed').length,
          actionTaken: reports.filter(r => r.status === 'Action Taken').length,
        };
        setStats(statsData);
        setRecentReports(reports.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: '#64748B' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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
                {stat.value}
              </h3>
              <p className="text-sm" style={{ color: '#64748B' }}>
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-bold mb-4" style={{ color: '#0F172A' }}>
          Recent Reports
        </h2>
        {recentReports.length > 0 ? (
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border flex items-center justify-between"
                style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" style={{ color: '#64748B' }} />
                    <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                      {report.category}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{
                      backgroundColor: report.status === 'Pending' ? 'rgba(245, 158, 11, 0.08)' :
                                      report.status === 'Reviewed' ? 'rgba(22, 163, 74, 0.08)' :
                                      'rgba(37, 99, 235, 0.08)',
                      color: report.status === 'Pending' ? '#F59E0B' :
                             report.status === 'Reviewed' ? '#16A34A' :
                             '#2563EB',
                    }}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {report.description?.substring(0, 60)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: '#94A3B8' }} />
            <p className="text-sm" style={{ color: '#64748B' }}>No reports yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

