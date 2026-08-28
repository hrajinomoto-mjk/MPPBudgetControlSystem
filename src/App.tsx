import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getCurrentFiscalMonth,
  getFiscalYear,
  fiscalToCalendarMonth,
} from './utils/fiscal';
import {
  initializeStorage,
  getStoredPlans,
  getStoredActuals,
  getStoredApprovals,
  getStoredLogs,
  getStoredNotifications,
  getDashboardData,
  savePlanRecord,
  saveActualRecord,
  requestActualApproval,
  approvePendingRequest,
  rejectPendingRequest,
  deleteRecord,
  duplicateDataToNextMonth,
  addAuditLog,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  resetAllDataToDefault,
  getStoredSyncState,
  saveStoredSyncState,
  getStoredUsers,
  updateUserProfile,
} from './utils/storage';
import { autoSyncFromSupabase, getStoredSupabaseConfig } from './utils/integrations';
import {
  User,
  PlanRecord,
  ActualRecord,
  PendingApproval,
  AuditLog,
  NotificationItem,
  DashboardItem,
  ToastMessage,
  AlertModalOptions,
  CloudSyncState,
} from './types';

// Layout & Navigation Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AndonRail } from './components/AndonRail';

// Notification & Dialog Components
import { ToastContainer } from './components/Toast';
import { AlertModal } from './components/AlertModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { ProfileModal } from './components/ProfileModal';

// Views
import { LandingPageView } from './components/LandingPageView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { TableView } from './components/TableView';
import { ApprovalView } from './components/ApprovalView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';

// Modals
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsModal } from './components/ShortcutsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ShareModal } from './components/ShareModal';
import { AutomatedReportModal } from './components/AutomatedReportModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { UserDepartmentReportModal } from './components/UserDepartmentReportModal';
import { AddDataModal } from './components/AddDataModal';
import { EditDataModal } from './components/EditDataModal';
import { DuplicateDataModal } from './components/DuplicateDataModal';
import { DownloadDatabaseModal } from './components/DownloadDatabaseModal';
import { ImportDataModal } from './components/ImportDataModal';
import { UserManagementModal } from './components/UserManagementModal';
import { RecipientDownloadModal, RecipientDownloadState } from './components/RecipientDownloadModal';
import { generateExecutiveReportPDF, generateUserDepartmentReportPDF } from './utils/exportPdf';

export const App: React.FC = () => {
  // 1. Real-time Reactive Core Database State
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [actuals, setActuals] = useState<ActualRecord[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  const reloadDatabase = useCallback(() => {
    setPlans(getStoredPlans());
    setActuals(getStoredActuals());
    setApprovals(getStoredApprovals());
    setAuditLogs(getStoredLogs());
    setNotifications(getStoredNotifications());
  }, []);

  // 2. Initialize Storage & Auto-Load Supabase Data on boot
  useEffect(() => {
    // Local seed / init
    initializeStorage();
    reloadDatabase();

    // Automatic Remote Sync on Startup (pull data from Supabase)
    const bootstrapCloudData = async () => {
      const config = getStoredSupabaseConfig();
      if (config.url && config.anonKey) {
        setIsCloudSyncing(true);
        try {
          const res = await autoSyncFromSupabase('BOOTSTRAP');
          if (res.success) {
            reloadDatabase();
          }
        } catch (err) {
          console.warn('Initial cloud auto-load note:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    };

    bootstrapCloudData();

    // Listen to custom cross-tab or cross-component sync events
    const handleDataSynced = () => {
      reloadDatabase();
      const currentSess = sessionStorage.getItem('mpcs_active_session');
      if (currentSess) {
        try {
          const parsed: User = JSON.parse(currentSess);
          const freshUsers = getStoredUsers();
          const matched = freshUsers.find(
            (u) =>
              u.userId.toLowerCase() === parsed.userId.toLowerCase() ||
              (u.email && parsed.email && u.email.toLowerCase() === parsed.email.toLowerCase()) ||
              (u.role === parsed.role && u.deptId === parsed.deptId && u.deptId !== 'ALL')
          );
          if (matched) {
            setUser(matched);
            sessionStorage.setItem('mpcs_active_session', JSON.stringify(matched));
          }
        } catch {
          // ignore
        }
      }
    };

    const handleUserUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
      reloadDatabase();
    };

    const handleWindowFocus = () => {
      const config = getStoredSupabaseConfig();
      if (config.url && config.anonKey && config.autoSync) {
        autoSyncFromSupabase('WINDOW_FOCUS').then((res) => {
          if (res.success) {
            handleDataSynced();
          }
        });
      }
    };

    window.addEventListener('mpcs_data_synced', handleDataSynced);
    window.addEventListener('mpcs_user_updated', handleUserUpdated);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('mpcs_data_synced', handleDataSynced);
      window.removeEventListener('mpcs_user_updated', handleUserUpdated);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [reloadDatabase]);

  // Periodic background pull if Supabase connected
  useEffect(() => {
    const timer = setInterval(() => {
      const config = getStoredSupabaseConfig();
      if (config.url && config.anonKey && config.autoSync) {
        autoSyncFromSupabase('INTERVAL_PULL').then((res) => {
          if (res.success) {
            reloadDatabase();
          }
        });
      } else {
        reloadDatabase();
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [reloadDatabase]);

  // 3. User & Auth State (Strictly secured session: initial entry always starts on Landing Page)
  const [user, setUser] = useState<User | null>(() => {
    // Clear legacy unencrypted persistent storage to prevent unauthorized dashboard bypass
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mpcs_current_user');
      const session = sessionStorage.getItem('mpcs_active_session');
      if (session) {
        try {
          return JSON.parse(session);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // 4. Navigation State (Always starts at Landing Page if unauthenticated)
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [publicPage, setPublicPage] = useState<'landing' | 'login'>('landing');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('mpcs_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mpcs_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // 5. Dark Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('mpcs_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mpcs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mpcs_theme', 'light');
    }
  }, [isDark]);

  // 6. Fiscal Period Selection State
  const currentFiscalMonth = getCurrentFiscalMonth();
  const currentCalendarYear = new Date().getFullYear();
  const [selectedFiscalMonth, setSelectedFiscalMonth] = useState<number | 'ALL'>(currentFiscalMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Sync selected dept when user logs in
  useEffect(() => {
    if (user?.role === 'USER' && user.deptId) {
      setSelectedDept(user.deptId);
    } else {
      setSelectedDept('ALL');
    }
  }, [user]);

  // 7. Toast & Alert System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showAlert = useCallback((options: Omit<AlertModalOptions, 'isOpen'>) => {
    setAlertModalOptions({ ...options, isOpen: true });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertModalOptions(null);
  }, []);

  // 8. Modals State
  const [syncState, setSyncState] = useState<CloudSyncState>(() => getStoredSyncState());
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAutomatedReportModalOpen, setIsAutomatedReportModalOpen] = useState(false);
  const [isExecutiveReportModalOpen, setIsExecutiveReportModalOpen] = useState(false);
  const [isUserDepartmentReportModalOpen, setIsUserDepartmentReportModalOpen] = useState(false);
  const [isAddDataModalOpen, setIsAddDataModalOpen] = useState(false);
  const [isDuplicateDataModalOpen, setIsDuplicateDataModalOpen] = useState(false);
  const [isDownloadDatabaseModalOpen, setIsDownloadDatabaseModalOpen] = useState(false);
  const [isImportDataModalOpen, setIsImportDataModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [importDataTargetType, setImportDataTargetType] = useState<'PLAN' | 'ACTUAL' | 'BOTH'>('PLAN');
  const [isRecipientDownloadModalOpen, setIsRecipientDownloadModalOpen] = useState<boolean>(false);
  const [recipientDownloadState, setRecipientDownloadState] = useState<RecipientDownloadState | null>(null);

  const handleOpenImportData = (target: 'PLAN' | 'ACTUAL' | 'BOTH' = 'PLAN') => {
    setImportDataTargetType(target);
    setIsImportDataModalOpen(true);
  };

  // Recipient Direct Download Link & Query Params Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const report = urlParams.get('report');
      const dept = urlParams.get('dept');
      const monthParam = urlParams.get('month');
      const yearParam = urlParams.get('year');
      const viewParam = urlParams.get('view');

      const targetMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
      const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

      if (dept && dept !== 'ALL') {
        setSelectedDept(dept);
      }

      if (action === 'download-pdf') {
        if (report === 'dept' && dept) {
          // Trigger PDF download for recipient
          generateUserDepartmentReportPDF(dept, targetMonth, targetYear);
          setRecipientDownloadState({
            reportType: 'dept',
            deptId: dept,
            month: targetMonth,
            year: targetYear,
            autoDownloaded: true,
          });
          setIsRecipientDownloadModalOpen(true);
        } else {
          // Executive Report PDF download for recipient
          generateExecutiveReportPDF(targetMonth, targetYear, { includeCover: true });
          setRecipientDownloadState({
            reportType: 'executive',
            month: targetMonth,
            year: targetYear,
            autoDownloaded: true,
          });
          setIsRecipientDownloadModalOpen(true);
        }
      } else if (viewParam === 'executive') {
        setIsExecutiveReportModalOpen(true);
      } else if (viewParam === 'dept' && dept) {
        setIsUserDepartmentReportModalOpen(true);
      }
    } catch (err) {
      console.warn('URL parameter handling note:', err);
    }
  }, []);

  // Edit Modal State
  const [editModalData, setEditModalData] = useState<{
    id: string;
    deptId: string;
    deptName: string;
    rw: number;
    os: number;
    remarks: string;
    isApprovalRequest: boolean;
  } | null>(null);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<{
    deptId: string;
    deptName: string;
    rw: number;
    os: number;
    remarks: string;
  } | null>(null);

  // 9. Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === '[') {
        e.preventDefault();
        handleToggleSidebarCollapse();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        reloadDatabase();
        addToast({
          type: 'info',
          title: 'Database Direfresh',
          message: 'Data alokasi dan status terbaru berhasil disinkronkan.',
        });
      } else if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActivePage('dashboard');
      } else if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActivePage('plan');
      } else if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActivePage('actual');
      } else if (e.key.toLowerCase() === 'n' && (user?.role === 'ADMIN' || user?.role === 'HR1')) {
        e.preventDefault();
        setIsAddDataModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, reloadDatabase, handleToggleSidebarCollapse, addToast]);

  // 10. Handlers
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    sessionStorage.setItem('mpcs_active_session', JSON.stringify(newUser));
    localStorage.removeItem('mpcs_current_user');
    addAuditLog(newUser.email || newUser.userId, 'LOGIN', newUser.deptId, 'Berhasil login ke dalam sistem');
    addNotification({
      title: 'Selamat Datang di MPCS',
      message: `Halo ${newUser.nama}, Anda berhasil masuk dengan hak akses ${newUser.role}.`,
      type: 'info',
    });
    addToast({
      type: 'success',
      title: 'Login Berhasil',
      message: `Selamat datang kembali, ${newUser.nama}. Sesi kerja aktif.`,
    });
    reloadDatabase();
  };

  const handlePerformLogout = () => {
    if (user) {
      addAuditLog(user.email || user.userId, 'LOGOUT', user.deptId, 'User logout dari sistem');
    }
    setUser(null);
    setPublicPage('landing');
    sessionStorage.removeItem('mpcs_active_session');
    localStorage.removeItem('mpcs_current_user');
    reloadDatabase();
    addToast({
      type: 'info',
      title: 'Sesi Diakhiri',
      message: 'Anda telah berhasil keluar dari sistem MPCS dengan aman.',
    });
  };

  const handleSaveProfile = (updatedUser: User) => {
    setUser(updatedUser);
    updateUserProfile(updatedUser);
    addAuditLog(
      updatedUser.email || updatedUser.userId,
      'UPDATE_PROFILE',
      updatedUser.deptId,
      `Memperbarui profil pengguna (${updatedUser.nama})`
    );
    reloadDatabase();
    addToast({
      type: 'success',
      title: 'Profil Berhasil Disimpan',
      message: `Informasi akun ${updatedUser.nama} telah diperbarui & disinkronkan ke database cloud.`,
    });
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleSaveAddData = (
    type: 'PLAN' | 'ACTUAL',
    deptId: string,
    bulan: number,
    tahun: number,
    rw: number,
    os: number,
    remarks: string
  ) => {
    const actor = user?.email || user?.userId || 'admin';
    if (type === 'PLAN') {
      savePlanRecord({ deptId, bulan, tahun, planRW: rw, planOS: os, remarks }, actor);
      addToast({
        type: 'success',
        title: 'Budget Manpower Tersimpan',
        message: `Data Plan untuk ${deptId} periode ${bulan}/${tahun} berhasil disimpan.`,
      });
    } else {
      saveActualRecord({ deptId, bulan, tahun, actualRW: rw, actualOS: os, remarks }, actor);
      addToast({
        type: 'success',
        title: 'Realisasi Tersimpan',
        message: `Data Actual untuk ${deptId} periode ${bulan}/${tahun} berhasil disimpan.`,
      });
    }
    reloadDatabase();
  };

  const handleOpenEditModal = (rec: { id: string; deptId: string; rw: number; os: number; remarks: string }) => {
    const isApproval = user?.role === 'USER' && activePage === 'actual';
    setEditModalData({
      id: rec.id,
      deptId: rec.deptId,
      deptName: rec.deptId,
      rw: rec.rw,
      os: rec.os,
      remarks: rec.remarks,
      isApprovalRequest: isApproval,
    });
  };

  const handleSaveEdit = (rw: number, os: number, remarks: string) => {
    if (!editModalData) return;

    if (editModalData.isApprovalRequest) {
      // Create Pending Approval Request
      const calMonth = selectedFiscalMonth === 'ALL' ? 4 : fiscalToCalendarMonth(selectedFiscalMonth);
      requestActualApproval({
        deptId: editModalData.deptId,
        deptName: editModalData.deptName,
        bulan: calMonth,
        tahun: selectedYear,
        actualRW: rw,
        actualOS: os,
        remarks,
        requestedBy: user?.nama || 'User',
      });
      showAlert({
        type: 'success',
        title: 'Permohonan Diajukan',
        message: 'Permohonan perubahan realisasi Actual berhasil diajukan ke Admin/HR Development untuk diverifikasi.',
        confirmText: 'Mengerti',
      });
    } else {
      const calMonth = selectedFiscalMonth === 'ALL' ? 4 : fiscalToCalendarMonth(selectedFiscalMonth);
      const actor = user?.email || user?.userId || 'admin';
      if (activePage === 'plan') {
        savePlanRecord(
          {
            deptId: editModalData.deptId,
            bulan: calMonth,
            tahun: selectedYear,
            planRW: rw,
            planOS: os,
            remarks,
          },
          actor
        );
        addToast({
          type: 'success',
          title: 'Plan Diperbarui',
          message: `Data Plan ${editModalData.deptId} berhasil diperbarui.`,
        });
      } else {
        saveActualRecord(
          {
            deptId: editModalData.deptId,
            bulan: calMonth,
            tahun: selectedYear,
            actualRW: rw,
            actualOS: os,
            remarks,
          },
          actor
        );
        addToast({
          type: 'success',
          title: 'Actual Diperbarui',
          message: `Data Actual ${editModalData.deptId} berhasil diperbarui.`,
        });
      }
    }
    setEditModalData(null);
    reloadDatabase();
  };

  const handleDeleteRecord = (type: 'PLAN' | 'ACTUAL', id: string) => {
    showAlert({
      type: 'danger',
      title: 'Konfirmasi Hapus Data',
      message: `Apakah Anda yakin ingin menghapus catatan ${type} ini? Tindakan ini akan dicatat dalam Audit Log.`,
      confirmText: 'Ya, Hapus Data',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteRecord(type, id, user?.email || user?.userId || 'admin');
        reloadDatabase();
        addToast({
          type: 'info',
          title: 'Data Dihapus',
          message: `Catatan ${type} berhasil dihapus dari sistem.`,
        });
      },
    });
  };

  const handleDuplicate = (type: 'PLAN' | 'ACTUAL', deptId: string, sourceBulan: number, sourceTahun: number) => {
    const res = duplicateDataToNextMonth(
      type,
      deptId,
      sourceBulan,
      sourceTahun,
      user?.email || user?.userId || 'admin'
    );
    showAlert({
      type: 'success',
      title: 'Duplikasi Berhasil',
      message: `Berhasil menduplikasi ${res.copied} data ${type} ke Bulan ${res.targetBulan}/${res.targetTahun} (${res.skipped} entri terlewati/sudah ada).`,
      confirmText: 'Tutup',
    });
    reloadDatabase();
  };

  const handleApprove = (id: string) => {
    approvePendingRequest(id, user?.nama || 'Admin');
    reloadDatabase();
    addToast({
      type: 'success',
      title: 'Pengajuan Disetujui',
      message: 'Perubahan alokasi manpower actual telah resmi disetujui.',
    });
  };

  const handleReject = (id: string, reason: string) => {
    rejectPendingRequest(id, user?.nama || 'Admin', reason);
    reloadDatabase();
    addToast({
      type: 'warning',
      title: 'Pengajuan Ditolak',
      message: `Pengajuan actual ditolak. Alasan: ${reason || 'Tidak memenuhi kualifikasi'}`,
    });
  };

  const handleTriggerSync = async () => {
    const updated = saveStoredSyncState({
      lastSynced: new Date().toISOString(),
      syncInProgress: false,
      pendingSyncCount: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    });
    setSyncState(updated);
    addAuditLog(user?.email || user?.userId || 'SYSTEM', 'CLOUD_SYNC', 'ALL', 'Sinkronisasi data cloud multi-device dan snapshot berhasil');
    addToast({
      title: 'Cloud Sync Berhasil',
      message: 'Data manpower terbaru telah diverifikasi dan disinkronkan ke cloud secara aman.',
      type: 'success',
    });
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = saveStoredSyncState({ autoSync: enabled });
    setSyncState(updated);
  };

  const handleResetFactoryData = () => {
    showAlert({
      type: 'danger',
      title: 'Reset Database Pabrik',
      message: '⚠️ PERINGATAN ADMINISTRATOR: Anda akan mereset seluruh database sistem kembali ke data awal pabrik PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory. Seluruh modifikasi lokal akan dikembalikan ke setelan default.',
      confirmText: 'Ya, Reset Seluruh Database',
      cancelText: 'Batal',
      onConfirm: () => {
        resetAllDataToDefault();
        reloadDatabase();
        showAlert({
          type: 'success',
          title: 'Database Berhasil Direset',
          message: 'Database sistem MPCS telah dikembalikan ke status awal pabrik PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory.',
          confirmText: 'Selesai',
        });
      },
    });
  };

  // 11. Dashboard Items Calculation
  const calMonth = selectedFiscalMonth === 'ALL' ? undefined : fiscalToCalendarMonth(selectedFiscalMonth);
  const dashboardItems: DashboardItem[] = useMemo(() => {
    return getDashboardData(selectedDept, calMonth, selectedYear);
  }, [selectedDept, calMonth, selectedYear, plans, actuals]);

  // Unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  // Render Login or Landing View if not authenticated
  if (!user) {
    if (publicPage === 'landing') {
      return (
        <>
          <LandingPageView
            onNavigateToLogin={() => setPublicPage('login')}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
          />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
          <AlertModal options={alertModalOptions} onClose={closeAlert} />
          <RecipientDownloadModal
            isOpen={isRecipientDownloadModalOpen}
            onClose={() => setIsRecipientDownloadModalOpen(false)}
            initialState={recipientDownloadState}
          />
        </>
      );
    }
    return (
      <>
        <LoginView
          onLogin={handleLogin}
          onNavigateToLanding={() => setPublicPage('landing')}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <AlertModal options={alertModalOptions} onClose={closeAlert} />
        <RecipientDownloadModal
          isOpen={isRecipientDownloadModalOpen}
          onClose={() => setIsRecipientDownloadModalOpen(false)}
          initialState={recipientDownloadState}
        />
      </>
    );
  }

  const currentCalMonth = selectedFiscalMonth === 'ALL' ? 4 : fiscalToCalendarMonth(selectedFiscalMonth);

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Desktop & Mobile Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setSidebarOpen(false);
        }}
        user={user}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onLogout={() => setIsLogoutModalOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* Main Workspace Layout (dynamically offsets for sidebar collapse/expand) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Unified Top Control Header (Navbar + Integrated Andon Rail) */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
          <Navbar
            user={user}
            activePage={activePage}
            onNavigate={setActivePage}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenNotifications={() => setIsNotificationsModalOpen(true)}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onOpenCloudSync={user?.role === 'ADMIN' ? () => setIsCloudSyncModalOpen(true) : () => {}}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onToggleTheme={handleToggleTheme}
            onRequestLogout={() => setIsLogoutModalOpen(true)}
            unreadNotificationsCount={unreadCount}
            isDark={isDark}
            syncState={syncState}
          />

          {/* Integrated Status Andon Bar */}
          <div className="px-3.5 sm:px-6 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <AndonRail
              items={dashboardItems}
              selectedDept={selectedDept}
              onSelectDept={(dept) => setSelectedDept(dept)}
            />
          </div>
        </div>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-x-hidden min-w-0 max-w-[1720px] w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              user={user}
              items={dashboardItems}
              selectedFiscalMonth={selectedFiscalMonth}
              selectedYear={selectedYear}
              selectedDept={selectedDept}
              onChangeFiscalMonth={setSelectedFiscalMonth}
              onChangeYear={setSelectedYear}
              onChangeDept={setSelectedDept}
              onRefresh={reloadDatabase}
              onOpenExecutiveReport={() => setIsExecutiveReportModalOpen(true)}
              onOpenUserReport={() => setIsUserDepartmentReportModalOpen(true)}
              onOpenDownloadExcel={() => setIsDownloadDatabaseModalOpen(true)}
              onOpenImportData={user?.role === 'ADMIN' ? () => handleOpenImportData('BOTH') : undefined}
              onPreviewItem={(item) =>
                setPreviewItem({
                  deptId: item.deptId,
                  deptName: item.deptName,
                  rw: item.actualRW,
                  os: item.actualOS,
                  remarks: item.remarks,
                })
              }
              isDark={isDark}
            />
          )}

          {activePage === 'plan' && (
            <TableView
              type="PLAN"
              user={user}
              plans={plans}
              actuals={actuals}
              onOpenAddModal={() => setIsAddDataModalOpen(true)}
              onOpenDuplicateModal={() => setIsDuplicateDataModalOpen(true)}
              onOpenImportModal={user?.role === 'ADMIN' ? (t) => handleOpenImportData(t) : undefined}
              onOpenEditModal={handleOpenEditModal}
              onDeleteRecord={handleDeleteRecord}
              onPreviewRecord={setPreviewItem}
              selectedFiscalMonth={selectedFiscalMonth}
              selectedYear={selectedYear}
              onChangeFiscalMonth={setSelectedFiscalMonth}
              onChangeYear={setSelectedYear}
            />
          )}

          {activePage === 'actual' && (
            <TableView
              type="ACTUAL"
              user={user}
              plans={plans}
              actuals={actuals}
              onOpenAddModal={() => setIsAddDataModalOpen(true)}
              onOpenDuplicateModal={() => setIsDuplicateDataModalOpen(true)}
              onOpenImportModal={user?.role === 'ADMIN' ? (t) => handleOpenImportData(t) : undefined}
              onOpenEditModal={handleOpenEditModal}
              onDeleteRecord={handleDeleteRecord}
              onPreviewRecord={setPreviewItem}
              selectedFiscalMonth={selectedFiscalMonth}
              selectedYear={selectedYear}
              onChangeFiscalMonth={setSelectedFiscalMonth}
              onChangeYear={setSelectedYear}
            />
          )}

          {activePage === 'approvals' && (
            <ApprovalView
              approvals={approvals}
              onApprove={handleApprove}
              onReject={handleReject}
              user={user}
            />
          )}

          {activePage === 'logs' && <AuditLogView logs={auditLogs} user={user} />}

          {activePage === 'settings' && (
            <SettingsView
              user={user}
              isDark={isDark}
              onToggleTheme={handleToggleTheme}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
              onOpenAutomatedReports={() => setIsAutomatedReportModalOpen(true)}
              onOpenImportData={user?.role === 'ADMIN' ? () => handleOpenImportData('BOTH') : undefined}
              onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
              onLogout={() => setIsLogoutModalOpen(true)}
              onResetFactoryData={handleResetFactoryData}
            />
          )}
        </main>
      </div>

      {/* Global Interactive Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Alert & Confirm Modal */}
      <AlertModal options={alertModalOptions} onClose={closeAlert} />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handlePerformLogout}
        user={user}
      />

      {/* User & Admin Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSaveProfile={handleSaveProfile}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActivePage}
        onTriggerAction={(action) => {
          if (action === 'toggle-theme') handleToggleTheme();
          else if (action === 'executive-report') setIsExecutiveReportModalOpen(true);
          else if (action === 'dept-report') setIsUserDepartmentReportModalOpen(true);
          else if (action === 'download-excel') setIsDownloadDatabaseModalOpen(true);
          else if (action === 'import-data') handleOpenImportData('BOTH');
          else if (action === 'user-management') setIsUserManagementModalOpen(true);
          else if (action === 'cloud-sync') setIsCloudSyncModalOpen(true);
          else if (action === 'automated-report') setIsAutomatedReportModalOpen(true);
          else if (action === 'add-data') setIsAddDataModalOpen(true);
          else if (action === 'duplicate-data') setIsDuplicateDataModalOpen(true);
          else if (action === 'edit-profile') setIsProfileModalOpen(true);
          else if (action === 'logout') setIsLogoutModalOpen(true);
        }}
        onOpenImportData={() => handleOpenImportData('BOTH')}
        isDark={isDark}
        userRole={user.role}
      />

      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          markNotificationAsRead(id);
          reloadDatabase();
        }}
        onMarkAllAsRead={() => {
          markAllNotificationsAsRead();
          reloadDatabase();
        }}
        onClearAll={() => {
          clearAllNotifications();
          reloadDatabase();
        }}
      />

      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        syncState={syncState}
        onTriggerSync={handleTriggerSync}
        onToggleAutoSync={handleToggleAutoSync}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        items={dashboardItems}
        bulan={currentCalMonth}
        tahun={selectedYear}
        currentFiscalMonth={selectedFiscalMonth}
        currentYear={selectedYear}
      />

      <AutomatedReportModal
        isOpen={isAutomatedReportModalOpen}
        onClose={() => setIsAutomatedReportModalOpen(false)}
      />

      <ExecutiveReportModal
        isOpen={isExecutiveReportModalOpen}
        onClose={() => setIsExecutiveReportModalOpen(false)}
        bulan={currentCalMonth}
        tahun={selectedYear}
      />

      <UserDepartmentReportModal
        isOpen={isUserDepartmentReportModalOpen}
        onClose={() => setIsUserDepartmentReportModalOpen(false)}
        deptId={user.deptId || 'PROD'}
        bulan={currentCalMonth}
        tahun={selectedYear}
      />

      <AddDataModal
        isOpen={isAddDataModalOpen}
        onClose={() => setIsAddDataModalOpen(false)}
        onSave={handleSaveAddData}
        defaultType={activePage === 'actual' ? 'ACTUAL' : 'PLAN'}
        defaultBulan={currentCalMonth}
        defaultTahun={selectedYear}
      />

      {editModalData && (
        <EditDataModal
          isOpen={true}
          onClose={() => setEditModalData(null)}
          onSave={handleSaveEdit}
          deptName={editModalData.deptName}
          initialRW={editModalData.rw}
          initialOS={editModalData.os}
          initialRemarks={editModalData.remarks}
          isApprovalRequest={editModalData.isApprovalRequest}
        />
      )}

      <DuplicateDataModal
        isOpen={isDuplicateDataModalOpen}
        onClose={() => setIsDuplicateDataModalOpen(false)}
        onDuplicate={handleDuplicate}
        currentBulan={currentCalMonth}
        currentTahun={selectedYear}
      />

      <DownloadDatabaseModal
        isOpen={isDownloadDatabaseModalOpen}
        onClose={() => setIsDownloadDatabaseModalOpen(false)}
        userDept={user.deptId || 'PROD'}
        isUser={user.role === 'USER'}
      />

      <ImportDataModal
        isOpen={isImportDataModalOpen}
        onClose={() => setIsImportDataModalOpen(false)}
        onSuccess={() => {
          reloadDatabase();
          addToast({
            type: 'success',
            title: 'Sinkronisasi Data Berhasil',
            message: 'Data manpower telah diperbarui dan disinkronkan ke seluruh sistem.',
          });
        }}
        user={user}
        defaultTargetType={importDataTargetType}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        currentUser={user}
        onUsersUpdated={() => {
          reloadDatabase();
        }}
        showToast={(type, title, message) => {
          addToast({
            type,
            title,
            message: message || '',
          });
        }}
      />

      <RecipientDownloadModal
        isOpen={isRecipientDownloadModalOpen}
        onClose={() => setIsRecipientDownloadModalOpen(false)}
        initialState={recipientDownloadState}
      />

      {/* Item Preview Modal Dialog */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase">
                DETAIL MANPOWER
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{previewItem.deptName}</h3>
              <p className="text-[11px] text-slate-400 font-mono">Kode Departemen: {previewItem.deptId}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-sans block">Regular Worker</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{previewItem.rw}</span>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-sans block">Outsource</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{previewItem.os}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">Catatan / Remarks:</span>
              <p className="text-slate-700 dark:text-slate-300 italic">{previewItem.remarks || 'Tidak ada catatan.'}</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
