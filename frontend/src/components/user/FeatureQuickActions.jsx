import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { 
  MdAir, 
  MdTimeline, 
  MdReportProblem,
  MdScience 
} from 'react-icons/md';
import { 
  BsGraphUp 
} from 'react-icons/bs';
import { 
  FaNotesMedical, 
  FaRoute
} from 'react-icons/fa';
import { 
  GiFireZone 
} from 'react-icons/gi';

const features = [
  { name: "Live AQI", icon: MdAir, route: "/" },
  { name: "Forecast", icon: BsGraphUp, route: "/" },
  { name: "Pollutants", icon: MdScience, route: "/" },
  { name: "Historic Data", icon: MdTimeline, route: "/" },
  { name: "Advisory", icon: FaNotesMedical, route: "/" },
  { name: "Safe Route", icon: FaRoute, route: "/" },
  { name: "Hotspots", icon: GiFireZone, route: "/" },
  { name: "Validation", icon: MdAir, route: "/validation", navigate: true },
  { name: "Report Pollution", icon: MdReportProblem, route: "/", highlight: true }
];

export default function FeatureQuickActions({ scrollToSection: scrollToSectionProp }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { scrollToSection: scrollToSectionContext, setShowReportModal, mode } = useApp();
  const { user, token } = useAuth();
  const flags = useFeatureFlags();
  const isDark = theme === 'dark';

  // Use prop if provided, otherwise use context
  const scrollToSection = scrollToSectionProp || scrollToSectionContext;

  const handleFeatureClick = (route, name) => {
    // Map feature names to section keys
    const sectionMap = {
      "Live AQI": "liveAqi",
      "Forecast": "forecast",
      "Pollutants": "pollutants",
      "Historic Data": "historic",
      "Advisory": "advisory",
      "Safe Route": "safeRoute",
      "Hotspots": "hotspots",
      "Report Pollution": "reportPollution"
    };

    const sectionKey = sectionMap[name];

    if (name === "Report Pollution") {
      // Open report pollution modal
      if (setShowReportModal) {
        setShowReportModal(true);
      }
      // Also try to scroll if scroll function is available
      if (scrollToSection && sectionKey) {
        scrollToSection(sectionKey);
      }
    } else {
      // Check if this feature should navigate directly
      const feature = features.find(f => f.name === name);
      if (feature?.navigate) {
        // Navigate directly without scrolling
        navigate(route);
      } else {
        // Scroll to relevant section first
        if (scrollToSection && sectionKey) {
          scrollToSection(sectionKey);
        }
        // For routes that navigate away, still navigate (but after scroll)
        if (route !== "/") {
          navigate(route);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex justify-center"
    >
      <div
        className="p-3 rounded-2xl"
        style={{
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        <div
          className="overflow-x-auto pb-2 feature-scroll-hide"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className="flex gap-3 px-1 justify-center"
            style={{
              minWidth: 'max-content',
            }}
          >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHighlighted = feature.highlight;
            const shouldHide = 
              (feature.name === "Report Pollution" && !flags.showReportPollution) ||
              (feature.name === "Historic Data" && !flags.showHistoricData);
            
            return (
              <motion.button
                key={feature.name}
                onClick={() => handleFeatureClick(feature.route, feature.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${shouldHide ? 'hidden-feature' : ''}`}
                style={{
                  backgroundColor: isHighlighted 
                    ? '#2563EB' 
                    : isDark 
                      ? '#1E293B' 
                      : '#F8FAFC',
                  color: isHighlighted 
                    ? '#FFFFFF' 
                    : isDark 
                      ? '#E2E8F0' 
                      : '#000000',
                  fontWeight: isHighlighted ? '600' : '700',
                  border: isHighlighted 
                    ? 'none' 
                    : `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                  boxShadow: isHighlighted
                    ? '0 4px 12px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(37, 99, 235, 0.1)'
                    : '0 2px 6px rgba(15, 23, 42, 0.06)',
                  minWidth: isHighlighted ? '140px' : 'auto',
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: isHighlighted
                    ? '0 6px 16px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(37, 99, 235, 0.2)'
                    : '0 4px 10px rgba(15, 23, 42, 0.12)',
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Icon 
                  className="w-4 h-4 flex-shrink-0" 
                  style={{ 
                    color: isHighlighted 
                      ? '#FFFFFF' 
                      : isDark 
                        ? '#94A3B8' 
                        : '#64748B' 
                  }} 
                />
                <span style={{ fontWeight: isHighlighted ? '600' : '700' }} data-translate={feature.name}>{feature.name}</span>
              </motion.button>
            );
          })}
          
          </div>
        </div>
      </div>
    </motion.div>
  );
}

