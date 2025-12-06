import { Heart, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();
  
  const safetyTips = [
    'Check AQI before outdoor activities',
    'Use N95 masks when AQI > 150',
    'Keep indoor air clean with purifiers',
    'Stay hydrated to help flush toxins',
  ];

  const footerBg = theme === 'dark' ? '#1E293B' : '#FFFFFF';
  const footerBorder = theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.08)';
  const textColor = theme === 'dark' ? '#E5E7EB' : '#1A1A1A';
  const textSecondary = theme === 'dark' ? '#9CA3AF' : '#4A4A4A';
  const cardBg = theme === 'dark' ? '#334155' : '#FFFFFF';
  const borderColor = theme === 'dark' ? '#475569' : 'rgba(0,0,0,0.08)';

  return (
    <footer 
      className="border-t mt-auto transition-colors" 
      style={{ 
        backgroundColor: footerBg,
        borderColor: footerBorder
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Safety Tips */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: textColor }} data-translate="Quick Safety Tips">
            Quick Safety Tips
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {safetyTips.map((tip, index) => {
              const bgColor = theme === 'dark' ? cardBg : '#FFFFFF';
              const tipBg = theme === 'dark' 
                ? cardBg 
                : index % 3 === 0 
                  ? 'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)'
                  : index % 3 === 1
                    ? 'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)'
                    : 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)';
              return (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-[18px] border transition-colors"
                  style={{ 
                    background: tipBg,
                    borderColor: borderColor,
                    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                >
                  <span className="text-lg">💡</span>
                  <span className="text-sm font-medium" style={{ color: textColor }} data-translate={tip}>{tip}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Sources */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t transition-colors" style={{ borderColor: borderColor }}>
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: textSecondary }}>
            <span className="font-medium" data-translate="Data Sources:">Data Sources:</span>
            <a 
              href="https://aqicn.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity font-medium"
              style={{ color: textSecondary }}
            >
              WAQI <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://openweathermap.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity font-medium"
              style={{ color: textSecondary }}
            >
              OpenWeather <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://firms.modaps.eosdis.nasa.gov" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity font-medium"
              style={{ color: textSecondary }}
            >
              NASA FIRMS <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-1 text-xs" style={{ color: textSecondary }}>
            <span data-translate="Made with">Made with</span>
            <Heart className="w-3 h-3 text-[#D72638] fill-[#D72638]" />
            <span data-translate="for Delhi NCR">for Delhi NCR</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs" style={{ color: textSecondary }}>
          <p data-translate={`© ${new Date().getFullYear()} Delhi Breathes. Real-Time Air Intelligence for a Healthier Delhi.`}>© {new Date().getFullYear()} Delhi Breathes. Real-Time Air Intelligence for a Healthier Delhi.</p>
          <p className="mt-1" data-translate="Auto-refreshes every 2 minutes. AQI values are indicative and sourced from public APIs.">Auto-refreshes every 2 minutes. AQI values are indicative and sourced from public APIs.</p>
        </div>
      </div>
    </footer>
  );
}
