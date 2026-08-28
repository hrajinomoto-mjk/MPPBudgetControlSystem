import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { DashboardItem, User } from '../types';
import { FISCAL_MONTH_LABELS, fiscalToCalendarMonth, getFiscalYear, formatFiscalYearLabel } from '../utils/fiscal';
import { getMonthlyTrendDataByFY } from '../utils/storage';

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
  const rowsPerPage = 7;

  const isDepartmentUser = user?.role === 'USER';
  const calendarMonth = selectedFiscalMonth === 'ALL' ? 4 : fiscalToCalendarMonth(selectedFiscalMonth);
  const fiscalYear = getFiscalYear(calendarMonth, selectedYear);
  const safeItems = Array.isArray(items) ? items : [];

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

  // AI Insight Generator
  const aiInsight = useMemo(() => {
    if (safeItems.length === 0) return { title: 'Belum Ada Data', narrative: 'Pilih filter untuk memuat data analisis.', highlights: [], over: [], under: [], optimal: [] };

    const overDepts = safeItems.filter((d) => (d.achievement || 0) > 100).sort((a, b) => (b.achievement || 0) - (a.achievement || 0));
    const underDepts = safeItems.filter((d) => (d.achievement || 0) < 90).sort((a, b) => (a.achievement || 0) - (b.achievement || 0));
    const optimalDepts = safeItems.filter((d) => (d.achievement || 0) >= 90 && (d.achievement || 0) <= 100);

    let narrative = '';
    if (achievement > 100) {
      narrative = `Secara keseluruhan tercatat kelebihan kapasitas manpower (Over Budget) sebesar ${achievement.toFixed(
        1
      )}% dari total perencanaan. Terdapat ${overDepts.length} departemen yang melampaui alokasi target.`;
    } else if (achievement >= 90) {
      narrative = `Manpower pabrik berada dalam rentang operasi OPTIMAL (${achievement.toFixed(
        1
      )}%). Alokasi Regular Worker dan Outsource terkendali stabil di ${optimalDepts.length} departemen.`;
    } else {
      narrative = `Realisasi tenaga kerja berada di bawah target (${achievement.toFixed(
        1
      )}%). Perlu peninjauan kecepatan pemenuhan vendor tenaga kerja Outsource di ${underDepts.length} departemen.`;
    }

    return {
      title: status === 'OVER' ? 'Peringatan Kapasitas Berlebih' : status === 'UNDER' ? 'Perhatian Pemenuhan Tenaga Kerja' : 'Kondisi Operasional Optimal',
      narrative,
      over: overDepts,
      under: underDepts,
      optimal: optimalDepts,
    };
  }, [safeItems, achievement, status]);

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Filter Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
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
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            title="Refresh data real-time (r)"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isDepartmentUser ? (
            <button
              type="button"
              onClick={onOpenUserReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Dept</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenExecutiveReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Executive</span>
            </button>
          )}

          {/* Import Data - Khusus Kewenangan Admin Master */}
          {user?.role === 'ADMIN' && onOpenImportData && (
            <button
              type="button"
              onClick={onOpenImportData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Import Data & Integrasi Database (Excel, Google Sheets, Supabase)"
            >
              <FileUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="hidden sm:inline">Import Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Download Excel database"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Budget */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-2 h-full absolute left-0 top-0 bg-red-600" />
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Budget</div>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{totalPlan.toLocaleString()}</div>
          </div>
        </div>

        {/* Total Actual */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-2 h-full absolute left-0 top-0 bg-blue-600" />
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Actual</div>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{totalActual.toLocaleString()}</div>
          </div>
        </div>

        {/* Variance / Gap */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 relative overflow-hidden">
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
        </div>

        {/* Achievement % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-2 h-full absolute left-0 top-0 bg-indigo-600" />
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Result vs Budget</div>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{achievement.toFixed(1)}%</div>
          </div>
        </div>

        {/* Manpower Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 relative overflow-hidden">
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
        </div>
      </div>

      {/* AI Intelligence Insight Box */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">
                AI WORKFORCE INTELLIGENCE
              </span>
              <h3 className="text-sm font-bold text-slate-100">{aiInsight.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-mono font-bold bg-white/10 rounded-full border border-white/20">
              {achievement.toFixed(1)}% Achv
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">{aiInsight.narrative}</p>

        {/* Highlights row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
              🏆 Optimal (90 - 100%)
            </span>
            <div className="text-slate-200 truncate">
              {aiInsight.optimal && aiInsight.optimal.length > 0
                ? aiInsight.optimal.map((d) => d.deptName).slice(0, 3).join(', ')
                : 'Tidak ada'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">
              🚨 Over Budget (&gt;100%)
            </span>
            <div className="text-slate-200 truncate">
              {aiInsight.over && aiInsight.over.length > 0
                ? aiInsight.over.map((d) => d.deptName).slice(0, 3).join(', ')
                : 'Nol Over Budget'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
              ⚠️ Under Target (&lt;90%)
            </span>
            <div className="text-slate-200 truncate">
              {aiInsight.under && aiInsight.under.length > 0
                ? aiInsight.under.map((d) => d.deptName).slice(0, 3).join(', ')
                : 'Nol Under Target'}
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month FY Trend Chart */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
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
      </div>

      {/* 2-Grid Charts: Main Bar & Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Budget vs Actual */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Budget vs Actual per Departemen
            </h3>
            <span className="text-xs text-slate-400">{items.length} Departemen</span>
          </div>

          <div className="h-72 w-full">
            <Bar data={mainBarData as any} options={mainBarOptions as any} />
          </div>
        </div>

        {/* Doughnut Composition */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
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
        </div>
      </div>

      {/* Variance Bar Chart */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Variance (Selisih Aktual - Budget) per Departemen
        </h3>
        <div className="h-60 w-full">
          <Bar data={varianceChartData} options={varianceChartOptions} />
        </div>
      </div>

      {/* Table Section with search */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rincian Data Manpower Departemen</h3>
            <p className="text-xs text-slate-400">Tabel monitoring alokasi RW, OS, dan status achievement</p>
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
                  <tr key={row.deptId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{row.deptName}</div>
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
                        onClick={() => onPreviewItem(row)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Lihat Rincian"
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
      </div>
    </div>
  );
};
