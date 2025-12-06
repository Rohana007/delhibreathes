import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Clock, Activity, ChevronDown, AlertTriangle, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { USER_CATEGORIES, getAqiColor } from '../../utils/helpers';

export default function HealthPanel() {
  const { ncrAqi, userCategory, setUserCategory, insights } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);

  const avgAqi = ncrAqi?.summary?.averageAqi || 0;

  useEffect(() => {
    // Recalculate health data when AQI or category changes
    const data = getHealthAdvisoryData(avgAqi, userCategory);
    setHealthData(data);
  }, [avgAqi, userCategory]);

  const categoryData = USER_CATEGORIES.find(c => c.id === userCategory) || USER_CATEGORIES[0];

  const getRiskColor = (risk) => {
    const colors = {
      'minimal': 'text-[#1E8A3D] bg-green-400/10 border-green-400/30',
      'low': 'text-[#1E8A3D] bg-green-400/10 border-green-400/30',
      'moderate': 'text-[#A67A00] bg-yellow-400/10 border-yellow-400/30',
      'high': 'text-[#C76A1C] bg-orange-400/10 border-orange-400/30',
      'very high': 'text-[#C62828] bg-red-400/10 border-red-400/30',
      'severe': 'text-[#C62828] bg-red-500/10 border-red-500/30',
      'hazardous': 'text-[#C62828] bg-red-600/10 border-red-600/30',
    };
    return colors[risk.toLowerCase()] || colors.moderate;
  };

  if (!healthData) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-64 bg-[#f0f4f8] rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#C62828]" />
          <h3 className="section-title mb-0">Health Advisory</h3>
        </div>
        <div 
          className="px-2 py-1 rounded-full text-xs"
          style={{ 
            backgroundColor: `${getAqiColor(avgAqi)}15`,
            color: getAqiColor(avgAqi) 
          }}
        >
          AQI: {avgAqi}
        </div>
      </div>

      {/* User Category Selector */}
      <div className="relative mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-[#f0f4f8] border border-[#d0e0f0] hover:border-white/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryData.icon}</span>
            <div className="text-left">
              <p className="text-xs text-black">I am a</p>
              <p className="font-medium text-black">{categoryData.label}</p>
              <p className="text-xs text-black">{categoryData.description}</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 w-full mt-2 p-2 rounded-xl bg-[#e8f0f8] border border-[#d0e0f0] shadow-xl"
            >
              {USER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setUserCategory(cat.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    userCategory === cat.id 
                      ? 'bg-primary-600/20 text-primary-400' 
                      : 'hover:bg-[#f0f4f8] text-black'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div className="text-left">
                    <span className="font-medium">{cat.label}</span>
                    <p className="text-xs text-black">{cat.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Health Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <HealthCard 
          icon={<Activity className="w-4 h-4" />}
          label="Risk Level"
          value={healthData.riskLevel}
          className={getRiskColor(healthData.riskLevel)}
        />
        <HealthCard 
          icon={<Clock className="w-4 h-4" />}
          label="Safe Outdoor Time"
          value={healthData.safeTime}
        />
        <HealthCard 
          icon={<Shield className="w-4 h-4" />}
          label="Recommended Mask"
          value={healthData.maskType}
        />
        <HealthCard 
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Exposure Limit"
          value={healthData.exposureLimit}
        />
      </div>

      {/* Symptoms Alert */}
      {healthData.symptoms.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <h4 className="text-sm font-medium text-[#C62828] mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Possible Symptoms
          </h4>
          <div className="flex flex-wrap gap-2">
            {healthData.symptoms.map((symptom, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-[#C62828]">
                {symptom}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Do's and Don'ts */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
          <h4 className="text-sm font-medium text-[#1E8A3D] mb-2 flex items-center gap-1">
            <Check className="w-4 h-4" /> Do
          </h4>
          <ul className="text-xs text-[#1A1A1A] space-y-1">
            {healthData.dos.map((item, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-[#1E8A3D]">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <h4 className="text-sm font-medium text-[#C62828] mb-2 flex items-center gap-1">
            <X className="w-4 h-4" /> Don't
          </h4>
          <ul className="text-xs text-[#1A1A1A] space-y-1">
            {healthData.donts.map((item, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-[#C62828]">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Indoor Precautions */}
      <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">🏠 Indoor Precautions</h4>
        <p className="text-xs text-[#1A1A1A]">{healthData.indoorPrecautions}</p>
      </div>

      {/* AI Summary */}
      {healthData.summary && (
        <div className="mt-4 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #E8FFF7 0%, #FFFFFF 100%)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">💡 Health Summary</h4>
          <p className="text-xs text-[#1A1A1A]">{healthData.summary}</p>
        </div>
      )}
    </motion.div>
  );
}

function HealthCard({ icon, label, value, className = '' }) {
  return (
    <div 
      className={`p-4 rounded-xl border ${className}`}
      style={{ 
        background: 'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}
    >
      <div className="flex items-center gap-2 mb-2 text-[#1A1A1A]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

/**
 * Get comprehensive health advisory data based on AQI and user category
 */
function getHealthAdvisoryData(aqi, category) {
  // Calculate base severity from AQI
  let baseSeverity = 'low';
  if (aqi <= 50) baseSeverity = 'low';
  else if (aqi <= 100) baseSeverity = 'moderate';
  else if (aqi <= 200) baseSeverity = 'high';
  else if (aqi <= 300) baseSeverity = 'very high';
  else if (aqi <= 400) baseSeverity = 'severe';
  else baseSeverity = 'hazardous';

  // Apply category modifiers
  const severityModifiers = {
    general: 0,
    child: 1,
    elderly: 1,
    asthmatic: 2,
    pregnant: 1,
    heartPatient: 2,
    outdoorWorker: 0, // Special handling
    athlete: 0, // Special handling
  };

  const modifier = severityModifiers[category] || 0;
  const severityLevels = ['low', 'moderate', 'high', 'very high', 'severe', 'hazardous'];
  const baseIndex = severityLevels.indexOf(baseSeverity);
  const finalIndex = Math.min(severityLevels.length - 1, baseIndex + modifier);
  const finalSeverity = severityLevels[finalIndex];

  // Get category-specific data
  const categoryData = getCategorySpecificData(aqi, category, finalSeverity);
  
  return {
    riskLevel: categoryData.riskLevel,
    safeTime: categoryData.safeTime,
    maskType: categoryData.maskType,
    symptoms: categoryData.symptoms,
    dos: categoryData.dos,
    donts: categoryData.donts,
    indoorPrecautions: categoryData.indoorPrecautions,
    exposureLimit: categoryData.exposureLimit,
    summary: categoryData.summary,
  };
}

/**
 * Get category-specific health data
 */
function getCategorySpecificData(aqi, category, severity) {
  const data = {
    general: {
      riskLevel: severity === 'low' ? 'Low' : severity === 'moderate' ? 'Moderate' : severity === 'high' ? 'High' : severity === 'very high' ? 'Very High' : severity === 'severe' ? 'Severe' : 'Hazardous',
      safeTime: aqi <= 50 ? 'Unlimited' : aqi <= 100 ? '6-8 hours' : aqi <= 200 ? '3-4 hours' : aqi <= 300 ? '< 1 hour' : '0 minutes',
      maskType: aqi <= 50 ? 'Not required' : aqi <= 100 ? 'Optional' : aqi <= 200 ? 'N95 recommended' : aqi <= 300 ? 'N95 required' : 'N95/N99 required',
      symptoms: aqi > 100 ? ['Throat irritation'] : [],
      dos: aqi <= 100 ? ['Morning walks', 'Light outdoor exercise', 'Parks with greenery'] : aqi <= 200 ? ['Indoor workout', 'Short outdoor breaks', 'Use masks outdoors'] : ['Stay indoors', 'Use air purifier', 'Keep hydrated'],
      donts: aqi <= 100 ? ['Heavy traffic areas', 'Industrial zones'] : aqi <= 200 ? ['Don\'t go for jogging today', 'Prolonged outdoor exposure'] : ['Any outdoor exercise', 'Opening windows', 'Going out without N95'],
      indoorPrecautions: aqi <= 100 ? 'Normal ventilation okay. Keep home clean.' : aqi <= 200 ? 'Keep windows closed during peak hours. Run air purifier if available.' : 'Keep all windows closed. Use air purifier on high. Seal gaps.',
      exposureLimit: aqi <= 50 ? 'No limit' : aqi <= 100 ? '8+ hours' : aqi <= 200 ? '3-4 hours' : aqi <= 300 ? '1-2 hours' : 'Avoid completely',
      summary: `Current AQI ${aqi} poses ${severity} risk for healthy adults. ${aqi <= 100 ? 'Generally safe for outdoor activities.' : aqi <= 200 ? 'Reduce prolonged outdoor exertion.' : 'Avoid strenuous outdoor activities.'}`,
    },
    child: {
      riskLevel: severity === 'low' ? 'Moderate' : severity === 'moderate' ? 'High' : severity === 'high' ? 'Very High' : severity === 'very high' ? 'Severe' : severity === 'severe' ? 'Hazardous' : 'Hazardous',
      safeTime: aqi <= 50 ? '4-6 hours' : aqi <= 100 ? '2-3 hours' : aqi <= 200 ? '1 hour' : aqi <= 300 ? '30 minutes' : '0 minutes',
      maskType: aqi <= 50 ? 'Optional' : aqi <= 100 ? 'N95 child-fit recommended' : aqi <= 200 ? 'N95 child-fit required' : 'N95/N99 child-fit mandatory',
      symptoms: aqi > 50 ? ['Wheezing', 'Coughing'] : [],
      dos: ['Isolate indoors', 'Use humidifier', 'Indoor play activities', 'Keep emergency contacts ready'],
      donts: ['School outdoor play', 'Sports activities', 'Prolonged outdoor exposure', 'Areas near construction'],
      indoorPrecautions: 'Keep all windows closed. Use air purifier and humidifier. Monitor for breathing difficulties.',
      exposureLimit: aqi <= 50 ? '4-6 hours' : aqi <= 100 ? '2-3 hours' : aqi <= 200 ? '1 hour' : aqi <= 300 ? '< 30 min' : 'Avoid completely',
      summary: `Children are more vulnerable. AQI ${aqi} means ${severity} risk. ${aqi <= 100 ? 'Limit outdoor play time.' : 'Keep children indoors as much as possible.'}`,
    },
    elderly: {
      riskLevel: severity === 'low' ? 'Moderate' : severity === 'moderate' ? 'High' : severity === 'high' ? 'Very High' : severity === 'very high' ? 'Severe' : severity === 'severe' ? 'Hazardous' : 'Hazardous',
      safeTime: aqi <= 50 ? '4-6 hours' : aqi <= 100 ? '2-3 hours' : aqi <= 200 ? '1 hour' : aqi <= 300 ? '30 minutes' : '0 minutes',
      maskType: aqi <= 50 ? 'Optional' : aqi <= 100 ? 'N95 recommended' : aqi <= 200 ? 'N95 required' : 'N95/N99 mandatory',
      symptoms: aqi > 100 ? ['Breathing difficulty', 'Chest tightness', 'Dizziness'] : [],
      dos: ['Stay indoors', 'Use air purifier', 'Keep medications ready', 'Light indoor exercises'],
      donts: ['Strenuous activities', 'Morning walks', 'Outdoor gatherings', 'Areas with high traffic'],
      indoorPrecautions: 'Keep all windows closed. Use air purifier on high. Ensure medications are accessible.',
      exposureLimit: aqi <= 50 ? '4-6 hours' : aqi <= 100 ? '2-3 hours' : aqi <= 200 ? '1 hour' : aqi <= 300 ? '< 30 min' : 'Avoid completely',
      summary: `Elderly individuals face ${severity} risk at AQI ${aqi}. ${aqi <= 100 ? 'Limit outdoor time.' : 'Stay indoors and monitor health closely.'}`,
    },
    asthmatic: {
      riskLevel: severity === 'low' ? 'High' : severity === 'moderate' ? 'Very High' : severity === 'high' ? 'Severe' : severity === 'very high' ? 'Hazardous' : severity === 'severe' ? 'Hazardous' : 'Hazardous',
      safeTime: aqi <= 50 ? '2-3 hours' : aqi <= 100 ? '1 hour' : aqi <= 200 ? '30 minutes' : aqi <= 300 ? '15 minutes' : 'None',
      maskType: aqi <= 50 ? 'N95 recommended' : aqi <= 100 ? 'N95 required' : aqi <= 200 ? 'N99 required' : 'N99 mandatory',
      symptoms: aqi > 50 ? ['Chest tightness', 'Shortness of breath', 'Wheezing', 'Coughing'] : [],
      dos: ['Emergency inhaler ready', 'Stay indoors', 'Use air purifier', 'Keep rescue medication accessible'],
      donts: ['Any outdoor activity', 'Physical exertion', 'Areas with smoke/dust', 'Opening windows'],
      indoorPrecautions: 'Complete indoor isolation. Air purifier essential. Keep rescue inhaler and medications within reach. Monitor breathing closely.',
      exposureLimit: aqi <= 50 ? '2-3 hours' : aqi <= 100 ? '1 hour' : aqi <= 200 ? '30 min' : aqi <= 300 ? '15 min' : 'None',
      summary: `Asthma patients face ${severity} risk. AQI ${aqi} can trigger severe symptoms. Stay indoors and keep emergency medication ready.`,
    },
    pregnant: {
      riskLevel: severity === 'low' ? 'Moderate' : severity === 'moderate' ? 'High' : severity === 'high' ? 'Very High' : severity === 'very high' ? 'Severe' : severity === 'severe' ? 'Hazardous' : 'Hazardous',
      safeTime: aqi <= 50 ? '4-6 hours' : aqi <= 100 ? '2-3 hours' : aqi <= 200 ? '1 hour' : aqi <= 300 ? '30 minutes' : '0 minutes',
      maskType: aqi <= 50 ? 'Optional' : aqi <= 100 ? 'N95 recommended' : aqi <= 200 ? 'N95 required' : 'N95/N99 mandatory',
      symptoms: aqi > 100 ? ['Headache', 'Nausea', 'Fatigue', 'Breathing difficulty'] : [],
      dos: ['Stay indoors', 'Use air purifier', 'Light indoor exercises', 'Stay hydrated'],
      donts: ['Outdoor walks', 'Strenuous activities', 'Areas with high pollution', 'Prolonged outdoor exposure'],
      indoorPrecautions: 'Keep all windows closed. Use air purifier on high. Ensure good ventilation with filtered air only.',
      exposureLimit: aqi <= 50 ? '4-6 hours' : aqi <= 100 ? '2-3 hours' : aqi <= 200 ? '1 hour' : aqi <= 300 ? '< 30 min' : 'Avoid completely',
      summary: `Pregnant women should be cautious. AQI ${aqi} means ${severity} risk. ${aqi <= 100 ? 'Limit outdoor time.' : 'Stay indoors as much as possible to protect both mother and baby.'}`,
    },
    heartPatient: {
      riskLevel: severity === 'low' ? 'High' : severity === 'moderate' ? 'Very High' : severity === 'high' ? 'Severe' : severity === 'very high' ? 'Hazardous' : severity === 'severe' ? 'Hazardous' : 'Hazardous',
      safeTime: aqi <= 50 ? '2-3 hours' : aqi <= 100 ? '1 hour' : aqi <= 200 ? '30 minutes' : aqi <= 300 ? '15 minutes' : 'None',
      maskType: aqi <= 50 ? 'N95 recommended' : aqi <= 100 ? 'N95 required' : aqi <= 200 ? 'N99 required' : 'N99 mandatory',
      symptoms: aqi > 100 ? ['Chest pain', 'Irregular heartbeat', 'Shortness of breath', 'Dizziness'] : [],
      dos: ['Stay indoors', 'Keep medications ready', 'Use air purifier', 'Monitor heart rate'],
      donts: ['Physical exertion', 'Outdoor activities', 'Stressful situations', 'Areas with high pollution'],
      indoorPrecautions: 'Complete indoor isolation. Air purifier essential. Keep emergency medications accessible. Monitor vital signs.',
      exposureLimit: aqi <= 50 ? '2-3 hours' : aqi <= 100 ? '1 hour' : aqi <= 200 ? '30 min' : aqi <= 300 ? '15 min' : 'None',
      summary: `Heart patients face ${severity} risk at AQI ${aqi}. Air pollution can worsen cardiovascular conditions. Stay indoors and monitor health.`,
    },
    outdoorWorker: {
      riskLevel: severity === 'low' ? 'Low' : severity === 'moderate' ? 'Moderate' : severity === 'high' ? 'High' : severity === 'very high' ? 'Very High' : severity === 'severe' ? 'Severe' : 'Hazardous',
      safeTime: aqi <= 50 ? '8+ hours' : aqi <= 100 ? '6 hours' : aqi <= 200 ? '4 hours' : aqi <= 300 ? '2 hours' : aqi <= 400 ? '1 hour' : '30 minutes',
      maskType: aqi <= 50 ? 'Optional' : aqi <= 100 ? 'N95 recommended' : aqi <= 200 ? 'N95 required' : aqi <= 300 ? 'N95/N99 required' : 'N99 mandatory',
      symptoms: aqi > 150 ? ['Throat irritation', 'Coughing', 'Eye irritation', 'Headache'] : [],
      dos: ['Wear N95/N99 mask', 'Take frequent breaks indoors', 'Stay hydrated', 'Shower after work'],
      donts: ['Work without mask', 'Skip breaks', 'Ignore symptoms', 'Work in peak pollution hours'],
      indoorPrecautions: 'After work, shower immediately. Use air purifier at home. Keep work clothes separate.',
      exposureLimit: aqi <= 50 ? '8+ hours' : aqi <= 100 ? '6 hours' : aqi <= 200 ? '4 hours' : aqi <= 300 ? '2 hours' : aqi <= 400 ? '1 hour' : '30 min',
      summary: `Outdoor workers face extended exposure. AQI ${aqi} means ${severity} risk. Always wear appropriate mask and take regular breaks.`,
    },
    athlete: {
      riskLevel: severity === 'low' ? 'Low' : severity === 'moderate' ? 'Moderate' : severity === 'high' ? 'High' : severity === 'very high' ? 'Very High' : severity === 'severe' ? 'Severe' : 'Hazardous',
      safeTime: aqi <= 50 ? 'Unlimited' : aqi <= 100 ? '4-6 hours' : aqi <= 200 ? '2 hours' : aqi <= 300 ? '1 hour' : '0 minutes',
      maskType: aqi <= 50 ? 'Not required' : aqi <= 100 ? 'Optional' : aqi <= 200 ? 'N95 recommended' : aqi <= 300 ? 'N95 required' : 'N95/N99 required',
      symptoms: aqi > 100 ? ['Reduced performance', 'Breathing difficulty', 'Fatigue'] : [],
      dos: ['Indoor workout', 'Gym sessions', 'Swimming (indoor)', 'Yoga/stretching'],
      donts: ['Outdoor running', 'Outdoor sports', 'High-intensity outdoor training', 'Marathons/races'],
      indoorPrecautions: 'Switch to indoor training facilities. Use well-ventilated gyms with air filtration.',
      exposureLimit: aqi <= 50 ? 'No limit' : aqi <= 100 ? '4-6 hours' : aqi <= 200 ? '2 hours' : aqi <= 300 ? '1 hour' : 'Avoid completely',
      summary: `Athletes should avoid outdoor training at AQI ${aqi} (${severity} risk). Switch to indoor facilities to maintain performance and health.`,
    },
  };

  return data[category] || data.general;
}
