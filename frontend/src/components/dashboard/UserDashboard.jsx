import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import ReportPollution from '../reports/ReportPollution';
import AQICard from './AQICard';
import RealtimeAqiCard from '../AQI/RealtimeAqiCard';
import TrendsChart from '../charts/TrendsChart';
import PredictionCard from './PredictionCard';
import HistoricAirQuality from './HistoricAirQuality';
import HealthPanel from '../health/HealthPanel';
import SafeRouteFinder from '../routes/SafeRouteFinder';
import AQIMap from '../map/AQIMap';
import InsightsPanel from '../ai/InsightsPanel';
import SeasonalForecast from './SeasonalForecast';
import HotspotHeatmap from '../policy/HotspotHeatmap';
import PersonalizedAlertsCard from '../alerts/PersonalizedAlertsCard';
import ChatbotSearch from '../ChatbotSearch/ChatbotSearch';
import PointsWidget from '../PointsWidget';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useAuth } from '../../hooks/useAuth';
import { NCR_LOCATIONS } from '../../utils/helpers';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function UserDashboard() {
  const { ncrAqi, selectedRegion, setScrollToSection } = useApp();
  const [isDesktop, setIsDesktop] = useState(false);
  const flags = useFeatureFlags();
  const { user, token } = useAuth();


  // Get current AQI for chatbot
  const currentAQI = ncrAqi?.regions?.[selectedRegion]?.aqi || ncrAqi?.summary?.averageAqi || null;

  // Create refs for each dashboard section
  const sectionRefs = {
    liveAqi: useRef(null),
    forecast: useRef(null),
    pollutants: useRef(null),
    historic: useRef(null),
    advisory: useRef(null),
    safeRoute: useRef(null),
    hotspots: useRef(null),
    reportPollution: useRef(null)
  };

  // Function to auto-scroll to a section
  const scrollToSectionFn = (key) => {
    if (sectionRefs[key]?.current) {
      sectionRefs[key].current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  // Register scroll function in context
  useEffect(() => {
    setScrollToSection(() => scrollToSectionFn);
    return () => setScrollToSection(null);
  }, [setScrollToSection]);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3 lg:gap-4"
        style={{ marginTop: '0.5rem' }}
      >
        {/* Main AQI and AQI Forecast Trend Graph */}
        <div 
          className="grid gap-3 lg:gap-3 xl:gap-4"
          style={{
            gridTemplateColumns: isDesktop ? '1.2fr 1.8fr' : 'repeat(1, minmax(0, 1fr))',
            marginTop: '0.5rem'
          }}
        >
          {/* Left Column: AQI Card + Personalized Alerts Card */}
          <div className="flex flex-col gap-3 lg:gap-3 xl:gap-4">
            <motion.div 
              ref={(el) => {
                sectionRefs.liveAqi.current = el;
                sectionRefs.pollutants.current = el;
              }} 
              variants={itemVariants} 
              className="h-full flex"
            >
              <div className="w-full h-full">
                {(() => {
                  // Get coordinates for selected region
                  const regionLocation = NCR_LOCATIONS[selectedRegion] || NCR_LOCATIONS.delhi;
                  return (
                    <RealtimeAqiCard 
                      lat={regionLocation.lat} 
                      lon={regionLocation.lon} 
                    />
                  );
                })()}
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <PersonalizedAlertsCard />
            </motion.div>
          </div>
          
          {/* Right Column: Forecast */}
          <motion.div ref={sectionRefs.forecast} variants={itemVariants} className="h-full flex flex-col" style={{ gap: 0 }}>
            <div className="w-full flex-1" style={{ marginBottom: 0, paddingBottom: 0 }}>
              <TrendsChart />
            </div>
            <div className="w-full" style={{ marginTop: '-2px', paddingTop: 0 }}>
              <PredictionCard />
            </div>
          </motion.div>
        </div>

        {/* Historic Air Quality */}
        <motion.div ref={sectionRefs.historic} variants={itemVariants} className={`w-full ${!flags.showHistoricData ? 'hidden-feature' : ''}`}>
          <HistoricAirQuality />
        </motion.div>

        {/* Map and Health Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-3 xl:gap-4">
          <motion.div variants={itemVariants}>
            <AQIMap />
          </motion.div>
          <motion.div ref={sectionRefs.advisory} variants={itemVariants}>
            <HealthPanel />
          </motion.div>
        </div>

        {/* Seasonal Forecast */}
        <motion.div variants={itemVariants}>
          <SeasonalForecast />
        </motion.div>

        {/* Hotspot Heatmap */}
        <motion.div ref={sectionRefs.hotspots} variants={itemVariants}>
          <HotspotHeatmap />
        </motion.div>

        {/* Safe Route Finder */}
        <motion.div ref={sectionRefs.safeRoute} variants={itemVariants}>
          <SafeRouteFinder />
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={itemVariants}>
          <InsightsPanel />
        </motion.div>

        {/* Report Pollution Section - Placeholder for scroll target */}
        <motion.div ref={sectionRefs.reportPollution} variants={itemVariants} style={{ minHeight: '1px' }} />
      </motion.div>

      {/* Floating Chatbot Search - Bottom Right */}
      {flags.showChatbot && <ChatbotSearch aqi={currentAQI} />}

      {/* Floating Green Points Button - Bottom Right Corner (User Dashboard Only) */}
      {token && user && flags.showGamification && (
        <div style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          zIndex: 9999,
        }}>
          <PointsWidget />
        </div>
      )}
    </>
  );
}
