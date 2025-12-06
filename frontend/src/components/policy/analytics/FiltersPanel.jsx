import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';

const SEASONS = [
  { value: 'winter', label: 'Winter (Dec–Feb)' },
  { value: 'summer', label: 'Summer (Mar–June)' },
  { value: 'monsoon', label: 'Monsoon (Jul–Sept)' },
  { value: 'post-monsoon', label: 'Post-Monsoon (Oct–Nov)' },
  { value: 'pre-monsoon', label: 'Pre-Monsoon (Feb–Mar)' },
];

const REGIONS = ['Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad', 'Greater Noida'];
const POLLUTANTS = ['PM2.5', 'PM10', 'NO2', 'O3', 'SO2', 'CO', 'NH3'];
const SOURCE_TYPES = ['Vehicles', 'Construction', 'Industrial', 'Stubble Burning', 'Dust', 'Other'];
const SEVERITY_LEVELS = ['Low', 'Moderate', 'High', 'Critical'];
const REPORT_TYPES = ['Air Quality', 'Odor', 'Visibility', 'Health Impact', 'Other'];

export default function FiltersPanel({ filters, onFiltersChange, onReset, onApply }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDateChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleMultiSelect = (field, value) => {
    const current = filters[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [field]: updated });
  };

  const hasActiveFilters = 
    filters.startDate || filters.endDate || filters.startTime || filters.endTime ||
    (filters.seasons && filters.seasons.length > 0) ||
    (filters.regions && filters.regions.length > 0) ||
    (filters.pollutants && filters.pollutants.length > 0) ||
    (filters.sourceTypes && filters.sourceTypes.length > 0) ||
    (filters.severityLevels && filters.severityLevels.length > 0) ||
    (filters.reportTypes && filters.reportTypes.length > 0);

  const FilterPill = ({ label, isSelected, onClick }) => (
    <motion.button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        isSelected
          ? 'bg-[#2563EB] text-white shadow-sm'
          : 'bg-white border border-[#ddd] text-gray-700 hover:border-[#2563EB] hover:text-[#2563EB]'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.2)' : '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #E2E8F0',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none' }}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" style={{ color: '#2563EB' }} />
          <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
            Filters
          </h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#2563EB] text-white">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                <Calendar className="w-4 h-4" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                style={{ 
                  borderColor: '#E2E8F0',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                <Calendar className="w-4 h-4" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                style={{ 
                  borderColor: '#E2E8F0',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                <Clock className="w-4 h-4" />
                Start Time
              </label>
              <input
                type="time"
                value={filters.startTime || ''}
                onChange={(e) => handleDateChange('startTime', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                style={{ 
                  borderColor: '#E2E8F0',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>
                <Clock className="w-4 h-4" />
                End Time
              </label>
              <input
                type="time"
                value={filters.endTime || ''}
                onChange={(e) => handleDateChange('endTime', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                style={{ 
                  borderColor: '#E2E8F0',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* Filter Groups as Pills */}
          <div className="space-y-4">
            {/* Seasons */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Seasons
              </label>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map(season => (
                  <FilterPill
                    key={season.value}
                    label={season.label}
                    isSelected={filters.seasons?.includes(season.value)}
                    onClick={() => handleMultiSelect('seasons', season.value)}
                  />
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(region => (
                  <FilterPill
                    key={region}
                    label={region}
                    isSelected={filters.regions?.includes(region)}
                    onClick={() => handleMultiSelect('regions', region)}
                  />
                ))}
              </div>
            </div>

            {/* Pollutants */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Pollutants
              </label>
              <div className="flex flex-wrap gap-2">
                {POLLUTANTS.map(pollutant => (
                  <FilterPill
                    key={pollutant}
                    label={pollutant}
                    isSelected={filters.pollutants?.includes(pollutant)}
                    onClick={() => handleMultiSelect('pollutants', pollutant)}
                  />
                ))}
              </div>
            </div>

            {/* Source Types */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Source Types
              </label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_TYPES.map(source => (
                  <FilterPill
                    key={source}
                    label={source}
                    isSelected={filters.sourceTypes?.includes(source)}
                    onClick={() => handleMultiSelect('sourceTypes', source)}
                  />
                ))}
              </div>
            </div>

            {/* Severity Levels */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Severity Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_LEVELS.map(severity => (
                  <FilterPill
                    key={severity}
                    label={severity}
                    isSelected={filters.severityLevels?.includes(severity)}
                    onClick={() => handleMultiSelect('severityLevels', severity)}
                  />
                ))}
              </div>
            </div>

            {/* Report Types */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Report Types
              </label>
              <div className="flex flex-wrap gap-2">
                {REPORT_TYPES.map(type => (
                  <FilterPill
                    key={type}
                    label={type}
                    isSelected={filters.reportTypes?.includes(type)}
                    onClick={() => handleMultiSelect('reportTypes', type)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end pt-2 border-t" style={{ borderColor: '#E2E8F0' }}>
            <motion.button
              onClick={onApply}
              className="px-6 py-2.5 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Apply Filters
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
