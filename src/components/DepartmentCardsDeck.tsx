import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { DashboardItem, User } from '../types';

interface DepartmentCardsDeckProps {
  user?: User | null;
  items: DashboardItem[];
  selectedDept: string;
  onSelectDept: (deptId: string) => void;
  isDark?: boolean;
}

type StatusFilter = 'ALL' | 'OVER' | 'OPTIMAL' | 'UNDER';

export const DepartmentCardsDeck: React.FC<DepartmentCardsDeckProps> = ({
  user,
  items,
  selectedDept,
  onSelectDept,
  isDark = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);

  const isDeptUser = user?.role === 'USER' && !!user?.deptId;
  const userDeptId = isDeptUser ? user.deptId : null;

  // Filter items based on user role and filters
  const effectiveItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    if (isDeptUser && userDeptId) {
      return items.filter((d) => d.deptId === userDeptId);
    }
    return items;
  }, [items, isDeptUser, userDeptId]);

  const filteredDepartments = useMemo(() => {
    if (!effectiveItems || effectiveItems.length === 0) return [];

    return effectiveItems.filter((d) => {
      const matchesSearch =
        d.deptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.deptId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ? true : d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [effectiveItems, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: effectiveItems.length,
      over: effectiveItems.filter((i) => i.status === 'OVER').length,
      optimal: effectiveItems.filter((i) => i.status === 'OPTIMAL').length,
      under: effectiveItems.filter((i) => i.status === 'UNDER').length,
    };
  }, [effectiveItems]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isDeptUser ? 'Akses Terotorisasi' : 'Interaktif 1-Klik Fokus'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {isDeptUser
                ? `1 Departemen Terotorisasi (${effectiveItems[0]?.deptName || userDeptId})`
                : `${items.length} Departemen Pabrik`}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span>Kartu Analisis Departemen (Klik untuk Memfokuskan Tampilan)</span>
          </h3>
        </div>

        {/* Action Toggle & Search */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Quick Search */}
          {!isDeptUser && (
            <div className="relative w-40 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Dept..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize kartu departemen' : 'Expand kartu departemen'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Semua</span>
              <span className="font-mono text-[10px] opacity-75">({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('OVER')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'OVER'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Surplus/Over (&gt;100%)</span>
              <span className="font-mono text-[10px]">({counts.over})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('OPTIMAL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'OPTIMAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sesuai Plan (90-100%)</span>
              <span className="font-mono text-[10px]">({counts.optimal})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('UNDER')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'UNDER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Progres/Under (&lt;90%)</span>
              <span className="font-mono text-[10px]">({counts.under})</span>
            </button>

            {!isDeptUser && selectedDept !== 'ALL' && (
              <button
                type="button"
                onClick={() => onSelectDept('ALL')}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-800/60 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Reset Fokus (Semua)</span>
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredDepartments.map((dept) => {
              const isSelected = selectedDept === dept.deptId;
              const isOver = dept.status === 'OVER';
              const isUnder = dept.status === 'UNDER';

              return (
                <motion.div
                  key={dept.deptId}
                  whileHover={{ y: -3, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectDept(dept.deptId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 dark:border-red-500 shadow-md ring-2 ring-red-500/40'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/60 shadow-2xs'
                  }`}
                >
                  {/* Left Edge Indicator */}
                  <div
                    className={`w-1.5 h-full absolute left-0 top-0 ${
                      isSelected
                        ? 'bg-red-600'
                        : isOver
                        ? 'bg-red-500'
                        : isUnder
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  />

                  {/* Top Bar: Dept Name + Status Pill */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5 pl-1.5">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">
                          {dept.deptId}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {dept.deptName}
                        </h4>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          isOver
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                            : isUnder
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        {dept.status}
                      </span>
                    </div>

                    {/* Numbers: Plan vs Actual & Gap */}
                    <div className="pl-1.5 pt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Realisasi / Plan</span>
                        <div className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                          {dept.actual} <span className="text-slate-400 text-[11px] font-normal">/ {dept.plan} MP</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Variance (GAP)</span>
                        <div
                          className={`font-mono font-extrabold ${
                            dept.gap > 0
                              ? 'text-red-600 dark:text-red-400'
                              : dept.gap === 0
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {dept.gap > 0 ? `+${dept.gap}` : dept.gap} MP
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Progress Bar, RW/OS & Focus Cue */}
                  <div className="pl-1.5 pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Pencapaian</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {dept.achievement.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-red-500' : isUnder ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, dept.achievement)}%` }}
                      />
                    </div>

                    {/* Breakdown & Action Cue */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>RW: {dept.actualRW} | OS: {dept.actualOS}</span>
                      <span className="font-bold flex items-center gap-0.5 text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform">
                        {isSelected ? '✓ Sedang Aktif' : 'Fokuskan →'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};
