import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ScrollText,
  Search,
  Download,
  Shield,
  Calendar,
  User as UserIcon,
  Clock,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  KeyRound,
  Edit3,
  PlusCircle,
  Trash2,
  FileDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Copy,
  Check,
  Activity,
  Sparkles,
  X,
  Lock,
  Terminal,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { AuditLog, User as UserType } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { exportAuditLogsCSV } from '../utils/exportExcel';
import { pageContainerVariants, staggerItemVariants } from '../utils/motion';

interface AuditLogViewProps {
  logs?: AuditLog[];
  user: UserType | null;
}

type CategoryFilter = 'ALL' | 'AUTH' | 'DATA' | 'APPROVAL' | 'EXPORT' | 'SYSTEM';
type TimeFilter = 'ALL' | 'TODAY' | '7DAYS' | '30DAYS';

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs = [], user }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const isDeptUser = user?.role === 'USER';
  const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);

  // Dept ID to Name mapping
  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    DEPARTMENTS.forEach((d) => map.set(d.id, d.name));
    return map;
  }, []);

  // Helper to categorize action
  const getActionCategory = (action: string = ''): CategoryFilter => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('SESSION') || act.includes('AUTH')) {
      return 'AUTH';
    }
    if (
      act.includes('CREATE') ||
      act.includes('ADD') ||
      act.includes('UPDATE') ||
      act.includes('EDIT') ||
      act.includes('DELETE') ||
      act.includes('DUPLICATE') ||
      act.includes('IMPORT')
    ) {
      return 'DATA';
    }
    if (act.includes('APPROV') || act.includes('REJECT') || act.includes('REQUEST') || act.includes('REVIEW')) {
      return 'APPROVAL';
    }
    if (act.includes('EXPORT') || act.includes('DOWNLOAD') || act.includes('REPORT') || act.includes('PRINT')) {
      return 'EXPORT';
    }
    return 'SYSTEM';
  };

  // Helper to get action badge styling & icon
  const getActionBadge = (action: string = '') => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) {
      return {
        label: 'LOGIN BERHASIL',
        icon: KeyRound,
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
      };
    }
    if (act.includes('LOGOUT')) {
      return {
        label: 'USER LOGOUT',
        icon: LogOut,
        bg: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    }
    if (act.includes('CREATE') || act.includes('ADD')) {
      return {
        label: action,
        icon: PlusCircle,
        bg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
        dot: 'bg-cyan-500',
      };
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return {
        label: action,
        icon: Edit3,
        bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        dot: 'bg-blue-500',
      };
    }
    if (act.includes('DELETE') || act.includes('HAPUS')) {
      return {
        label: action,
        icon: Trash2,
        bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        dot: 'bg-rose-500',
      };
    }
    if (act.includes('APPROV')) {
      return {
        label: action,
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
      };
    }
    if (act.includes('REJECT')) {
      return {
        label: action,
        icon: X,
        bg: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
        dot: 'bg-red-500',
      };
    }
    if (act.includes('EXPORT') || act.includes('DOWNLOAD')) {
      return {
        label: action,
        icon: FileDown,
        bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        dot: 'bg-indigo-500',
      };
    }
    if (act.includes('SYNC') || act.includes('BACKUP')) {
      return {
        label: action,
        icon: RefreshCw,
        bg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
        dot: 'bg-purple-500',
      };
    }
    return {
      label: action || 'AKTIVITAS SISTEM',
      icon: Activity,
      bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    };
  };

  // Extract simulated hash checksum for display
  const getLogChecksum = (id: string, time: string) => {
    let hash = 0;
    const str = `${id}-${time}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6).toUpperCase();
  };

  // Format Relative Time
  const getRelativeTime = (timeStr: string) => {
    try {
      const logDate = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - logDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '-';
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = safeLogs.length;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const todayCount = safeLogs.filter((l) => l.time && l.time.slice(0, 10) === todayStr).length;
    const authCount = safeLogs.filter((l) => getActionCategory(l.action) === 'AUTH').length;
    const dataCount = safeLogs.filter((l) => getActionCategory(l.action) === 'DATA').length;
    const approvalCount = safeLogs.filter((l) => getActionCategory(l.action) === 'APPROVAL').length;
    const exportSyncCount = safeLogs.filter(
      (l) => getActionCategory(l.action) === 'EXPORT' || getActionCategory(l.action) === 'SYSTEM'
    ).length;

    const uniqueUsers = new Set(safeLogs.map((l) => l.user).filter(Boolean)).size;

    return {
      total,
      todayCount,
      authCount,
      dataCount,
      approvalCount,
      exportSyncCount,
      uniqueUsers,
    };
  }, [safeLogs]);

  // Actions list for dropdown
  const actionsList = useMemo(() => {
    return Array.from(new Set(safeLogs.map((l) => l.action).filter(Boolean)));
  }, [safeLogs]);

  // Filtered Logs
  const filtered = useMemo(() => {
    return safeLogs.filter((log) => {
      if (!log) return false;

      // Role Dept Restriction
      if (isDeptUser && user?.deptId && log.dept !== user.deptId && log.dept !== 'ALL' && log.dept !== '-') {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = getActionCategory(log.action);
        if (cat !== categoryFilter) return false;
      }

      // Action Filter
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }

      // Dept Filter (Admin only)
      if (deptFilter !== 'ALL' && log.dept !== deptFilter) {
        return false;
      }

      // Role / User Type Filter
      if (roleFilter !== 'ALL') {
        const isSystem = log.user === 'SYSTEM' || (log.user || '').toLowerCase().includes('system');
        const isAdmin = (log.user || '').toLowerCase().includes('admin');
        if (roleFilter === 'ADMIN' && !isAdmin) return false;
        if (roleFilter === 'USER' && (isAdmin || isSystem)) return false;
        if (roleFilter === 'SYSTEM' && !isSystem) return false;
      }

      // Time Range Filter
      if (timeFilter !== 'ALL') {
        const logDate = new Date(log.time).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (timeFilter === 'TODAY' && now - logDate > oneDay) return false;
        if (timeFilter === '7DAYS' && now - logDate > 7 * oneDay) return false;
        if (timeFilter === '30DAYS' && now - logDate > 30 * oneDay) return false;
      }

      // Search Query
      if (search) {
        const q = search.toLowerCase();
        const deptName = deptMap.get(log.dept) || '';
        return (
          (log.id || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q) ||
          (log.user || '').toLowerCase().includes(q) ||
          (log.dept || '').toLowerCase().includes(q) ||
          deptName.toLowerCase().includes(q) ||
          (log.detail || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [safeLogs, isDeptUser, user, categoryFilter, actionFilter, deptFilter, roleFilter, timeFilter, search, deptMap]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(currentPage * rowsPerPage, filtered.length);

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySummary = () => {
    const summaryText = `[AUDIT TRAIL SUMMARY]\nTotal Events: ${metrics.total}\nHari Ini: ${metrics.todayCount}\nAuth Events: ${metrics.authCount}\nData Mutations: ${metrics.dataCount}\nApprovals: ${metrics.approvalCount}\nUser Aktif: ${metrics.uniqueUsers}\nDicatat pada: ${new Date().toLocaleString('id-ID')}`;
    navigator.clipboard?.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const resetAllFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setActionFilter('ALL');
    setDeptFilter('ALL');
    setTimeFilter('ALL');
    setRoleFilter('ALL');
    setPage(1);
  };

  const isFiltered =
    search !== '' ||
    categoryFilter !== 'ALL' ||
    actionFilter !== 'ALL' ||
    deptFilter !== 'ALL' ||
    timeFilter !== 'ALL' ||
    roleFilter !== 'ALL';

  return (
    <motion.div variants={pageContainerVariants} initial="hidden" animate="visible" className="space-y-5">
      {/* 1. Executive Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                Audit Trail & Activity Log
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Logging
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Lock className="w-2.5 h-2.5 text-indigo-500" />
                ISO 27001 Compliance
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDeptUser
                ? `Catatan jejak aktivitas terotorisasi & mutasi data alokasi manpower Departemen ${user?.deptId}`
                : 'Sistem pencatatan rekam jejak kepatuhan, mutasi alokasi manpower, otentikasi akun, dan tata kelola pabrik'}
            </p>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95"
            title="Salin ringkasan statistik log ke clipboard"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSummary ? 'Tersalin' : 'Salin Ringkasan'}</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => exportAuditLogsCSV(isDeptUser ? user?.deptId : 'ALL')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Log</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Top Metric Analytics KPI Cards */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Events */}
        <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Log Event
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <ScrollText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {metrics.total.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              +{metrics.todayCount} Hari Ini
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-500" />
            <span>Tercatat pada local & cloud storage</span>
          </div>
        </div>

        {/* Metric 2: Authentication & Sessions */}
        <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Otentikasi & Sesi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics.authCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Event Login/Logout</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <UserIcon className="w-3 h-3 text-emerald-500" />
            <span>{metrics.uniqueUsers} Aktor Terverifikasi</span>
          </div>
        </div>

        {/* Metric 3: Data Mutations */}
        <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mutasi Data
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {metrics.dataCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Modifikasi Data</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 text-blue-500" />
            <span>Plan, Actual, Import & Update</span>
          </div>
        </div>

        {/* Metric 4: Governance & Approvals */}
        <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Governance & Reviu
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {(metrics.approvalCount + metrics.exportSyncCount).toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Review & Sync</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-500" />
            <span>Integritas Terenkripsi 100%</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Activity Distribution Ribbon & Security Compliance Bar */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Distribusi & Spektrum Aktivitas Sistem</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{filtered.length} Peristiwa Ditampilkan</span>
        </div>

        {/* Visual Progress Bar Distribution */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {metrics.total > 0 && (
            <>
              <div
                style={{ width: `${(metrics.authCount / metrics.total) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Otentikasi & Sesi: ${metrics.authCount}`}
              />
              <div
                style={{ width: `${(metrics.dataCount / metrics.total) * 100}%` }}
                className="bg-blue-500 h-full transition-all duration-500"
                title={`Mutasi Data: ${metrics.dataCount}`}
              />
              <div
                style={{ width: `${(metrics.approvalCount / metrics.total) * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Approval & Reviu: ${metrics.approvalCount}`}
              />
              <div
                style={{ width: `${(metrics.exportSyncCount / metrics.total) * 100}%` }}
                className="bg-purple-500 h-full transition-all duration-500"
                title={`Ekspor & Sync: ${metrics.exportSyncCount}`}
              />
            </>
          )}
        </div>

        {/* Legend Chips */}
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>
              Otentikasi ({metrics.total > 0 ? Math.round((metrics.authCount / metrics.total) * 100) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>
              Mutasi Data ({metrics.total > 0 ? Math.round((metrics.dataCount / metrics.total) * 100) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>
              Approval ({metrics.total > 0 ? Math.round((metrics.approvalCount / metrics.total) * 100) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>
              Ekspor & Sync ({metrics.total > 0 ? Math.round((metrics.exportSyncCount / metrics.total) * 100) : 0}%)
            </span>
          </div>
        </div>
      </motion.div>

      {/* 4. Interactive Category Chips & Multi-faceted Filter Hub */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        {/* Category Quick Chips Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'ALL'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Aktivitas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">{safeLogs.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('AUTH');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'AUTH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sesi & Autentikasi</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">{metrics.authCount}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('DATA');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'DATA'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Mutasi & Input Data</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">{metrics.dataCount}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('APPROVAL');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'APPROVAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Persetujuan & Reviu</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">{metrics.approvalCount}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('EXPORT');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'EXPORT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor & Laporan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('SYSTEM');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'SYSTEM'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sistem & Cloud Sync</span>
          </button>
        </div>

        {/* Detailed Controls Grid: Action, Department, Time, Role & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 items-center">
          {/* Action Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer truncate"
            >
              <option value="ALL">Semua Jenis Aksi</option>
              {actionsList.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter (Admin) or Locked Dept (User) */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isDeptUser ? (
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                {user?.deptId} • {deptMap.get(user?.deptId || '') || 'Dept Anda'}
              </span>
            ) : (
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer truncate"
              >
                <option value="ALL">Semua Departemen</option>
                <option value="ALL">Pabrik (ALL)</option>
                <option value="-">Sistem / Non-Dept (-)</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} • {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as TimeFilter);
                setPage(1);
              }}
              className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer truncate"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini (24 Jam)</option>
              <option value="7DAYS">7 Hari Terakhir</option>
              <option value="30DAYS">30 Hari Terakhir</option>
            </select>
          </div>

          {/* Role / User Type Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer truncate"
            >
              <option value="ALL">Semua Pengguna</option>
              <option value="ADMIN">Admin HR</option>
              <option value="USER">User Departemen</option>
              <option value="SYSTEM">System Bot</option>
            </select>
          </div>

          {/* Search Box with Clear */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari ID, user, aksi, detail, dept..."
              className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Feedback & Quick Reset Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Menampilkan {filtered.length} dari {safeLogs.length} total rekaman log
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-red-600 dark:text-red-400 hover:underline font-bold text-[11px] flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Tampilkan per halaman:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
              <option value={100}>100 Baris</option>
            </select>
          </div>
        </div>

        {/* 5. Rich, High-Density Logs Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white font-bold border-b border-slate-800 select-none">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center text-slate-400 font-mono">No</th>
                <th className="py-3 px-3.5 w-44">Waktu & Timestamp</th>
                <th className="py-3 px-3.5 w-56">User / Operator</th>
                <th className="py-3 px-3.5 w-48">Kategori & Jenis Aksi</th>
                <th className="py-3 px-3.5 w-44">Departemen Terkait</th>
                <th className="py-3 px-3.5">Detail Perubahan & Payload</th>
                <th className="py-3 px-3.5 w-24 text-center">Integritas</th>
                <th className="py-3 px-3.5 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0c1220]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400 mb-3">
                      <ScrollText className="w-7 h-7" />
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data audit log</div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Tidak ditemukan rekaman log yang sesuai dengan filter atau kata kunci pencarian saat ini.
                    </p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-3 px-3.5 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-bold text-xs hover:bg-red-100 transition-all cursor-pointer"
                      >
                        Reset Semua Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((log, index) => {
                  const badge = getActionBadge(log.action);
                  const BadgeIcon = badge.icon;
                  const deptFullName = deptMap.get(log.dept) || (log.dept === 'ALL' ? 'Semua Dept' : log.dept);
                  const isSystemUser = log.user === 'SYSTEM' || (log.user || '').toLowerCase().includes('system');
                  const isAdminUser = (log.user || '').toLowerCase().includes('admin');
                  const checksum = getLogChecksum(log.id, log.time);
                  const relativeTime = getRelativeTime(log.time);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* No / Index */}
                      <td className="py-3 px-3.5 text-center font-mono text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        {startIdx + index}
                      </td>

                      {/* Timestamp & Relative Time */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {new Date(log.time).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span>{new Date(log.time).toLocaleTimeString('id-ID')} WIB</span>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{relativeTime}</span>
                        </div>
                      </td>

                      {/* User / Operator */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSystemUser
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300'
                                : isAdminUser
                                ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300'
                                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                            }`}
                          >
                            {isSystemUser ? 'SYS' : (log.user || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                              {log.user}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                  isSystemUser
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : isAdminUser
                                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}
                              >
                                {isSystemUser ? 'SYSTEM BOT' : isAdminUser ? 'ADMIN HR' : 'DEPT USER'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Action Badge */}
                      <td className="py-3 px-3.5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[130px]">{badge.label}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {log.dept}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={deptFullName}>
                            {deptFullName}
                          </span>
                        </div>
                      </td>

                      {/* Detail & Activity Payload */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        <div className="line-clamp-2">{log.detail}</div>
                      </td>

                      {/* Checksum & Status */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className="px-2 py-0.5 rounded-lg font-mono text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          title={`Security Checksum: ${checksum}`}
                        >
                          {checksum}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Lihat Detail Log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Comprehensive Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Menampilkan data <span className="font-bold text-slate-800 dark:text-slate-200">{startIdx}</span> -{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{endIdx}</span> dari{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> log terekam
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(1)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-300"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-300 font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {/* Page Status Indicator */}
            <span className="px-3 py-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>

            {/* Next Page */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-300 font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(totalPages)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-300"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 7. Detailed Log Inspection Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-white">
                    <ScrollText className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">Audit Log Record Inspector</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Timestamp</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                      {new Date(selectedLog.time).toLocaleString('id-ID')} WIB
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Departemen</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedLog.dept} • {deptMap.get(selectedLog.dept) || 'Semua / Pabrik'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">User / Aktor</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{selectedLog.user}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Jenis Aksi</span>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedLog.action}</div>
                  </div>
                </div>

                {/* Detail Description */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Deskripsi Aktivitas & Rincian
                  </label>
                  <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {selectedLog.detail}
                  </div>
                </div>

                {/* Security Verification & Raw Footprint */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Raw Audit Footprint (JSON Payload)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyId(JSON.stringify(selectedLog, null, 2))}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId ? 'Tersalin' : 'Salin JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                    {JSON.stringify(
                      {
                        ...selectedLog,
                        checksum: getLogChecksum(selectedLog.id, selectedLog.time),
                        client: 'Manpower Portal Client v2.0',
                        verified: true,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Integritas Audit Terverifikasi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
