import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { DashboardItem } from '../types';

interface AndonRailProps {
  items?: DashboardItem[];
  selectedDept?: string;
  onSelectDept?: (deptId: string) => void;
}

export const AndonRail: React.FC<AndonRailProps> = ({
  items = [],
  selectedDept = 'ALL',
  onSelectDept = (_deptId: string) => {},
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const safeItems = Array.isArray(items) ? items : [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors w-full">
      {/* Andon Live Badge Header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
          ANDON
        </span>
      </div>

      {/* Track & Scrollable Section */}
      <div className="relative flex-1 min-w-0 flex items-center px-1.5 py-1">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-all z-10 cursor-pointer shadow-2xs"
          title="Geser Kiri"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Horizontal Track without any default scrollbars */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto scroll-smooth px-2.5 py-1 flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {safeItems.length === 0 ? (
            <span className="text-xs text-slate-400 italic py-1">Menunggu pembaruan data departemen...</span>
          ) : (
            safeItems.map((item) => {
              const isSelected = selectedDept === item.deptId;
              let dotClass = 'bg-emerald-500 shadow-emerald-500/50';
              let badgeBg = 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';

              if (item.status === 'OVER') {
                dotClass = 'bg-red-500 shadow-red-500/50 pulse-andon-red';
                badgeBg = 'bg-red-50/90 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60';
              } else if (item.status === 'UNDER') {
                dotClass = 'bg-amber-500 shadow-amber-500/50';
                badgeBg = 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
              }

              return (
                <button
                  key={item.deptId}
                  type="button"
                  onClick={() => onSelectDept(isSelected ? 'ALL' : item.deptId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${badgeBg} ${
                    isSelected
                      ? 'ring-2 ring-red-600 dark:ring-red-500 font-bold scale-105 shadow-xs'
                      : 'hover:scale-102 hover:shadow-xs'
                  }`}
                  title={`${item.deptName}: Plan ${item.plan} | Actual ${item.actual} (${item.achievement.toFixed(1)}%)`}
                >
                  <span className={`w-2 h-2 rounded-full shadow-xs flex-shrink-0 ${dotClass}`} />
                  <span className="truncate max-w-[125px]">{item.deptName}</span>
                  <span className="font-mono text-[10px] font-bold opacity-85">{item.achievement.toFixed(0)}%</span>
                </button>
              );
            })
          )}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-all z-10 cursor-pointer shadow-2xs"
          title="Geser Kanan"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
