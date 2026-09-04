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
  Cloud,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';
import { User, PushNotification, CloudSyncState } from '../types';
import { ThemeToggle } from './ThemeToggle';

function formatSyncTime(isoString?: string | null): string {
  if (!isoString) return 'Baru saja';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Baru saja';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m lalu`;
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  } catch {
    return 'Tersinkron';
  }
}

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

  const isOffline = syncState ? !syncState.isOnline : false;
  const isSyncing = syncState?.syncInProgress === true;
  const pendingCount = syncState?.pendingSyncCount || 0;
  const isSyncPending = isOffline || isSyncing || pendingCount > 0;

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

        {/* Cloud Sync Status Indicator - Prominent 'Sync-Success' or 'Sync-Pending' pill */}
        {onOpenCloudSync && (
          <button
            type="button"
            onClick={onOpenCloudSync}
            id="navbar-cloud-sync-status-btn"
            title={
              isSyncPending
                ? `Sync-Pending • ${
                    isSyncing
                      ? 'Sedang menyinkronkan data ke cloud Supabase...'
                      : isOffline
                      ? 'Mode Offline: Perubahan data tersimpan di penyimpanan lokal'
                      : `${pendingCount} antrean data menunggu sinkronisasi`
                  } (Klik untuk buka detail Cloud Sync)`
                : `Sync-Success • Terhubung & tersinkronisasi otomatis dengan Cloud Supabase (Terakhir: ${formatSyncTime(
                    syncState?.lastSynced
                  )})`
            }
            className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs cursor-pointer select-none ${
              isSyncPending
                ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/20'
                : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400/20'
            }`}
            aria-label={`Status Sinkronisasi Cloud: ${isSyncPending ? 'Sync-Pending' : 'Sync-Success'}`}
          >
            {/* Cloud Sync Icon with State */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              {isSyncPending ? (
                isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                ) : isOffline ? (
                  <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
                )
              ) : (
                <CloudCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>

            {/* Prominent Status Indicator Label & Glowing Dot */}
            <div className="flex items-center gap-1.5">
              {/* Dynamic status dot */}
              <span className="relative flex h-2 w-2 flex-shrink-0">
                {isSyncPending ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
              </span>

              {/* Prominent Label: 'Sync-Success' or 'Sync-Pending' */}
              <span className="font-extrabold text-[11px] sm:text-xs tracking-tight whitespace-nowrap">
                {isSyncPending ? 'Sync-Pending' : 'Sync-Success'}
              </span>

              {/* Badge for pending counter if applicable */}
              {isSyncPending && pendingCount > 0 && !isSyncing && (
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                  {pendingCount}
                </span>
              )}

              {/* Timestamp on larger screens */}
              <span className="hidden xl:inline text-[10px] font-semibold opacity-75 whitespace-nowrap">
                {isSyncPending
                  ? isSyncing
                    ? '• Sinkronisasi...'
                    : isOffline
                    ? '• Offline'
                    : '• Tertunda'
                  : `• ${formatSyncTime(syncState?.lastSynced)}`}
              </span>
            </div>

            <ShieldCheck
              className={`w-3.5 h-3.5 hidden 2xl:inline opacity-70 ${
                isSyncPending ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
              title="Koneksi Terenkripsi & Integritas Terverifikasi"
            />
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

        {/* Dark Mode Toggle with Cross-Fade Transition */}
        <ThemeToggle isDark={currentTheme === 'dark'} onToggle={onToggleTheme} />

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
