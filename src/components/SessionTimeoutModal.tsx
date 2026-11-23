import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  totalWarningSeconds: number;
  user: User | null;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  remainingSeconds,
  totalWarningSeconds,
  user,
  onExtendSession,
  onLogoutNow,
}) => {
  const { t } = usePreferences();

  const safeRemaining = Math.max(0, Math.ceil(remainingSeconds));
  const mins = Math.floor(safeRemaining / 60);
  const secs = safeRemaining % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPct = Math.max(
    0,
    Math.min(100, (safeRemaining / Math.max(1, totalWarningSeconds)) * 100)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-timeout-title"
          data-no-translate="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md mpcs-surface rounded-3xl border border-amber-300/60 dark:border-amber-700/60 shadow-2xl overflow-hidden"
          >
            {/* Top Amber Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600" />

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    {t('session.warningBadge')}
                  </span>
                  <h3
                    id="session-timeout-title"
                    className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5"
                  >
                    {t('session.warningTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t('session.warningDesc')}
                  </p>
                </div>
              </div>

              {/* Countdown Panel */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{t('session.autoLogoutIn')}</span>
                  </div>
                  <span className="font-mono tabular-nums text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formattedCountdown}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-500 ease-linear"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {user && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="truncate font-semibold">{user.nama}</span>
                    <span className="font-mono font-bold shrink-0">{user.deptId}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onLogoutNow}
                  className="sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('session.logoutNowBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={onExtendSession}
                  className="sm:flex-1 py-2.5 px-4 rounded-xl mpcs-accent-gradient text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('session.stayLoggedInBtn')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
