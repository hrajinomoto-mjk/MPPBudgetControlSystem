import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Flame,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Building2,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DashboardItem, PlanRecord, ActualRecord } from '../types';
import {
  DailyHeatmapCell,
  DeptMatrixCell,
  generateDailyHeatmapData,
  generateDeptMatrixData,
} from '../utils/calendarHeatmapData';
import { DEPARTMENTS } from '../data/initialData';
import { CALENDAR_MONTH_NAMES } from '../utils/fiscal';

interface CalendarHeatmapProps {
  items: DashboardItem[];
  allPlans: PlanRecord[];
  allActuals: ActualRecord[];
  currentCalendarMonth: number; // 1 - 12
  currentYear: number;
  selectedDept: string;
  onSelectDept?: (deptId: string) => void;
  isDark?: boolean;
}

type HeatmapMode = 'DAILY_CALENDAR' | 'DEPT_MATRIX';
type VarianceFilter = 'ALL' | 'HIGH_VARIANCE' | 'WEEKDAYS' | 'WEEKENDS';

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  items,
  allPlans,
  allActuals,
  currentCalendarMonth,
  currentYear,
  selectedDept,
  onSelectDept,
}) => {
  const [mode, setMode] = useState<HeatmapMode>('DAILY_CALENDAR');
  const [varianceFilter, setVarianceFilter] = useState<VarianceFilter>('ALL');
  const [selectedDayCell, setSelectedDayCell] = useState<DailyHeatmapCell | null>(null);
  const [matrixSortBy, setMatrixSortBy] = useState<'NAME' | 'VARIANCE_DESC' | 'VARIANCE_ASC'>('VARIANCE_DESC');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Generate Daily Heatmap Data for selected month & year
  const dailyData = useMemo(() => {
    return generateDailyHeatmapData(items, currentCalendarMonth, currentYear, selectedDept);
  }, [items, currentCalendarMonth, currentYear, selectedDept]);

  // Generate Department vs 12 Fiscal Months Matrix
  const deptMatrixData = useMemo(() => {
    const raw = generateDeptMatrixData(allPlans, allActuals, currentYear);
    if (matrixSortBy === 'VARIANCE_DESC') {
      return [...raw].sort((a, b) => b.avgVariance - a.avgVariance);
    } else if (matrixSortBy === 'VARIANCE_ASC') {
      return [...raw].sort((a, b) => a.avgVariance - b.avgVariance);
    }
    return raw;
  }, [allPlans, allActuals, currentYear, matrixSortBy]);

  // Daily statistics for Pattern Recognition
  const dailyStats = useMemo(() => {
    if (!dailyData.length) return null;

    let maxVarianceDay = dailyData[0];
    let minVarianceDay = dailyData[0];
    let totalVar = 0;
    let highVarCount = 0;
    let optimalCount = 0;

    dailyData.forEach((day) => {
      totalVar += Math.abs(day.variance);
      if (day.variance > maxVarianceDay.variance) {
        maxVarianceDay = day;
      }
      if (Math.abs(day.variance) < Math.abs(minVarianceDay.variance)) {
        minVarianceDay = day;
      }
      if (day.status === 'SURPLUS_HIGH' || day.status === 'DEFICIT_HIGH') {
        highVarCount++;
      }
      if (day.status === 'OPTIMAL') {
        optimalCount++;
      }
    });

    const avgVariance = (totalVar / dailyData.length).toFixed(1);
    const stabilityScore = Math.round((optimalCount / dailyData.length) * 100);

    return {
      maxVarianceDay,
      minVarianceDay,
      avgVariance,
      highVarCount,
      optimalCount,
      stabilityScore,
    };
  }, [dailyData]);

  // Day offset for calendar start (Monday first)
  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(currentYear, currentCalendarMonth - 1, 1).getDay();
    // In JS 0=Sun, 1=Mon, ..., 6=Sat. We map Monday=0, ..., Sunday=6
    return firstDay === 0 ? 6 : firstDay - 1;
  }, [currentCalendarMonth, currentYear]);

  // Filtered days based on active filter
  const displayedDays = useMemo(() => {
    return dailyData.filter((d) => {
      if (varianceFilter === 'HIGH_VARIANCE') {
        return d.status === 'SURPLUS_HIGH' || d.status === 'DEFICIT_HIGH';
      }
      if (varianceFilter === 'WEEKDAYS') {
        return !d.isWeekend;
      }
      if (varianceFilter === 'WEEKENDS') {
        return d.isWeekend;
      }
      return true;
    });
  }, [dailyData, varianceFilter]);

  // Color mapper helper for Daily Heatmap
  const getCellColorClasses = (status: DailyHeatmapCell['status'], isMatchFilter: boolean) => {
    if (!isMatchFilter) {
      return 'opacity-30 bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800';
    }
    switch (status) {
      case 'SURPLUS_HIGH':
        return 'bg-gradient-to-br from-rose-500/20 to-red-600/25 border-rose-400/80 dark:border-rose-500/60 text-rose-800 dark:text-rose-200 shadow-xs shadow-rose-500/10 hover:border-rose-500';
      case 'SURPLUS_MODERATE':
        return 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/80 dark:border-amber-500/60 text-amber-800 dark:text-amber-200 shadow-xs shadow-amber-500/10 hover:border-amber-500';
      case 'OPTIMAL':
        return 'bg-gradient-to-br from-emerald-500/15 to-teal-500/20 border-emerald-400/70 dark:border-emerald-600/60 text-emerald-800 dark:text-emerald-200 shadow-xs shadow-emerald-500/10 hover:border-emerald-500';
      case 'DEFICIT_MODERATE':
        return 'bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-400/80 dark:border-sky-600/60 text-sky-800 dark:text-sky-200 shadow-xs shadow-sky-500/10 hover:border-sky-500';
      case 'DEFICIT_HIGH':
        return 'bg-gradient-to-br from-indigo-500/20 to-violet-600/25 border-indigo-400/80 dark:border-indigo-600/60 text-indigo-800 dark:text-indigo-200 shadow-xs shadow-indigo-500/10 hover:border-indigo-500';
      default:
        return 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const getStatusBadge = (status: DailyHeatmapCell['status']) => {
    switch (status) {
      case 'SURPLUS_HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>Surplus Tinggi (&gt;+10%)</span>
          </span>
        );
      case 'SURPLUS_MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span>Surplus Sedang</span>
          </span>
        );
      case 'OPTIMAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Optimal (±5%)</span>
          </span>
        );
      case 'DEFICIT_MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
            <TrendingDown className="w-3 h-3 text-sky-500" />
            <span>Defisit Ringan</span>
          </span>
        );
      case 'DEFICIT_HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3 text-indigo-500" />
            <span>Defisit Signifikan</span>
          </span>
        );
    }
  };

  const monthName = CALENDAR_MONTH_NAMES[currentCalendarMonth - 1] || 'Bulan';
  const deptDisplayName =
    selectedDept === 'ALL'
      ? 'Seluruh Pabrik (All 23 Departments)'
      : DEPARTMENTS.find((d) => d.id === selectedDept)?.name || selectedDept;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4"
    >
      {/* Top Header & Toggles */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60">
              <Flame className="w-3 h-3 animate-pulse" />
              Pattern Recognition
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {monthName} {currentYear} • {deptDisplayName}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <CalendarIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span>Kalender Heatmap Variansi Manpower</span>
          </h3>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('DAILY_CALENDAR')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'DAILY_CALENDAR'
                  ? 'bg-white dark:bg-[#111a2e] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender Harian</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('DEPT_MATRIX')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'DEPT_MATRIX'
                  ? 'bg-white dark:bg-[#111a2e] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matrix Departemen</span>
            </button>
          </div>

          {/* Quick Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            title={isExpanded ? 'Sembunyikan detail heatmap' : 'Tampilkan detail heatmap'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Pattern Intelligence Metrics Banner */}
          {dailyStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Peak Variance Day */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/30 dark:to-red-900/10 border border-rose-200 dark:border-rose-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                    Puncak Variansi
                  </span>
                  <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    Tgl {dailyStats.maxVarianceDay.date}
                  </span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                    ({dailyStats.maxVarianceDay.variance >= 0 ? '+' : ''}
                    {dailyStats.maxVarianceDay.variance} MP)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {dailyStats.maxVarianceDay.dayName} • {dailyStats.maxVarianceDay.achievement}% Ach
                </p>
              </div>

              {/* Average Daily Variance */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                    Rata-Rata Variansi
                  </span>
                  <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    ±{dailyStats.avgVariance}
                  </span>
                  <span className="text-xs text-slate-500 font-sans">orang/hari</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Deviasi harian dari budget
                </p>
              </div>

              {/* Stability Score */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    Stabilitas Pola
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {dailyStats.stabilityScore}%
                  </span>
                  <span className="text-xs text-slate-500 font-sans">hari ideal</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {dailyStats.optimalCount} dari {dailyData.length} hari sesuai rencana
                </p>
              </div>

              {/* High Variance Days Count */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-900/10 border border-blue-200 dark:border-indigo-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                    Hari Perlu Perhatian
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {dailyStats.highVarCount}
                  </span>
                  <span className="text-xs text-slate-500 font-sans">hari fluktuatif</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Variansi tinggi &gt;10% atau lembur
                </p>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: DAILY CALENDAR HEATMAP */}
          {mode === 'DAILY_CALENDAR' && (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-xs flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3" />
                    Filter:
                  </span>
                  {(
                    [
                      { id: 'ALL', label: 'Semua Hari' },
                      { id: 'HIGH_VARIANCE', label: '⚠️ Variansi Signifikan Saja' },
                      { id: 'WEEKDAYS', label: 'Hari Kerja (Sen-Jum)' },
                      { id: 'WEEKENDS', label: 'Akhir Pekan (Sab-Min)' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setVarianceFilter(f.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        varianceFilter === f.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400">
                  Klik pada tanggal untuk melihat rincian alokasi per departemen & catatan shift.
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                {/* Weekday Column Headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <span>SEN</span>
                  <span>SEL</span>
                  <span>RAB</span>
                  <span>KAM</span>
                  <span>JUM</span>
                  <span className="text-amber-600 dark:text-amber-400">SAB</span>
                  <span className="text-rose-600 dark:text-rose-400">MIN</span>
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1.5 pt-2">
                  {/* Empty Offset cells before 1st of month */}
                  {Array.from({ length: firstDayOffset }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[72px] sm:min-h-[82px] rounded-xl border border-dashed border-slate-200/40 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-800/10 opacity-30"
                    />
                  ))}

                  {/* Actual Daily Cells */}
                  {dailyData.map((day) => {
                    const isMatchFilter = displayedDays.some((d) => d.date === day.date);
                    const isSelected = selectedDayCell?.date === day.date;
                    const colorClasses = getCellColorClasses(day.status, isMatchFilter);

                    return (
                      <motion.button
                        key={day.date}
                        type="button"
                        whileHover={isMatchFilter ? { scale: 1.02, y: -1 } : {}}
                        whileTap={isMatchFilter ? { scale: 0.97 } : {}}
                        onClick={() => setSelectedDayCell(day)}
                        className={`min-h-[72px] sm:min-h-[82px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${colorClasses} ${
                          isSelected ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900 z-10' : ''
                        }`}
                      >
                        {/* Day Number and Weekend Tag */}
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-bold text-xs sm:text-sm">
                            {String(day.date).padStart(2, '0')}
                          </span>
                          {day.isWeekend && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
                              W/E
                            </span>
                          )}
                        </div>

                        {/* Middle Value: Variance Badge */}
                        <div className="my-0.5">
                          <div className="flex items-center gap-0.5 font-mono font-bold text-xs sm:text-sm">
                            {day.variance > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
                            ) : day.variance < 0 ? (
                              <ArrowDownRight className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            ) : (
                              <Minus className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                            <span>
                              {day.variance > 0 ? `+${day.variance}` : day.variance}
                            </span>
                            <span className="text-[9px] font-normal opacity-70">MP</span>
                          </div>
                        </div>

                        {/* Bottom Stats: Plan vs Actual & Achievement */}
                        <div className="flex items-center justify-between text-[9px] font-mono opacity-80 pt-1 border-t border-current/10">
                          <span>{day.totalActual} / {day.totalPlan}</span>
                          <span className="font-bold">{day.achievement}%</span>
                        </div>

                        {/* Subtle indicator dot for high variance */}
                        {day.status === 'SURPLUS_HIGH' && (
                          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: DEPARTMENT MATRIX HEATMAP */}
          {mode === 'DEPT_MATRIX' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Matrix variansi seluruh 23 departemen sepanjang 12 Bulan Fiscal ({currentYear}).
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Urutkan:</span>
                  <select
                    value={matrixSortBy}
                    onChange={(e) => setMatrixSortBy(e.target.value as any)}
                    className="p-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                  >
                    <option value="VARIANCE_DESC">Variansi Tertinggi (Surplus)</option>
                    <option value="VARIANCE_ASC">Variansi Terendah (Defisit)</option>
                    <option value="NAME">Nama Departemen</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-[#111a2e] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap sticky left-0 bg-slate-100 dark:bg-[#111a2e] z-10">
                        Departemen
                      </th>
                      {[
                        'Apr',
                        'Mei',
                        'Jun',
                        'Jul',
                        'Agu',
                        'Sep',
                        'Okt',
                        'Nov',
                        'Des',
                        'Jan',
                        'Feb',
                        'Mar',
                      ].map((m) => (
                        <th key={m} className="py-2.5 px-2 text-center whitespace-nowrap">
                          {m}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-200/60 dark:bg-slate-800">
                        Rata-Rata
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {deptMatrixData.map((dept) => {
                      const isSelectedDept = selectedDept === dept.deptId;
                      return (
                        <tr
                          key={dept.deptId}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelectedDept ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap font-sans font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-[#0c1220] z-10 border-r border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5">
                              {onSelectDept && (
                                <button
                                  type="button"
                                  onClick={() => onSelectDept(dept.deptId)}
                                  className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer text-left"
                                  title="Filter dashboard ke departemen ini"
                                >
                                  <span>{dept.deptName}</span>
                                </button>
                              )}
                              {!onSelectDept && <span>{dept.deptName}</span>}
                              <span className="text-[10px] text-slate-400 font-mono">({dept.deptId})</span>
                            </div>
                          </td>

                          {dept.monthlyData.map((m) => {
                            let cellBg = 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
                            if (m.status === 'SURPLUS_HIGH') {
                              cellBg = 'bg-rose-500/25 text-rose-800 dark:text-rose-300 font-bold';
                            } else if (m.status === 'SURPLUS_MODERATE') {
                              cellBg = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold';
                            } else if (m.status === 'DEFICIT_MODERATE') {
                              cellBg = 'bg-sky-500/20 text-sky-800 dark:text-sky-300';
                            } else if (m.status === 'DEFICIT_HIGH') {
                              cellBg = 'bg-indigo-500/25 text-indigo-800 dark:text-indigo-300 font-bold';
                            }

                            return (
                              <td key={m.fiscalMonth} className="p-1 text-center">
                                <div
                                  className={`py-1 px-1 rounded-lg text-[10px] transition-transform hover:scale-110 cursor-default ${cellBg}`}
                                  title={`${dept.deptName} - ${m.monthName}: Actual ${m.actual} vs Plan ${m.plan} (Var: ${
                                    m.variance > 0 ? `+${m.variance}` : m.variance
                                  }, Ach: ${m.achievement}%)`}
                                >
                                  {m.variance > 0 ? `+${m.variance}` : m.variance}
                                </div>
                              </td>
                            );
                          })}

                          <td className="py-2 px-3 text-center font-bold bg-slate-50 dark:bg-slate-800/60 border-l border-slate-100 dark:border-slate-800">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] ${
                                dept.avgVariance > 3
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  : dept.avgVariance < -3
                                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {dept.avgVariance > 0 ? `+${dept.avgVariance}` : dept.avgVariance} MP
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CHROMATIC SCALE & HEATMAP LEGEND */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Skala Variansi Manpower:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700/60">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Surplus Signifikan (&gt;+10% / Overload)
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Surplus Sedang (+5% s/d +10%)
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Optimal / Sesuai Rencana (95% - 105%)
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700/60">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Alokasi Ringan (88% - 94%)
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700/60">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Defisit Signifikan (&lt;88%)
              </span>
            </div>
          </div>
        </>
      )}

      {/* POPUP / MODAL INSPECTOR FOR SELECTED DAY CELL */}
      <AnimatePresence>
        {selectedDayCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                      {selectedDayCell.dateString}
                    </span>
                    {getStatusBadge(selectedDayCell.status)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedDayCell.dayName}, {selectedDayCell.date} {monthName} {currentYear}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Analisis pola alokasi dan variansi harian • {deptDisplayName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayCell(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* KPI Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-sans text-slate-500 block">Target Budget</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedDayCell.totalPlan}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-sans">
                    RW: {selectedDayCell.planRW} | OS: {selectedDayCell.planOS}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-sans text-blue-600 dark:text-blue-400 block">Realisasi Actual</span>
                  <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">
                    {selectedDayCell.totalActual}
                  </span>
                  <span className="text-[9px] text-blue-500 block font-sans">
                    RW: {selectedDayCell.actualRW} | OS: {selectedDayCell.actualOS}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl border ${
                    selectedDayCell.variance > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : selectedDayCell.variance < 0
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <span className="text-[10px] font-sans block opacity-80">Selisih / GAP</span>
                  <span className="text-base font-extrabold">
                    {selectedDayCell.variance > 0 ? `+${selectedDayCell.variance}` : selectedDayCell.variance} MP
                  </span>
                  <span className="text-[9px] block font-sans opacity-80">
                    {selectedDayCell.variance > 0 ? 'Surplus' : selectedDayCell.variance < 0 ? 'Defisit' : 'Seimbang'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  <span className="text-[10px] font-sans block opacity-80">Achievement</span>
                  <span className="text-base font-extrabold">{selectedDayCell.achievement}%</span>
                  <span className="text-[9px] block font-sans opacity-80">Utilisasi MP</span>
                </div>
              </div>

              {/* Operational Shift & Pattern Notes */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-4 h-4 text-red-500" />
                  <span>Catatan Pola Shift & Operasional:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  {selectedDayCell.operationalNote}
                </p>

                {selectedDayCell.topVarianceDept && selectedDept === 'ALL' && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kontributor Variansi Utama:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedDayCell.topVarianceDept.deptName} (
                      {selectedDayCell.topVarianceDept.deptVariance > 0 ? '+' : ''}
                      {selectedDayCell.topVarianceDept.deptVariance} MP)
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDayCell(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
