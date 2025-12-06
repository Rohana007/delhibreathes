import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FiltersPanel from './FiltersPanel';
import AQIHistoryChart from './AQIHistoryChart';
import PollutantTrendChart from './PollutantTrendChart';
import SourceContributionSection from './SourceContributionSection';
import CitizenReportTable from './CitizenReportTable';
import ExportCSVButton from './ExportCSVButton';
import {
  getAnalyticsHistoric,
  getAnalyticsPollutants,
  getAnalyticsSources,
  getAnalyticsReports,
} from '../../../services/api';
import { Calendar } from 'lucide-react';

const defaultFilters = {
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  seasons: [],
  regions: [],
  pollutants: [],
  sourceTypes: [],
  severityLevels: [],
  reportTypes: [],
};

export default function ReportAnalyticsSection() {
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [historicData, setHistoricData] = useState([]);
  const [pollutantData, setPollutantData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isDefaultMode, setIsDefaultMode] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  // Get previous month range for default (same day one month ago to today)
  const getPreviousMonthRange = () => {
    const now = new Date();
    const endDate = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1); // Go back one month
    return {
      start: startDate,
      end: endDate,
      label: `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    };
  };

  const fetchAnalytics = async (useDefault = false) => {
    setLoading(true);
    try {
      const queryParams = useDefault 
        ? { default: true }
        : { ...filters };
      
      // Remove empty arrays and empty strings
      Object.keys(queryParams).forEach(key => {
        if (Array.isArray(queryParams[key]) && queryParams[key].length === 0) {
          delete queryParams[key];
        }
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const [historic, pollutants, sources, reports] = await Promise.all([
        getAnalyticsHistoric(queryParams),
        getAnalyticsPollutants(queryParams),
        getAnalyticsSources(queryParams),
        getAnalyticsReports(queryParams),
      ]);
      
      // Handle historic data response (can be object with defaultApplied or array)
      let historicDataArray = [];
      let defaultInfo = null;
      
      if (historic && typeof historic === 'object' && historic.defaultApplied) {
        historicDataArray = historic.data || [];
        defaultInfo = historic.range;
        setIsDefaultMode(true);
        if (historic.range) {
          const start = new Date(historic.range.start);
          const end = new Date(historic.range.end);
          setDateRange({
            start,
            end,
            label: `${start.getDate()}–${end.getDate()} ${end.toLocaleString('default', { month: 'long' })} ${end.getFullYear()}`,
          });
        }
      } else {
        historicDataArray = Array.isArray(historic) ? historic : (historic?.data || []);
        setIsDefaultMode(false);
        setDateRange(null);
      }
      
      setHistoricData(historicDataArray);
      setPollutantData(Array.isArray(pollutants) ? pollutants : []);
      setSourceData(Array.isArray(sources) ? sources : []);
      setReportData(Array.isArray(reports) ? reports : []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setHistoricData([]);
      setPollutantData([]);
      setSourceData([]);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch default data on mount
  useEffect(() => {
    fetchAnalytics(true);
    const range = getPreviousMonthRange();
    setDateRange(range);
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    fetchAnalytics(true);
    const range = getPreviousMonthRange();
    setDateRange(range);
  };

  const handleApplyFilters = () => {
    setIsDefaultMode(false);
    setDateRange(null);
    fetchAnalytics(false);
  };

  const handleViewReport = (report) => {
    // Navigate to report details or open modal
    console.log('View report:', report);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Detailed Report Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Filter and analyze pollution reports with comprehensive charts and data tables
          </p>
        </div>
        <ExportCSVButton filters={isDefaultMode ? { default: true } : filters} />
      </div>

      {/* Summary Badges */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 mb-4"
      >
        {/* Date Range Badge */}
        {isDefaultMode && dateRange && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <Calendar className="w-4 h-4" style={{ color: '#2563EB' }} />
            <span className="text-sm font-semibold" style={{ color: '#2563EB' }}>
              Showing data for: {dateRange.label}
            </span>
          </div>
        )}
        
        {/* Days Included Badge */}
        {dateRange && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg shadow-sm">
            <span className="text-sm font-semibold" style={{ color: '#059669' }}>
              {Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))} Days
            </span>
          </div>
        )}
        
        {/* Regions Selected Badge */}
        {filters.regions && filters.regions.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
            <span className="text-sm font-semibold" style={{ color: '#7C3AED' }}>
              {filters.regions.length} Region{filters.regions.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {/* Pollutants Selected Badge */}
        {filters.pollutants && filters.pollutants.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
            <span className="text-sm font-semibold" style={{ color: '#EA580C' }}>
              {filters.pollutants.length} Pollutant{filters.pollutants.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </motion.div>

      <FiltersPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AQIHistoryChart data={historicData} loading={loading} />
        <PollutantTrendChart data={pollutantData} loading={loading} />
      </div>

      <SourceContributionSection data={sourceData} loading={loading} />

      <CitizenReportTable
        data={reportData}
        loading={loading}
        onViewReport={handleViewReport}
      />
    </motion.div>
  );
}
