import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ThemeId,
  ThemeDefinition,
  ENTERPRISE_THEMES,
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  getThemeDefinition,
  isValidThemeId,
} from '../utils/themes';
import { Language, TRANSLATIONS, getLocalizedFiscalMonth } from '../i18n/translations';
import { syncDomTranslations, isSyncingDomTranslations } from '../i18n/domPhraseMap';

interface AppPreferencesContextValue {
  // Theme state
  themeId: ThemeId;
  theme: ThemeDefinition;
  themes: ThemeDefinition[];
  isDark: boolean;
  setThemeId: (nextThemeId: ThemeId) => void;
  toggleLightDark: () => void;

  // Language state
  language: Language;
  locale: 'id-ID' | 'en-US';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  formatFiscalMonth: (fiscalMonth: number) => string;
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | undefined>(undefined);

const STORAGE_THEME_ID = 'mpcs_theme_id';
const STORAGE_LEGACY_THEME = 'mpcs_theme';
const STORAGE_LAST_LIGHT = 'mpcs_last_light_theme';
const STORAGE_LAST_DARK = 'mpcs_last_dark_theme';
const STORAGE_LANGUAGE = 'mpcs_language';

function resolveInitialThemeId(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_LIGHT_THEME;
  const savedId = localStorage.getItem(STORAGE_THEME_ID);
  if (isValidThemeId(savedId)) return savedId;

  const legacy = localStorage.getItem(STORAGE_LEGACY_THEME);
  if (legacy === 'dark') return DEFAULT_DARK_THEME;
  if (legacy === 'light') return DEFAULT_LIGHT_THEME;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? DEFAULT_DARK_THEME
    : DEFAULT_LIGHT_THEME;
}

function resolveInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'id';
  const saved = localStorage.getItem(STORAGE_LANGUAGE);
  if (saved === 'en' || saved === 'id') return saved;
  return 'id';
}

export const AppPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(resolveInitialThemeId);
  const [language, setLanguageState] = useState<Language>(resolveInitialLanguage);

  const theme = useMemo(() => getThemeDefinition(themeId), [themeId]);
  const isDark = theme.mode === 'dark';

  // Apply Theme to DOM & Persist
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_LEGACY_THEME, 'dark');
      localStorage.setItem(STORAGE_LAST_DARK, theme.id);
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_LEGACY_THEME, 'light');
      localStorage.setItem(STORAGE_LAST_LIGHT, theme.id);
    }
    localStorage.setItem(STORAGE_THEME_ID, theme.id);
  }, [theme.id, isDark]);

  // Apply Language to DOM, document title, and observe all views/modals/portals bidirectionally
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_LANGUAGE, language);

    const localizedTitle = TRANSLATIONS[language]['app.title'];
    if (localizedTitle) {
      document.title = localizedTitle;
    }

    const targetRoot = document.body || document.getElementById('root');
    if (!targetRoot) return;

    // Run immediate pass after React paints + delayed pass for animated portals/modals
    const frame = requestAnimationFrame(() => {
      syncDomTranslations(targetRoot, language);
    });
    const followUpTimer = window.setTimeout(() => {
      syncDomTranslations(targetRoot, language);
    }, 140);

    let pendingTimer: number | null = null;
    const observer = new MutationObserver(() => {
      if (isSyncingDomTranslations()) return;
      if (pendingTimer !== null) return;
      pendingTimer = window.setTimeout(() => {
        pendingTimer = null;
        syncDomTranslations(targetRoot, language);
      }, 30);
    });

    observer.observe(targetRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(followUpTimer);
      if (pendingTimer !== null) window.clearTimeout(pendingTimer);
      observer.disconnect();
    };
  }, [language]);

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    if (!isValidThemeId(nextThemeId)) return;
    const apply = () => setThemeIdState(nextThemeId);
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      try {
        (document as any).startViewTransition(apply);
      } catch {
        apply();
      }
    } else {
      apply();
    }
  }, []);

  const toggleLightDark = useCallback(() => {
    const nextIsDark = !isDark;
    const preferredKey = nextIsDark ? STORAGE_LAST_DARK : STORAGE_LAST_LIGHT;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(preferredKey) : null;
    const fallback = nextIsDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
    const target = isValidThemeId(saved) ? saved : fallback;
    setThemeId(target);
  }, [isDark, setThemeId]);

  const setLanguage = useCallback((nextLang: Language) => {
    setLanguageState(nextLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'id' ? 'en' : 'id'));
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return TRANSLATIONS[language][key] || TRANSLATIONS.id[key] || fallback || key;
    },
    [language]
  );

  const formatFiscalMonth = useCallback(
    (fiscalMonth: number): string => getLocalizedFiscalMonth(fiscalMonth, language),
    [language]
  );

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      themeId,
      theme,
      themes: ENTERPRISE_THEMES,
      isDark,
      setThemeId,
      toggleLightDark,
      language,
      locale: language === 'en' ? 'en-US' : 'id-ID',
      setLanguage,
      toggleLanguage,
      t,
      formatFiscalMonth,
    }),
    [themeId, theme, isDark, setThemeId, toggleLightDark, language, setLanguage, toggleLanguage, t, formatFiscalMonth]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
};

export function usePreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within an AppPreferencesProvider');
  }
  return ctx;
}
