import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Download } from 'lucide-react';
import { useFeatureFlags } from '../../../hooks/useFeatureFlags';

const getSeverityColor = (severity) => {
  const colors = {
    Low: 'bg-green-100 text-green-800',
    Moderate: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
};

export default function CitizenReportTable({ data, loading, onViewReport }) {
  const flags = useFeatureFlags();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    let sorted = [...data];
    
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading) {
    return (
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </motion.div>
    );
  }

  if (!flags.showCitizenReports) {
    return null;
  }

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Citizen Report Analytics</h3>
        <span className="ml-auto text-sm text-gray-600">
          {sortedData.length} reports
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('date')}
              >
                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('region')}
              >
                Region {sortConfig.key === 'region' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Source</th>
              <th 
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('severity')}
              >
                Severity {sortConfig.key === 'severity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">AQI</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No reports found for the selected filters
                </td>
              </tr>
            ) : (
              sortedData.map((report, index) => (
                <tr 
                  key={report.id || index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {new Date(report.date || report.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {report.region || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {report.type || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {report.source || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                      {report.severity || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {report.aqi || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewReport && onViewReport(report)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

