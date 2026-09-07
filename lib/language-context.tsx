'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './i18n';
import { Pandal, MetroStation, FoodStall, CrowdLevel } from './types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  tPandalName: (pandalOrName: Partial<Pandal> | string | null | undefined, bnName?: string) => string;
  tMetroName: (stationOrName: Partial<MetroStation> | string | null | undefined, bnName?: string) => string;
  tFoodName: (stallOrName: Partial<FoodStall> | string | null | undefined, bnName?: string) => string;
  tRegion: (region: string) => string;
  tCrowd: (level: CrowdLevel | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pujo_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
      if (savedLang === 'en' || savedLang === 'bn') {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      }
    } catch (e) {
      console.warn('Could not read saved language preference:', e);
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      if (lang === 'bn') {
        document.body.classList.add('lang-bn');
      } else {
        document.body.classList.remove('lang-bn');
      }
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'bn' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  const tPandalName = (pandalOrName: Partial<Pandal> | string | null | undefined, bnName?: string): string => {
    if (!pandalOrName) return '';
    if (typeof pandalOrName === 'string') {
      if (language === 'bn' && bnName && bnName.trim() !== '') return bnName;
      return pandalOrName;
    }
    if (language === 'bn' && pandalOrName.bengaliName && pandalOrName.bengaliName.trim() !== '') {
      return pandalOrName.bengaliName;
    }
    return pandalOrName.name || '';
  };

  const tMetroName = (stationOrName: Partial<MetroStation> | string | null | undefined, bnName?: string): string => {
    if (!stationOrName) return '';
    if (typeof stationOrName === 'string') {
      if (language === 'bn' && bnName && bnName.trim() !== '') return bnName;
      return stationOrName;
    }
    if (language === 'bn' && stationOrName.bengaliName && stationOrName.bengaliName.trim() !== '') {
      return stationOrName.bengaliName;
    }
    return stationOrName.name || '';
  };

  const tFoodName = (stallOrName: Partial<FoodStall> | string | null | undefined, bnName?: string): string => {
    if (!stallOrName) return '';
    if (typeof stallOrName === 'string') {
      if (language === 'bn' && bnName && bnName.trim() !== '') return bnName;
      return stallOrName;
    }
    if (language === 'bn' && stallOrName.bengaliName && stallOrName.bengaliName.trim() !== '') {
      return stallOrName.bengaliName;
    }
    return stallOrName.name || '';
  };

  const tRegion = (region: string): string => {
    if (!region) return '';
    if (language === 'bn') {
      const regTrans = translations.bn[region];
      if (regTrans) return regTrans;
    }
    return region;
  };

  const tCrowd = (level: CrowdLevel | string): string => {
    if (!level) return '';
    if (language === 'bn') {
      const crowdTrans = translations.bn[level];
      if (crowdTrans) return crowdTrans;
    }
    return level;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        tPandalName,
        tMetroName,
        tFoodName,
        tRegion,
        tCrowd,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
