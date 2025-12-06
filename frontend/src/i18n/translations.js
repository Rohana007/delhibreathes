/**
 * Comprehensive Translation Dictionary
 * Uses English text as keys for direct data-translate attribute matching
 * Defaults to Hindi (hi) for full Hindi integration
 */

// Transliteration map for safe words (never translated, only transliterated)
const TRANSLITERATIONS = {
  en: {
    "Delhi Breathes": "Delhi Breathes",
    "AQI": "AQI",
    "PM2.5": "PM2.5",
    "PM10": "PM10",
    "NO2": "NO2",
    "O3": "O3",
    "CO": "CO",
    "NH3": "NH3",
    "Forecast": "Forecast",
    "Live AQI": "Live AQI",
    "Advisory": "Advisory",
    "Safe Route": "Safe Route",
    "Hotspots": "Hotspots",
    "My Reports": "My Reports",
    "User": "User"
  },
  hi: {
    "Delhi Breathes": "दिल्ली ब्रीद्स",
    "AQI": "AQI",
    "PM2.5": "PM2.5",
    "PM10": "PM10",
    "NO2": "NO2",
    "O3": "O3",
    "CO": "CO",
    "NH3": "NH3",
    "Forecast": "फोरकास्ट",
    "Live AQI": "लाइव AQI",
    "Advisory": "एडवाइजरी",
    "Safe Route": "सेफ रूट",
    "Hotspots": "हॉटस्पॉट",
    "My Reports": "मेरी रिपोर्टें",
    "User": "उपयोगकर्ता"
  }
};

// Import existing translations from JSON files
import enTranslations from '../utils/translator/languages/en.json';
import hiTranslations from '../utils/translator/languages/hi.json';

// Create translation maps using English text as keys
const createTranslationMaps = () => {
  const enMap = {};
  const hiMap = {};
  
  // Map JSON keys to English text keys
  Object.keys(enTranslations).forEach(key => {
    const englishText = enTranslations[key];
    const hindiText = hiTranslations[key] || englishText; // Fallback to English if missing
    
    if (typeof englishText === 'string' && englishText.trim()) {
      enMap[englishText] = englishText; // English maps to itself
      hiMap[englishText] = hindiText; // Hindi translation
    }
  });
  
  return { enMap, hiMap };
};

const { enMap, hiMap } = createTranslationMaps();

// Add common UI text that might appear in JSX but not in JSON
const additionalTranslations = {
  en: {
    "NCR Average": "NCR Average",
    "NCR Avg:": "NCR Avg:",
    "Air Quality Index": "Air Quality Index",
    "Fetching air quality data...": "Fetching air quality data...",
    "Unable to load live AQI data. Please check the backend logs and your network connection.": "Unable to load live AQI data. Please check the backend logs and your network connection.",
    "Air quality data is currently unavailable. Please try again in a moment.": "Air quality data is currently unavailable. Please try again in a moment.",
    "Tap for pollutant breakdown": "Tap for pollutant breakdown",
    "Select Language": "Select Language",
    "Refresh data": "Refresh data",
    "View my reports": "View my reports",
    "Stable": "Stable",
    "Something went wrong": "Something went wrong",
    "Failed to load data. Please check your connection and try again.": "Failed to load data. Please check your connection and try again.",
    "Try Again": "Try Again",
    "Loading...": "Loading...",
    "Policymaker Login": "Policymaker Login",
    "Citizen Login": "Citizen Login",
    "Sign in with your email and password to continue": "Sign in with your email and password to continue",
    "Enter your email": "Enter your email",
    "Enter your password": "Enter your password",
    "Signing in...": "Signing in...",
    "Sign In": "Sign In",
    "Don't have an account?": "Don't have an account?",
    "Sign up": "Sign up",
    "Create Account": "Create Account",
    "Sign up to start reporting pollution": "Sign up to start reporting pollution",
    "Name": "Name",
    "Enter your name": "Enter your name",
    "Enter your password (min 6 characters)": "Enter your password (min 6 characters)",
    "Confirm Password": "Confirm Password",
    "Confirm your password": "Confirm your password",
    "Creating account...": "Creating account...",
    "Already have an account?": "Already have an account?",
    "Back to Dashboard": "Back to Dashboard",
    "View and track all your pollution reports": "View and track all your pollution reports",
    "Loading your reports...": "Loading your reports...",
    "Loading reports...": "Loading reports...",
    "No reports yet": "No reports yet",
    "You haven't submitted any pollution reports yet.": "You haven't submitted any pollution reports yet.",
    "Disable Alerts?": "Disable Alerts?",
    "Turn off personalized alerts? You will no longer receive personalized alerts.": "Turn off personalized alerts? You will no longer receive personalized alerts.",
    "Normal": "Normal",
    "Asthma": "Asthma",
    "Child": "Child",
    "Elderly": "Elderly",
    "Pregnant": "Pregnant",
    "Heart Patient": "Heart Patient",
    "Sensitive": "Sensitive",
    "Healthy adult": "Healthy adult",
    "Respiratory condition": "Respiratory condition",
    "Children (sensitive)": "Children (sensitive)",
    "Senior citizens": "Senior citizens",
    "Pregnant women": "Pregnant women",
    "Cardiac condition": "Cardiac condition",
    "Sensitive individuals": "Sensitive individuals",
    "Enable Personalized Alerts": "Enable Personalized Alerts",
    "Select Region": "Select Region",
    "Select Health Category": "Select Health Category",
    "Cancel": "Cancel",
    "Enabling...": "Enabling...",
    "Enable Alerts": "Enable Alerts",
    "Get AQI alerts matched to your location & health category.": "Get AQI alerts matched to your location & health category.",
    "Alerts OFF": "Alerts OFF",
    "Enable": "Enable",
    "Alerts ON": "Alerts ON",
    "Personalized": "Personalized",
    "Category:": "Category:",
    "Region:": "Region:",
    "Threshold:": "Threshold:",
    "You will receive alerts when AQI crosses this limit.": "You will receive alerts when AQI crosses this limit.",
    "Manage": "Manage",
    "Disable": "Disable",
    "Real-Time Air Intelligence Platform": "Real-Time Air Intelligence Platform",
    "Login with your email and password to access real-time air quality data, personalized health recommendations, and pollution reports.": "Login with your email and password to access real-time air quality data, personalized health recommendations, and pollution reports.",
    "Continue": "Continue",
    "Login with your email and password to access advanced analytics, hotspot management, policy simulation tools, and comprehensive air quality reports.": "Login with your email and password to access advanced analytics, hotspot management, policy simulation tools, and comprehensive air quality reports.",
    "Report Pollution": "Report Pollution",
    "Help improve air quality monitoring": "Help improve air quality monitoring",
    "Report Details": "Report Details",
    "Type of Pollution *": "Type of Pollution *",
    "Location *": "Location *",
    "Location captured": "Location captured",
    "Get Current Location": "Get Current Location",
    "Description *": "Description *",
    "Describe what you observed...": "Describe what you observed...",
    "Photos (optional, max 3)": "Photos (optional, max 3)",
    "Submit Report": "Submit Report",
    "Recent Alerts:": "Recent Alerts:",
    "AQI in your region is now Hazardous ({{aqi}}). Avoid outdoor activity.": "AQI in your region is now Hazardous ({{aqi}}). Avoid outdoor activity.",
    "AQI in your region is now Very Unhealthy ({{aqi}}). Avoid outdoor activity.": "AQI in your region is now Very Unhealthy ({{aqi}}). Avoid outdoor activity.",
    "AQI in your region is now Unhealthy ({{aqi}}). Avoid outdoor activity.": "AQI in your region is now Unhealthy ({{aqi}}). Avoid outdoor activity.",
    "AQI in your region is now Moderate ({{aqi}}). Avoid outdoor activity.": "AQI in your region is now Moderate ({{aqi}}). Avoid outdoor activity.",
    "You are registered as 'Child'. Limit outdoor exposure. Current AQI: {{aqi}}": "You are registered as 'Child'. Limit outdoor exposure. Current AQI: {{aqi}}",
    "You are registered as 'Elderly'. Avoid outdoor activities. Current AQI: {{aqi}}": "You are registered as 'Elderly'. Avoid outdoor activities. Current AQI: {{aqi}}",
    "You are registered as 'Pregnant'. Limit outdoor exposure. Current AQI: {{aqi}}": "You are registered as 'Pregnant'. Limit outdoor exposure. Current AQI: {{aqi}}",
    "AQI rising by +{{change}} expected in next 6 hours.": "AQI rising by +{{change}} expected in next 6 hours."
  },
  hi: {
    "NCR Average": "एनसीआर औसत",
    "NCR Avg:": "एनसीआर औसत:",
    "Air Quality Index": "वायु गुणवत्ता सूचकांक",
    "Fetching air quality data...": "वायु गुणवत्ता डेटा प्राप्त कर रहे हैं...",
    "Unable to load live AQI data. Please check the backend logs and your network connection.": "लाइव AQI डेटा लोड करने में असमर्थ। कृपया बैकएंड लॉग और अपने नेटवर्क कनेक्शन की जांच करें।",
    "Air quality data is currently unavailable. Please try again in a moment.": "वायु गुणवत्ता डेटा वर्तमान में उपलब्ध नहीं है। कृपया कुछ समय बाद पुनः प्रयास करें।",
    "Tap for pollutant breakdown": "प्रदूषक विवरण के लिए टैप करें",
    "Select Language": "भाषा चुनें",
    "Refresh data": "डेटा रीफ्रेश करें",
    "View my reports": "मेरी रिपोर्ट देखें",
    "Stable": "स्थिर",
    "Something went wrong": "कुछ गलत हो गया",
    "Failed to load data. Please check your connection and try again.": "डेटा लोड करने में विफल। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
    "Try Again": "पुनः प्रयास करें",
    "Loading...": "लोड हो रहा है...",
    "Policymaker Login": "नीति निर्माता लॉगिन",
    "Citizen Login": "नागरिक लॉगिन",
    "Sign in with your email and password to continue": "अपने ईमेल और पासवर्ड के साथ साइन इन करें",
    "Enter your email": "अपना ईमेल दर्ज करें",
    "Enter your password": "अपना पासवर्ड दर्ज करें",
    "Signing in...": "साइन इन हो रहा है...",
    "Sign In": "साइन इन",
    "Don't have an account?": "खाता नहीं है?",
    "Sign up": "साइन अप करें",
    "Create Account": "खाता बनाएं",
    "Sign up to start reporting pollution": "प्रदूषण की रिपोर्ट करना शुरू करने के लिए साइन अप करें",
    "Name": "नाम",
    "Enter your name": "अपना नाम दर्ज करें",
    "Enter your password (min 6 characters)": "अपना पासवर्ड दर्ज करें (न्यूनतम 6 अक्षर)",
    "Confirm Password": "पासवर्ड की पुष्टि करें",
    "Confirm your password": "अपने पासवर्ड की पुष्टि करें",
    "Creating account...": "खाता बनाया जा रहा है...",
    "Already have an account?": "पहले से खाता है?",
    "Back to Dashboard": "डैशबोर्ड पर वापस जाएं",
    "View and track all your pollution reports": "अपनी सभी प्रदूषण रिपोर्ट देखें और ट्रैक करें",
    "Loading your reports...": "आपकी रिपोर्ट लोड हो रही हैं...",
    "Loading reports...": "रिपोर्ट लोड हो रही हैं...",
    "No reports yet": "अभी तक कोई रिपोर्ट नहीं",
    "You haven't submitted any pollution reports yet.": "आपने अभी तक कोई प्रदूषण रिपोर्ट सबमिट नहीं की है।",
    "Disable Alerts?": "अलर्ट अक्षम करें?",
    "Turn off personalized alerts? You will no longer receive personalized alerts.": "व्यक्तिगत अलर्ट बंद करें? आपको अब व्यक्तिगत अलर्ट नहीं मिलेंगे।",
    "Normal": "सामान्य",
    "Asthma": "दमा",
    "Child": "बच्चा",
    "Elderly": "बुजुर्ग",
    "Pregnant": "गर्भवती",
    "Heart Patient": "हृदय रोगी",
    "Sensitive": "संवेदनशील",
    "Healthy adult": "स्वस्थ वयस्क",
    "Respiratory condition": "श्वसन संबंधी स्थिति",
    "Children (sensitive)": "बच्चे (संवेदनशील)",
    "Senior citizens": "वरिष्ठ नागरिक",
    "Pregnant women": "गर्भवती महिलाएं",
    "Cardiac condition": "हृदय रोग",
    "Sensitive individuals": "संवेदनशील व्यक्ति",
    "Enable Personalized Alerts": "व्यक्तिगत अलर्ट सक्षम करें",
    "Select Region": "क्षेत्र चुनें",
    "Select Health Category": "स्वास्थ्य श्रेणी चुनें",
    "Cancel": "रद्द करें",
    "Enabling...": "सक्षम कर रहे हैं...",
    "Enable Alerts": "अलर्ट सक्षम करें",
    "Get AQI alerts matched to your location & health category.": "अपने स्थान और स्वास्थ्य श्रेणी से मेल खाने वाले AQI अलर्ट प्राप्त करें।",
    "Alerts OFF": "अलर्ट बंद",
    "Enable": "सक्षम करें",
    "Alerts ON": "अलर्ट चालू",
    "Personalized": "व्यक्तिगत",
    "Category:": "श्रेणी:",
    "Region:": "क्षेत्र:",
    "Threshold:": "सीमा:",
    "You will receive alerts when AQI crosses this limit.": "जब AQI इस सीमा को पार करेगा तो आपको अलर्ट मिलेंगे।",
    "Manage": "प्रबंधित करें",
    "Disable": "अक्षम करें",
    "Real-Time Air Intelligence Platform": "रियल-टाइम एयर इंटेलिजेंस प्लेटफॉर्म",
    "Login with your email and password to access real-time air quality data, personalized health recommendations, and pollution reports.": "रियल-टाइम वायु गुणवत्ता डेटा, व्यक्तिगत स्वास्थ्य सिफारिशें और प्रदूषण रिपोर्ट तक पहुंचने के लिए अपने ईमेल और पासवर्ड के साथ लॉगिन करें।",
    "Continue": "जारी रखें",
    "Login with your email and password to access advanced analytics, hotspot management, policy simulation tools, and comprehensive air quality reports.": "उन्नत विश्लेषण, हॉटस्पॉट प्रबंधन, नीति सिमुलेशन उपकरण और व्यापक वायु गुणवत्ता रिपोर्ट तक पहुंचने के लिए अपने ईमेल और पासवर्ड के साथ लॉगिन करें।",
    "Report Pollution": "प्रदूषण की रिपोर्ट करें",
    "Help improve air quality monitoring": "वायु गुणवत्ता निगरानी में सुधार करने में मदद करें",
    "Report Details": "रिपोर्ट विवरण",
    "Type of Pollution *": "प्रदूषण का प्रकार *",
    "Location *": "स्थान *",
    "Location captured": "स्थान कैप्चर किया गया",
    "Get Current Location": "वर्तमान स्थान प्राप्त करें",
    "Description *": "विवरण *",
    "Describe what you observed...": "आपने जो देखा उसका वर्णन करें...",
    "Photos (optional, max 3)": "फोटो (वैकल्पिक, अधिकतम 3)",
    "Submit Report": "रिपोर्ट सबमिट करें",
    "Recent Alerts:": "हाल की अलर्ट:",
    "AQI in your region is now Hazardous ({{aqi}}). Avoid outdoor activity.": "आपके क्षेत्र में AQI अब खतरनाक ({{aqi}}) है। बाहरी गतिविधियों से बचें।",
    "AQI in your region is now Very Unhealthy ({{aqi}}). Avoid outdoor activity.": "आपके क्षेत्र में AQI अब बहुत अस्वस्थ ({{aqi}}) है। बाहरी गतिविधियों से बचें।",
    "AQI in your region is now Unhealthy ({{aqi}}). Avoid outdoor activity.": "आपके क्षेत्र में AQI अब अस्वस्थ ({{aqi}}) है। बाहरी गतिविधियों से बचें।",
    "AQI in your region is now Moderate ({{aqi}}). Avoid outdoor activity.": "आपके क्षेत्र में AQI अब मध्यम ({{aqi}}) है। बाहरी गतिविधियों से बचें।",
    "You are registered as 'Child'. Limit outdoor exposure. Current AQI: {{aqi}}": "आप 'बच्चा' के रूप में पंजीकृत हैं। बाहरी एक्सपोजर सीमित करें। वर्तमान AQI: {{aqi}}",
    "You are registered as 'Elderly'. Avoid outdoor activities. Current AQI: {{aqi}}": "आप 'बुजुर्ग' के रूप में पंजीकृत हैं। बाहरी गतिविधियों से बचें। वर्तमान AQI: {{aqi}}",
    "You are registered as 'Pregnant'. Limit outdoor exposure. Current AQI: {{aqi}}": "आप 'गर्भवती' के रूप में पंजीकृत हैं। बाहरी एक्सपोजर सीमित करें। वर्तमान AQI: {{aqi}}",
    "AQI rising by +{{change}} expected in next 6 hours.": "अगले 6 घंटों में AQI में +{{change}} की वृद्धि की उम्मीद है।"
  }
};

// Merge all translations
const translations = {
  en: { ...enMap, ...additionalTranslations.en },
  hi: { ...hiMap, ...additionalTranslations.hi }
};

export { translations, TRANSLITERATIONS };
export default translations;
