import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { User } from '../types';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
}) => {
  const { t } = usePreferences();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md mpcs-surface border rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Decorative Header */}
        <div className="mpcs-accent-gradient p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">{t('logout.title')}</h3>
              <p className="text-[10px] text-white/85 truncate max-w-[240px]">PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* User Info Capsule */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl mpcs-accent-gradient text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {user.nama ? user.nama[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.nama}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                  <span className="font-semibold mpcs-accent-text">{user.role}</span>
                  <span>•</span>
                  <span>{user.deptId} ({user.deptName || 'All Dept'})</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-center sm:justify-start">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {t('logout.question')}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('logout.desc')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {t('logout.cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl mpcs-accent-gradient text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logout.confirm')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
