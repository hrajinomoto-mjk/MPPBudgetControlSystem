import React from 'react';
import { Globe, Check } from 'lucide-react';
import { usePreferences } from '../contexts/AppPreferencesContext';
import { Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'dark-surface' | 'panel';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage, t } = usePreferences();

  if (variant === 'panel') {
    const options: Array<{ code: Language; short: string; name: string; desc: string; sample: string }> = [
      {
        code: 'id',
        short: 'ID',
        name: t('lang.idName'),
        desc: t('lang.idDesc'),
        sample: 'Bulan 1 (Apr) · WIB (UTC+7)',
      },
      {
        code: 'en',
        short: 'EN',
        name: t('lang.enName'),
        desc: t('lang.enDesc'),
        sample: 'Month 1 (Apr) · WIB (UTC+7)',
      },
    ];

    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`} data-no-translate="true">
        {options.map((opt) => {
          const active = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLanguage(opt.code)}
              className={`group text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 ${
                active
                  ? 'mpcs-accent-soft shadow-xs ring-2 ring-[var(--mpcs-accent)]/25'
                  : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-extrabold shrink-0 transition-colors ${
                    active
                      ? 'mpcs-accent-gradient text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.short}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {opt.name}
                    </span>
                    {active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider mpcs-accent-text">
                        · {t('lang.activeBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {opt.desc}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1.5 tabular-nums">
                    {opt.sample}
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  active
                    ? 'mpcs-accent-bg text-white'
                    : 'border border-slate-300 dark:border-slate-700 bg-transparent'
                }`}
              >
                {active && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const isDarkSurface = variant === 'dark-surface';

  return (
    <div
      data-no-translate="true"
      role="group"
      aria-label={t('navbar.languageLabel')}
      title={t('lang.subtitle')}
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-xl border transition-colors shrink-0 ${
        isDarkSurface
          ? 'bg-slate-800/90 border-slate-700 text-slate-300'
          : 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
      } ${className}`}
    >
      <Globe
        className={`w-3.5 h-3.5 ml-1.5 mr-0.5 shrink-0 hidden sm:block ${
          isDarkSurface ? 'text-slate-400' : 'text-slate-400 dark:text-slate-400'
        }`}
      />
      {(['id', 'en'] as Language[]).map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              active
                ? 'mpcs-accent-gradient text-white shadow-2xs'
                : isDarkSurface
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};
