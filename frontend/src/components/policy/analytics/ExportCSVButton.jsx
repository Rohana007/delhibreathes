import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import { exportAnalyticsToCSV } from '../../../services/api';

export default function ExportCSVButton({ filters }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      
      // If no filters, request default 1-month CSV
      const hasFilters = params.startDate || params.endDate || 
                        (params.regions && params.regions.length > 0) ||
                        (params.seasons && params.seasons.length > 0) ||
                        (params.pollutants && params.pollutants.length > 0) ||
                        (params.sourceTypes && params.sourceTypes.length > 0) ||
                        (params.severityLevels && params.severityLevels.length > 0) ||
                        (params.reportTypes && params.reportTypes.length > 0);
      
      if (!hasFilters || filters.default) {
        params.default = 'true';
      }
      
      const response = await exportAnalyticsToCSV(params);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename (matching backend logic)
      let filename;
      if (params.default && !hasFilters) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthName = startDate.toLocaleString('default', { month: 'long' });
        filename = `delhi-analytics-${monthName.toLowerCase()}-${startDate.getFullYear()}.csv`;
      } else {
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        filename = `delhi-analytics-filtered-${timestamp}.csv`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      style={{
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span>Export to CSV</span>
        </>
      )}
    </motion.button>
  );
}

