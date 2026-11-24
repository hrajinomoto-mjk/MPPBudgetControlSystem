import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Flame,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Building2,
  Users,
  BarChart3,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Calendar,
} from 'lucide-react';
import { DashboardItem, PlanRecord, ActualRecord, User } from '../types';
import {
  DeptMatrixCell,
  generateDeptMatrixData,
} from '../utils/calendarHeatmapData';
import { DEPARTMENTS } from '../data/initialData';
import { FISCAL_MONTH_LABELS, fiscalToCalendarMonth } from '../utils/fiscal';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface CalendarHeatmapProps {
  user?: User | null;
  items: DashboardItem[];
  allPlans: PlanRecord[];
  allActuals: ActualRecord[];
  currentCalendarMonth: number; // 1 - 12
  currentYear: number;
  selectedDept: string;
  onSelectDept?: (deptId: string) => void;
  isDark?: boolean;
}

type SortOption = 'VARIANCE_DESC' | 'VARIANCE_ASC' | 'NAME' | 'ACHIEVEMENT_DESC';

interface SelectedCellDetail {
  deptId: string;
  deptName: string;
  monthName: string;
  fiscalMonth: number;
  calendarMonth: number;
  calendarYear: number;
  plan: number;
  planRW: number;
  planOS: number;
  actual: number;
  actualRW: number;
  actualOS: number;
  variance: number;
  achievement: number;
  status: DeptMatrixCell['overallStatus'];
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  user,
  items,
  allPlans,
  allActuals,
  currentCalendarMonth,
  currentYear,
  selectedDept,
  onSelectDept,
}) => {
  const { language } = usePreferences();
  const en = language === 'en';
  const [sortBy, setSortBy] = useState<SortOption>('VARIANCE_DESC');
  const [selectedCell, setSelectedCell] = useState<SelectedCellDetail | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filterDeptSearch, setFilterDeptSearch] = useState<string>('');

  const localizeMonthName = (name: string) => {
    if (!en) return name;
    const map: Record<string, string> = {
      Januari: 'January',
      Februari: 'February',
      Maret: 'March',
      April: 'April',
      Mei: 'May',
      Juni: 'June',
      Juli: 'July',
      Agustus: 'August',
      September: 'September',
      Oktober: 'October',
      November: 'November',
      Desember: 'December',
      Agu: 'Aug',
      Okt: 'Oct',
      Des: 'Dec',
    };
    return map[name] || name;
  };

  const isDeptUser = user?.role === 'USER' && !!user?.deptId;
  const userDeptId = isDeptUser ? user.deptId : null;

  // Generate 12 Fiscal Months Department Matrix
  const deptMatrixData = useMemo(() => {
    // Strictly filter data source if logged-in user is a department user
    const effectivePlans = isDeptUser && userDeptId ? allPlans.filter((p) => p.deptId === userDeptId) : allPlans;
    const effectiveActuals = isDeptUser && userDeptId ? allActuals.filter((a) => a.deptId === userDeptId) : allActuals;
    const raw = generateDeptMatrixData(effectivePlans, effectiveActuals, currentYear);

    // Filter by search or selected dept
    let filtered = isDeptUser && userDeptId ? raw.filter((d) => d.deptId === userDeptId) : raw;
    if (filterDeptSearch.trim() && !isDeptUser) {
      const q = filterDeptSearch.toLowerCase();
      filtered = filtered.filter(
        (d) => d.deptName.toLowerCase().includes(q) || d.deptId.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'VARIANCE_DESC') {
      return [...filtered].sort((a, b) => b.avgVariance - a.avgVariance);
    } else if (sortBy === 'VARIANCE_ASC') {
      return [...filtered].sort((a, b) => a.avgVariance - b.avgVariance);
    } else if (sortBy === 'ACHIEVEMENT_DESC') {
      return [...filtered].sort((a, b) => b.avgAchievement - a.avgAchievement);
    } else if (sortBy === 'NAME') {
      return [...filtered].sort((a, b) => a.deptName.localeCompare(b.deptName));
    }
    return filtered;
  }, [allPlans, allActuals, currentYear, sortBy, filterDeptSearch, isDeptUser, userDeptId]);

  // Aggregate matrix statistics for header insights
  const matrixStats = useMemo(() => {
    if (isDeptUser && userDeptId) {
      if (!deptMatrixData.length) return null;
      const userDept = deptMatrixData[0];
      const monthlyData = userDept.monthlyData || [];

      // Peak variance month for user's department
      const peakMonth = [...monthlyData].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))[0] || {
        monthName: 'N/A',
        variance: 0,
      };

      return {
        isDeptMode: true,
        deptName: userDept.deptName,
        deptId: userDept.deptId,
        peakMonthName: peakMonth.monthName,
        peakMonthVariance: peakMonth.variance,
        avgVariance: userDept.avgVariance,
        avgAchievement: userDept.avgAchievement,
        overallStatus: userDept.overallStatus,
        totalDepts: 1,
      };
    }

    const raw = generateDeptMatrixData(allPlans, allActuals, currentYear);
    if (!raw.length) return null;

    // Monthly totals across all departments (12 months)
    const monthlyTotals = Array.from({ length: 12 }, (_, idx) => {
      let totalPlan = 0;
      let totalActual = 0;
      let totalVar = 0;
      const monthName = FISCAL_MONTH_LABELS[idx];

      raw.forEach((dept) => {
        const m = dept.monthlyData[idx];
        if (m) {
          totalPlan += m.plan;
          totalActual += m.actual;
          totalVar += m.variance;
        }
      });

      const ach = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 100;
      return {
        fiscalIndex: idx,
        monthName,
        totalPlan,
        totalActual,
        totalVar,
        ach,
      };
    });

    // Month with peak absolute variance
    const peakMonth = [...monthlyTotals].sort((a, b) => Math.abs(b.totalVar) - Math.abs(a.totalVar))[0];

    // Department with highest average surplus
    const topSurplusDept = [...raw].sort((a, b) => b.avgVariance - a.avgVariance)[0];

    // Most stable department (closest to 100% ach and 0 variance)
    const mostStableDept = [...raw].sort((a, b) => Math.abs(a.avgVariance) - Math.abs(b.avgVariance))[0];

    // Overall factory average variance
    const totalFactoryVar = raw.reduce((sum, d) => sum + d.avgVariance, 0);
    const avgFactoryVariance = Math.round(totalFactoryVar / raw.length);

    return {
      isDeptMode: false,
      peakMonth,
      topSurplusDept,
      mostStableDept,
      avgFactoryVariance,
      totalDepts: raw.length,
    };
  }, [allPlans, allActuals, currentYear, isDeptUser, userDeptId, deptMatrixData]);

  const getStatusBadge = (status: DeptMatrixCell['overallStatus']) => {
    switch (status) {
      case 'SURPLUS_HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>{en ? 'High Surplus (>+10%)' : 'Surplus Tinggi (>+10%)'}</span>
          </span>
        );
      case 'SURPLUS_MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span>{en ? 'Moderate Surplus' : 'Surplus Sedang'}</span>
          </span>
        );
      case 'OPTIMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Optimal (±5%)</span>
          </span>
        );
      case 'DEFICIT_MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
            <TrendingDown className="w-3 h-3 text-sky-500" />
            <span>{en ? 'Mild Deficit' : 'Defisit Ringan'}</span>
          </span>
        );
      case 'DEFICIT_HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3 text-indigo-500" />
            <span>{en ? 'Significant Deficit' : 'Defisit Signifikan'}</span>
          </span>
        );
    }
  };

  const deptDisplayName =
    selectedDept === 'ALL'
      ? en
        ? 'Entire Factory (All 23 Departments)'
        : 'Seluruh Pabrik (All 23 Departments)'
      : DEPARTMENTS.find((d) => d.id === selectedDept)?.name || selectedDept;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4"
      data-no-translate="true"
    >
      {/* Top Header & Toggles */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mpcs-accent-soft border">
              <Layers className="w-3 h-3" />
              {en ? '12-MONTH FISCAL HEATMAP MATRIX' : 'HEATMAP MATRIX 12 BULAN FISCAL'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              FY {currentYear} •{' '}
              {isDeptUser
                ? `${deptMatrixData[0]?.deptName || userDeptId} (${
                    en ? 'Department Restricted Access' : 'Akses Khusus Departemen'
                  })`
                : deptDisplayName}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <Calendar className="w-5 h-5 mpcs-accent-text" />
            <span>
              {en
                ? 'Monthly Department Variance Heatmap Matrix (12 FY)'
                : 'Matrix Heatmap Variansi Departemen Per Bulan (12 FY)'}
            </span>
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {!isDeptUser && selectedDept !== 'ALL' && onSelectDept && (
            <button
              type="button"
              onClick={() => onSelectDept('ALL')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {en ? 'Reset Filter: Show All' : 'Reset Filter: Tampilkan Semua'}
            </button>
          )}

          {/* Sort Dropdown */}
          {!isDeptUser && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/90 rounded-xl text-xs shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">
                {en ? 'Sort by:' : 'Urutkan:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent font-bold text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
              >
                <option value="VARIANCE_DESC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  {en ? 'Highest Variance (Surplus)' : 'Variansi Tertinggi (Surplus)'}
                </option>
                <option value="VARIANCE_ASC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  {en ? 'Lowest Variance (Deficit)' : 'Variansi Terendah (Defisit)'}
                </option>
                <option value="ACHIEVEMENT_DESC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  {en ? 'Highest % Achievement' : '% Achievement Tertinggi'}
                </option>
                <option value="NAME" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  {en ? 'Department Name (A-Z)' : 'Nama Departemen (A-Z)'}
                </option>
              </select>
            </div>
          )}

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={
              en
                ? isExpanded
                  ? 'Minimize matrix view'
                  : 'Expand matrix view'
                : isExpanded
                ? 'Minimize / Perkecil tampilan matrix'
                : 'Expand / Perluas tampilan matrix'
            }
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Matrix Intelligence Metric Cards */}
          {matrixStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {matrixStats.isDeptMode ? (
                <>
                  {/* Peak Month Variance */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/30 dark:to-red-900/10 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                        {en ? 'Peak FY GAP Month' : 'Bulan Puncak GAP FY'}
                      </span>
                      <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {localizeMonthName(matrixStats.peakMonthName)}
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                        ({matrixStats.peakMonthVariance >= 0 ? '+' : ''}
                        {matrixStats.peakMonthVariance} MP)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {en ? 'Largest department GAP this FY' : 'GAP terbesar departemen di FY ini'}
                    </p>
                  </div>

                  {/* Average FY Variance */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                        {en ? 'FY Average Variance' : 'Rata-Rata Variansi FY'}
                      </span>
                      <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {matrixStats.avgVariance >= 0 ? '+' : ''}{matrixStats.avgVariance}
                      </span>
                      <span className="text-xs text-slate-500 font-sans">
                        {en ? 'MP/month' : 'MP/bulan'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {en ? 'Average GAP across 12 months' : 'Rata-rata GAP sepanjang 12 bulan'}
                    </p>
                  </div>

                  {/* Average Achievement */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                        {en ? 'Average Achievement' : 'Rata-Rata Pencapaian'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                        {matrixStats.avgAchievement.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {en ? 'Average actual vs target' : 'Rata-rata realisasi terhadap target'}
                    </p>
                  </div>

                  {/* Allocation Status */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {en ? 'Annual Allocation Status' : 'Status Alokasi Tahunan'}
                      </span>
                      <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(matrixStats.overallStatus)}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      {en ? 'Workforce utilization classification' : 'Klasifikasi utilisasi tenaga kerja'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Peak Month Variance */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/30 dark:to-red-900/10 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                        {en ? 'Peak GAP Month' : 'Bulan Puncak GAP'}
                      </span>
                      <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {localizeMonthName(matrixStats.peakMonth?.monthName || '')}
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                        ({(matrixStats.peakMonth?.totalVar || 0) >= 0 ? '+' : ''}
                        {matrixStats.peakMonth?.totalVar} MP)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {en ? 'Largest factory GAP across the FY' : 'GAP Pabrik terbesar sepanjang FY'}
                    </p>
                  </div>

                  {/* Top Surplus Department */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                        {en ? 'Highest Average Surplus' : 'Surplus Rata-Rata Tertinggi'}
                      </span>
                      <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {matrixStats.topSurplusDept?.deptName || '-'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 truncate mt-0.5">
                      {en
                        ? `Avg: +${matrixStats.topSurplusDept?.avgVariance} MP/mo`
                        : `Rata-rata: +${matrixStats.topSurplusDept?.avgVariance} MP/bln`}
                    </p>
                  </div>

                  {/* Most Stable Department */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                        {en ? 'Most Stable Department' : 'Departemen Paling Stabil'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {matrixStats.mostStableDept?.deptName || '-'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {en
                        ? `Avg GAP ±${matrixStats.mostStableDept?.avgVariance} MP (Optimal)`
                        : `GAP rata-rata ±${matrixStats.mostStableDept?.avgVariance} MP (Optimal)`}
                    </p>
                  </div>

                  {/* Factory Average Variance */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {en ? 'Factory Average Variance' : 'Rata-Rata Variansi Pabrik'}
                      </span>
                      <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {(matrixStats.avgFactoryVariance || 0) >= 0 ? '+' : ''}
                        {matrixStats.avgFactoryVariance}
                      </span>
                      <span className="text-xs text-slate-500 font-sans">
                        {en ? 'MP/department' : 'MP/departemen'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {en
                        ? `Total ${matrixStats.totalDepts} active departments`
                        : `Total ${matrixStats.totalDepts} departemen aktif`}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Interactive Matrix Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {en
                  ? 'Click any month cell to inspect Regular & Outsource Manpower breakdown details.'
                  : 'Klik pada sel bulan manapun untuk membuka detail rincian Manpower Regular & OS.'}
              </span>
              <span className="font-mono text-[11px] font-medium">
                {en
                  ? `${deptMatrixData.length} Department${deptMatrixData.length === 1 ? '' : 's'} ${
                      isDeptUser ? '(Authorized by Account)' : 'displayed'
                    }`
                  : `${deptMatrixData.length} Departemen ${
                      isDeptUser ? '(Terotorisasi Sesuai Akun)' : 'ditampilkan'
                    }`}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-[#111a2e] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap sticky left-0 bg-slate-100 dark:bg-[#111a2e] z-10 border-r border-slate-200 dark:border-slate-700">
                      {en ? 'Department' : 'Departemen'}
                    </th>
                    {(en
                      ? ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
                      : ['Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar']
                    ).map((m, idx) => {
                      const calMonth = fiscalToCalendarMonth(idx + 1);
                      const isCurrentMonth = calMonth === currentCalendarMonth;
                      return (
                        <th
                          key={m}
                          className={`py-3 px-2 text-center whitespace-nowrap ${
                            isCurrentMonth
                              ? 'mpcs-accent-soft font-black ring-1 ring-inset ring-[var(--mpcs-accent-border)]'
                              : ''
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{m}</span>
                            {isCurrentMonth && (
                              <span className="text-[8px] font-bold uppercase mpcs-accent-text">
                                {en ? 'Active' : 'Aktif'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-3 px-3 text-center whitespace-nowrap bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white">
                      {en ? 'FY Avg' : 'Rata-Rata FY'}
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
                          isSelectedDept ? 'mpcs-accent-soft ring-1 ring-inset ring-[var(--mpcs-accent-border)]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-sans font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-[#0c1220] z-10 border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {onSelectDept ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectDept(dept.deptId)}
                                  className="hover:text-[var(--mpcs-accent)] cursor-pointer text-left font-bold transition-colors"
                                  title={en ? 'Click to focus filter on this department' : 'Klik untuk filter fokus ke departemen ini'}
                                >
                                  <span>{dept.deptName}</span>
                                </button>
                              ) : (
                                <span>{dept.deptName}</span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">({dept.deptId})</span>
                            </div>

                            {onSelectDept && isSelectedDept && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded mpcs-accent-gradient text-white font-bold uppercase">
                                {en ? 'Focus' : 'Fokus'}
                              </span>
                            )}
                          </div>
                        </td>

                        {dept.monthlyData.map((m) => {
                          let cellBg = 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40';
                          if (m.status === 'SURPLUS_HIGH') {
                            cellBg = 'bg-rose-500/25 text-rose-800 dark:text-rose-300 font-bold border-rose-300 dark:border-rose-800';
                          } else if (m.status === 'SURPLUS_MODERATE') {
                            cellBg = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border-amber-300 dark:border-amber-800';
                          } else if (m.status === 'DEFICIT_MODERATE') {
                            cellBg = 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800';
                          } else if (m.status === 'DEFICIT_HIGH') {
                            cellBg = 'bg-indigo-500/25 text-indigo-800 dark:text-indigo-300 font-bold border-indigo-300 dark:border-indigo-800';
                          }

                          const isCurrentActiveCol = m.calendarMonth === currentCalendarMonth;

                          return (
                            <td key={m.fiscalMonth} className={`p-1 text-center ${isCurrentActiveCol ? 'bg-[var(--mpcs-accent-soft)]' : ''}`}>
                              <button
                                type="button"
                                onClick={() => {
                                  const calYear = m.calendarMonth >= 4 ? currentYear : currentYear + 1;
                                  setSelectedCell({
                                    deptId: dept.deptId,
                                    deptName: dept.deptName,
                                    monthName: m.monthName,
                                    fiscalMonth: m.fiscalMonth,
                                    calendarMonth: m.calendarMonth,
                                    calendarYear: calYear,
                                    plan: m.plan,
                                    planRW: m.planRW,
                                    planOS: m.planOS,
                                    actual: m.actual,
                                    actualRW: m.actualRW,
                                    actualOS: m.actualOS,
                                    variance: m.variance,
                                    achievement: m.achievement,
                                    status: m.status,
                                  });
                                }}
                                className={`w-full py-1 px-1 rounded-lg text-[10px] transition-all hover:scale-110 cursor-pointer border ${cellBg}`}
                                title={`${dept.deptName} - ${localizeMonthName(m.monthName)}: Actual ${m.actual} vs Plan ${m.plan} (Var: ${
                                  m.variance > 0 ? `+${m.variance}` : m.variance
                                }, Ach: ${m.achievement}%) - ${en ? 'Click for details' : 'Klik untuk rincian'}`}
                              >
                                {m.variance > 0 ? `+${m.variance}` : m.variance}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-2 px-3 text-center font-bold bg-slate-50 dark:bg-slate-800/60 border-l border-slate-200 dark:border-slate-800">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] inline-block font-mono ${
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

          {/* Chromatic Scale Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>{en ? 'Manpower Variance Scale:' : 'Skala Variansi Manpower:'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700/60">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {en ? 'Significant Surplus (>+10% / Overload)' : 'Surplus Signifikan (>+10% / Overload)'}
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {en ? 'Moderate Surplus (+5% to +10%)' : 'Surplus Sedang (+5% s/d +10%)'}
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {en ? 'Optimal / On Plan (95% - 105%)' : 'Optimal / Sesuai Rencana (95% - 105%)'}
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700/60">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {en ? 'Light Allocation (88% - 94%)' : 'Alokasi Ringan (88% - 94%)'}
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700/60">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {en ? 'Significant Deficit (<88%)' : 'Defisit Signifikan (<88%)'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* POPUP / MODAL INSPECTOR FOR CLICKED CELL */}
      <AnimatePresence>
        {selectedCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                      {localizeMonthName(selectedCell.monthName)} {selectedCell.calendarYear}
                    </span>
                    {getStatusBadge(selectedCell.status)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedCell.deptName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {en
                      ? `Code: ${selectedCell.deptId} • Fiscal Month #${selectedCell.fiscalMonth}`
                      : `Kode: ${selectedCell.deptId} • Bulan Fiscal ke-${selectedCell.fiscalMonth}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* KPI Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-center font-mono">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-sans text-slate-500 block">
                    {en ? 'Budget Target (Plan)' : 'Target Budget (Plan)'}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedCell.plan}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                    Regular: {selectedCell.planRW} | Outsource: {selectedCell.planOS}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-sans text-blue-600 dark:text-blue-400 block">
                    {en ? 'Actual Realization' : 'Realisasi (Actual)'}
                  </span>
                  <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300">
                    {selectedCell.actual}
                  </span>
                  <span className="text-[10px] text-blue-500 block font-sans mt-0.5">
                    Regular: {selectedCell.actualRW} | Outsource: {selectedCell.actualOS}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl border ${
                    selectedCell.variance > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : selectedCell.variance < 0
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <span className="text-[10px] font-sans block opacity-80">
                    {en ? 'Variance GAP' : 'Selisih GAP'}
                  </span>
                  <span className="text-xl font-extrabold">
                    {selectedCell.variance > 0 ? `+${selectedCell.variance}` : selectedCell.variance} MP
                  </span>
                  <span className="text-[10px] block font-sans opacity-80 mt-0.5">
                    {selectedCell.variance > 0
                      ? en
                        ? 'Workforce Surplus'
                        : 'Surplus Tenaga Kerja'
                      : selectedCell.variance < 0
                      ? en
                        ? 'Workforce Deficit'
                        : 'Defisit Tenaga Kerja'
                      : en
                      ? 'On Budget'
                      : 'Sesuai Budget'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  <span className="text-[10px] font-sans block opacity-80">% Achievement</span>
                  <span className="text-xl font-extrabold">{selectedCell.achievement}%</span>
                  <span className="text-[10px] block font-sans opacity-80 mt-0.5">
                    {en ? 'Manpower Utilization' : 'Utilisasi Manpower'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {onSelectDept && !isDeptUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDept(selectedCell.deptId);
                      setSelectedCell(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl mpcs-accent-gradient text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>
                      {en ? 'Focus Dashboard on This Department' : 'Fokuskan Dashboard ke Departemen Ini'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {en ? 'Close' : 'Tutup'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
