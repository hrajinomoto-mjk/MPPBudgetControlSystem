import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  Keyboard,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  Share2,
  User as UserIcon,
  Wifi,
  WifiOff,
  Menu,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { User, PushNotification, CloudSyncState } from '../types';

interface NavbarProps {
  user: User | null;
  activePage?: string;
  onNavigate?: (page: string) => void;
  onOpenSidebar?: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onOpenNotifications: () => void;
  onOpenCloudSync: () => void;
  onOpenShare: () => void;
  onOpenProfile: () => void;
  onToggleTheme: () => void;
  onRequestLogout?: () => void;
  theme?: 'light' | 'dark';
  isDark?: boolean;
  notifications?: PushNotification[];
  syncState?: CloudSyncState;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenSidebar,
  onOpenCommandPalette,
  onOpenShortcuts,
  onOpenNotifications,
  onOpenCloudSync,
  onOpenShare,
  onOpenProfile,
  theme,
  isDark,
  onToggleTheme,
  notifications = [],
  syncState = {
    isOnline: true,
    lastSynced: null,
    syncInProgress: false,
    pendingSyncCount: 0,
    autoSync: true,
    encryptionActive: true,
  },
  unreadNotificationsCount,
}) => {
  const [time, setTime] = useState<string>('');
  const safeNotifs = Array.isArray(notifications) ? notifications : [];
  const unreadCount =
    unreadNotificationsCount !== undefined
      ? unreadNotificationsCount
      : safeNotifs.filter((n) => !n.read).length;
  const currentTheme = theme || (isDark ? 'dark' : 'light');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const avatarGradientMap: Record<string, string> = {
    red: 'from-red-600 to-rose-700',
    indigo: 'from-indigo-600 to-blue-700',
    emerald: 'from-emerald-600 to-teal-700',
    amber: 'from-amber-600 to-orange-700',
    purple: 'from-purple-600 to-pink-700',
    slate: 'from-slate-700 to-slate-900',
  };

  const userAvatarBg = (user?.avatarColor && avatarGradientMap[user.avatarColor]) || 'from-red-600 to-rose-700';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-2.5 bg-white/90 dark:bg-[#0c1220]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors shadow-xs">
      {/* Left zone: Mobile toggle & Command search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg min-w-0">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex-shrink-0"
            title="Buka Navigasi Sidebar"
            aria-label="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 w-full max-w-md px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 rounded-xl transition-all shadow-2xs group cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex-shrink-0" />
          <span className="flex-1 text-left hidden sm:inline truncate font-medium">Cari menu, departemen, atau aksi...</span>
          <span className="flex-1 text-left sm:hidden truncate font-medium">Cari...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right controls zone */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
        {/* Factory Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>{time || '00:00:00'}</span>
        </div>

        {/* Cloud Sync Indicator - Khusus Kewenangan Admin Master */}
        {user?.role === 'ADMIN' && onOpenCloudSync && (
          <button
            type="button"
            onClick={onOpenCloudSync}
            title={syncState.isOnline ? 'Online • Cloud Synchronized' : 'Offline Mode • Data Disimpan Lokal'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs cursor-pointer ${
              syncState.isOnline
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
          >
            {syncState.isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <span className="hidden md:inline font-semibold">{syncState.isOnline ? 'Cloud Sync' : 'Offline'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hidden xl:inline" title="E2E Encrypted" />
          </button>
        )}

        {/* Share & Multi-Device Button */}
        <button
          type="button"
          onClick={onOpenShare}
          title="Buka di Device Lain & Bagikan Tautan"
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          aria-label="Akses & Bagikan ke Device Lain"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Shortcuts Button */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="hidden sm:flex p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          aria-label="Shortcuts Help"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          title="Notifikasi Sistem"
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={currentTheme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Interactive User Profile Trigger Button */}
        {user && (
          <button
            type="button"
            onClick={onOpenProfile}
            title="Klik untuk Edit Profil & Akun"
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all group cursor-pointer shadow-2xs"
          >
            <div className="relative flex-shrink-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br ${userAvatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform`}
              >
                {user.nama ? user.nama[0].toUpperCase() : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0c1220]" />
            </div>

            <div className="hidden md:flex flex-col text-left min-w-0 max-w-[130px] xl:max-w-[170px]">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {user.nama}
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user.role} • {user.deptId}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 hidden md:block transition-transform group-hover:translate-y-0.5" />
          </button>
        )}
      </div>
    </header>
  );
};
