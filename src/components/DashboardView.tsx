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
  Minimize2,
  Maximize2,
  Presentation,
} from 'lucide-react';
import { DashboardItem, User, CompanyFilter, CompanyName } from '../types';
import { FISCAL_MONTH_LABELS, CALENDAR_MONTH_NAMES, fiscalToCalendarMonth, getFiscalYear, formatFiscalYearLabel } from '../utils/fiscal';
import { getMonthlyTrendDataByFY, getStoredPlans, getStoredActuals, getDashboardData, getCompanyMap } from '../utils/storage';
import { pageContainerVariants, staggerItemVariants, staggerSubGridVariants, staggerSubCardVariants } from '../utils/motion';
import { CalendarHeatmap } from './CalendarHeatmap';
import { TopOverstaffedLeaderboard } from './TopOverstaffedLeaderboard';
import { DepartmentCardsDeck } from './DepartmentCardsDeck';
import { COMPANIES } from '../data/initialData';
import { usePreferences } from '../contexts/AppPreferencesContext';
import { FISCAL_MONTH_LABELS_I18N } from '../i18n/translations';

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
  selectedCompany?: CompanyFilter;
  onChangeFiscalMonth: (m: number | 'ALL') => void;
  onChangeYear: (y: number) => void;
  onChangeDept: (d: string) => void;
  onChangeCompany?: (c: CompanyFilter) => void;
  onRefresh: () => void;
  onOpenExecutiveReport: () => void;
  onOpenExecutiveDossier?: () => void;
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
  selectedCompany = 'ALL',
  onChangeFiscalMonth,
  onChangeYear,
  onChangeDept,
  onChangeCompany,
  onRefresh,
  onOpenExecutiveReport,
  onOpenExecutiveDossier,
  onOpenUserReport,
  onOpenDownloadExcel,
  onOpenImportData,
  onPreviewItem,
  isDark,
}) => {
  const { language, t, formatFiscalMonth, theme } = usePreferences();
  const [searchTable, setSearchTable] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInsightExpanded, setIsInsightExpanded] = useState(false);
  const [expandAI, setExpandAI] = useState(true);
  const [expandTrend, setExpandTrend] = useState(true);
  const [expandMainCharts, setExpandMainCharts] = useState(true);
  const [expandVariance, setExpandVariance] = useState(true);
  const [expandTable, setExpandTable] = useState(true);
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

  const allPlans = useMemo(() => {
    const raw = getStoredPlans();
    if (isDepartmentUser && user?.deptId) {
      return raw.filter((p) => p.deptId === user.deptId);
    }
    return raw;
  }, [isDepartmentUser, user?.deptId, isRefreshing]);

  const allActuals = useMemo(() => {
    const raw = getStoredActuals();
    if (isDepartmentUser && user?.deptId) {
      return raw.filter((a) => a.deptId === user.deptId);
    }
    return raw;
  }, [isDepartmentUser, user?.deptId, isRefreshing]);

  // Compute factory department records for admin, or user's dept for dept user
  const allFactoryItems = useMemo(() => {
    if (isDepartmentUser && user?.deptId) {
      return getDashboardData(user.deptId, selectedFiscalMonth === 'ALL' ? undefined : calendarMonth, selectedYear);
    }
    return getDashboardData('ALL', selectedFiscalMonth === 'ALL' ? undefined : calendarMonth, selectedYear);
  }, [isDepartmentUser, user?.deptId, selectedFiscalMonth, calendarMonth, selectedYear, isRefreshing]);

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

  // AI Insight Generator - Humanized, Objective & Detail-Oriented (Bilingual ID/EN)
  const aiInsight = useMemo(() => {
    const en = language === 'en';
    if (safeItems.length === 0) {
      return {
        title: en ? 'Analysis Not Yet Available' : 'Analisis Belum Tersedia',
        subtitle: en
          ? 'Select a period filter to load comprehensive workforce analysis.'
          : 'Pilih filter periode untuk memuat analisis menyeluruh.',
        narrative: en
          ? 'Please select a department or fiscal month period to view workforce allocation analysis.'
          : 'Silakan pilih departemen atau periode bulan fiscal untuk menampilkan analisis alokasi tenaga kerja.',
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

    const currentDeptName =
      safeItems[0]?.deptName || user?.deptId || (en ? 'Your Department' : 'Departemen Anda');

    // Dynamic Title without negative judgements
    let title = en
      ? 'Allocation Stability & Controlled Utilization'
      : 'Stabilitas Alokasi & Utilisasi Terkendali';
    let subtitle = isDepartmentUser
      ? en
        ? `Alignment between planned budget and actual realization for ${currentDeptName} is well balanced.`
        : `Penyelarasan antara alokasi perencanaan dan realisasi ${currentDeptName} berjalan berimbang.`
      : en
      ? 'Alignment between planned allocation and actual realization is well balanced.'
      : 'Penyelarasan antara alokasi perencanaan dan realisasi berjalan berimbang.';

    if (achievement > 100) {
      title = en
        ? 'Manpower Capacity Alignment Review'
        : 'Tinjauan Penyelarasan Kapasitas Manpower';
      subtitle = isDepartmentUser
        ? en
          ? `Actual workforce for ${currentDeptName} exceeds planned allocation. Reviewing line workload and overtime hours is recommended.`
          : `Realisasi tenaga kerja ${currentDeptName} di atas target alokasi rencana. Disarankan meninjau beban kerja lini & jam lembur.`
        : en
        ? 'Collaborative review with relevant departments is recommended to evaluate workload dynamics.'
        : 'Perlu kajian kolaboratif bersama departemen terkait untuk meninjau dinamika beban kerja.';
    } else if (achievement < 90) {
      title = en
        ? 'Workforce Fulfillment Support & Progress'
        : 'Dukungan & Progres Pemenuhan Tenaga Kerja';
      subtitle = isDepartmentUser
        ? en
          ? `Actual workforce for ${currentDeptName} is currently below planned target. Line fulfillment coordination is progressing steadily.`
          : `Realisasi tenaga kerja ${currentDeptName} masih di bawah target rencana. Koordinasi pemenuhan kebutuhan lini terus berjalan bertahap.`
        : en
        ? 'Optimizing fulfillment coordination across factory operational lines.'
        : 'Optimalisasi koordinasi pemenuhan kebutuhan lini operasional pabrik.';
    }

    // Humanized, constructive narrative
    let narrative = '';

    if (isDepartmentUser) {
      if (optimalDepts.length > 0) {
        narrative = en
          ? `Current workforce utilization for ${currentDeptName} is recorded at ${achievement.toFixed(
              1
            )}% (actual ${totalActual.toLocaleString()} HC out of ${totalPlan.toLocaleString()} HC planned allocation). Manpower allocation operates within the ideal capacity corridor aligned with budget targets.`
          : `Tingkat utilisasi tenaga kerja departemen ${currentDeptName} saat ini tercatat sebesar ${achievement.toFixed(
              1
            )}% (realisasi ${totalActual.toLocaleString()} orang dari alokasi rencana ${totalPlan.toLocaleString()} orang). Alokasi manpower beroperasi pada rentang kapasitas yang sangat ideal dan selaras dengan target perencanaan.`;
      } else if (overDepts.length > 0) {
        narrative = en
          ? `Current workforce utilization for ${currentDeptName} is recorded at ${achievement.toFixed(
              1
            )}% (actual ${totalActual.toLocaleString()} HC out of ${totalPlan.toLocaleString()} HC planned allocation, variance +${gap.toLocaleString()} HC). Periodic internal review is recommended regarding workload target adjustments and overtime effectiveness.`
          : `Tingkat utilisasi tenaga kerja departemen ${currentDeptName} saat ini tercatat sebesar ${achievement.toFixed(
              1
            )}% (realisasi ${totalActual.toLocaleString()} orang dari alokasi rencana ${totalPlan.toLocaleString()} orang, selisih +${gap.toLocaleString()} orang). Disarankan melakukan evaluasi berkala internal terkait penyesuaian target volume kerja dan efektivitas jam kerja lembur.`;
      } else if (underDepts.length > 0) {
        narrative = en
          ? `Current workforce utilization for ${currentDeptName} is recorded at ${achievement.toFixed(
              1
            )}% (actual ${totalActual.toLocaleString()} HC out of ${totalPlan.toLocaleString()} HC planned allocation, variance ${gap.toLocaleString()} HC). Accelerated selection and outsourcing fulfillment continue to be closely monitored.`
          : `Tingkat utilisasi tenaga kerja departemen ${currentDeptName} saat ini tercatat sebesar ${achievement.toFixed(
              1
            )}% (realisasi ${totalActual.toLocaleString()} orang dari alokasi rencana ${totalPlan.toLocaleString()} orang, selisih ${gap.toLocaleString()} orang). Proses percepatan seleksi dan pemenuhan alokasi mitra kerja terus dimonitor secara berkala.`;
      } else {
        narrative = en
          ? `Current workforce utilization for ${currentDeptName} is recorded at ${achievement.toFixed(
              1
            )}% (actual ${totalActual.toLocaleString()} HC out of ${totalPlan.toLocaleString()} HC planned allocation).`
          : `Tingkat utilisasi tenaga kerja departemen ${currentDeptName} saat ini tercatat sebesar ${achievement.toFixed(
              1
            )}% (realisasi ${totalActual.toLocaleString()} orang dari alokasi rencana ${totalPlan.toLocaleString()} orang).`;
      }
    } else {
      narrative = en
        ? `Factory workforce utilization is currently recorded at ${achievement.toFixed(
            1
          )}% (actual ${totalActual.toLocaleString()} HC out of ${totalPlan.toLocaleString()} HC planned allocation). A total of ${optimalDepts.length} out of ${safeItems.length} departments are operating within the ideal capacity corridor.`
        : `Tingkat utilisasi tenaga kerja pabrik saat ini tercatat sebesar ${achievement.toFixed(
            1
          )}% (realisasi ${totalActual.toLocaleString()} orang dari alokasi rencana ${totalPlan.toLocaleString()} orang). Sebanyak ${optimalDepts.length} dari total ${safeItems.length} departemen beroperasi pada rentang kapasitas yang sangat ideal.`;

      if (overDepts.length > 0) {
        narrative += en
          ? ` For the ${overDepts.length} department(s) with realization above initial allocation, periodic reviews with Department Heads are recommended to evaluate production volume adjustments, seasonal demand spikes, and overtime efficiency.`
          : ` Untuk ${overDepts.length} departemen dengan realisasi di atas alokasi awal, disarankan melakukan kajian berkala bersama Kepala Departemen guna meninjau kebutuhan penyesuaian target volume produksi, lonjakan permintaan musiman (seasonal demand), dan efektivitas jam kerja lembur.`;
      }

      if (underDepts.length > 0) {
        narrative += en
          ? ` Meanwhile, across the ${underDepts.length} department(s) currently below target, accelerated candidate selection and outsource partner fulfillment are being monitored intensively.`
          : ` Sementara pada ${underDepts.length} departemen yang berada di bawah target, proses percepatan seleksi dan pemenuhan alokasi mitra kerja terus dimonitor secara intensif.`;
      }
    }

    // Actionable, constructive steps
    const recommendations = isDepartmentUser
      ? [
          {
            title: en ? 'Internal Workload & Overtime Review' : 'Kajian Beban Kerja & Lembur Internal',
            desc:
              overDepts.length > 0
                ? en
                  ? `Conduct an internal evaluation of overtime allocation and output target fulfillment for ${currentDeptName}.`
                  : `Lakukan evaluasi internal terkait alokasi jam lembur dan pemenuhan target output kerja seksi/departemen ${currentDeptName}.`
                : en
                ? 'Maintain effective shift scheduling and daily overtime control.'
                : 'Pertahankan efektivitas pembagian jadwal shift kerja dan kontrol kebutuhan lembur harian.',
          },
          {
            title: en ? 'Competency Flexibility & Multi-Skilling' : 'Fleksibilitas Kompetensi & Multi-Skilling',
            desc: en
              ? 'Strengthen employee competency flexibility and multi-skilling in your section to respond rapidly to operational workload fluctuations.'
              : 'Tingkatkan fleksibilitas kompetensi dan multi-skilling karyawan di seksi Anda agar siap merespons fluktuasi beban kerja operasional.',
          },
          {
            title: en
              ? 'Regular Worker & Outsource (OS) Ratio Monitoring'
              : 'Pemantauan Rasio Regular Worker & Mitra (OS)',
            desc: en
              ? 'Perform regular monitoring of Outsource and Regular Worker fulfillment ratios to preserve department productivity stability.'
              : 'Lakukan pemantauan berkala rasio pemenuhan tenaga kerja Outsource dan Regular Worker demi menjaga stabilitas produktivitas departemen.',
          },
        ]
      : [
          {
            title: en ? 'Workload & Overtime Review with PIC' : 'Kajian Beban Kerja & Lembur Bersama PIC',
            desc:
              overDepts.length > 0
                ? en
                  ? `Conduct periodic discussions with ${overDepts
                      .slice(0, 2)
                      .map((d) => d.deptName)
                      .join(', ')}${
                      overDepts.length > 2 ? ' and related departments' : ''
                    } to ensure additional headcount requirements align with production schedules.`
                  : `Diskusikan secara berkala bersama tim ${overDepts
                      .slice(0, 2)
                      .map((d) => d.deptName)
                      .join(', ')}${
                      overDepts.length > 2 ? ' dan departemen terkait' : ''
                    } untuk memastikan kebutuhan tambahan telah selaras dengan jadwal produksi.`
                : en
                ? 'Maintain alignment of shift schedules and daily overtime evaluations.'
                : 'Pertahankan keselarasan pembagian jadwal shift kerja dan evaluasi kebutuhan lembur harian.',
          },
          {
            title: en
              ? 'Cross-Line Operational Rotation Flexibility'
              : 'Fleksibilitas Rotasi Antar-Lini Operasional',
            desc:
              underDepts.length > 0 && overDepts.length > 0
                ? en
                  ? 'Consider cross-skilling or temporary workforce rotation to support departments requiring urgent capacity.'
                  : 'Pertimbangkan opsi cross-skilling atau rotasi sementara tenaga kerja untuk mendukung departemen yang sedang membutuhkan kapasitas mendesak.'
                : en
                ? 'Enhance employee competency flexibility so cross-section mobility responds swiftly during workload surges.'
                : 'Tingkatkan fleksibilitas kompetensi karyawan agar mobilitas kerja antar seksi berjalan responsif saat terjadi lonjakan beban kerja.',
          },
          {
            title: en
              ? 'Outsource Partner Planning Synchronization'
              : 'Sinkronisasi Rencana Mitra Kerja (Outsource)',
            desc: en
              ? 'Conduct periodic evaluations of Outsource vs. Regular Worker fulfillment ratios to safeguard plant cost stability and productivity.'
              : 'Lakukan evaluasi berkala rasio pemenuhan tenaga kerja Outsource dan Regular Worker demi menjaga stabilitas biaya dan produktivitas pabrik.',
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
  }, [safeItems, achievement, totalPlan, totalActual, isDepartmentUser, user?.deptId, gap, language]);

  // 12-Month Fiscal Trend Data
  const monthlyTrendData = useMemo(() => {
    const data = getMonthlyTrendDataByFY(selectedDept, fiscalYear, selectedCompany);
    return Array.isArray(data) ? data : [];
  }, [selectedDept, fiscalYear, selectedCompany]);

  // Filtered Table Items
  const filteredTableItems = useMemo(() => {
    const q = (searchTable || '').toLowerCase();
    return safeItems.filter((item) => (item.deptName || '').toLowerCase().includes(q));
  }, [safeItems, searchTable]);

  const totalPages = Math.ceil(filteredTableItems.length / rowsPerPage) || 1;
  const paginatedItems = filteredTableItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Chart theme colors (high-contrast legible tones in dark mode)
  const textMuted = isDark ? '#e2e8f0' : '#475569';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(0, 0, 0, 0.06)';

  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const num = parseInt(full, 16);
    if (Number.isNaN(num)) return `rgba(220, 38, 38, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const doughnutRwColor =
    theme.id === 'executive-royal'
      ? '#0ea5e9'
      : theme.id === 'nordic-cyber'
      ? '#06b6d4'
      : theme.id === 'emerald-kaizen'
      ? '#0284c7'
      : theme.id === 'obsidian-gold'
      ? '#38bdf8'
      : '#2563eb';

  // Chart 1: Budget vs Actual Bar with line
  const mainBarData = {
    labels: safeItems.map((d) => (d.deptName.length > 14 ? d.deptName.substring(0, 14) + '…' : d.deptName)),
    datasets: [
      {
        type: 'bar' as const,
        label: language === 'en' ? 'Budget (Plan)' : 'Anggaran (Plan)',
        data: safeItems.map((d) => d.plan),
        backgroundColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.5)',
        borderRadius: 8,
        barThickness: 'flex' as const,
        maxBarThickness: 32,
      },
      {
        type: 'bar' as const,
        label: language === 'en' ? 'Actual (Realization)' : 'Realisasi (Actual)',
        data: safeItems.map((d) => d.actual),
        backgroundColor: theme.chartAccent,
        borderRadius: 8,
        barThickness: 'flex' as const,
        maxBarThickness: 32,
      },
      {
        type: 'line' as const,
        label: language === 'en' ? '% Achievement' : '% Pencapaian',
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
        labels: { color: textMuted, boxWidth: 12, usePointStyle: true, font: { size: 11, weight: 600 as any } },
      },
      tooltip: {
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textMuted, maxRotation: 45, minRotation: 0, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textMuted, font: { size: 11 } },
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: {
          color: isDark ? '#6ee7b7' : '#059669',
          font: { size: 11, weight: 600 as any },
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
        label: language === 'en' ? 'Variance Gap' : 'Selisih Variance',
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
          label: (ctx: any) =>
            language === 'en'
              ? `Variance: ${ctx.raw > 0 ? '+' : ''}${ctx.raw} HC`
              : `Selisih: ${ctx.raw > 0 ? '+' : ''}${ctx.raw} orang`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textMuted, maxRotation: 45, minRotation: 0, font: { size: 11 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textMuted, font: { size: 11 } },
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
        backgroundColor: [doughnutRwColor, theme.chartAccent],
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
        labels: { color: textMuted, boxWidth: 10, usePointStyle: true, font: { size: 12, weight: 600 as any } },
      },
    },
  };

  // Chart 4: Monthly FY Trend
  const monthlyTrendChartData = {
    labels: monthlyTrendData.map(
      (d) => FISCAL_MONTH_LABELS_I18N[language][d.fiscalMonth] || FISCAL_MONTH_LABELS[d.fiscalMonth] || String(d.fiscalMonth)
    ),
    datasets: [
      {
        label: language === 'en' ? 'Budget (Plan)' : 'Anggaran (Plan)',
        data: monthlyTrendData.map((d) => d.plan),
        borderColor: isDark ? '#cbd5e1' : '#64748b',
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        tension: 0.35,
        fill: false,
      },
      {
        label: language === 'en' ? 'Actual (Realization)' : 'Realisasi (Actual)',
        data: monthlyTrendData.map((d) => d.actual),
        borderColor: theme.chartAccent,
        backgroundColor: hexToRgba(theme.chartAccent, isDark ? 0.2 : 0.1),
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: theme.chartAccent,
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
        labels: { color: textMuted, boxWidth: 12, usePointStyle: true, font: { size: 11, weight: 600 as any } },
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
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mpcs-surface p-5 rounded-3xl border shadow-xs"
      >
        <div>
          <span className="text-[11px] font-bold tracking-wider mpcs-accent-text uppercase">
            {isDepartmentUser ? t('dashboard.kickerDept') : t('dashboard.kickerFactory')}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
            {isDepartmentUser ? `${t('dashboard.titleDept')} ${safeItems[0]?.deptName || user?.deptId}` : t('dashboard.titleFactory')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isDepartmentUser
              ? `${t('dashboard.subtitleDept')} ${safeItems[0]?.deptName || user?.deptId} (${formatFiscalYearLabel(fiscalYear)})`
              : `${t('dashboard.subtitleFactory')} (${formatFiscalYearLabel(fiscalYear)})`}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Company Select */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/90 rounded-xl text-xs shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-[var(--mpcs-accent-border)] focus-within:border-[var(--mpcs-accent)]">
            <Building2 className="w-3.5 h-3.5 mpcs-accent-text shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 hidden sm:inline">{t('dashboard.filterCompany')}</span>
              <select
                value={selectedCompany}
                disabled={isDepartmentUser}
                onChange={(e) => onChangeCompany?.(e.target.value as CompanyFilter)}
                className="bg-transparent font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer pr-1 text-xs disabled:cursor-not-allowed disabled:opacity-80"
                aria-label={t('dashboard.filterCompany')}
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  {t('dashboard.allCompanies')}
                </option>
                {COMPANIES.map((comp) => (
                  <option key={comp} value={comp} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                    {comp} ({comp === 'PT Ajinex International' ? '5 Dept' : '18 Dept'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fiscal Month Select */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/90 rounded-xl text-xs shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-[var(--mpcs-accent-border)] focus-within:border-[var(--mpcs-accent)]">
            <Calendar className="w-3.5 h-3.5 mpcs-accent-text shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 hidden sm:inline">{t('dashboard.filterMonth')}</span>
              <select
                value={selectedFiscalMonth}
                onChange={(e) => onChangeFiscalMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer pr-1 text-xs"
                aria-label={t('dashboard.filterMonth')}
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  {t('dashboard.allMonths')}
                </option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                    {formatFiscalMonth(i + 1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Select */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/90 rounded-xl text-xs shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-[var(--mpcs-accent-border)] focus-within:border-[var(--mpcs-accent)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 hidden sm:inline">{t('dashboard.filterYear')}</span>
              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer pr-1 text-xs"
                aria-label={t('dashboard.filterYear')}
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                    {t('dashboard.yearPrefix')} {y}
                  </option>
                ))}
              </select>
            </div>
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
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin mpcs-accent-text' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}</span>
          </motion.button>

          {isDepartmentUser ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenUserReport}
              className="flex items-center gap-1.5 px-3.5 py-2 mpcs-accent-bg text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('dashboard.reportDept')}</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={onOpenExecutiveReport}
                className="flex items-center gap-1.5 px-3.5 py-2 mpcs-accent-bg text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('dashboard.reportExecutive')}</span>
              </motion.button>

              {onOpenExecutiveDossier && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={onOpenExecutiveDossier}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title={t('dashboard.reportToManagement')}
                >
                  <Presentation className="w-3.5 h-3.5 mpcs-accent-text" />
                  <span>{t('dashboard.reportToManagement')}</span>
                </motion.button>
              )}
            </>
          )}

          {/* Import Data - Khusus Kewenangan Admin Master */}
          {user?.role === 'ADMIN' && onOpenImportData && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenImportData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Import Data & Integrasi Database (Excel, Google Sheets, Supabase)"
            >
              <FileUp className="w-3.5 h-3.5 mpcs-accent-text" />
              <span className="hidden sm:inline">{t('dashboard.importData')}</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onOpenDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Download Excel database"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('dashboard.excel')}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Active Focus Alert Banner (Only shown for Admin/HR when a specific department is focused) */}
      {!isDepartmentUser && selectedDept !== 'ALL' && (
        <motion.div
          variants={staggerItemVariants}
          className="p-4 rounded-3xl mpcs-accent-soft border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl mpcs-accent-gradient text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider mpcs-accent-text">
                  {t('dashboard.activeFocus')}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold mpcs-accent-soft border">
                  {selectedDept}
                </span>
                {safeItems[0]?.company && (
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                    safeItems[0].company === 'PT Ajinex International'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                  }`}>
                    {safeItems[0].company}
                  </span>
                )}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 mpcs-accent-text hover:opacity-90 font-bold text-xs transition-all border border-[var(--mpcs-accent-border)] shadow-2xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('dashboard.resetFocus')}</span>
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
            <div className="w-2 h-full absolute left-0 top-0 mpcs-accent-bar" />
            <div className="w-11 h-11 rounded-xl mpcs-accent-soft flex items-center justify-center flex-shrink-0">
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
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isDepartmentUser ? 'Status Dept' : 'Status Factory'}
              </div>
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
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-15"
          style={{ backgroundColor: 'var(--mpcs-accent)' }}
        />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl mpcs-accent-soft border shadow-inner">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest mpcs-accent-text uppercase">
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
              {isDepartmentUser
                ? language === 'en'
                  ? `1 Department (${safeItems[0]?.deptName || user?.deptId || 'Your Dept'})`
                  : `1 Departemen (${safeItems[0]?.deptName || user?.deptId || 'Dept Anda'})`
                : language === 'en'
                ? `${safeItems.length} Depts Monitored`
                : `${safeItems.length} Dept Dipantau`}
            </span>
            <button
              type="button"
              onClick={() => setExpandAI(!expandAI)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={
                expandAI
                  ? language === 'en'
                    ? 'Minimize AI analysis'
                    : 'Minimize analisis AI'
                  : language === 'en'
                  ? 'Expand AI analysis'
                  : 'Expand analisis AI'
              }
            >
              {expandAI ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expandAI && (
          <>
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
                {language === 'en' ? 'On Plan (90 - 100%)' : 'Sesuai Perencanaan (90 - 100%)'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isDepartmentUser
                  ? aiInsight.optimal.length > 0
                    ? language === 'en'
                      ? 'On Target'
                      : 'Sesuai Target'
                    : '0 Dept'
                  : `${aiInsight.optimal.length} Dept`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              {language === 'en'
                ? isDepartmentUser
                  ? 'Balanced and productive workforce allocation aligned with planning targets.'
                  : 'Balanced and productive workforce allocation aligned with targets. Click to focus.'
                : isDepartmentUser
                ? 'Alokasi tenaga kerja seimbang & produktif sesuai target perencanaan.'
                : 'Alokasi tenaga kerja seimbang & produktif sesuai target alokasi. Klik untuk fokus.'}
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {aiInsight.optimal.length > 0 ? (
                aiInsight.optimal.map((d) => (
                  <button
                    type="button"
                    key={d.deptId}
                    onClick={() => (!isDepartmentUser ? onChangeDept(d.deptId) : null)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 shadow-2xs ${
                      !isDepartmentUser ? 'hover:bg-emerald-800/60 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                    }`}
                    title={`${d.deptName} • Actual: ${d.actual} (Plan: ${d.plan})`}
                  >
                    <span className="truncate max-w-[140px]">{d.deptName}</span>
                    <span className="font-mono text-emerald-400 font-bold">({d.achievement.toFixed(0)}%)</span>
                  </button>
                ))
              ) : (
                <span className="text-slate-500 text-[11px] italic">
                  {language === 'en'
                    ? isDepartmentUser
                      ? 'Your department is not in this range'
                      : 'No departments in this range'
                    : isDepartmentUser
                    ? 'Departemen Anda tidak berada dalam rentang ini'
                    : 'Tidak ada departemen dalam rentang ini'}
                </span>
              )}
            </div>
          </div>

          {/* 2. Perlu Kajian Alokasi (>100%) - Constructive, No Negative Judgement */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-amber-500/25 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <SearchCheck className="w-3.5 h-3.5 text-amber-400" />
                {language === 'en' ? 'Allocation Review (>100%)' : 'Perlu Kajian Alokasi (>100%)'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isDepartmentUser
                  ? aiInsight.over.length > 0
                    ? language === 'en'
                      ? 'Needs Review'
                      : 'Perlu Kajian'
                    : language === 'en'
                    ? 'Controlled'
                    : 'Terkendali'
                  : `${aiInsight.over.length} Dept`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              {language === 'en'
                ? isDepartmentUser
                  ? 'Internal review recommended regarding line output fluctuations and overtime needs.'
                  : 'Joint PIC review recommended regarding output fluctuations & overtime. Click to focus.'
                : isDepartmentUser
                ? 'Disarankan telaah internal terkait fluktuasi output lini & kebutuhan lembur.'
                : 'Disarankan telaah bersama PIC terkait fluktuasi output & lembur. Klik untuk fokus.'}
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {aiInsight.over.length > 0 ? (
                aiInsight.over.map((d) => (
                  <button
                    type="button"
                    key={d.deptId}
                    onClick={() => (!isDepartmentUser ? onChangeDept(d.deptId) : null)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-950/40 border border-amber-500/30 text-amber-200 shadow-2xs ${
                      !isDepartmentUser ? 'hover:bg-amber-800/60 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                    }`}
                    title={`${d.deptName} • Actual: ${d.actual} (Plan: ${d.plan}, ${language === 'en' ? 'Gap' : 'Selisih'}: +${d.gap})`}
                  >
                    <span className="truncate max-w-[140px]">{d.deptName}</span>
                    <span className="font-mono text-amber-400 font-bold">(+{d.gap} MP • {d.achievement.toFixed(0)}%)</span>
                  </button>
                ))
              ) : (
                <span className="text-emerald-400 text-[11px] font-medium">
                  {language === 'en'
                    ? isDepartmentUser
                      ? 'Your department allocation is within planned estimate'
                      : 'All departments are within planned estimate'
                    : isDepartmentUser
                    ? 'Alokasi departemen Anda dalam estimasi rencana'
                    : 'Semua departemen dalam estimasi rencana'}
                </span>
              )}
            </div>
          </div>

          {/* 3. Dalam Pemenuhan (<90%) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                {language === 'en' ? 'In Fulfillment (<90%)' : 'Dalam Pemenuhan (<90%)'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {isDepartmentUser
                  ? aiInsight.under.length > 0
                    ? language === 'en'
                      ? 'In Progress'
                      : 'Dalam Proses'
                    : language === 'en'
                    ? 'Fulfilled'
                    : 'Terpenuhi'
                  : `${aiInsight.under.length} Dept`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              {language === 'en'
                ? isDepartmentUser
                  ? 'Recruitment and partner capacity fulfillment are monitored regularly.'
                  : 'Recruitment and partner capacity fulfillment are progressing steadily. Click to focus.'
                : isDepartmentUser
                ? 'Proses rekrutmen & pemenuhan kapasitas mitra kerja terus dimonitor berkala.'
                : 'Proses rekrutmen & pemenuhan kapasitas mitra terus berjalan bertahap. Klik untuk fokus.'}
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {aiInsight.under.length > 0 ? (
                aiInsight.under.map((d) => (
                  <button
                    type="button"
                    key={d.deptId}
                    onClick={() => (!isDepartmentUser ? onChangeDept(d.deptId) : null)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-blue-950/40 border border-blue-500/30 text-blue-200 shadow-2xs ${
                      !isDepartmentUser ? 'hover:bg-blue-800/60 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                    }`}
                    title={`${d.deptName} • Actual: ${d.actual} (Plan: ${d.plan}, ${language === 'en' ? 'Gap' : 'Selisih'}: ${d.gap})`}
                  >
                    <span className="truncate max-w-[140px]">{d.deptName}</span>
                    <span className="font-mono text-blue-400 font-bold">({d.gap} MP • {d.achievement.toFixed(0)}%)</span>
                  </button>
                ))
              ) : (
                <span className="text-emerald-400 text-[11px] font-medium">
                  {language === 'en'
                    ? isDepartmentUser
                      ? 'Your department allocation capacity is fulfilled'
                      : 'All departments fulfilled'
                    : isDepartmentUser
                    ? 'Kapasitas alokasi departemen Anda terpenuhi'
                    : 'Semua departemen terpenuhi'}
                </span>
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
              <span>
                {language === 'en'
                  ? isDepartmentUser
                    ? 'Action Recommendations & Department Allocation Notes'
                    : 'Action Recommendations & Cross-Department Collaborative Notes'
                  : isDepartmentUser
                  ? 'Rekomendasi Tindak Lanjut & Catatan Alokasi Departemen'
                  : 'Rekomendasi Tindak Lanjut & Catatan Kolaboratif Antar-Departemen'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>
                {language === 'en'
                  ? isInsightExpanded
                    ? 'Hide Details'
                    : 'View Full Recommendations'
                  : isInsightExpanded
                  ? 'Sembunyikan Rincian'
                  : 'Lihat Rekomendasi Lengkap'}
              </span>
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
                        <span className="w-4 h-4 rounded-full mpcs-accent-soft flex items-center justify-center text-[10px] font-mono font-bold">
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
          </>
        )}
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">12 Fiscal Months (Apr - Mar)</span>
            <button
              type="button"
              onClick={() => setExpandTrend(!expandTrend)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={expandTrend ? 'Minimize chart trend' : 'Expand chart trend'}
            >
              {expandTrend ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expandTrend && (
          <div className="h-64 w-full">
            <Line data={monthlyTrendChartData} options={monthlyTrendOptions} />
          </div>
        )}
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
              {language === 'en'
                ? isDepartmentUser
                  ? `Budget vs Actual — ${safeItems[0]?.deptName || 'Department'}`
                  : 'Budget vs Actual per Department'
                : isDepartmentUser
                ? `Budget vs Actual — ${safeItems[0]?.deptName || 'Departemen'}`
                : 'Budget vs Actual per Departemen'}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {language === 'en'
                  ? isDepartmentUser
                    ? safeItems[0]?.deptName || '1 Department'
                    : `${items.length} Departments`
                  : isDepartmentUser
                  ? safeItems[0]?.deptName || '1 Departemen'
                  : `${items.length} Departemen`}
              </span>
              <button
                type="button"
                onClick={() => setExpandMainCharts(!expandMainCharts)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={expandMainCharts ? 'Minimize bar chart' : 'Expand bar chart'}
              >
                {expandMainCharts ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expandMainCharts && (
            <div className="h-72 w-full">
              <Bar data={mainBarData as any} options={mainBarOptions as any} />
            </div>
          )}
        </motion.div>

        {/* Doughnut Composition */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'en' ? 'Workforce Composition (RW vs OS)' : 'Komposisi Tenaga Kerja (RW vs OS)'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en' ? 'Regular Worker to Outsource ratio' : 'Rasio Regular Worker terhadap Outsource'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpandMainCharts(!expandMainCharts)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={expandMainCharts ? 'Minimize doughnut' : 'Expand doughnut'}
            >
              {expandMainCharts ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {expandMainCharts && (
            <>
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
                <div className="p-2 rounded-xl mpcs-accent-soft border">
                  <span className="text-[10px] block opacity-80">Outsource</span>
                  <span className="font-mono font-bold text-sm">
                    {items.reduce((s, d) => s + d.actualOS, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Top 5 Overstaffed Departments - Only shown for Admin or factory multi-dept view */}
      {!isDepartmentUser && safeItems.length > 1 && (
        <motion.div variants={staggerItemVariants}>
          <TopOverstaffedLeaderboard
            items={safeItems}
            selectedMonthName={selectedMonthLabel}
            selectedYear={selectedYear}
            onSelectDept={onChangeDept}
            isDark={isDark}
          />
        </motion.div>
      )}

      {/* Variance Bar Chart */}
      <motion.div
        variants={staggerItemVariants}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {language === 'en'
              ? isDepartmentUser
                ? `Manpower Variance — ${safeItems[0]?.deptName || 'Department'}`
                : 'Variance (Actual - Budget Gap) per Department'
              : isDepartmentUser
              ? `Variance Manpower — ${safeItems[0]?.deptName || 'Departemen'}`
              : 'Variance (Selisih Aktual - Budget) per Departemen'}
          </h3>
          <button
            type="button"
            onClick={() => setExpandVariance(!expandVariance)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={expandVariance ? 'Minimize variance chart' : 'Expand variance chart'}
          >
            {expandVariance ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {expandVariance && (
          <div className="h-60 w-full">
            <Bar data={varianceChartData} options={varianceChartOptions} />
          </div>
        )}
      </motion.div>

      {/* Calendar Heatmap View - Pattern Recognition for Daily & Departmental Manpower Variances */}
      <motion.div variants={staggerItemVariants}>
        <CalendarHeatmap
          user={user}
          items={safeItems}
          allPlans={allPlans}
          allActuals={allActuals}
          currentCalendarMonth={calendarMonth}
          currentYear={selectedYear}
          selectedDept={selectedDept}
          onSelectDept={isDepartmentUser ? undefined : onChangeDept}
          isDark={isDark}
        />
      </motion.div>

      {/* Department Quick Cards Deck - Interactive 1-Click Department Focus */}
      <motion.div variants={staggerItemVariants}>
        <DepartmentCardsDeck
          user={user}
          items={allFactoryItems}
          selectedDept={selectedDept}
          onSelectDept={isDepartmentUser ? () => {} : onChangeDept}
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Department Manpower Data Breakdown' : 'Rincian Data Manpower Departemen'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'en'
                ? 'Monitoring table for RW, OS allocation, and achievement status. Click a row to focus.'
                : 'Tabel monitoring alokasi RW, OS, dan status achievement. Klik baris untuk memfokuskan data.'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => {
                  setSearchTable(e.target.value);
                  setPage(1);
                }}
                placeholder={language === 'en' ? 'Search Department...' : 'Cari Departemen...'}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--mpcs-accent)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setExpandTable(!expandTable)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={
                expandTable
                  ? language === 'en'
                    ? 'Minimize table'
                    : 'Minimize tabel'
                  : language === 'en'
                  ? 'Expand table'
                  : 'Expand tabel'
              }
            >
              {expandTable ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expandTable && (
          <>
            {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs">
            <thead className="mpcs-table-head text-white font-bold">
              <tr>
                <th className="p-3 text-left">{language === 'en' ? 'Department' : 'Departemen'}</th>
                <th className="p-3 text-center">Budget (Plan)</th>
                <th className="p-3 text-center">
                  {language === 'en' ? 'Actual (Realization)' : 'Actual (Realisasi)'}
                </th>
                <th className="p-3 text-center">{language === 'en' ? 'Variance' : 'Selisih'}</th>
                <th className="p-3 text-center">Achv %</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">{language === 'en' ? 'Action' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {language === 'en'
                      ? 'No departments match the search filter.'
                      : 'Tidak ada departemen yang sesuai dengan filter pencarian.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => (
                  <tr
                    key={row.deptId}
                    onClick={() => onChangeDept(row.deptId)}
                    className={`cursor-pointer transition-colors ${
                      selectedDept === row.deptId
                        ? 'mpcs-accent-soft font-semibold'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                    title={`Klik untuk memfokuskan data departemen ${row.deptName}`}
                  >
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        {selectedDept === row.deptId && (
                          <span className="w-1.5 h-1.5 rounded-full mpcs-accent-bar animate-pulse" />
                        )}
                        <span>{row.deptName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">{row.deptId}</span>
                        {row.company && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                              row.company === 'PT Ajinex International'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            }`}
                          >
                            {row.company === 'PT Ajinex International' ? 'NEX' : 'Ajinomoto'}
                          </span>
                        )}
                      </div>
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
              {language === 'en'
                ? `Showing ${(page - 1) * rowsPerPage + 1} - ${Math.min(page * rowsPerPage, filteredTableItems.length)} of ${filteredTableItems.length}`
                : `Menampilkan ${(page - 1) * rowsPerPage + 1} - ${Math.min(page * rowsPerPage, filteredTableItems.length)} dari ${filteredTableItems.length}`}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
              >
                {language === 'en' ? 'Prev' : 'Sebelumnya'}
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
              >
                {language === 'en' ? 'Next' : 'Berikutnya'}
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
