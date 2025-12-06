import { motion } from 'framer-motion';
import ReportAnalyticsSection from '../../components/policy/analytics/ReportAnalyticsSection';

export default function PolicyAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Analytics</h1>
        <p className="text-gray-600">
          Comprehensive analysis of pollution reports and air quality trends
        </p>
      </div>
      <ReportAnalyticsSection />
    </motion.div>
  );
}

