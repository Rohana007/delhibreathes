import { useApp } from '../context/AppContext';
import ReportPollution from './reports/ReportPollution';

// Render Report Pollution Modal at root level to avoid z-index issues
export default function ReportPollutionModal() {
  const { showReportModal, setShowReportModal } = useApp();
  
  if (!showReportModal) return null;
  
  return (
    <ReportPollution onClose={() => setShowReportModal(false)} />
  );
}

