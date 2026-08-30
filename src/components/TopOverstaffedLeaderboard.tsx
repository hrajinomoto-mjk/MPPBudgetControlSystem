import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  ArrowUpRight,
  TrendingUp,
  Scale,
  Users,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Layers,
  BarChart2,
  CheckCircle,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { DashboardItem } from '../types';

interface TopOverstaffedLeaderboardProps {
  items: DashboardItem[];
  selectedMonthName?: string;
  selectedYear?: number;
  onSelectDept?: (deptId: string) => void;
  isDark?: boolean;
}

type SortCriteria = 'GAP' | 'ACHIEVEMENT';

export const TopOverstaffedLeaderboard: React.FC<TopOverstaffedLeaderboardProps> = ({
  items,
  selectedMonthName = 'Bulan Berjalan',
  selectedYear = new Date().getFullYear(),
  onSelectDept,
  isDark = false,
}) => {
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('GAP');

  // Filter and sort top 5 overstaffed departments
  const topOverstaffed = useMemo(() => {
    if (!items || items.length === 0) return [];

    // Filter departments with actual > plan (gap > 0), or if none, take top 5 highest gap/achievement
    const overstaffedList = items.filter((item) => (item.gap || 0) > 0 || (item.achievement || 0) > 100);

    const candidates = overstaffedList.length >= 3 ? overstaffedList : [...items];

    const sorted = [...candidates].sort((a, b) => {
      if (sortCriteria === 'GAP') {
        return (b.gap || 0) - (a.gap || 0);
      }
      return (b.achievement || 0) - (a.achievement || 0);
    });

    return sorted.slice(0, 5).map((item, index) => {
      const plan = item.plan || 0;
      const actual = item.actual || 0;
      const gap = item.gap || actual - plan;
      const achievement = item.achievement || (plan > 0 ? (actual / plan) * 100 : 100);
      const osShare = actual > 0 ? ((item.actualOS || 0) / actual) * 100 : 0;

      // Priority classification for rebalancing
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let priorityLabel = 'Monitoring';
      let actionSuggestion = 'Pertahankan ritme lembur normal';

      if (gap >= 6 || achievement >= 115) {
        priority = 'HIGH';
        priorityLabel = 'Prioritas Tinggi';
        actionSuggestion =
          osShare > 40
            ? 'Realokasikan tenaga outsource ke lini defisit'
            : 'Tinjau beban kerja shift & batasi lembur akhir pekan';
      } else if (gap >= 3 || achievement >= 106) {
        priority = 'MEDIUM';
        priorityLabel = 'Prioritas Sedang';
        actionSuggestion = 'Penyelarasan shift cadangan & rotasi berkala';
      }

      return {
        ...item,
        rank: index + 1,
        plan,
        actual,
        gap,
        achievement,
        osShare,
        priority,
        priorityLabel,
        actionSuggestion,
      };
    });
  }, [items, sortCriteria]);

  const totalSurplus = useMemo(() => {
    return topOverstaffed.reduce((acc, curr) => acc + Math.max(0, curr.gap), 0);
  }, [topOverstaffed]);

  // ChartJS Comparative Horizontal Bar Chart Data
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  const chartData = {
    labels: topOverstaffed.map((d) =>
      d.deptName.length > 14 ? `${d.deptName.substring(0, 13)}…` : d.deptName
    ),
    datasets: [
      {
        label: 'Budget (Plan)',
        data: topOverstaffed.map((d) => d.plan),
        backgroundColor: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.65)',
        borderColor: '#94a3b8',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: 'Realisasi (Actual)',
        data: topOverstaffed.map((d) => d.actual),
        backgroundColor: isDark ? 'rgba(230, 0, 18, 0.85)' : '#e60012',
        borderColor: '#b91c1c',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: textMuted,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { size: 10, weight: 600 as any },
        },
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          afterLabel: (ctx: any) => {
            const item = topOverstaffed[ctx.dataIndex];
            if (!item) return '';
            if (ctx.datasetIndex === 1) {
              return `Selisih: +${item.gap} MP (${item.achievement.toFixed(1)}%)\nRW: ${item.actualRW} | OS: ${item.actualOS}`;
            }
            return `Budget: ${item.plan} MP`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textMuted, font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: textMuted, font: { size: 10, weight: 600 as any } },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60">
              <Flame className="w-3 h-3 text-red-500" />
              Resource Rebalancing
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {selectedMonthName} {selectedYear}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <Scale className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span>Top 5 Overstaffed Departments (Surplus Manpower)</span>
          </h3>
        </div>

        {/* Sort & Metric Criteria Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSortCriteria('GAP')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              sortCriteria === 'GAP'
                ? 'bg-white dark:bg-[#111a2e] text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Selisih (GAP MP)</span>
          </button>
          <button
            type="button"
            onClick={() => setSortCriteria('ACHIEVEMENT')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              sortCriteria === 'ACHIEVEMENT'
                ? 'bg-white dark:bg-[#111a2e] text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>% Achievement</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Comparative Bar Chart & Detailed Leaderboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Comparative Horizontal Bar Chart (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <BarChart2 className="w-3.5 h-3.5 text-red-500" />
              <span>Komparasi Plan vs Actual (Top 5)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Orang (Headcount)</span>
          </div>

          <div className="h-56 w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Quick Rebalancing Summary Footer */}
          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Total Surplus Top 5:
            </span>
            <span className="font-mono font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
              +{totalSurplus} Manpower
            </span>
          </div>
        </div>

        {/* Right Column: Leaderboard Cards with Actionable Rebalancing Tags (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          {topOverstaffed.map((dept) => {
            const isHighPriority = dept.priority === 'HIGH';
            const isMediumPriority = dept.priority === 'MEDIUM';

            return (
              <motion.div
                key={dept.deptId}
                whileHover={{ scale: 1.01, x: 2 }}
                onClick={() => onSelectDept && onSelectDept(dept.deptId)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isHighPriority
                    ? 'bg-gradient-to-r from-red-50/50 via-white to-white dark:from-red-950/20 dark:via-slate-900/30 dark:to-slate-900/30 border-red-200 dark:border-red-900/50 hover:border-red-400'
                    : isMediumPriority
                    ? 'bg-gradient-to-r from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900/30 dark:to-slate-900/30 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
                    : 'bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Rank & Department Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-extrabold shrink-0 ${
                        dept.rank === 1
                          ? 'bg-red-600 text-white shadow-xs'
                          : dept.rank === 2
                          ? 'bg-amber-500 text-white'
                          : dept.rank === 3
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      #{dept.rank}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {dept.deptName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({dept.deptId})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Saran Realokasi:
                        </span>{' '}
                        {dept.actionSuggestion}
                      </p>
                    </div>
                  </div>

                  {/* Numbers & Priority Badge */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {/* Figures Breakdown */}
                    <div className="text-right font-mono text-xs">
                      <div className="flex items-center gap-1 justify-end font-bold">
                        <span className="text-slate-500 text-[11px]">
                          {dept.actual} / {dept.plan}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            dept.gap > 0
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {dept.gap > 0 ? `+${dept.gap}` : dept.gap} MP
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                        {dept.achievement.toFixed(1)}% Budget ({dept.actualOS} OS)
                      </span>
                    </div>

                    {/* Priority Pill */}
                    <div className="shrink-0 flex items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                          isHighPriority
                            ? 'bg-red-600 text-white'
                            : isMediumPriority
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                        }`}
                      >
                        {isHighPriority && <AlertCircle className="w-3 h-3" />}
                        {dept.priorityLabel}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Progress bar visual for actual vs plan */}
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    className="bg-slate-400 dark:bg-slate-600 h-full"
                    style={{
                      width: `${Math.min(100, (dept.plan / Math.max(dept.actual, dept.plan)) * 100)}%`,
                    }}
                    title={`Budget: ${dept.plan} MP`}
                  />
                  {dept.gap > 0 && (
                    <div
                      className="bg-red-500 h-full animate-pulse"
                      style={{
                        width: `${Math.min(100, (dept.gap / Math.max(dept.actual, dept.plan)) * 100)}%`,
                      }}
                      title={`Surplus: +${dept.gap} MP`}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
