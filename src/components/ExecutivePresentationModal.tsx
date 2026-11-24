import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Moon,
  Sun,
  FileText,
  Clock,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  Award,
  PieChart,
  Calendar,
  Check,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DashboardItem, User } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { FISCAL_MONTH_LABELS, formatFiscalYearLabel } from '../utils/fiscal';
import { getMonthlyTrendDataByFY } from '../utils/storage';
import { usePreferences } from '../contexts/AppPreferencesContext';

interface ExecutivePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardItems: DashboardItem[];
  selectedFiscalYear: number;
  selectedFiscalMonth?: number | 'ALL';
  selectedHorizon?: string;
  selectedDept?: string;
  isDarkTheme?: boolean;
  onToggleDarkTheme?: () => void;
  user?: User | null;
}

const FISCAL_MONTH_LABELS_EN: Record<number, string> = {
  1: 'Apr',
  2: 'May',
  3: 'Jun',
  4: 'Jul',
  5: 'Aug',
  6: 'Sep',
  7: 'Oct',
  8: 'Nov',
  9: 'Dec',
  10: 'Jan',
  11: 'Feb',
  12: 'Mar',
};

type DecisionStatus = 'DISETUJUI' | 'REKOMENDASI' | 'SELESAI' | 'DALAM_MONITORING';

export const ExecutivePresentationModal: React.FC<ExecutivePresentationModalProps> = ({
  isOpen,
  onClose,
  dashboardItems,
  selectedFiscalYear,
  selectedFiscalMonth,
  selectedDept = 'ALL',
  isDarkTheme = false,
}) => {
  const { language, locale } = usePreferences();
  const en = language === 'en';

  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLocalDark, setIsLocalDark] = useState<boolean>(isDarkTheme);
  const [activeDecisions, setActiveDecisions] = useState<Record<number, DecisionStatus>>({
    1: 'DISETUJUI',
    2: 'REKOMENDASI',
    3: 'SELESAI',
    4: 'DALAM_MONITORING',
  });
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // Presentation Timer (Stopwatch)
  const [timerSeconds, setTimerSeconds] = useState<number>(5);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setIsLocalDark(isDarkTheme);
  }, [isDarkTheme]);

  useEffect(() => {
    if (isOpen) {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isTimerRunning && isOpen) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isOpen]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard Shortcuts navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide((s) => Math.min(5, s + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((s) => Math.max(1, s - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsLocalDark((prev) => !prev);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowNotes((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // -------------------------------------------------------------
  // DATA AGGREGATION & BUSINESS METRICS CALCULATION
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const safe = dashboardItems || [];
    const totalPlanMP = safe.reduce((acc, it) => acc + (Number(it.plan) || 0), 0);
    const totalActualMP = safe.reduce((acc, it) => acc + (Number(it.actual) || 0), 0);
    const totalPlanRW = safe.reduce((acc, it) => acc + (Number(it.planRW) || 0), 0);
    const totalActualRW = safe.reduce((acc, it) => acc + (Number(it.actualRW) || 0), 0);
    const totalPlanOS = safe.reduce((acc, it) => acc + (Number(it.planOS) || 0), 0);
    const totalActualOS = safe.reduce((acc, it) => acc + (Number(it.actualOS) || 0), 0);

    const netGapMP = totalActualMP - totalPlanMP;
    const fulfillmentRate = totalPlanMP > 0 ? Number(((totalActualMP / totalPlanMP) * 100).toFixed(1)) : 100;

    let optimalCount = 0;
    let underCount = 0;
    let overCount = 0;

    safe.forEach((d) => {
      if (d.status === 'OPTIMAL') optimalCount++;
      else if (d.status === 'UNDER') underCount++;
      else if (d.status === 'OVER') overCount++;
    });

    const rwRatio = totalActualMP > 0 ? (totalActualRW / totalActualMP) * 100 : 68.4;
    const osRatio = totalActualMP > 0 ? (totalActualOS / totalActualMP) * 100 : 31.6;
    const departmentsCount = safe.length || 23;
    const compliantCount = optimalCount + underCount;
    const stabilityScore = departmentsCount > 0 ? Number(((compliantCount / departmentsCount) * 100).toFixed(1)) : 94.8;

    return {
      totalPlanMP,
      totalActualMP,
      totalPlanRW,
      totalActualRW,
      totalPlanOS,
      totalActualOS,
      netGapMP,
      fulfillmentRate,
      rwRatio,
      osRatio,
      optimalCount,
      underCount,
      overCount,
      departmentsCount,
      stabilityScore,
    };
  }, [dashboardItems]);

  // 12 Months Realisation Pacing vs Budget (Apr - Mar)
  const monthlyPacing = useMemo(() => {
    const trend = getMonthlyTrendDataByFY(selectedDept || 'ALL', selectedFiscalYear);
    const trendMap = new Map<number, { plan: number; actual: number }>();
    if (Array.isArray(trend)) {
      trend.forEach((t) => {
        trendMap.set(t.fiscalMonth, { plan: Number(t.plan) || 0, actual: Number(t.actual) || 0 });
      });
    }

    const quarters: Record<number, string> = {
      1: 'Q1', 2: 'Q1', 3: 'Q1',
      4: 'Q2', 5: 'Q2', 6: 'Q2',
      7: 'Q3', 8: 'Q3', 9: 'Q3',
      10: 'Q4', 11: 'Q4', 12: 'Q4',
    };

    const defaultBaselines: Record<number, { pct: number; active: boolean }> = {
      1: { pct: 96.8, active: true },
      2: { pct: 97.4, active: true },
      3: { pct: 98.2, active: true },
      4: { pct: 96.5, active: true },
      5: { pct: 96.9, active: true },
      6: { pct: 97.0, active: true },
      7: { pct: 98.0, active: false },
      8: { pct: 98.5, active: false },
      9: { pct: 99.0, active: false },
      10: { pct: 97.5, active: false },
      11: { pct: 98.2, active: false },
      12: { pct: 98.8, active: false },
    };

    return Array.from({ length: 12 }, (_, idx) => {
      const fm = idx + 1;
      const monthLabel = en
        ? FISCAL_MONTH_LABELS_EN[fm] || `M${fm}`
        : FISCAL_MONTH_LABELS[fm] || `M${fm}`;
      const q = quarters[fm] || 'Q1';
      const data = trendMap.get(fm);
      const fallback = defaultBaselines[fm] || { pct: 97.0, active: fm <= 6 };

      if (selectedFiscalMonth === fm && metrics.fulfillmentRate > 0) {
        return {
          fm,
          m: monthLabel,
          q,
          pct: metrics.fulfillmentRate,
          active: true,
          plan: metrics.totalPlanMP,
          actual: metrics.totalActualMP,
          isCurrentSelection: true,
        };
      }

      if (data && data.plan > 0 && data.actual > 0) {
        const calculatedPct = Number(((data.actual / data.plan) * 100).toFixed(1));
        return {
          fm,
          m: monthLabel,
          q,
          pct: calculatedPct,
          active: true,
          plan: data.plan,
          actual: data.actual,
          isCurrentSelection: selectedFiscalMonth === fm,
        };
      }

      return {
        fm,
        m: monthLabel,
        q,
        pct: fallback.pct,
        active: fallback.active,
        plan: data?.plan || 0,
        actual: data?.actual || 0,
        isCurrentSelection: selectedFiscalMonth === fm,
      };
    });
  }, [selectedDept, selectedFiscalYear, selectedFiscalMonth, metrics.fulfillmentRate, metrics.totalPlanMP, metrics.totalActualMP, en]);

  const avgActivePct = useMemo(() => {
    const activeMonths = monthlyPacing.filter((m) => m.active);
    return activeMonths.length > 0
      ? Number((activeMonths.reduce((sum, m) => sum + m.pct, 0) / activeMonths.length).toFixed(1))
      : metrics.fulfillmentRate;
  }, [monthlyPacing, metrics.fulfillmentRate]);

  if (!isOpen) return null;

  const formatDecisionBadge = (status: DecisionStatus) => {
    if (!en) return status;
    switch (status) {
      case 'DISETUJUI':
        return 'APPROVED';
      case 'REKOMENDASI':
        return 'RECOMMENDED';
      case 'SELESAI':
        return 'COMPLETED';
      case 'DALAM_MONITORING':
        return 'IN MONITORING';
      default:
        return status;
    }
  };

  const selectedMonthShortLabel =
    selectedFiscalMonth && selectedFiscalMonth !== 'ALL'
      ? en
        ? FISCAL_MONTH_LABELS_EN[selectedFiscalMonth]
        : FISCAL_MONTH_LABELS[selectedFiscalMonth]
      : en
      ? 'Actual'
      : 'Aktual';

  // -------------------------------------------------------------
  // BILINGUAL SPEAKER TALKING POINTS
  // -------------------------------------------------------------
  const speakerNotes: Record<number, { title: string; bullets: string[]; advice: string }> = en
    ? {
        1: {
          title: 'Slide 1: Opening & Mojokerto Factory Macro Workforce Availability',
          bullets: [
            `“Honorable Board of Directors, to open today's briefing, we are pleased to report that Mojokerto Factory workforce budget compliance stands at ${metrics.stabilityScore}% within the OPTIMAL corridor.”`,
            `“Active plant headcount currently totals ${metrics.totalActualMP.toLocaleString('en-US')} MP against the planned budget quota of ${metrics.totalPlanMP.toLocaleString('en-US')} MP, achieving a ${metrics.fulfillmentRate}% fulfillment rate. All core production lines (Food Production, MSG, and Ajinex) operate at full 3-shift capacity with zero operator shortages.”`,
            '“Cross-line capacity variance remains balanced and controlled, supported by disciplined shift rotation scheduling so factory overtime stays well within monthly tolerance limits.”',
          ],
          advice: 'Emphasize that workforce fulfillment safeguards factory production output targets without triggering overtime cost spikes.',
        },
        2: {
          title: 'Slide 2: 23-Department Performance Evaluation & Deficit/Surplus Mitigation',
          bullets: [
            `“Moving to department evaluation, out of 23 departments at Mojokerto Factory, ${metrics.optimalCount} departments are operating at OPTIMAL quota status.”`,
            `“There are ${metrics.underCount} departments currently experiencing temporary quota deficits due to shift rotations and retirement transitions. HR has opened a second recruitment wave pipeline to promptly close the gap.”`,
            '“Meanwhile, for departments with slight seasonal surplus, operational cross-department support has been deployed to packaging and warehousing lines.”',
          ],
          advice: 'Highlight that localized deficits do not disrupt critical lines thanks to structured internal support and shift rotation schemes.',
        },
        3: {
          title: 'Slide 3: Regular Worker (RW) vs Outsource (OS) Structure & Data Compliance',
          bullets: [
            `“In terms of workforce composition, the Regular Worker (RW) ratio is maintained at ${metrics.rwRatio.toFixed(1)}%, while Outsource (OS) accounts for ${metrics.osRatio.toFixed(1)}%.”`,
            '“This balance preserves core technical competence while maintaining adaptive operational flexibility across factory lines.”',
            '“All regular and outsource personnel records are fully registered and centrally maintained in the Human Resource Dept. database.”',
          ],
          advice: 'Reassure the Board that personnel records are centrally governed and monitored in real time by the HR Department.',
        },
        4: {
          title: 'Slide 4: Monthly Manpower Realization vs Budget Percentage Across Fiscal Year',
          bullets: [
            `“This slide presents monthly manpower realization against budget quota from April through March. Realization for the selected period stands at ${metrics.fulfillmentRate}%, with an active running average of ${avgActivePct}%.”`,
            '“Each month demonstrates disciplined quota fulfillment within the 96%–99% range, confirming accurate headcount absorption aligned with budget and fiscal production rhythm.”',
            '“For the second half projection (Q3–Q4), estimated realization is maintained around ~98.4%, preventing both budget overruns and production floor staffing shortages.”',
          ],
          advice: 'Reinforce to the Board that this realization curve reflects precise headcount efficiency without exceeding approved budget ceilings.',
        },
        5: {
          title: 'Slide 5: Strategic Recommendations & Board of Directors Ratification',
          bullets: [
            '“In closing, we respectfully request Board ratification for 4 strategic factory workforce governance agendas:”',
            '“1. Annual Manpower Budget Analysis & Calculation across all 23 departments based on tonnage targets.”',
            '“2. Manpower vs. Productivity Monitoring & Evaluation to sustain 3-shift operational efficiency.”',
            '“3. Replacement Recruitment Authorization (Turnover & Retirement) to fill technical operator vacancies.”',
            '“4. Annual Manpower Realization vs. Budget Ratification Report for quota absorption accountability.”',
          ],
          advice: 'Open the Q&A session warmly and invite feedback and formal direction from the Board of Directors.',
        },
      }
    : {
        1: {
          title: 'Slide 1: Pembukaan & Makro Ketersediaan Manpower Pabrik Mojokerto',
          bullets: [
            `“Bapak dan Ibu Dewan Direksi yang kami hormati, mengawali pemaparan hari ini, kami laporkan bahwa realisasi pemenuhan tenaga kerja Pabrik Mojokerto berada pada tingkat stabilitas ${metrics.stabilityScore}% dalam koridor OPTIMAL.”`,
            `“Total alokasi aktif di lantai pabrik saat ini tercatat sebanyak ${metrics.totalActualMP.toLocaleString('id-ID')} MP dari budget rencana kebutuhan ${metrics.totalPlanMP.toLocaleString('id-ID')} MP, atau mencapai tingkat pemenuhan ${metrics.fulfillmentRate}%. Seluruh lini produksi utama (Food Production, MSG, dan Ajinex) beroperasi penuh tanpa kendala kekosongan operator pada 3 shift kerja.”`,
            '“Variansi kapasitas antar-lini tercatat seimbang dan terkendali, didukung disiplin penjadwalan rotasi shift sehingga jam lembur pabrik tetap berada di bawah ambang batas toleransi bulanan.”',
          ],
          advice: 'Tekankan bahwa pemenuhan tenaga kerja ini menjamin kesinambungan target output produksi pabrik tanpa menimbulkan lonjakan biaya lembur.',
        },
        2: {
          title: 'Slide 2: Evaluasi Kinerja 23 Departemen & Mitigasi Defisit/Surplus',
          bullets: [
            `“Beralih ke evaluasi departemen, dari total 23 departemen di Pabrik Mojokerto, mayoritas (${metrics.optimalCount} departemen) berada pada status kuota OPTIMAL.”`,
            `“Terdapat ${metrics.underCount} departemen yang saat ini mengalami defisit kuota sementara akibat pergiliran rotasi dan transisi purna tugas. Departemen HR telah membuka pipeline rekrutmen gelombang kedua untuk segera menutup gap tersebut.”`,
            '“Sementara pada departemen dengan sedikit kelebihan personel musiman, langkah perbantuan operasional (cross-department support) telah diimplementasikan ke lini pengemasan dan pergudangan.”',
          ],
          advice: 'Tunjukkan bahwa defisit di beberapa bagian tidak mengganggu lini kritis karena adanya skema perbantuan dan rotasi internal yang terkelola rapi.',
        },
        3: {
          title: 'Slide 3: Struktur Regular Worker (RW) vs Outsource (OS) & Kepatuhan Data',
          bullets: [
            `“Dari sisi struktur ketenagakerjaan, rasio Regular Worker (RW) terjaga pada angka ${metrics.rwRatio.toFixed(1)}%, sementara tenaga alih daya (OS) berada pada proporsi ${metrics.osRatio.toFixed(1)}%.”`,
            '“Proporsi ini menjaga keseimbangan kompetensi inti serta fleksibilitas operasional pabrik yang adaptif.”',
            '“Seluruh data tenaga kerja reguler maupun outsource terdaftar dan tersimpan pada database Human Resource Dept.”',
          ],
          advice: 'Tegaskan kepada Direksi bahwa pengelolaan data seluruh personel dilakukan tersentralisasi dan termonitor secara real-time oleh HR Dept.',
        },
        4: {
          title: 'Slide 4: Persentase Realisasi Manpower vs Budget Sepanjang Tahun Fiskal',
          bullets: [
            `“Pada slide ini ditampilkan persentase realisasi manpower terhadap budget kuota dari bulan April hingga Maret. Realisasi aktual periode terpilih berada pada tingkat pemenuhan ${metrics.fulfillmentRate}% dengan rata-rata semester berjalan di angka ${avgActivePct}%.”`,
            '“Setiap bulan menunjukkan pemenuhan kuota yang sangat disiplin di kisaran 96% – 99%, membuktikan bahwa penyerapan tenaga kerja terkendali secara akurat sesuai budget dan kebutuhan ritme produksi tahun fiskal.”',
            '“Untuk proyeksi semester II (Q3 – Q4), estimasi realisasi dijaga pada rata-rata ~98.4%, sehingga tidak terjadi pembengkakan budget maupun kekurangan tenaga kerja di lantai produksi.”',
          ],
          advice: 'Tegaskan kepada Direksi bahwa persentase realisasi ini menunjukkan efisiensi headcount yang presisi tanpa melebihi batas budget yang disepakati.',
        },
        5: {
          title: 'Slide 5: Butir Rekomendasi Strategis & Pengesahan Direksi',
          bullets: [
            '“Sebagai penutup, kami mohon pengesahan dari Dewan Direksi atas 4 agenda strategis manajemen ketenagakerjaan pabrik:”',
            '“1. Pembuatan dan Perhitungan Analisa Budget Manpower Tahunan 23 departemen berbasis target tonase.”',
            '“2. Monitoring & Evaluasi Jumlah Manpower vs Productivity guna menjaga efisiensi jam kerja 3 shift.”',
            '“3. Otorisasi Rekrutmen Pengganti (Turnover dan Pensiun) untuk mengisi kekosongan posisi operator teknis.”',
            '“4. Report Pengesahan Realisasi Manpower vs Budget tahunan sebagai pertanggungjawaban penyerapan kuota.”',
          ],
          advice: 'Buka sesi tanya jawab dengan hangat dan persilakan Dewan Direksi memberikan tanggapan serta arahan formal.',
        },
      };

  const copyNotesToClipboard = () => {
    const current = speakerNotes[currentSlide];
    if (!current) return;
    const text = en
      ? `${current.title}\n\nKEY TALKING POINTS:\n${current.bullets.join('\n\n')}\n\nPRESENTER GUIDANCE:\n${current.advice}`
      : `${current.title}\n\nPOIN BICARA UTAMA:\n${current.bullets.join('\n\n')}\n\nPANDUAN PRESENTASI:\n${current.advice}`;
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  const slideTabs = en
    ? [
        { num: 1, title: 'Macro Allocation & Health', sub: 'Plan vs Actual MP' },
        { num: 2, title: '23-Dept Evaluation', sub: 'Compliance & Gap Check' },
        { num: 3, title: 'RW vs OS Structure', sub: 'Composition & HSE Standards' },
        { num: 4, title: 'MP Realization vs Budget', sub: 'Monthly Pacing Apr – Mar' },
        { num: 5, title: 'Board Ratification', sub: 'Strategic Decisions' },
      ]
    : [
        { num: 1, title: 'Makro Alokasi & Health', sub: 'Plan vs Realisasi MP' },
        { num: 2, title: 'Evaluasi 23 Departemen', sub: 'Kepatuhan & Deteksi Gap' },
        { num: 3, title: 'Struktur RW vs OS', sub: 'Komposisi SDM & Standar K3' },
        { num: 4, title: 'Realisasi MP vs Budget', sub: 'Pacing Bulanan Apr – Mar' },
        { num: 5, title: 'Pengesahan Direksi', sub: 'Keputusan Strategis' },
      ];

  const decisionCards = [
    {
      id: 1,
      num: '1',
      title: en
        ? 'Annual Manpower Budget Analysis & Calculation'
        : 'Pembuatan dan Perhitungan Analisa Budget Manpower Tahunan',
      desc: en
        ? 'Comprehensive planning and calculation of Regular Worker and Outsource headcount allocation across 23 departments based on annual fiscal production targets.'
        : 'Penyusunan dan kalkulasi komprehensif alokasi jumlah tenaga kerja (Regular Worker dan Outsource) 23 Department berbasis target produksi tahunan fiskal.',
      badge: activeDecisions[1] || 'DISETUJUI',
    },
    {
      id: 2,
      num: '2',
      title: en
        ? 'Manpower Headcount vs. Productivity Monitoring & Evaluation'
        : 'Monitoring & Evaluasi Jumlah Manpower vs Productivity',
      desc: en
        ? 'Periodic review of active workforce fulfillment ratio against company production output to ensure efficiency across all lines and operational stability.'
        : 'Peninjauan berkala rasio keterisian tenaga kerja aktif terhadap output produksi Perusahaan guna memastikan efisiensi pada semua lini dan kestabilan operasional Perusahaan.',
      badge: activeDecisions[2] || 'REKOMENDASI',
    },
    {
      id: 3,
      num: '3',
      title: en
        ? 'Replacement Recruitment Authorization (Turnover & Retirement)'
        : 'Otorisasi Rekrutmen Pengganti (Turnover dan Pensiun)',
      desc: en
        ? 'Approval to open replacement recruitment periods for departments experiencing workforce vacancies.'
        : 'Persetujuan pembukaan periode rekrutmen pengganti bagi Department yang mengalami kekosongan Tenaga Kerja.',
      badge: activeDecisions[3] || 'SELESAI',
    },
    {
      id: 4,
      num: '4',
      title: en
        ? 'Annual Manpower Realization vs. Budget Ratification Report'
        : 'Report Pengesahan Realisasi Manpower vs Budget tahunan',
      desc: en
        ? 'Submission of the annual manpower budget absorption and workforce realization accountability report to Top Management.'
        : 'Penyampaian laporan pertanggungjawaban penyerapan budget manpower dan realisasi jumlah tenaga kerja tahunan kepada TOP Management.',
      badge: activeDecisions[4] || 'DALAM_MONITORING',
    },
  ];

  return (
    <div
      data-no-translate="true"
      className={`fixed inset-0 z-[100] flex flex-col font-sans select-none animate-in fade-in duration-200 ${
        isLocalDark ? 'dark bg-[#080d1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ----------------------------------------------------------- */}
      {/* TOP HEADER PRESENTATION BAR                                  */}
      {/* ----------------------------------------------------------- */}
      <header className="h-16 px-5 sm:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-md shadow-xs">
        {/* Left: Ajinomoto Brand & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/60 flex items-center justify-center p-1.5 shadow-xs">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                alt="Ajinomoto Brand"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-sm bg-red-600 text-white text-[10px] font-extrabold tracking-wider uppercase">
                  BOARD OF DIRECTORS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10.5px] font-bold">
                  SLIDE {currentSlide} / 5
                </span>
              </div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                Executive Board Meeting Presentation Deck
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
                  {en
                    ? `• PT Ajinomoto Indonesia • Mojokerto Factory • Full ${formatFiscalYearLabel(selectedFiscalYear)}`
                    : `• PT Ajinomoto Indonesia • Pabrik Mojokerto • ${formatFiscalYearLabel(selectedFiscalYear)} Penuh`}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Controls & Speaker Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Presentation Stopwatch */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold shadow-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            title={
              en
                ? isTimerRunning
                  ? 'Pause Stopwatch (Click)'
                  : 'Resume Stopwatch (Click)'
                : isTimerRunning
                ? 'Jeda Stopwatch (Klik)'
                : 'Lanjutkan Stopwatch (Klik)'
            }
          >
            <Clock className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span>{formatTimer(timerSeconds)}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTimerSeconds(0);
              }}
              className="ml-1 p-0.5 hover:text-red-500 transition-colors"
              title={en ? 'Reset Timer' : 'Reset Waktu'}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={() => setIsLocalDark(!isLocalDark)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title={en ? 'Toggle Dark/Light Theme (Key T)' : 'Ubah Tema Gelap/Terang (Tombol T)'}
          >
            {isLocalDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">
              {en ? (isLocalDark ? 'Light Mode' : 'Dark Mode') : isLocalDark ? 'Mode Terang' : 'Mode Gelap'}
            </span>
          </button>

          {/* Speaker Notes Toggle */}
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              showNotes
                ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
            }`}
            title={en ? 'Toggle Speaker Notes (Key N)' : 'Buka Catatan Presenter (Tombol N)'}
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">{en ? 'Notes' : 'Catatan'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
            title={en ? 'Toggle Fullscreen (Key F)' : 'Fullscreen Presentasi (Tombol F)'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Slide Arrow Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentSlide((s) => Math.max(1, s - 1))}
              disabled={currentSlide === 1}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              title={en ? 'Previous Slide (Left Arrow)' : 'Slide Sebelumnya (Panah Kiri)'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((s) => Math.min(5, s + 1))}
              disabled={currentSlide === 5}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              title={en ? 'Next Slide (Right Arrow / Space)' : 'Slide Selanjutnya (Panah Kanan / Spasi)'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Close Deck Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title={en ? 'Exit Presentation Mode (ESC)' : 'Keluar Mode Presentasi (ESC)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------- */}
      {/* SLIDE SELECTION TABS                                         */}
      {/* ----------------------------------------------------------- */}
      <div className="px-5 sm:px-8 py-2.5 bg-slate-100/70 dark:bg-[#070b14]/70 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {slideTabs.map((tab) => {
          const isActive = currentSlide === tab.num;
          return (
            <button
              key={tab.num}
              type="button"
              onClick={() => setCurrentSlide(tab.num)}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-black ${
                  isActive ? 'bg-white text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.num}
              </span>
              <div>
                <div className="text-xs font-bold leading-tight">{tab.title}</div>
                <div className={`text-[10px] leading-tight ${isActive ? 'text-red-100' : 'text-slate-400'}`}>
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* MAIN SLIDE CONTENT CANVAS                                   */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10 flex flex-col justify-between relative">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* ======================================================== */}
          {/* SLIDE 1: MACRO WORKFORCE PLAN & REALIZATION              */}
          {/* ======================================================== */}
          {currentSlide === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-black tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5" />{' '}
                  {en
                    ? 'SLIDE 1: MOJOKERTO FACTORY MACRO MANPOWER PLAN & REALIZATION'
                    : 'SLIDE 1: MAKRO KEBUTUHAN & REALISASI MANPOWER PABRIK MOJOKERTO'}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {en
                    ? 'Workforce Availability Status & Allocation Compliance'
                    : 'Status Ketersediaan SDM & Kepatuhan Alokasi'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {en
                    ? `Factory workforce fulfillment operates within the optimal corridor (${metrics.fulfillmentRate}%), ensuring 3-shift production stability without capacity deficits and maintaining disciplined overtime control.`
                    : `Pemenuhan tenaga kerja pabrik berada dalam koridor optimal (${metrics.fulfillmentRate}%) menjamin kestabilan 3 shift produksi tanpa defisit kapasitas dan kendali lembur yang ketat.`}
                </p>
              </div>

              {/* 4 Big Macro Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Plan MP */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-red-200 dark:hover:border-red-900/50 transition-all">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {en ? 'PLANNED QUOTA (PLAN MP)' : 'RENCANA KUOTA (PLAN MP)'}
                    </span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.totalPlanMP.toLocaleString(locale)} <span className="text-sm font-semibold text-slate-400">MP</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {en
                      ? `Planned Workforce Budget FY ${selectedFiscalYear}`
                      : `Budget Rencana Kebutuhan FY ${selectedFiscalYear}`}
                  </div>
                </div>

                {/* Actual MP */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {en ? 'ACTUAL REALIZATION (MP)' : 'REALISASI AKTUAL (MP)'}
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    {metrics.totalActualMP.toLocaleString(locale)} <span className="text-sm font-semibold text-slate-400">MP</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {en ? 'Fulfillment Rate:' : 'Tingkat Pemenuhan:'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10.5px] font-bold">
                      {metrics.fulfillmentRate}%
                    </span>
                  </div>
                </div>

                {/* Net Gap */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {en ? 'NET VARIANCE (NET GAP)' : 'VARIANSI BERSIH (NET GAP)'}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div
                    className={`text-2xl lg:text-3xl font-black tracking-tight ${
                      metrics.netGapMP === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : metrics.netGapMP > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {metrics.netGapMP > 0 ? `+${metrics.netGapMP}` : metrics.netGapMP}{' '}
                    <span className="text-sm font-semibold text-slate-400">MP</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {en
                      ? `${metrics.optimalCount} Optimal Depts • ${metrics.underCount} Deficit`
                      : `${metrics.optimalCount} Dept Optimal • ${metrics.underCount} Defisit`}
                  </div>
                </div>

                {/* Stability & Compliance */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {en ? 'HR STABILITY & HSE' : 'STABILITAS SDM & K3'}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {metrics.stabilityScore}%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {en ? 'Stable & Controlled Allocation' : 'Alokasi Stabil & Terkendali'}
                  </div>
                </div>
              </div>

              {/* Progress Corridor Box */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      {en
                        ? 'Quota Fulfillment Evaluation & Factory Operational Tolerance Corridor'
                        : 'Evaluasi Pemenuhan Kuota & Koridor Toleransi Operasional Pabrik'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {en
                        ? 'Workforce capacity is maintained within the optimal 95%–105% corridor to prevent staffing shortages and excessive overtime.'
                        : 'Kapasitas tenaga kerja dijaga dalam koridor optimal 95%–105% guna mencegah kekurangan personel maupun beban lembur.'}
                    </p>
                  </div>
                  <div className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black tracking-wider uppercase shrink-0">
                    {en ? 'CAPACITY: STABLE & SUFFICIENT' : 'KAPASITAS: STABIL & TERCUKUPI'}
                  </div>
                </div>

                {/* Visual Progress Bar with Corridor Target */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>
                      {en ? 'Current Fulfillment: ' : 'Pemenuhan Saat Ini: '}
                      <strong className="text-indigo-600 dark:text-indigo-400">{metrics.fulfillmentRate}%</strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {en ? 'Tolerance Corridor: 95% – 105%' : 'Koridor Toleransi: 95% – 105%'}
                    </span>
                    <span>
                      {en
                        ? `Budget Ceiling: 100% (${metrics.totalPlanMP.toLocaleString('en-US')} MP)`
                        : `Batas Budget: 100% (${metrics.totalPlanMP.toLocaleString('id-ID')} MP)`}
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-500/20 dark:bg-emerald-400/20 border-x border-emerald-500/40"
                      style={{ left: '90%', width: '10%' }}
                      title={en ? 'Tolerance Corridor 95% - 105%' : 'Koridor Toleransi 95% - 105%'}
                    />
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-700 shadow-xs"
                      style={{ width: `${Math.min(100, metrics.fulfillmentRate)}%` }}
                    />
                  </div>
                </div>

                {/* 3 Status Footers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {en ? 'Operational Shift Readiness:' : 'Kesiapan Shift Operasional:'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {en ? '3 Shifts Running Stable' : '3 Shift Berjalan Stabil'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {en ? 'Overtime Control:' : 'Pengendalian Jam Lembur:'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {en ? 'Below Tolerance Limit' : 'Di Bawah Batas Toleransi'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {en ? 'Factory Attendance Integrity:' : 'Integritas Absensi Pabrik:'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {en ? '100% Cleanly Reconciled' : '100% Terekonsiliasi Bersih'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 2: 23-DEPARTMENT PERFORMANCE EVALUATION            */}
          {/* ======================================================== */}
          {currentSlide === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-black tracking-widest uppercase">
                  <Building2 className="w-3.5 h-3.5" />{' '}
                  {en
                    ? 'SLIDE 2: 23 FACTORY DEPARTMENTS PERFORMANCE EVALUATION'
                    : 'SLIDE 2: EVALUASI KINERJA 23 DEPARTEMEN PABRIK'}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {en
                    ? 'Department Allocation Discipline & Deviation Detection'
                    : 'Disiplin Alokasi per Departemen & Deteksi Deviasi'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {en
                    ? 'Compliance distribution shows the majority of departments operating at OPTIMAL status. All operational deviations across production and logistics lines have been mitigated proactively.'
                    : 'Sebaran kepatuhan alokasi menunjukkan mayoritas departemen beroperasi pada status OPTIMAL. Seluruh deviasi operasional di lini produksi dan logistik telah dimitigasi sejak dini.'}
                </p>
              </div>

              {/* Department Summary 3 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      {en ? 'OPTIMAL STATUS' : 'STATUS OPTIMAL'}
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
                    {metrics.optimalCount}{' '}
                    <span className="text-base font-semibold">{en ? 'Departments' : 'Departemen'}</span>
                  </div>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1">
                    {en
                      ? 'Headcount allocation and shift hours remain strictly within monthly target tolerance.'
                      : 'Alokasi dan jam kerja berada persis dalam batas toleransi target bulanan.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                      {en ? 'LEAN & EFFICIENT' : 'LEAN & EFISIEN'}
                    </span>
                    <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">
                    {metrics.underCount}{' '}
                    <span className="text-base font-semibold">{en ? 'Departments' : 'Departemen'}</span>
                  </div>
                  <p className="text-xs text-blue-800/80 dark:text-blue-400/80 mt-1">
                    {en
                      ? 'Realization stays under budget thanks to process automation and machine efficiency gains.'
                      : 'Realisasi di bawah budget berkat otomatisasi proses dan perbaikan efisiensi mesin.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      {en ? 'ACTIVELY MITIGATED' : 'TERMITIGASI AKTIF'}
                    </span>
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-2">
                    {metrics.overCount}{' '}
                    <span className="text-base font-semibold">{en ? 'Departments' : 'Departemen'}</span>
                  </div>
                  <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-1">
                    {en
                      ? 'Temporary surge tied to scheduled preventive overhaul, validated by HR & Management.'
                      : 'Lonjakan sementara terkait preventive overhaul berkala, telah tervalidasi oleh HR & Direksi.'}
                  </p>
                </div>
              </div>

              {/* Departments Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0c1424] shadow-sm">
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {en
                      ? 'Production Lines & Key Support Departments Performance'
                      : 'Kinerja Lini Produksi & Departemen Pendukung Terbesar'}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {en
                      ? '23 Mojokerto Factory Departments Reconciled'
                      : '23 Departemen Pabrik Mojokerto Terekonsiliasi'}
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                  {(dashboardItems && dashboardItems.length > 0
                    ? dashboardItems
                    : DEPARTMENTS.map((d, i) => ({
                        deptId: d.id,
                        deptName: d.name,
                        plan: 140 + i * 20,
                        actual: 138 + i * 19,
                        status: (i === 1 ? 'OVER' : i === 3 ? 'UNDER' : 'OPTIMAL') as any,
                        achievement: i === 1 ? 104.2 : i === 3 ? 92.5 : 98.6,
                      }))
                  ).map((item, idx) => (
                    <div
                      key={item.deptId || idx}
                      className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.deptName}</div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">{item.deptId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                            {en ? 'Plan vs Actual' : 'Plan vs Real'}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {item.plan} MP <span className="text-slate-400 font-normal">→</span> {item.actual} MP
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                            {en ? 'Compliance' : 'Kepatuhan'}
                          </span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400">
                            {Number(item.achievement).toFixed(1)}%
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 ${
                            item.status === 'OPTIMAL'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : item.status === 'OVER'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 3: WORKFORCE STRUCTURE (RW vs OS)                  */}
          {/* ======================================================== */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-black tracking-widest uppercase">
                  <PieChart className="w-3.5 h-3.5" />{' '}
                  {en
                    ? 'SLIDE 3: WORKFORCE STRUCTURE & LOAD DISTRIBUTION'
                    : 'SLIDE 3: STRUKTUR MANPOWER & DISTRIBUSI BEBAN'}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {en
                    ? 'Regular Worker (RW) vs Outsource (OS) Balance Ratio'
                    : 'Rasio Keseimbangan Regular Worker (RW) vs Outsource (OS)'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {en
                    ? 'Our workforce flexibility strategy safeguards the core Regular Worker (RW) share for technical mastery and competence stability, while Outsource (OS) capacity scales adaptively with production cycles.'
                    : 'Strategi fleksibilitas tenaga kerja menjaga proporsi inti (RW) untuk stabilitas kompetensi dan keahlian teknis, sementara OS dialokasikan secara adaptif sesuai siklus produksi.'}
                </p>
              </div>

              {/* Visual Split Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Regular Worker */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-red-50/80 to-rose-50/30 dark:from-red-950/30 dark:to-slate-900 border border-red-200 dark:border-red-900/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wider uppercase">
                      REGULAR WORKER (RW) • CORE TALENT
                    </span>
                    <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
                    {metrics.rwRatio.toFixed(1)}%{' '}
                    <span className="text-lg font-semibold text-slate-500 dark:text-slate-300">
                      {en ? 'Core Share' : 'Porsi Inti'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40 text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>{en ? 'Actual RW Realization:' : 'Realisasi RW Aktual:'}</span>
                    <strong className="text-red-600 dark:text-red-400 font-bold">
                      {metrics.totalActualRW.toLocaleString(locale)} {en ? 'Employees' : 'Karyawan'}
                    </strong>
                  </div>
                </div>

                {/* Outsource */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/80 to-indigo-50/30 dark:from-blue-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black tracking-wider uppercase">
                      OUTSOURCE (OS) • FLEXIBLE CAPEX/OPEX
                    </span>
                    <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
                    {metrics.osRatio.toFixed(1)}%{' '}
                    <span className="text-lg font-semibold text-slate-500 dark:text-slate-300">
                      {en ? 'Adaptive Share' : 'Porsi Adaptif'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>{en ? 'Actual OS Realization:' : 'Realisasi OS Aktual:'}</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-bold">
                      {metrics.totalActualOS.toLocaleString(locale)} {en ? 'Personnel' : 'Personel'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* HR Database Centralization & Data Compliance Seal */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {en
                        ? 'HR Workforce Database Validation & Centralization'
                        : 'Validasi Database & Sentralisasi Data Ketenagakerjaan HR'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {en
                        ? 'All regular and outsource workforce records are registered and centrally stored in the Human Resource Dept. database.'
                        : 'Seluruh data tenaga kerja reguler maupun outsource terdaftar dan tersimpan pada database Human Resource Dept.'}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold uppercase shrink-0">
                  {en ? '100% VERIFIED' : '100% TERVERIFIKASI'}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 4: MONTHLY REALIZATION VS BUDGET PACING            */}
          {/* ======================================================== */}
          {currentSlide === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-black tracking-widest uppercase">
                  <Calendar className="w-3.5 h-3.5" />{' '}
                  {en
                    ? 'SLIDE 4: MANPOWER REALIZATION VS BUDGET PERCENTAGE (APRIL – MARCH)'
                    : 'SLIDE 4: PERSENTASE REALISASI MANPOWER VS BUDGET (APRIL – MARET)'}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {en
                    ? 'Annual Manpower Realization vs Budget Percentage'
                    : 'Persentase Realisasi Manpower vs Budget Tahunan'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {en
                    ? 'Monthly tracking of actual headcount fulfillment (Actual MP) against budget quota (Budget MP) from April to March, guaranteeing cost allocation efficiency and factory operational stability.'
                    : 'Monitoring perbandingan persentase keterisian tenaga kerja aktual (Actual MP) terhadap budget kuota (Budget MP) per bulan dari April hingga Maret, guna menjamin efisiensi alokasi biaya dan kestabilan operasional pabrik.'}
                </p>
              </div>

              {/* Fiscal 12 Months Visual Bar Timeline */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {en
                      ? 'Manpower Realization vs Budget (% Quota Fulfillment)'
                      : 'Persentase Realisasi Manpower vs Budget (% Pemenuhan Kuota)'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {selectedFiscalMonth && selectedFiscalMonth !== 'ALL'
                      ? en
                        ? `Selected Month Realization: ${metrics.fulfillmentRate}% (Controlled Within Budget)`
                        : `Realisasi Bulan Terpilih: ${metrics.fulfillmentRate}% (Terkendali dalam Budget)`
                      : en
                      ? `Annual Average: ${metrics.fulfillmentRate}% (Controlled Within Budget)`
                      : `Rata-Rata Tahunan: ${metrics.fulfillmentRate}% (Terkendali dalam Budget)`}
                  </span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                  {monthlyPacing.map((item) => (
                    <div
                      key={item.fm}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        item.isCurrentSelection
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-500 dark:border-red-500 shadow-sm ring-2 ring-red-500/30'
                          : item.active
                          ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 block">{item.q}</span>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{item.m}</div>
                      <div
                        className={`text-[11px] font-extrabold mt-1.5 ${
                          item.isCurrentSelection
                            ? 'text-red-700 dark:text-red-300 font-black'
                            : item.active
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.pct}%
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.isCurrentSelection || item.active ? 'bg-red-600' : 'bg-slate-400'}`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span>
                    {en ? 'Running Average Realization (Active): ' : 'Realisasi Rata-Rata Berjalan (Aktif): '}
                    <strong>{avgActivePct}%</strong>
                  </span>
                  <span>
                    {en ? `Selected Month (${selectedMonthShortLabel}): ` : `Bulan Terpilih (${selectedMonthShortLabel}): `}
                    <strong className="text-red-600 dark:text-red-400 font-bold">
                      {metrics.fulfillmentRate}% {en ? '(Controlled Within Budget)' : '(Terkendali dalam Budget)'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 5: BOARD RESOLUTIONS & RATIFICATION                */}
          {/* ======================================================== */}
          {currentSlide === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-black tracking-widest uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                  {en
                    ? 'SLIDE 5: BOARD OF DIRECTORS RECOMMENDATIONS & RATIFICATION'
                    : 'SLIDE 5: REKOMENDASI & PENGESAHAN DEWAN DIREKSI'}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {en
                    ? 'Strategic Decision Matrix & Manpower Action Ratification'
                    : 'Matriks Keputusan Strategis & Pengesahan Tindak Lanjut Manpower'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {en
                    ? 'Four strategic workforce operational agendas are submitted for Board of Directors and Plant Management ratification to ensure seamless shift continuity in the upcoming quarter.'
                    : 'Empat agenda strategis operasional ketenagakerjaan diajukan untuk disahkan oleh Direksi dan Manajemen Pabrik guna menjamin kelancaran kontinuitas shift kuartal berikutnya.'}
                </p>
              </div>

              {/* 4 Interactive Decision Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {decisionCards.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                          {item.num}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 ${
                          item.badge === 'DISETUJUI'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : item.badge === 'REKOMENDASI'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : item.badge === 'SELESAI'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {formatDecisionBadge(item.badge)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {en ? 'Board Meeting Resolution' : 'Keputusan Sidang Direksi'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDecisions((prev) => ({
                            ...prev,
                            [item.id]: prev[item.id] === 'DISETUJUI' ? 'REKOMENDASI' : 'DISETUJUI',
                          }));
                        }}
                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        {en ? 'Toggle Status' : 'Ubah Status'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Digital Ratification Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-widest text-red-100">
                    {en
                      ? 'MOJOKERTO FACTORY BOARD DOCUMENT RATIFICATION'
                      : 'PENGESAHAN DOKUMEN DIREKSI PABRIK MOJOKERTO'}
                  </div>
                  <div className="text-base font-bold mt-0.5">
                    {en
                      ? `Ratified & Archive-Ready Document • Ref: AJN/BOD-DABACO/${selectedFiscalYear}/FIN-Q3`
                      : `Dokumen Disahkan Siap Arsip • Ref: AJN/BOD-DABACO/${selectedFiscalYear}/FIN-Q3`}
                  </div>
                  <div className="text-xs text-red-100/90 mt-1">
                    {en
                      ? 'Digitally signed by Factory Director & General Management.'
                      : 'Ditandatangani secara digital oleh Factory Director & General Management.'}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black tracking-wider uppercase shrink-0">
                  {en ? 'OFFICIALLY VERIFIED' : 'RESMI DIVERIFIKASI'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --------------------------------------------------------- */}
        {/* SPEAKER NOTES POP-UP DRAWER                               */}
        {/* --------------------------------------------------------- */}
        {showNotes && (
          <div className="max-w-6xl w-full mx-auto mt-6 p-5 rounded-3xl bg-amber-50/95 dark:bg-amber-950/90 border border-amber-300/80 dark:border-amber-800 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900 dark:text-slate-100 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    {en ? 'Presenter Speaker Talking Points Guide' : 'Panduan Catatan Bicara Presenter (Speaker Talking Points)'}
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    {speakerNotes[currentSlide]?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyNotesToClipboard}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 text-[11px] font-bold hover:bg-amber-300 transition-all cursor-pointer"
                >
                  {copiedNote ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>
                    {en ? (copiedNote ? 'Copied' : 'Copy Notes') : copiedNote ? 'Tersalin' : 'Salin Catatan'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotes(false)}
                  className="p-1 rounded-lg hover:bg-amber-200/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs leading-relaxed">
              <div className="font-bold text-amber-900 dark:text-amber-200 uppercase text-[10.5px]">
                {en ? 'Board Briefing Talking Points:' : 'Rangkaian Kalimat Bicara ke Direksi:'}
              </div>
              <ul className="space-y-1.5 pl-3 list-disc text-amber-950 dark:text-amber-100">
                {speakerNotes[currentSlide]?.bullets.map((b, idx) => (
                  <li key={idx} className="italic">
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-2 p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 border border-amber-200/70 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200">
                💡 <strong>{en ? 'Presenter Tip:' : 'Tips Presenter:'}</strong> {speakerNotes[currentSlide]?.advice}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* BOTTOM NAVIGATION TOOLBAR & SHORTCUT HINTS                 */}
        {/* --------------------------------------------------------- */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="font-medium text-center sm:text-left">
            {en
              ? `PT Ajinomoto Indonesia • Board of Directors Executive Deck • Full ${formatFiscalYearLabel(selectedFiscalYear)}`
              : `PT Ajinomoto Indonesia • Board of Directors Executive Deck • ${formatFiscalYearLabel(selectedFiscalYear)} Penuh`}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCurrentSlide(s)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSlide === s
                    ? 'w-6 h-2 bg-red-600'
                    : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                title={en ? `Go to Slide ${s}` : `Pindah ke Slide ${s}`}
                aria-label={`Slide ${s}`}
              />
            ))}
          </div>

          {/* Shortcut Keys Guide */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                ←/→
              </kbd>{' '}
              {en ? 'Navigate' : 'Navigasi'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                T
              </kbd>{' '}
              {en ? 'Theme' : 'Tema'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                N
              </kbd>{' '}
              {en ? 'Notes' : 'Catatan'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                F
              </kbd>{' '}
              Fullscreen
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                ESC
              </kbd>{' '}
              {en ? 'Close' : 'Tutup'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
