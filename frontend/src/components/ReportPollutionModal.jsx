import { useApp } from '../context/AppContext';
import ReportPollution from './reports/ReportPollution';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

// Render Report Pollution Modal at root level to avoid z-index issues
export default function ReportPollutionModal() {
  const { showReportModal, setShowReportModal } = useApp();
  const flags = useFeatureFlags();
  
  if (!showReportModal || !flags.showReportPollution) return null;
  
  return (
    <ReportPollution onClose={() => setShowReportModal(false)} />
  );
}

