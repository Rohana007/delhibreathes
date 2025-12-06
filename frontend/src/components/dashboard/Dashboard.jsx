import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';
import UserDashboard from './UserDashboard';
import PolicyDashboard from './PolicyDashboard';
import AlertBanner from './AlertBanner';
import SlideAlert from '../SlideAlert';
import { usePersonalizedAlerts } from '../../hooks/usePersonalizedAlerts';
import { useAqiForecast } from '../../hooks/useAqiForecast';

export default function Dashboard() {
  const { mode, loading, error, fetchData, insights, ncrAqi, selectedRegion } = useApp();
  const { theme } = useTheme();
  const { isAlertsEnabled, healthCategory, alertThreshold, region, loading: alertsLoading } = usePersonalizedAlerts();
  const [currentAlert, setCurrentAlert] = useState(null);
  
  // Get current AQI for the user's region
  // Try to match region (handle case variations)
  const regionKey = region ? region.toLowerCase() : selectedRegion;
  const regionData = ncrAqi?.regions?.[regionKey] || ncrAqi?.regions?.[selectedRegion] || null;
  const currentAQI = regionData?.aqi || ncrAqi?.summary?.averageAqi || null;
  
  // Get forecast data for trend detection
  const { expectedChange6h, trendDirection } = useAqiForecast(currentAQI, selectedRegion);

  const pageBg = theme === 'dark' ? '#0F172A' : '#FFFFFF';

  // ========== FIX 6: Improved render logic with explicit states ==========
  // Log component state for debugging
  console.log(
    '🔵 [Dashboard] Render - loading:',
    loading,
    'error:',
    error,
    'ncrAqi:',
    ncrAqi ? 'present' : 'null',
    'insights:',
    insights ? 'present' : 'null'
  );

  // Derived flags so the component never early-returns and never gets stuck
  // Show loading only if we're actually loading AND have no data at all
  const showLoading = loading && !ncrAqi && !insights && !error;
  // Show error if we're not loading, have an error, and no data
  const showError = !loading && !!error && !ncrAqi && !insights;
  // Show fallback if we're not loading, no error, but still no data
  const showFallback = !loading && !error && !ncrAqi && !insights;

  // Determine if we should show slide alert
  useEffect(() => {
    if (!isAlertsEnabled || alertsLoading || !currentAQI) {
      setCurrentAlert(null);
      return;
    }

    let alertMessage = null;
    let alertType = 'warning';

    // Check if AQI crosses threshold
    if (currentAQI >= alertThreshold) {
      const aqiLabel = currentAQI >= 300 ? 'Hazardous' : 
                      currentAQI >= 200 ? 'Very Unhealthy' :
                      currentAQI >= 150 ? 'Unhealthy' : 'Moderate';
      alertMessage = `AQI in your region is now ${aqiLabel} (${currentAQI}). Avoid outdoor activity.`;
      alertType = currentAQI >= 200 ? 'danger' : 'warning';
    }
    // Check health category specific thresholds
    else if (healthCategory === 'child' && currentAQI >= 75) {
      alertMessage = `You are registered as 'Child'. Limit outdoor exposure. Current AQI: ${currentAQI}`;
      alertType = 'warning';
    }
    else if (healthCategory === 'elderly' && currentAQI >= 100) {
      alertMessage = `You are registered as 'Elderly'. Avoid outdoor activities. Current AQI: ${currentAQI}`;
      alertType = 'warning';
    }
    else if (healthCategory === 'pregnant' && currentAQI >= 100) {
      alertMessage = `You are registered as 'Pregnant'. Limit outdoor exposure. Current AQI: ${currentAQI}`;
      alertType = 'warning';
    }
    // Check forecast trend
    else if (expectedChange6h && expectedChange6h > 30) {
      alertMessage = `AQI rising by +${expectedChange6h} expected in next 6 hours.`;
      alertType = 'warning';
    }

    setCurrentAlert(alertMessage ? { message: alertMessage, type: alertType } : null);
  }, [isAlertsEnabled, alertsLoading, currentAQI, alertThreshold, healthCategory, expectedChange6h]);

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-4 relative"
      style={{ backgroundColor: pageBg }}
    >
      {/* Inline loader so the whole dashboard never gets replaced */}
      {showLoading && (
        <div className="mb-4 flex items-center justify-center">
          <LoadingSpinner message="Fetching air quality data..." />
        </div>
      )}

      {/* Visible on-screen error UI with retry */}
      {showError && (
        <div className="mb-4">
          <ErrorDisplay error={error} onRetry={fetchData} />
          <div style={{ color: 'red', fontWeight: 'bold', marginTop: '8px' }} data-translate="Unable to load live AQI data. Please check the backend logs and your network connection.">
            Unable to load live AQI data. Please check the backend logs and your network connection.
          </div>
        </div>
      )}

      {/* Fallback card when AQI data is empty/null */}
      {showFallback && (
        <div className="mb-4 flex justify-center">
          <div className="glass-card p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }} data-translate="AQI Unavailable">
              AQI Unavailable
            </h3>
            <p className="text-sm mb-4" style={{ color: '#64748B' }} data-translate="Air quality data is currently unavailable. Please try again in a moment.">
              Air quality data is currently unavailable. Please try again in a moment.
            </p>
            <button
              onClick={fetchData}
              className="btn-primary"
              style={{ marginTop: '1rem' }}
              data-translate="Retry"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Slide Alert Banner */}
      {currentAlert && (
        <SlideAlert
          message={currentAlert.message}
          type={currentAlert.type}
          onClose={() => setCurrentAlert(null)}
          autoHideDelay={6000}
        />
      )}

      {/* Alert Banner */}
      <AlertBanner />

      {/* Dashboard Content */}
      {mode === 'user' ? <UserDashboard /> : <PolicyDashboard />}
    </div>
  );
}

