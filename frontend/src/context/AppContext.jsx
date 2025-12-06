import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { getAqiColor, getAqiClass, getAqiLevel } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Mode state
  const [mode, setMode] = useState('user'); // 'user' | 'policymaker'
  
  // Data states
  const [ncrAqi, setNcrAqi] = useState(null);
  const [hotspots, setHotspots] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState(null);
  const [policyInsights, setPolicyInsights] = useState(null);
  const [seasonalForecast, setSeasonalForecast] = useState(null);
  const [sourceMarkers, setSourceMarkers] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('delhi');
  const [userCategory, setUserCategory] = useState('general');
  
  // Scroll and modal states
  const [scrollToSection, setScrollToSection] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch all data with FULL debugging
  const fetchData = useCallback(async () => {
    // ========== FIX 1: Log environment variable ==========
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    console.log('🔵 [AppContext] Component mounted / fetchData called');
    console.log('🔵 [AppContext] VITE_API_URL =', import.meta.env.VITE_API_URL);
    console.log('🔵 [AppContext] Final API_BASE =', API_URL);
    
    // ========== FIX 9: Add timeout to prevent infinite loading ==========
    let loadingTimeout;
    let isCancelled = false;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 [AppContext] Loading state set to true');
      
      // Set timeout to force loading to false after 8 seconds (reduced from 10s)
      loadingTimeout = setTimeout(() => {
        console.warn('⚠️ [AppContext] Loading timeout reached (8s) - forcing loading to false');
        isCancelled = true;
        setLoading(false);
        setError('Request took too long. Please check your connection and try again.');
      }, 8000); // 8 second timeout

      // ========== FIX 2: Safe async function for AQI fetch ==========
      const loadAQI = async () => {
        if (isCancelled) {
          console.log('⏸️ [AppContext] AQI fetch cancelled due to timeout');
          return null;
        }
        
        try {
          // Use the API service method but with full debugging
          const aqiUrl = `${API_URL}/aqi/ncr`;
          console.log('🔵 [AppContext] Fetching AQI from:', aqiUrl);
          console.log('🔵 [AppContext] Using API service method: getAllNCRAQI()');
          
          // Use the API service method (which uses axios) with a timeout
          const apiResult = await Promise.race([
            api.getAllNCRAQI(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AQI fetch timeout after 6 seconds')), 6000)
            )
          ]);
          
          if (isCancelled) {
            console.log('⏸️ [AppContext] AQI fetch completed but was cancelled');
            return null;
          }
          
          // Normalise API shape: backend returns { success, data: {...} }
          const data = apiResult && apiResult.data && apiResult.success !== false
            ? apiResult.data
            : apiResult;

          console.log('🟣 [AppContext] API response received');
          console.log('🟢 [AppContext] Parsed AQI data (normalized):', data);
          console.log('🟢 [AppContext] AQI data type:', typeof data);
          console.log('🟢 [AppContext] AQI data keys:', data ? Object.keys(data) : 'null/undefined');
          console.log('🟢 [AppContext] AQI summary:', data?.summary);
          console.log('🟢 [AppContext] AQI regions:', data?.regions ? Object.keys(data.regions) : 'none');
          
          if (!data) {
            console.warn('⚠️ [AppContext] AQI data is null/undefined');
            if (!isCancelled) {
              setError('AQI data is unavailable at the moment');
            }
            return null;
          }
          
          if (!isCancelled) {
            setNcrAqi(data);
            console.log('✅ [AppContext] AQI data set successfully');
          }
          return data;
        } catch (err) {
          if (isCancelled) {
            console.log('⏸️ [AppContext] AQI fetch error but was cancelled');
            return null;
          }
          
          console.error('❌ [AppContext] AQI Fetch Error:', err);
          console.error('❌ [AppContext] Error name:', err.name);
          console.error('❌ [AppContext] Error message:', err.message);
          console.error('❌ [AppContext] Error stack:', err.stack);
          console.error('❌ [AppContext] Error response:', err.response);
          console.error('❌ [AppContext] Error code:', err.code);
          
          // Network error handling
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            console.error('❌ [AppContext] Request timeout - backend may be slow or unavailable');
            setError('Request timeout. Backend may be slow or unavailable.');
          } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
            console.error('❌ [AppContext] Network error - backend may be down');
            setError('Unable to connect to server. Please check if backend is running on http://localhost:5000');
          } else if (err.response) {
            console.error('❌ [AppContext] API error response:', err.response.status, err.response.data);
            setError(`API error: ${err.response.status} - ${err.response.data?.message || err.message}`);
          } else {
            setError(`Unable to load AQI: ${err.message || 'Unknown error'}`);
          }
          return null;
        }
      };

      // Stagger API calls to avoid rate limiting - add small delays between calls
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      console.log('🔵 [AppContext] Starting parallel API calls...');
      
      // ========== FIX 3: Use Promise.allSettled with better error handling ==========
      const results = await Promise.allSettled([
        loadAQI(), // Use our safe async function
        delay(100).then(() => {
          console.log('🔵 [AppContext] Fetching hotspots...');
          return api.getHotspots().catch(e => {
            console.warn('⚠️ [AppContext] Failed to fetch hotspots:', e);
            return { error: e.message, data: null };
          });
        }),
        delay(200).then(() => {
          console.log('🔵 [AppContext] Fetching predictions...');
          return api.getPredictions().catch(e => {
            console.warn('⚠️ [AppContext] Failed to fetch predictions:', e);
            return { error: e.message, data: null };
          });
        }),
        delay(300).then(() => {
          console.log('🔵 [AppContext] Fetching insights...');
          return api.getInsights().catch(e => {
            console.warn('⚠️ [AppContext] Failed to fetch insights:', e);
            return { error: e.message, data: null };
          });
        }),
      ]);

      console.log('🟣 [AppContext] All API calls completed. Results:', results);

      // ========== FIX 4: Set data even if some requests fail ==========
      if (!isCancelled) {
        if (results[0].status === 'fulfilled' && results[0].value) {
          console.log('✅ [AppContext] Setting NCR AQI data');
          setNcrAqi(results[0].value);
        } else {
          console.warn('⚠️ [AppContext] NCR AQI fetch failed:', results[0].reason);
        }
        
        if (results[1].status === 'fulfilled' && results[1].value) {
          console.log('✅ [AppContext] Setting hotspots data');
          setHotspots(results[1].value);
        }
        if (results[2].status === 'fulfilled' && results[2].value) {
          console.log('✅ [AppContext] Setting predictions data');
          setPredictions(results[2].value);
        }
        if (results[3].status === 'fulfilled' && results[3].value) {
          console.log('✅ [AppContext] Setting insights data');
          setInsights(results[3].value);
        }

        setLastUpdated(new Date());
        console.log('✅ [AppContext] Last updated timestamp set');
      }

      // Fetch additional data based on mode
      if (mode === 'policymaker') {
        try {
          console.log('🔵 [AppContext] Fetching policy data...');
          const [policyData, sourceData] = await Promise.allSettled([
            api.getPolicyInsights().catch(e => null),
            api.getSourceMarkers().catch(e => null),
          ]);
          if (policyData.status === 'fulfilled' && policyData.value) {
            setPolicyInsights(policyData.value);
          }
          if (sourceData.status === 'fulfilled' && sourceData.value) {
            setSourceMarkers(sourceData.value);
          }
        } catch (e) {
          console.warn('⚠️ [AppContext] Policy data fetch failed:', e);
        }
      }
      
      console.log('✅ [AppContext] Fetch completed successfully');
    } catch (err) {
      console.error('❌ [AppContext] Error fetching data:', err);
      console.error('❌ [AppContext] Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      
      // Always set error if fetch fails completely
      if (!isCancelled) {
        setError(err.message || 'Failed to fetch data');
        console.error('❌ [AppContext] Error set:', err.message);
      }
    } finally {
      // Clear timeout if fetch completes before timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      // Always set loading to false, even if cancelled
      setLoading(false);
      console.log('🔵 [AppContext] Loading state set to false');
    }
  }, [mode]); // REMOVED state dependencies to prevent infinite loops

  // Initial fetch and auto-refresh
  useEffect(() => {
    console.log('🔵 [AppContext] useEffect triggered - setting up fetch');
    
    // Add initial delay to prevent immediate rate limiting on page load
    const timeout = setTimeout(() => {
      console.log('🔵 [AppContext] Initial fetch timeout triggered');
      fetchData();
    }, 300); // Reduced from 500ms to 300ms for faster initial load
    
    // ========== FIX 10: Safety timeout - force loading to false after 12 seconds ==========
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ [AppContext] Safety timeout - forcing loading to false after 12s');
      setLoading(false);
      setError('Data fetch timed out. Please check your backend server.');
    }, 12000); // Reduced from 15s to 12s
    
    // Auto-refresh every 5 minutes (increased from 2 to reduce API calls)
    const interval = setInterval(() => {
      console.log('🔵 [AppContext] Auto-refresh triggered');
      fetchData();
    }, 300000);
    
    return () => {
      console.log('🔵 [AppContext] Cleanup - clearing timeouts and intervals');
      clearTimeout(timeout);
      clearTimeout(safetyTimeout);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Fetch policy insights when mode changes
  useEffect(() => {
    if (mode === 'policymaker' && !policyInsights) {
      Promise.all([
        api.getPolicyInsights(),
        api.getSourceMarkers(),
      ]).then(([policy, sources]) => {
        setPolicyInsights(policy);
        setSourceMarkers(sources);
      }).catch(console.error);
    }
  }, [mode, policyInsights]);

  // Get current AQI for selected region
  const getCurrentAqi = useCallback(() => {
    if (!ncrAqi?.regions) return null;
    return ncrAqi.regions[selectedRegion];
  }, [ncrAqi, selectedRegion]);

  const value = {
    // Mode
    mode,
    setMode,
    
    // Data
    ncrAqi,
    hotspots,
    predictions,
    insights,
    policyInsights,
    seasonalForecast,
    sourceMarkers,
    
    // UI
    loading,
    error,
    lastUpdated,
    selectedRegion,
    setSelectedRegion,
    userCategory,
    setUserCategory,
    
    // Actions
    fetchData,
    getCurrentAqi,
    
    // Scroll and modals
    scrollToSection,
    setScrollToSection,
    showReportModal,
    setShowReportModal,
    
    // Helpers (using Indian AQI)
    getAqiColor,
    getAqiClass,
    getAqiLevel,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
