import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CheckCircle2,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  X,
  UserCheck,
  KeyRound,
  Presentation,
  Bot,
} from 'lucide-react';
import { User } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface SidebarProps {
  user: User | null;
  activePage: string;
  onNavigate?: (page: string) => void;
  onSelectPage?: (page: any) => void;
  isOpen?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingApprovalsCount?: number;
  pendingApprovalCount?: number;
  onOpenProfile?: () => void;
  onOpenUserManagement?: () => void;
  onLogout: () => void;
  fullscreenHidden?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activePage,
  onNavigate,
  onSelectPage,
  isOpen = false,
  mobileOpen,
  onClose,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
  pendingApprovalsCount,
  pendingApprovalCount,
  onOpenProfile,
  onOpenUserManagement,
  onLogout,
  fullscreenHidden = false,
}) => {
  const { t } = usePreferences();
  const isMobileVisible = mobileOpen !== undefined ? mobileOpen : isOpen;
  const handleClose = onCloseMobile || onClose || (() => {});
  const handleNavigate = (page: string, action?: () => void) => {
    if (action) {
      action();
    } else {
      if (onNavigate) onNavigate(page);
      if (onSelectPage) onSelectPage(page);
    }
    handleClose();
  };

  const totalPending = pendingApprovalsCount !== undefined ? pendingApprovalsCount : (pendingApprovalCount || 0);
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR1';

  const avatarGradientMap: Record<string, string> = {
    indigo: 'bg-gradient-to-tr from-indigo-600 to-blue-700',
    emerald: 'bg-gradient-to-tr from-emerald-600 to-teal-700',
    amber: 'bg-gradient-to-tr from-amber-600 to-orange-700',
    purple: 'bg-gradient-to-tr from-purple-600 to-pink-700',
    slate: 'bg-gradient-to-tr from-slate-700 to-slate-900',
  };

  const userAvatarClass =
    user?.avatarColor && user.avatarColor !== 'red' && avatarGradientMap[user.avatarColor]
      ? avatarGradientMap[user.avatarColor]
      : 'mpcs-accent-gradient';

  // Dynamic department header label: 'HR Development' for ADMIN, and user's specific department for other roles
  const getDepartmentHeaderLabel = () => {
    if (!user) return 'HR Development';
    if (user.role === 'ADMIN') return 'HR Development';
    if (user.deptName && user.deptName !== 'All Departments') return user.deptName;
    const foundDept = DEPARTMENTS.find((d) => d.id === user.deptId);
    if (foundDept) return foundDept.name;
    return user.deptId || 'HR Development';
  };
  const departmentHeaderLabel = getDepartmentHeaderLabel();

  // Navigation menu items without landing page tab
  const menuItems: Array<{
    id: string;
    altId: string;
    label: string;
    icon: any;
    shortcut: string;
    badge?: number;
    action?: () => void;
  }> = [
    {
      id: 'dashboard',
      altId: 'DASHBOARD',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      shortcut: 'g d',
    },
    {
      id: 'executive',
      altId: 'EXECUTIVE_DOSSIER',
      label: t('nav.executive'),
      icon: Presentation,
      shortcut: 'g e',
    },
    {
      id: 'plan',
      altId: 'PLAN',
      label: t('nav.plan'),
      icon: ClipboardList,
      shortcut: 'g b',
    },
    {
      id: 'actual',
      altId: 'REAL',
      label: t('nav.actual'),
      icon: Users,
      shortcut: 'g r',
    },
    ...(isAdminOrHR
      ? [
          {
            id: 'approvals',
            altId: 'APPROVALS',
            label: t('nav.approvals'),
            icon: CheckCircle2,
            shortcut: 'g a',
            badge: totalPending > 0 ? totalPending : undefined,
          },
        ]
      : []),
    ...(isAdminOrHR
      ? [
          {
            id: 'usermanagement',
            altId: 'USER_MANAGEMENT',
            label: t('nav.usermanagement'),
            icon: KeyRound,
            shortcut: 'g u',
          },
        ]
      : []),
    {
      id: 'logs',
      altId: 'AUDIT_LOG',
      label: t('nav.logs'),
      icon: ScrollText,
      shortcut: 'g l',
    },
    {
      id: 'assistant',
      altId: 'HR_ASSISTANT',
      label: t('nav.hrAssistant'),
      icon: Bot,
      shortcut: 'g h',
    },
    {
      id: 'settings',
      altId: 'SETTINGS',
      label: t('nav.settings'),
      icon: Settings,
      shortcut: 'g s',
    },
  ];

  return (
    <>
      {/* Mobile / Fullscreen Drawer Backdrop */}
      {isMobileVisible && (
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 ${fullscreenHidden ? '' : 'lg:hidden'} animate-in fade-in duration-200`}
          onClick={handleClose}
        />
      )}

      {/* Sidebar Aside Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 ${fullscreenHidden ? '' : 'lg:z-30'} flex flex-col mpcs-sidebar border-r transition-all duration-300 ease-in-out ${
          fullscreenHidden
            ? 'w-64 shadow-2xl'
            : `${collapsed ? 'lg:w-20' : 'lg:w-64'} shadow-xl lg:shadow-none`
        } ${
          isMobileVisible
            ? 'w-64 translate-x-0'
            : fullscreenHidden
            ? '-translate-x-full'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Desktop Expand / Collapse Toggle Button */}
        {onToggleCollapse && !fullscreenHidden && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-6 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-500 hover:text-[var(--mpcs-accent)] z-40 transition-all hover:scale-110 cursor-pointer"
            title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            aria-label="Toggle Sidebar Collapse"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Brand / Logo Area */}
        <div
          className={`p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center transition-all ${
            collapsed ? 'lg:justify-center lg:px-2' : 'justify-between'
          }`}
        >
          <div className={`flex flex-col items-center text-center w-full ${collapsed ? 'lg:items-center' : ''}`}>
            <div className="flex items-center justify-center p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-xs mb-1.5 transition-all">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                alt="Ajinomoto Brand Logo"
                className={`object-contain transition-all duration-300 ${
                  collapsed ? 'lg:w-8 lg:h-8 w-24 h-9' : 'w-24 h-9'
                }`}
              />
            </div>
            {(!collapsed || isMobileVisible) && (
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-extrabold tracking-wider mpcs-accent-text uppercase text-center leading-tight">
                  NE - NEX
                </span>
                <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 text-center">
                  <MapPin className="w-3 h-3 mpcs-accent-text shrink-0" /> Mojokerto Factory • {departmentHeaderLabel}
                </span>
              </div>
            )}
          </div>

          {/* Mobile / Fullscreen Drawer Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className={`${fullscreenHidden ? 'flex' : 'lg:hidden'} p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer`}
            aria-label={t('nav.closeMenu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const currentLower = (activePage || '').toLowerCase();
            const isActive =
              currentLower === item.id.toLowerCase() ||
              currentLower === item.altId.toLowerCase();

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id, item.action)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative cursor-pointer ${
                  collapsed ? 'lg:justify-center lg:px-2' : ''
                } ${
                  isActive
                    ? 'mpcs-accent-gradient text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-[var(--mpcs-accent)]'
                  }`}
                />

                {(!collapsed || isMobileVisible) && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full shadow-xs animate-pulse">
                        {item.badge}
                      </span>
                    ) : (
                      <kbd
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-opacity ${
                          isActive
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </>
                )}

                {/* Collapsed Active Indicator / Notification Pill */}
                {collapsed && !isMobileVisible && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white dark:ring-[#090e1a] animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* User Profile Card (Clickable to open Edit Profile) */}
          {user && (
            <button
              type="button"
              onClick={onOpenProfile}
              className={`w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 transition-all cursor-pointer group shadow-2xs ${
                collapsed ? 'lg:justify-center lg:px-2' : ''
              }`}
              title={t('nav.editProfileTooltip')}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg ${userAvatarClass} text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:scale-105 transition-transform`}>
                  {user.nama ? user.nama[0].toUpperCase() : 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#090e1a]" />
              </div>

              {(!collapsed || isMobileVisible) && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[var(--mpcs-accent)] transition-colors">
                    {user.nama}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span className="font-semibold mpcs-accent-text">{user.role}</span>
                    <span>•</span>
                    <span>{user.deptId}</span>
                  </div>
                </div>
              )}
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer ${
              collapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
            title={t('nav.logoutTooltip')}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobileVisible) && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
