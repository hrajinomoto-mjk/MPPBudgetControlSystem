import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Palette, Check, ChevronDown } from 'lucide-react';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface ThemeToggleProps {
  isDark?: boolean;
  onToggle?: () => void;
  variant?: 'button' | 'switch' | 'compact' | 'picker';
  className?: string;
  showLabel?: boolean;
  darkSurface?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark: propIsDark,
  onToggle: propOnToggle,
  variant = 'picker',
  className = '',
  showLabel = false,
  darkSurface = false,
}) => {
  const { themeId, theme, themes, isDark: ctxIsDark, setThemeId, toggleLightDark, language, t } =
    usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveIsDark = propIsDark !== undefined ? propIsDark : ctxIsDark;
  const handleQuickToggle = () => {
    toggleLightDark();
    if (propOnToggle && propOnToggle !== toggleLightDark) {
      // Avoid double toggle when App already delegates to toggleLightDark
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-3 ${className}`} data-no-translate="true">
        {showLabel && (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {effectiveIsDark ? t('theme.modeDark') : t('theme.modeLight')}
          </span>
        )}
        <button
          type="button"
          onClick={handleQuickToggle}
          role="switch"
          aria-checked={effectiveIsDark}
          aria-label={effectiveIsDark ? t('theme.switchLight') : t('theme.switchDark')}
          title={effectiveIsDark ? t('theme.switchLight') : t('theme.switchDark')}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpcs-accent)] focus-visible:ring-offset-2 ${
            effectiveIsDark
              ? 'mpcs-accent-gradient shadow-inner'
              : 'bg-slate-200 dark:bg-slate-700 shadow-inner'
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] pointer-events-none opacity-60">
            <Sun
              className={`w-3 h-3 text-amber-500 transition-opacity duration-300 ${
                effectiveIsDark ? 'opacity-30' : 'opacity-100'
              }`}
            />
            <Moon
              className={`w-3 h-3 text-indigo-200 transition-opacity duration-300 ${
                effectiveIsDark ? 'opacity-100' : 'opacity-30'
              }`}
            />
          </div>

          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 600, damping: 35 }}
            className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-colors duration-300 ${
              effectiveIsDark ? 'ml-auto bg-slate-900 text-amber-400' : 'mr-auto bg-white text-amber-500'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={effectiveIsDark ? 'dark-thumb' : 'light-thumb'}
                initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex items-center justify-center"
              >
                {effectiveIsDark ? (
                  <Moon className="h-3 w-3 text-amber-300" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </button>
      </div>
    );
  }

  const lightThemes = themes.filter((item) => item.mode === 'light');
  const darkThemes = themes.filter((item) => item.mode === 'dark');

  return (
    <div ref={containerRef} className="relative" data-no-translate="true">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`${t('theme.pickerTitle')} · ${theme.name[language]}`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
          darkSurface
            ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
            : 'bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
        } ${className}`}
      >
        <span
          className="w-3 h-3 rounded-full ring-2 ring-white/80 dark:ring-slate-900 shrink-0"
          style={{ backgroundColor: theme.swatches.accent }}
        />
        <Palette className="w-3.5 h-3.5 opacity-80 shrink-0" />
        <ChevronDown
          className={`w-3 h-3 opacity-60 transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="absolute right-0 mt-2 w-80 sm:w-[340px] rounded-2xl bg-white dark:bg-[#0f1627] border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 z-[90] origin-top-right"
          >
            {/* Header & Quick Light/Dark Switch */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {t('theme.pickerTitle')}
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  {theme.name[language]}
                </div>
              </div>

              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (effectiveIsDark) toggleLightDark();
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-bold transition-colors cursor-pointer ${
                    !effectiveIsDark
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>{t('theme.quickLight')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!effectiveIsDark) toggleLightDark();
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-bold transition-colors cursor-pointer ${
                    effectiveIsDark
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>{t('theme.quickDark')}</span>
                </button>
              </div>
            </div>

            {/* Light Themes Section */}
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 px-1">
                {t('theme.lightSection')}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {lightThemes.map((item) => {
                  const selected = themeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setThemeId(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-slate-50 dark:bg-slate-800/90 border-[var(--mpcs-accent)] shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-7 rounded-lg border flex overflow-hidden shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: item.swatches.canvas,
                            borderColor: item.swatches.border,
                          }}
                        >
                          <div
                            className="w-2.5 h-full"
                            style={{ backgroundColor: item.swatches.sidebar }}
                          />
                          <div className="flex-1 p-1 flex flex-col justify-between">
                            <div
                              className="h-1.5 w-4 rounded-full"
                              style={{ backgroundColor: item.swatches.accent }}
                            />
                            <div
                              className="h-1.5 w-full rounded-sm"
                              style={{ backgroundColor: item.swatches.surface }}
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.name[language]}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {item.category[language]}
                          </div>
                        </div>
                      </div>
                      {selected && (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: item.swatches.accent }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Themes Section */}
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 px-1">
                {t('theme.darkSection')}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {darkThemes.map((item) => {
                  const selected = themeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setThemeId(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-slate-50 dark:bg-slate-800/90 border-[var(--mpcs-accent)] shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-7 rounded-lg border flex overflow-hidden shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: item.swatches.canvas,
                            borderColor: item.swatches.border,
                          }}
                        >
                          <div
                            className="w-2.5 h-full"
                            style={{ backgroundColor: item.swatches.sidebar }}
                          />
                          <div className="flex-1 p-1 flex flex-col justify-between">
                            <div
                              className="h-1.5 w-4 rounded-full"
                              style={{ backgroundColor: item.swatches.accent }}
                            />
                            <div
                              className="h-1.5 w-full rounded-sm"
                              style={{ backgroundColor: item.swatches.surface }}
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.name[language]}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {item.category[language]}
                          </div>
                        </div>
                      </div>
                      {selected && (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: item.swatches.accent }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
