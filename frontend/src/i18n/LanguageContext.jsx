import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { en } from './translations/en';
import { ta } from './translations/ta';
import {
  LANGUAGE_STORAGE_KEY,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGES,
} from './constants';

const translations = {
  en,
  ta,
};

export const LanguageContext = createContext(null);

/**
 * Safely resolves nested property values using a dot-separated path.
 * e.g. getNestedValue(en, 'nav.home') => 'Home'
 */
const getNestedValue = (obj, path) => {
  if (!obj || typeof obj !== 'object' || !path) return undefined;
  
  // Direct property check first (handles flat keys or pre-resolved paths)
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  // Traverse dot notation
  const segments = String(path).split('.');
  let current = obj;
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
};

/**
 * Formats a translation string by replacing placeholder tokens like {name} or {{name}}.
 */
const interpolate = (template, params) => {
  if (!template || typeof template !== 'string' || !params || typeof params !== 'object') {
    return template;
  }
  return template.replace(/\{{1,2}\s*([\w.]+)\s*\}{1,2}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
  });
};

export const LanguageProvider = ({ children }) => {
  // Safe initialization avoiding module-level browser API access
  const [language, setLanguageState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
          return savedLanguage;
        }
      }
    } catch {
      // LocalStorage access restricted / private browsing mode
    }
    return DEFAULT_LANGUAGE;
  });

  // Change language and persist to localStorage
  const changeLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) {
      console.warn(`[i18n] Language "${newLang}" is not supported. Fallback to "${DEFAULT_LANGUAGE}".`);
      return;
    }

    setLanguageState(newLang);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      }
    } catch {
      // Ignore if localStorage is blocked or throws
    }
  }, []);

  // Update document lang and data-language attributes for accessibility and styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('data-language', language);
    }
  }, [language]);

  // Synchronize language changes across browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue && SUPPORTED_LANGUAGES.includes(e.newValue)) {
        setLanguageState(e.newValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  /**
   * Translation lookup function.
   * Priority:
   * 1. Active language translation (ta or en)
   * 2. Fallback to English (en)
   * 3. Provided defaultValue
   * 4. The lookup key itself
   */
  const t = useCallback((key, params = {}, defaultValue = undefined) => {
    if (!key) return '';

    // 1. Try active language
    let text = getNestedValue(translations[language], key);

    // 2. Fallback to default language (English) if missing
    if (text === undefined && language !== DEFAULT_LANGUAGE) {
      text = getNestedValue(translations[DEFAULT_LANGUAGE], key);
    }

    // 3. Fallback to defaultValue or key
    if (text === undefined) {
      text = defaultValue !== undefined ? defaultValue : key;
    }

    // 4. Parameter interpolation
    return interpolate(text, params);
  }, [language]);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    language,
    currentLanguage: language,
    changeLanguage,
    setLanguage: changeLanguage,
    t,
    languages: LANGUAGES,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isTamil: language === 'ta',
    isEnglish: language === 'en',
  }), [language, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Convenient alias matching standard i18n conventions
export const useTranslation = () => {
  return useLanguage();
};

export default LanguageContext;
