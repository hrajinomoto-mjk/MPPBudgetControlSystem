import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ClipboardList,
  Target,
  Activity,
  Brain,
  FileSpreadsheet,
  FileText,
  RotateCw,
  Search,
  Eye,
  Layers,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  Info,
  ChevronDown,
  ChevronUp,
  SearchCheck,
  FileCheck2,
  X,
} from 'lucide-react';
import { DashboardItem, User } from '../types';
import { FISCAL_MONTH_LABELS, CALENDAR_MONTH_NAMES, fiscalToCalendarMonth, getFiscalYear, formatFiscalYearLabel } from '../utils/fiscal';
import { getMonthlyTrendDataByFY, getStoredPlans, getStoredActuals, getDashboardData } from '../utils/storage';
import { pageContainerVariants, staggerItemVariants, staggerSubGridVariants, staggerSubCardVariants } from '../utils/motion';
import { CalendarHeatmap } from './CalendarHeatmap';
import { TopOverstaffedLeaderboard } from './TopOverstaffedLeaderboard';
import { DepartmentCardsDeck } from './DepartmentCardsDeck';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  user: User | null;
  items: DashboardItem[];
  selectedFiscalMonth: number | 'ALL';
  selectedYear: number;
  selectedDept: string;
  onChangeFiscalMonth: (m: number | 'ALL') => void;
  onChangeYear: (y: number) => void;
  onChangeDept: (d: string) => void;
  onRefresh: () => void;
  onOpenExecutiveReport: () => void;
  onOpenUserReport: () => void;
  onOpenDownloadExcel: () => void;
  onOpenImportData?: () => void;
  onPreviewItem: (item: DashboardItem) => void;
  isDark: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  items,
  selectedFiscalMonth,
  selectedYear,
  selectedDept,
  onChangeFiscalMonth,
  onChangeYear,
  onChangeDept,
  onRefresh,
  onOpenExecutiveReport,
  onOpenUserReport,
  onOpenDownloadExcel,
  onOpenImportData,
  onPreviewItem,
  isDark,
}) => {
  const [searchTable, setSearchTable] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInsightExpanded, setIsInsightExpanded] = useState(false);
  const rowsPerPage = 7;

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const isDepartmentUser = user?.role === 'USER';
  const calendarMonth = selectedFiscalMonth === 'ALL' ? (new Date().getMonth() + 1) : fiscalToCalendarMonth(selectedFiscalMonth);
  const fiscalYear = getFiscalYear(calendarMonth, selectedYear);
  const selectedMonthLabel =
    selectedFiscalMonth === 'ALL'
      ? 'Akumulasi FY'
      : `${CALENDAR_MONTH_NAMES[calendarMonth - 1] || 'Bulan'} (FM-${selectedFiscalMonth})`;
  const safeItems = Array.isArray(items) ? items : [];

  const allPlans = useMemo(() => getStoredPlans(), [isRefreshing]);
  const allActuals = useMemo(() => getStoredActuals(), [isRefreshing]);

  // Always compute full factory department records so cards and overview remain interactive even when filtered
  const allFactoryItems = useMemo(() => {
    return getDashboardData('ALL', selectedFiscalMonth === 'ALL' ? undefined : calendarMonth, selectedYear);
  }, [selectedFiscalMonth, calendarMonth, selectedYear, isRefreshing]);

  // Aggregated KPIs
  const { totalPlan, totalActual, gap, achievement, status } = useMemo(() => {
    let p = 0;
    let a = 0;
    safeItems.forEach((item) => {
      p += item.plan || 0;
      a += item.actual || 0;
    });
    const g = a - p;
    const ach = p > 0 ? (a / p) * 100 : 0;
    let st: 'OVER' | 'OPTIMAL' | 'UNDER' = 'OPTIMAL';
    if (ach > 100) st = 'OVER';
    else if (ach < 90) st = 'UNDER';

    return {
      totalPlan: p,
      totalActual: a,
      gap: g,
      achievement: ach,
      status: st,
    };
  }, [safeItems]);

  // AI Insight Generator - Humanized, Objective & Detail-Oriented
  const aiInsight = useMemo(() => {
    if (safeItems.length === 0) {
      return {
        title: 'Analisis Belum Tersedia',
        subtitle: 'Pilih filter periode untuk memuat analisis menyeluruh.',
        narrative: 'Silakan pilih departemen atau periode bulan fiscal untuk menampilkan analisis alokasi tenaga kerja.',
        over: [],
        under: [],
        optimal: [],
        recommendations: [],
      };
    }

    const overDepts = safeItems
      .filter((d) => (d.achievement || 0) > 100)
      .sort((a, b) => (b.achievement || 0) - (a.achievement || 0));
    const underDepts = safeItems
      .filter((d) => (d.achievement || 0) < 90)
      .sort((a, b) => (a.achievement || 0) - (b.achievement || 0));
    const optimalDepts = safeItems
      .filter((d) => (d.achievement || 0) >= 90 && (d.achievement || 0) <= 100)
      .sort((a, b) => (b.achievement || 0) - (a.achievement || 0));

    // Dynamic Title without negative judgements
    let title = 'Stabilitas Alokasi & Utilisasi Terkendali';
    let subtitle = 'Penyelarasan antara alokasi perencanaan dan realisasi berjalan berimbang.';

    if (achievement > 100) {
      title = 'Tinjauan Penyelarasan Kapasitas Manpower';
      subtitle = 'Perlu kajian kolaboratif bersama departemen terkait untuk meninjau dinamika beban kerja.';
    } else if (achievement < 90) {
      title = 'Dukungan & Progres Pemenuhan Tenaga Kerja';
      subtitle = 'Optimalisasi koordinasi pemenuhan kebutuhan lini operasional pabrik.';
    }

    // Humanized, constructive narrative
    let narrative = `Tingkat utilisasi tenaga kerja pabrik saat ini tercatat sebesar ${achievement.toFixed(
      1
    )}% (realisasi ${totalActual.toLocaleString()} orang dari alokasi rencana ${totalPlan.toLocaleString()} orang). Sebanyak ${optimalDepts.length} dari total ${safeItems.length} departemen beroperasi pada rentang kapasitas yang sangat ideal.`;

    if (overDepts.length > 0) {
      narrative += ` Untuk ${overDepts.length} departemen dengan realisasi di atas alokasi awal, disarankan melakukan kajian berkala bersama Kepala Departemen guna meninjau kebutuhan penyesuaian target volume produksi, lonjakan permintaan musiman (seasonal demand), dan efektivitas jam kerja lembur.`;
    }

    if (underDepts.length > 0) {
      narrative += ` Sementara pada ${underDepts.length} departemen yang berada di bawah target, proses percepatan seleksi dan pemenuhan alokasi mitra kerja terus dimonitor secara intensif.`;
    }

    // Actionable, constructive steps
    const recommendations = [
      {
        title: 'Kajian Beban Kerja & Lembur Bersama PIC',
        desc:
          overDepts.length > 0
            ? `Diskusikan secara berkala bersama tim ${overDepts.slice(0, 2).map((d) => d.deptName).join(', ')}${
                overDepts.length > 2 ? ' dan departemen terkait' : ''
              } untuk memastikan kebutuhan tambahan telah selaras dengan jadwal produksi.`
            : 'Pertahankan keselarasan pembagian jadwal shift kerja dan evaluasi kebutuhan lembur harian.',
      },
      {
        title: 'Fleksibilitas Rotasi Antar-Lini Operasional',
        desc:
          underDepts.length > 0 && overDepts.length > 0
            ? 'Pertimbangkan opsi cross-skilling atau rotasi sementara tenaga kerja untuk mendukung departemen yang sedang membutuhkan kapasitas mendesak.'
            : 'Tingkatkan fleksibilitas kompetensi karyawan agar mobilitas kerja antar seksi berjalan responsif saat terjadi lonjakan beban kerja.',
      },
      {
        title: 'Sinkronisasi Rencana Mitra Kerja (Outsource)',
        desc: 'Lakukan evaluasi berkala rasio pemenuhan tenaga kerja Outsource dan Regular Worker demi menjaga stabilitas biaya dan produktivitas pabrik.',
      },
    ];

    return {
      title,
      subtitle,
      narrative,
      over: overDepts,
      under: underDepts,
      optimal: optimalDepts,
      recommendations,
    };
  }, [safeItems, achievement, totalPlan, totalActual]);

  // 12-Month Fiscal Trend Data
  const monthlyTrendData = useMemo(() => {
    const data = getMonthlyTrendDataByFY(selectedDept, fiscalYear);
    return Array.isArray(data) ? data : [];
  }, [selectedDept, fiscalYear]);

  // Filtered Table Items
  const filteredTableItems = useMemo(() => {
    const q = (searchTable || '').toLowerCase();
    return safeItems.filter((item) => (item.deptName || '').toLowerCase().includes(q));
  }, [safeItems, searchTable]);

  const totalPages = Math.ceil(filteredTableItems.length / rowsPerPage) || 1;
  const paginatedItems = filteredTableItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Chart theme colors
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // Chart 1: Budget vs Actual Bar with line
  const mainBarData = {
    labels: safeItems.map((d) => (d.deptName.length > 14 ? d.deptName.substring(0, 14) + '…' : d.deptName)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Budget (Plan)',
        data: safeItems.map((d) => d.plan),
        backgroundColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.5)',
        borderRadius: 8,
        barThickness: 'flex' as const,
        maxBarThickness: 32,
      },
      {
        type: 'bar' as const,
        label: 'Actual (Realisasi)',
        data: safeItems.map((d) => d.actual),
        backgroundColor: '#e60012',
        borderRadius: 8,
        barThickness: 'flex' as const,
        maxBarThickness: 32,
      },
      {
        type: 'line' as const,
        label: '% Pencapaian',
        data: safeItems.map((d) => d.achievement),
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        borderWidth: 2,
        pointRadius: 4,
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const mainBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const clickedItem = safeItems[index];
        if (clickedItem && clickedItem.deptId) {
          onChangeDept(clickedItem.deptId);
        }
      }
    },
    onHover: (event: any, chartElement: any[]) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = chartElement?.length > 0 ? 'pointer' : 'default';
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: textMuted, boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textMuted, maxRotation: 45, minRotation: 0, font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textMuted, font: { size: 10 } },
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#10b981',
          font: { size: 10 },
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  // Chart 2: Variance Bar per Dept
  const varianceChartData = {
    labels: safeItems.map((d) => (d.deptName.length > 12 ? d.deptName.substring(0, 12) + '…' : d.deptName)),
    datasets: [
      {
        label: 'Selisih Variance',
        data: safeItems.map((d) => d.gap),
        backgroundColor: safeItems.map((d) => (d.gap > 0 ? '#e60012' : d.gap === 0 ? '#94a3b8' : '#10b981')),
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const varianceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const clickedItem = safeItems[index];
        if (clickedItem && clickedItem.deptId) {
          onChangeDept(clickedItem.deptId);
        }
      }
    },
    onHover: (event: any, chartElement: any[]) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = chartElement?.length > 0 ? 'pointer' : 'default';
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Selisih: ${ctx.raw > 0 ? '+' : ''}${ctx.raw} orang`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textMuted, maxRotation: 45, minRotation: 0, font: { size: 10 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textMuted, font: { size: 10 } },
      },
    },
  };

  // Chart 3: Doughnut Total Composition
  const doughnutData = {
    labels: ['Regular Worker (RW)', 'Outsource (OS)'],
    datasets: [
      {
        data: [
          safeItems.reduce((s, d) => s + (d.actualRW || 0), 0),
          safeItems.reduce((s, d) => s + (d.actualOS || 0), 0),
        ],
        backgroundColor: ['#2563eb', '#e60012'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: textMuted, boxWidth: 10, usePointStyle: true, font: { size: 11 } },
      },
    },
  };

  // Chart 4: Monthly FY Trend
  const monthlyTrendChartData = {
    labels: monthlyTrendData.map((d) => FISCAL_MONTH_LABELS[d.fiscalMonth] || String(d.fiscalMonth)),
    datasets: [
      {
        label: 'Budget (Plan)',
        data: monthlyTrendData.map((d) => d.plan),
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        tension: 0.35,
        fill: false,
      },
      {
        label: 'Actual (Realisasi)',
        data: monthlyTrendData.map((d) => d.actual),
        borderColor: '#e60012',
        backgroundColor: isDark ? 'rgba(230, 0, 18, 0.15)' : 'rgba(230, 0, 18, 0.08)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#e60012',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const monthlyTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: textMuted, boxWidth: 12, usePointStyle: true },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textMuted, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textMuted, font: { size: 11 } },
      },
    },
  };

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header & Filter Row */}
      <motion.div
        variants={staggerItemVariants}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div>
          <span className="text-[11px] font-bold tracking-wider text-red-600 dark:text-red-400 uppercase">
            FACTORY WORKFORCE ANALYTICS
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
            Executive Summary Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring Manpower Budget vs Actual — Real-time Factory Floor View ({formatFiscalYearLabel(fiscalYear)})
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Fiscal Month Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedFiscalMonth}
              onChange={(e) => onChangeFiscalMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Bulan (FY)</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Bulan {i + 1} ({FISCAL_MONTH_LABELS[i + 1]})
                </option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <select
              value={selectedYear}
              onChange={(e) => onChangeYear(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-70 shadow-2xs"
            title="Refresh database real-time & sinkronisasi cloud (Shortcut: R)"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600 dark:text-red-400' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Merefresh...' : 'Refresh'}</span>
          </motion.button>

          {isDepartmentUser ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenUserReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Dept</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenExecutiveReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Executive</span>
            </motion.button>
          )}

          {/* Import Data - Khusus Kewenangan Admin Master */}
          {user?.role === 'ADMIN' && onOpenImportData && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenImportData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Import Data & Integrasi Database (Excel, Google Sheets, Supabase)"
            >
              <FileUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="hidden sm:inline">Import Data</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onOpenDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Download Excel database"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Active Focus Alert Banner (Shown when a single department is focused) */}
      {selectedDept !== 'ALL' && (
        <motion.div
          variants={staggerItemVariants}
          className="p-4 rounded-3xl bg-gradient-to-r from-red-600/10 via-red-500/5 to-transparent dark:from-red-950/40 dark:via-red-900/20 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                  FOKUS DEPARTEMEN AKTIF
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  {selectedDept}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {safeItems[0]?.deptName || selectedDept}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onChangeDept('ALL')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs transition-all border border-red-200 dark:border-red-800 shadow-2xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset ke Semua Departemen (ALL)</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 5 KPI Stat Cards with Staggered Entrance and Micro-Hover */}
      <motion.div variants={staggerItemVariants}>
        <motion.div variants={staggerSubGridVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Budget */}
          <motion.div
            variants={staggerSubCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3.5 relative overflow-hidden"
          >
            <div className="w-2 h-full absolute left-0 top-0 bg-red-600" />
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Budget</div>
              <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{totalPlan.toLocaleString()}</div>
            </div>
          </motion.div>

          {/* Total Actual */}
          <motion.div
            variants={staggerSubCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3.5 relative overflow-hidden"
          >
            <div className="w-2 h-full absolute left-0 top-0 bg-blue-600" />
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Actual</div>
              <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{totalActual.toLocaleString()}</div>
            </div>
          </motion.div>

          {/* Variance / Gap */}
          <motion.div
            variants={staggerSubCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3.5 relative overflow-hidden"
          >
            <div className={`w-2 h-full absolute left-0 top-0 ${gap > 0 ? 'bg-red-600' : 'bg-emerald-600'}`} />
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                gap > 0
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {gap > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Variance (Gap)</div>
              <div
                className={`text-xl font-mono font-extrabold ${
                  gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {gap > 0 ? '+' : ''}{gap.toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Achievement % */}
          <motion.div
            variants={staggerSubCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3.5 relative overflow-hidden"
          >
            <div className="w-2 h-full absolute left-0 top-0 bg-indigo-600" />
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Result vs Budget</div>
              <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{achievement.toFixed(1)}%</div>
            </div>
          </motion.div>

          {/* Manpower Status */}
          <motion.div
            variants={staggerSubCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3.5 relative overflow-hidden"
          >
            <div
              className={`w-2 h-full absolute left-0 top-0 ${
                status === 'OVER' ? 'bg-red-600' : status === 'UNDER' ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
            />
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                status === 'OVER'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-600'
                  : status === 'UNDER'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status Factory</div>
              <div
                className={`text-sm font-extrabold tracking-wide ${
                  status === 'OVER'
                    ? 'text-red-600 dark:text-red-400'
                    : status === 'UNDER'
                    ? 'text-amber-500'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {status}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* AI Intelligence Insight Box - Humanized & Detailed Presentation */}
      <motion.div
        variants={staggerItemVariants}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl border border-slate-800/80 relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 shadow-inner">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">
                  AI WORKFORCE INTELLIGENCE
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 text-slate-300">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Real-Time Analytics
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{aiInsight.title}</h3>
              <p className="text-[11px] text-slate-400">{aiInsight.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 text-xs font-mono font-bold bg-white/10 rounded-xl border border-white/15 shadow-2xs">
              {achievement.toFixed(1)}% Achv
            </span>
            <span className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 rounded-xl border border-slate-700/60">
              {safeItems.length} Dept Dipantau
            </span>
          </div>
        </div>

        {/* Narrative */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 mb-4">
          <p className="text-xs text-slate-200 leading-relaxed">
            {aiInsight.narrative}
          </p>
        </div>

        {/* 3 Categories: Optimal, Needs Review, In Progress */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* 1. Sesuai Perencanaan */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sesuai Perencanaan (90 - 100%)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {aiInsight.optimal.length} Dept
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Alokasi tenaga kerja seimbang & produktif sesuai target alokasi. Klik untuk fokus.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {aiInsight.optimal.length > 0 ? (
                aiInsight.optimal.map((d) => (
                  <button
                    type="button"
                    key={d.deptId}
                    onClick={() => onChangeDept(d.deptId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-950/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 hover:text-white transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    title={`Klik untuk fokuskan ${d.deptName} • Actual: ${d.actual} (Plan: ${d.plan})`}
                  >
                    <span className="truncate max-w-[120px]">{d.deptName}</span>
                    <span className="font-mono text-emerald-400 font-bold">({d.achievement.toFixed(0)}%)</span>
                  </button>
                ))
              ) : (
                <span className="text-slate-500 text-[11px] italic">Tidak ada departemen dalam rentang ini</span>
              )}
            </div>
          </div>

          {/* 2. Perlu Kajian Alokasi (>100%) - Constructive, No Negative Judgement */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-amber-500/25 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <SearchCheck className="w-3.5 h-3.5 text-amber-400" />
                Perlu Kajian Alokasi (&gt;100%)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {aiInsight.over.length} Dept
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Disarankan telaah bersama PIC terkait fluktuasi output & lembur. Klik untuk fokus.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {aiInsight.over.length > 0 ? (
                aiInsight.over.map((d) => (
                  <button
                    type="button"
                    key={d.deptId}
                    onClick={() => onChangeDept(d.deptId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-950/40 hover:bg-amber-800/60 border border-amber-500/30 text-amber-200 hover:text-white transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    title={`Klik untuk fokuskan ${d.deptName} • Actual: ${d.actual} (Plan: ${d.plan}, Selisih: +${d.gap})`}
                  >
                    <span className="truncate max-w-[120px]">{d.deptName}</span>
                    <span className="font-mono text-amber-400 font-bold">(+{d.gap} MP • {d.achievement.toFixed(0)}%)</span>
                  </button>
                ))
              ) : (
                <span className="text-emerald-400 text-[11px] font-medium">Semua departemen dalam estimasi rencana</span>
              )}
            </div>
          </div>

          {/* 3. Dalam Pemenuhan (<90%) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Dalam Pemenuhan (&lt;90%)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {aiInsight.under.length} Dept
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Proses rekrutmen & pemenuhan kapasitas mitra terus berjalan bertahap. Klik untuk fokus.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {aiInsight.under.length > 0 ? (
                aiInsight.under.map((d) => (
                  <button
                    type="button"
                    key={d.deptId}
                    onClick={() => onChangeDept(d.deptId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-blue-950/40 hover:bg-blue-800/60 border border-blue-500/30 text-blue-200 hover:text-white transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    title={`Klik untuk fokuskan ${d.deptName} • Actual: ${d.actual} (Plan: ${d.plan}, Selisih: ${d.gap})`}
                  >
                    <span className="truncate max-w-[120px]">{d.deptName}</span>
                    <span className="font-mono text-blue-400 font-bold">({d.gap} MP • {d.achievement.toFixed(0)}%)</span>
                  </button>
                ))
              ) : (
                <span className="text-emerald-400 text-[11px] font-medium">Semua departemen terpenuhi</span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Recommendations / Collaborative Action Plan */}
        <div className="relative z-10 mt-3.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsInsightExpanded(!isInsightExpanded)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-semibold"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rekomendasi Tindak Lanjut & Catatan Kolaboratif Antar-Departemen</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{isInsightExpanded ? 'Sembunyikan Rincian' : 'Lihat Rekomendasi Lengkap'}</span>
              {isInsightExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          <AnimatePresence>
            {isInsightExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden"
              >
                {aiInsight.recommendations.map((rec, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    key={idx}
                    className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-slate-200 font-bold text-[11px] mb-1">
                        <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center text-[10px] font-mono font-bold">
                          {idx + 1}
                        </span>
                        <span>{rec.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{rec.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 12-Month FY Trend Chart */}
      <motion.div
        variants={staggerItemVariants}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              FISCAL YEAR PERSPECTIVE
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Trend Total Manpower vs Budget ({formatFiscalYearLabel(fiscalYear)})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">12 Fiscal Months (Apr - Mar)</span>
        </div>

        <div className="h-64 w-full">
          <Line data={monthlyTrendChartData} options={monthlyTrendOptions} />
        </div>
      </motion.div>

      {/* 2-Grid Charts: Main Bar & Doughnut */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Budget vs Actual */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Budget vs Actual per Departemen
            </h3>
            <span className="text-xs text-slate-400">{items.length} Departemen</span>
          </div>

          <div className="h-72 w-full">
            <Bar data={mainBarData as any} options={mainBarOptions as any} />
          </div>
        </motion.div>

        {/* Doughnut Composition */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Komposisi Tenaga Kerja (RW vs OS)
            </h3>
            <p className="text-xs text-slate-400">Rasio Regular Worker terhadap Outsource</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
              <span className="text-[10px] block opacity-70">Regular Worker</span>
              <span className="font-mono font-bold text-sm">
                {items.reduce((s, d) => s + d.actualRW, 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
              <span className="text-[10px] block opacity-70">Outsource</span>
              <span className="font-mono font-bold text-sm">
                {items.reduce((s, d) => s + d.actualOS, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Top 5 Overstaffed Departments - Comparative Bar Chart & Rebalancing Priority Leaderboard */}
      <motion.div variants={staggerItemVariants}>
        <TopOverstaffedLeaderboard
          items={safeItems}
          selectedMonthName={selectedMonthLabel}
          selectedYear={selectedYear}
          onSelectDept={onChangeDept}
          isDark={isDark}
        />
      </motion.div>

      {/* Variance Bar Chart */}
      <motion.div
        variants={staggerItemVariants}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Variance (Selisih Aktual - Budget) per Departemen
        </h3>
        <div className="h-60 w-full">
          <Bar data={varianceChartData} options={varianceChartOptions} />
        </div>
      </motion.div>

      {/* Calendar Heatmap View - Pattern Recognition for Daily & Departmental Manpower Variances */}
      <motion.div variants={staggerItemVariants}>
        <CalendarHeatmap
          items={safeItems}
          allPlans={allPlans}
          allActuals={allActuals}
          currentCalendarMonth={calendarMonth}
          currentYear={selectedYear}
          selectedDept={selectedDept}
          onSelectDept={onChangeDept}
          isDark={isDark}
        />
      </motion.div>

      {/* Department Quick Cards Deck - Interactive 1-Click Department Focus */}
      <motion.div variants={staggerItemVariants}>
        <DepartmentCardsDeck
          items={allFactoryItems}
          selectedDept={selectedDept}
          onSelectDept={onChangeDept}
          isDark={isDark}
        />
      </motion.div>

      {/* Table Section with search */}
      <motion.div
        variants={staggerItemVariants}
        className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rincian Data Manpower Departemen</h3>
            <p className="text-xs text-slate-400">Tabel monitoring alokasi RW, OS, dan status achievement. Klik baris untuk memfokuskan data.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTable}
              onChange={(e) => {
                setSearchTable(e.target.value);
                setPage(1);
              }}
              placeholder="Cari Departemen..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-3 text-left">Departemen</th>
                <th className="p-3 text-center">Budget (Plan)</th>
                <th className="p-3 text-center">Actual (Realisasi)</th>
                <th className="p-3 text-center">Selisih</th>
                <th className="p-3 text-center">Achv %</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada departemen yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => (
                  <tr
                    key={row.deptId}
                    onClick={() => onChangeDept(row.deptId)}
                    className={`cursor-pointer transition-colors ${
                      selectedDept === row.deptId
                        ? 'bg-red-50/70 dark:bg-red-950/40 font-semibold'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                    title={`Klik untuk memfokuskan data departemen ${row.deptName}`}
                  >
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        {selectedDept === row.deptId && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        )}
                        <span>{row.deptName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{row.deptId}</span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="font-bold">{row.plan}</span>
                      <div className="text-[10px] text-slate-400">RW:{row.planRW} OS:{row.planOS}</div>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="font-bold">{row.actual}</span>
                      <div className="text-[10px] text-slate-400">RW:{row.actualRW} OS:{row.actualOS}</div>
                    </td>
                    <td
                      className={`p-3 text-center font-mono font-bold ${
                        row.gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {row.gap > 0 ? '+' : ''}{row.gap}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{row.achievement.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'OVER'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                            : row.status === 'UNDER'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewItem(row);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Lihat Rincian Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Menampilkan {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredTableItems.length)} dari {filteredTableItems.length}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
