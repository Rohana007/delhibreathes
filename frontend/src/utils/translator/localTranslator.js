/**
 * Advanced Local Translation Engine
 * Defaults to Hindi (hi) for full Hindi integration
 */

import { translations, TRANSLITERATIONS } from '../../i18n/translations';

// Debug mode (set window.I18N_DEBUG = true to enable)
const DEBUG = typeof window !== 'undefined' && window.I18N_DEBUG === true;
const missingKeys = new Set();

/**
 * Transliterate safe words (never translate, only transliterate)
 * In English mode, returns text as-is without any transliteration
 */
export function transliterateSafeWords(text, lang = 'en') {
  if (!text || typeof text !== 'string') return text;
  
  // In English mode, return text as-is (no transliteration needed)
  if (lang === 'en') {
    return text;
  }
  
  const transliterationMap = TRANSLITERATIONS[lang] || TRANSLITERATIONS.en;
  let result = text;
  
  // Replace safe words with transliterations (only for non-English languages)
  Object.keys(transliterationMap).forEach(safeWord => {
    const transliteration = transliterationMap[safeWord];
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${safeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, transliteration);
  });
  
  return result;
}

/**
 * Translate a single element, preserving placeholders and dynamic content
 */
export function translateElement(el, dict) {
  if (!el || !dict) return;
  
  // Skip if element has no text content or is a script/style tag
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
    return;
  }
  
  // Get the translation key from data-translate attribute (English text)
  const englishText = el.getAttribute('data-translate');
  if (!englishText) return;
  
  // Get translation (English text as key)
  const translation = dict[englishText];
  if (!translation) {
    if (DEBUG) {
      missingKeys.add(englishText);
      console.warn(`[I18N] Missing translation for: "${englishText}"`);
    }
    // For English mode, if translation missing, use the English text from data-translate
    if (getCurrentLang() === 'en') {
      el.textContent = englishText;
    }
    return; // Fallback to original text
  }
  
  // Check if element has dynamic content
  const hasDynamicContent = Array.from(el.children).some(child => {
    return child.textContent.includes('{{') || 
           child.textContent.includes('{') ||
           child.hasAttribute('data-dynamic');
  });
  
  if (hasDynamicContent) {
    // Only translate static text parts, preserve dynamic content
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      el.textContent = transliterateSafeWords(translation, getCurrentLang());
    }
  } else {
    // Simple text replacement
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      el.textContent = transliterateSafeWords(translation, getCurrentLang());
    } else {
      // For elements with mixed content, try to preserve structure
      const translated = transliterateSafeWords(translation, getCurrentLang());
      // Only replace if it's safe to do so
      if (!el.querySelector('input, textarea, select, button, a, img, svg')) {
        el.textContent = translated;
      }
    }
  }
}

/**
 * Get current language from localStorage (defaults to English)
 */
function getCurrentLang() {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('lang') || 'en'; // Default to English
}

/**
 * Apply translation to the entire page
 */
export function applyTranslation(lang = 'en') {
  if (typeof window === 'undefined') return;
  
  const dict = translations[lang] || translations.en;
  if (!dict) {
    console.error(`[I18N] Translation dictionary not found for language: ${lang}`);
    return;
  }
  
  // Clear missing keys set
  missingKeys.clear();
  
  // Find all elements with data-translate attribute
  const elements = document.querySelectorAll('[data-translate]');
  
  elements.forEach(el => {
    try {
      translateElement(el, dict);
    } catch (error) {
      if (DEBUG) {
        console.error(`[I18N] Error translating element:`, el, error);
      }
    }
  });
  
  // Log missing keys summary if debug mode is enabled
  if (DEBUG && missingKeys.size > 0) {
    console.group(`[I18N] Missing Translation Keys (${missingKeys.size})`);
    Array.from(missingKeys).sort().forEach(key => {
      console.warn(`  - "${key}"`);
    });
    console.groupEnd();
  }
  
  // Store current language
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('lang', lang);
  }
}

/**
 * Initialize translation system with MutationObserver for dynamic content
 * Defaults to Hindi
 */
let observer = null;
let isInitialized = false;

export function initTranslation() {
  if (isInitialized) return;
  if (typeof window === 'undefined') return;
  
  // Default to English, check localStorage for override
  const savedLang = localStorage.getItem('lang') || 'en';
  
  // Apply initial translation
  applyTranslation(savedLang);
  
  // Set up MutationObserver for dynamically added content
  let observerTimeout = null;
  
  observer = new MutationObserver((mutations) => {
    // Debounce observer calls
    if (observerTimeout) {
      clearTimeout(observerTimeout);
    }
    
    observerTimeout = setTimeout(() => {
      const currentLang = getCurrentLang();
      const dict = translations[currentLang] || translations.en;
      
      // Check if any new nodes have data-translate attributes
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the node itself
            if (node.hasAttribute && node.hasAttribute('data-translate')) {
              translateElement(node, dict);
            }
            
            // Check children
            const translatableElements = node.querySelectorAll && node.querySelectorAll('[data-translate]');
            if (translatableElements) {
              translatableElements.forEach(el => {
                translateElement(el, dict);
              });
            }
          }
        });
      });
    }, 100); // 100ms debounce
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  isInitialized = true;
  
  // Expose for debugging
  if (typeof window !== 'undefined') {
    window.__applyTranslation = applyTranslation;
  }
  
  if (DEBUG) {
    console.log('[I18N] Translation system initialized');
    console.log(`[I18N] Current language: ${savedLang}`);
    console.log(`[I18N] Available languages:`, Object.keys(translations).join(', '));
  }
}

/**
 * Cleanup function to stop observing
 */
export function cleanupTranslation() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  isInitialized = false;
}

// Export for backward compatibility
export default {
  applyTranslation,
  initTranslation,
  cleanupTranslation,
  translateElement,
  transliterateSafeWords
};
