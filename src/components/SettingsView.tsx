import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Cloud,
  Mail,
  Shield,
  Key,
  Database,
  RotateCcw,
  LogOut,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  UserCheck,
  FileUp,
  KeyRound,
  ShieldCheck,
  Server,
  Lock,
  HardDrive,
  Clock,
  Info,
  Palette,
  Globe,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { usePreferences } from '../contexts/AppPreferencesContext';
import { pageContainerVariants, staggerItemVariants } from '../utils/motion';

interface SettingsViewProps {
  user: User | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenCloudSync: () => void;
  onOpenAutomatedReports: () => void;
  onOpenImportData?: () => void;
  onOpenUserManagement?: () => void;
  onLogout: () => void;
  onResetFactoryData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenProfile,
  onOpenCloudSync,
  onOpenAutomatedReports,
  onOpenImportData,
  onOpenUserManagement,
  onLogout,
  onResetFactoryData,
}) => {
  const { themeId, theme, themes, setThemeId, language, t } = usePreferences();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; success: boolean } | null>(null);

  const avatarGradientMap: Record<string, string> = {
    red: 'from-red-600 to-rose-700',
    indigo: 'from-indigo-600 to-blue-700',
    emerald: 'from-emerald-600 to-teal-700',
    amber: 'from-amber-600 to-orange-700',
    purple: 'from-purple-600 to-pink-700',
    slate: 'from-slate-700 to-slate-900',
  };

  const userAvatarBg = (user?.avatarColor && avatarGradientMap[user.avatarColor]) || 'from-red-600 to-rose-700';

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: t('settings.passMismatch'), success: false });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ text: t('settings.passTooShort'), success: false });
      return;
    }
    setPasswordMsg({ text: t('settings.passUpdated'), success: true });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3500);
  };

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR1';

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: t('settings.passEmpty'), color: 'bg-slate-200 dark:bg-slate-700' };
    if (pass.length < 5) return { score: 1, text: t('settings.passWeak'), color: 'bg-rose-500' };
    if (pass.length < 8) return { score: 2, text: t('settings.passMedium'), color: 'bg-amber-500' };
    return { score: 3, text: t('settings.passStrong'), color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 w-full"
    >
      {/* 1. Executive Top Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mpcs-surface p-4 sm:p-5 rounded-3xl border shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl mpcs-accent-gradient text-white flex items-center justify-center shadow-md shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {t('settings.title')}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>

        {/* System Info Summary */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            {t('settings.gateway')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 mpcs-accent-text" />
            {t('settings.encryption')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            ISO 27001
          </span>
        </div>
      </motion.div>

      {/* 2. Enterprise Visual Theme Studio & Bilingual Localization Panel */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Enterprise Theme Studio (8 cols) */}
        <div
          className="xl:col-span-8 mpcs-surface p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5"
          data-no-translate="true"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl mpcs-accent-soft border flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t('settings.themeStudioTitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('settings.themeStudioSubtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} variant="switch" showLabel />
            </div>
          </div>

          {/* 6 Curated Enterprise Theme Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {themes.map((item) => {
              const isSelected = themeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setThemeId(item.id)}
                  className={`group text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-[var(--mpcs-accent)] ring-2 ring-[var(--mpcs-accent)]/20 bg-slate-50/90 dark:bg-slate-800/60 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  {/* Mini Workspace Visual Preview */}
                  <div
                    className="w-full h-24 rounded-xl border overflow-hidden flex shadow-2xs transition-transform duration-200 group-hover:scale-[1.01]"
                    style={{
                      backgroundColor: item.swatches.canvas,
                      borderColor: item.swatches.border,
                    }}
                  >
                    {/* Mini Sidebar */}
                    <div
                      className="w-11 h-full p-2 flex flex-col gap-1.5 border-r"
                      style={{
                        backgroundColor: item.swatches.sidebar,
                        borderColor: item.swatches.border,
                      }}
                    >
                      <div
                        className="h-2.5 w-full rounded-sm"
                        style={{ backgroundColor: item.swatches.accent }}
                      />
                      <div className="h-1.5 w-4/5 rounded-full opacity-25" style={{ backgroundColor: item.swatches.text }} />
                      <div className="h-1.5 w-3/4 rounded-full opacity-20" style={{ backgroundColor: item.swatches.text }} />
                      <div className="h-1.5 w-4/5 rounded-full opacity-20" style={{ backgroundColor: item.swatches.text }} />
                    </div>

                    {/* Mini Workspace Body */}
                    <div className="flex-1 p-2 flex flex-col justify-between gap-1.5">
                      {/* Mini Topbar */}
                      <div
                        className="h-3.5 rounded-md border px-1.5 flex items-center justify-between"
                        style={{
                          backgroundColor: item.swatches.surface,
                          borderColor: item.swatches.border,
                        }}
                      >
                        <div className="h-1.5 w-8 rounded-full opacity-30" style={{ backgroundColor: item.swatches.text }} />
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.swatches.accent }} />
                          <span className="w-1.5 h-1.5 rounded-full opacity-30" style={{ backgroundColor: item.swatches.text }} />
                        </div>
                      </div>

                      {/* Mini KPI Row */}
                      <div className="grid grid-cols-3 gap-1.5 flex-1">
                        {[0, 1, 2].map((idx) => (
                          <div
                            key={idx}
                            className="rounded-md border p-1.5 flex flex-col justify-between"
                            style={{
                              backgroundColor: item.swatches.surface,
                              borderColor: item.swatches.border,
                            }}
                          >
                            <div
                              className="h-1 w-5 rounded-full opacity-30"
                              style={{ backgroundColor: item.swatches.text }}
                            />
                            <div
                              className="h-2 w-7 rounded-sm"
                              style={{
                                backgroundColor: idx === 0 ? item.swatches.accent : item.swatches.text,
                                opacity: idx === 0 ? 1 : 0.7,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Theme Meta */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.swatches.accent }}
                        />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {item.name[language]}
                        </span>
                      </div>

                      {isSelected ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                          style={{ color: item.swatches.accent }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          {t('theme.active')}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 shrink-0">
                          {item.mode === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                        </span>
                      )}
                    </div>

                    <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                      {item.category[language]}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                      {item.tagline[language]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enterprise Language & Localization Panel (4 cols) */}
        <div
          className="xl:col-span-4 mpcs-surface p-5 sm:p-6 rounded-3xl border shadow-xs flex flex-col justify-between space-y-5"
          data-no-translate="true"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-10 h-10 rounded-2xl mpcs-accent-soft border flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t('settings.langPanelTitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('settings.langPanelSubtitle')}
                </p>
              </div>
            </div>

            <LanguageSwitcher variant="panel" className="grid-cols-1!" />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>{language === 'en' ? 'Active Theme' : 'Tema Aktif'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{theme.name[language]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{language === 'en' ? 'Active Locale' : 'Lokalisasi Aktif'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'EN-US (Enterprise)' : 'ID-ID (Indonesia)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{language === 'en' ? 'Fiscal Calendar' : 'Kalender Fiskal'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Apr – Mar (FY)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. User Profile Showcase & System Telemetry */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* User Profile Card (7 cols on lg) */}
        <div className="lg:col-span-7 mpcs-surface p-5 sm:p-6 rounded-3xl border shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${userAvatarBg} text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0 ring-4 ring-slate-100 dark:ring-slate-800`}
              >
                {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'AJ'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {user?.nama || 'Registered User'}
                  </h3>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider mpcs-accent-text">
                    · {user?.role} ACCESS
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                  {user?.email || user?.userId}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {user?.deptName || 'All Departments'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold mpcs-accent-text">{user?.deptId}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {t('settings.activeSession')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onOpenProfile}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 mpcs-accent-text" />
                <span>{t('settings.editProfile')}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onLogout}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('settings.logoutSession')}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* System Telemetry & Health Cards (5 cols on lg) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <div className="mpcs-surface p-4 rounded-2xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('settings.cloudEngine')}</span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('settings.synced')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time Multi-device</p>
            </div>
          </div>

          <div className="mpcs-surface p-4 rounded-2xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('settings.vaultSecurity')}</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{t('settings.protected')}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">ISO 27001 Compliant</p>
            </div>
          </div>

          <div className="mpcs-surface p-4 rounded-2xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('settings.dbStorage')}</span>
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">Hybrid Mirror</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Indexed Local + Cloud</p>
            </div>
          </div>

          <div className="mpcs-surface p-4 rounded-2xl border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('settings.timezone')}</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">WIB (UTC+7)</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Mojokerto Standard Time</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. ADMIN EXCLUSIVE: User & Password Maintenance Banner */}
      {isAdminOrHR && onOpenUserManagement && (
        <motion.div
          variants={staggerItemVariants}
          className="mpcs-hero-gradient text-white p-5 sm:p-6 rounded-3xl shadow-lg space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-white/90">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>{t('settings.adminBannerBadge')}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                {t('settings.adminBannerTitle')}
              </h3>
              <p className="text-xs text-white/85 leading-relaxed">
                {t('settings.adminBannerDesc')}
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onOpenUserManagement}
                className="w-full md:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 mpcs-accent-text" />
                <span>{t('settings.adminBannerBtn')}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. Core Configuration Bento Grid */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: Profile & Account Details */}
        <div className="mpcs-surface p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings.profileCardTitle')}</h4>
                  <p className="text-[11px] text-slate-500">{t('settings.profileCardSub')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenProfile}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {t('settings.profileCardBtn')}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              {t('settings.profileCardDesc')}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Role: {user?.role}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t('settings.verified')}</span>
          </div>
        </div>

        {/* Module 2: Cloud Sync (Admin / System) */}
        {user?.role === 'ADMIN' && (
          <div className="mpcs-surface p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings.cloudCardTitle')}</h4>
                    <p className="text-[11px] text-slate-500">{t('settings.cloudCardSub')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCloudSync}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Sync DB
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                {t('settings.cloudCardDesc')}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Status: Live Mirroring</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Zero Conflict</span>
            </div>
          </div>
        )}

        {/* Module 3: Automated Reports */}
        <div className="mpcs-surface p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings.autoReportTitle')}</h4>
                  <p className="text-[11px] text-slate-500">{t('settings.autoReportSub')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAutomatedReports}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {t('settings.autoReportBtn')}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              {t('settings.autoReportDesc')}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{t('settings.autoReportFreq')}</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">PDF Ready</span>
          </div>
        </div>

        {/* Module 4: Database Integrations (Excel, GSheets, Supabase) - Admin Only */}
        {user?.role === 'ADMIN' && onOpenImportData && (
          <div className="mpcs-surface p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl mpcs-accent-soft border">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t('settings.dbIntegrationTitle')}
                    </h4>
                    <p className="text-[11px] text-slate-500">{t('settings.dbIntegrationSub')}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenImportData}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 mpcs-accent-gradient text-white rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>{t('settings.dbIntegrationBtn')}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                {t('settings.dbIntegrationDesc')}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{t('settings.supportedFormats')}</span>
              <span className="font-semibold mpcs-accent-text">Multi-Source</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* 6. Bottom Row: Change Password Form & Danger Zone Grid */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Change Password Card (7 cols on lg) */}
        <div className="lg:col-span-7 mpcs-surface p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl mpcs-accent-soft border">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings.changePassTitle')}</h4>
                <p className="text-[11px] text-slate-500">{t('settings.changePassSub')}</p>
              </div>
            </div>
            {newPassword && (
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {t('settings.passStrength')} {passStrength.text}
              </span>
            )}
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.currentPass')}
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('settings.currentPassPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--mpcs-accent)] text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('settings.newPass')}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPassPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--mpcs-accent)] text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settings.confirmPass')}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPassPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--mpcs-accent)] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {newPassword && (
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passStrength.color}`}
                  style={{ width: `${(passStrength.score / 3) * 100}%` }}
                />
              </div>
            )}

            {passwordMsg && (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
                  passwordMsg.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                {passwordMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="px-5 py-2.5 mpcs-accent-gradient text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {t('settings.updatePassBtn')}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Admin Danger Zone: Factory Reset (5 cols on lg) */}
        {user?.role === 'ADMIN' ? (
          <div className="lg:col-span-5 bg-red-50/60 dark:bg-red-950/20 p-5 sm:p-6 rounded-3xl border border-red-200 dark:border-red-900/60 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
                <RotateCcw className="w-4 h-4" />
                <span>{t('settings.dangerTitle')}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('settings.dangerDesc')}
              </p>
              <div className="p-3 bg-red-100/70 dark:bg-red-950/60 rounded-xl border border-red-200 dark:border-red-800/80 text-[11px] text-red-800 dark:text-red-300 font-medium">
                {t('settings.dangerWarn')}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onResetFactoryData}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('settings.dangerBtn')}</span>
            </motion.button>
          </div>
        ) : (
          <div className="lg:col-span-5 mpcs-surface p-5 sm:p-6 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 mpcs-accent-text" />
                <span>{t('settings.accessGuideTitle')}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'en' ? 'Department' : 'Departemen'} <b>({user?.deptId})</b> — {t('settings.accessGuideDesc')}
              </p>
            </div>
            <div className="p-3 mpcs-accent-soft rounded-xl border text-[11px] font-medium">
              {t('settings.accessGuideTip')}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
