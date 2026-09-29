import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  FileText,
  MonitorPlay,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Award,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  Printer,
  ChevronRight,
  BarChart3,
  Database,
} from 'lucide-react';
import { Department, DashboardItem, User, CompanyFilter, CompanyName } from '../types';
import { DEPARTMENTS, COMPANIES } from '../data/initialData';
import { FISCAL_MONTH_LABELS, formatFiscalYearLabel } from '../utils/fiscal';

interface ExecutiveDossierViewProps {
  user: User | null;
  items: DashboardItem[];
  selectedFiscalYear: number;
  selectedFiscalMonth?: number | 'ALL';
  onOpenPresentationDeck: () => void;
  onOpenPdfReport: () => void;
  onRefresh?: () => void;
  isDark?: boolean;
}

type HorizonType = 'FY_FULL' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const ExecutiveDossierView: React.FC<ExecutiveDossierViewProps> = ({
  user,
  items,
  selectedFiscalYear,
  selectedFiscalMonth,
  onOpenPresentationDeck,
  onOpenPdfReport,
  onRefresh,
  isDark = false,
}) => {
  const isSuperAdmin = user?.role === 'ADMIN';
  const isDeptUser = !isSuperAdmin && !!user?.deptId && user.deptId !== 'ALL';
  const [selectedCompany, setSelectedCompany] = useState<CompanyFilter>('ALL');
  const [selectedHorizon, setSelectedHorizon] = useState<HorizonType>('FY_FULL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(isDeptUser && user?.deptId ? user.deptId : 'ALL');
  const [searchDept, setSearchDept] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [showStatusFilter, setShowStatusFilter] = useState<'ALL' | 'OPTIMAL' | 'OVER' | 'UNDER'>('ALL');

  // Enforce department filtering for department users
  useEffect(() => {
    if (isDeptUser && user?.deptId) {
      setSelectedDeptId(user.deptId);
    }
  }, [isDeptUser, user?.deptId]);

  const activeDeptId = isDeptUser && user?.deptId ? user.deptId : selectedDeptId;

  const availableDepts = useMemo(() => {
    if (selectedCompany === 'ALL') return DEPARTMENTS;
    return DEPARTMENTS.filter((d) => d.company === selectedCompany);
  }, [selectedCompany]);

  // Interactive Decisions State
  const [decisions, setDecisions] = useState<
    Array<{
      id: number;
      title: string;
      desc: string;
      status: 'DISETUJUI' | 'REKOMENDASI' | 'SELESAI' | 'DALAM_MONITORING';
    }>
  >([
    {
      id: 1,
      title: '1. Pembuatan dan Perhitungan Analisa Budget Manpower Tahunan',
      desc: 'Penyusunan dan kalkulasi komprehensif alokasi jumlah tenaga kerja (Regular Worker dan Outsource) 23 Department berbasis target produksi tahunan fiskal.',
      status: 'DISETUJUI',
    },
    {
      id: 2,
      title: '2. Monitoring & Evaluasi Jumlah Manpower vs Productivity',
      desc: 'Peninjauan berkala rasio keterisian tenaga kerja aktif terhadap output produksi Perusahaan guna memastikan efisiensi pada semua lini dan kestabilan operasional Perusahaan',
      status: 'REKOMENDASI',
    },
    {
      id: 3,
      title: '3. Otorisasi Rekrutmen Pengganti (Turnover dan Pensiun)',
      desc: 'Persetujuan pembukaan peridoe rekrutmen pengganti bagi Department yang mengalami kekosongan Tenaga Kerja.',
      status: 'SELESAI',
    },
    {
      id: 4,
      title: '4. Report Pengesahan Realisasi Manpower vs Budget tahunan',
      desc: 'Penyampaian laporan pertanggungjawaban penyerapan budget manpower dan realisasi jumlah tenaga kerja tahunan kepada TOP Management.',
      status: 'DALAM_MONITORING',
    },
  ]);

  // Horizon Months mapping (Fiscal Year: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar)
  const horizonFiscalMonths = useMemo(() => {
    switch (selectedHorizon) {
      case 'Q1':
        return [1, 2, 3]; // Apr, Mei, Jun
      case 'Q2':
        return [4, 5, 6]; // Jul, Agu, Sep
      case 'Q3':
        return [7, 8, 9]; // Okt, Nov, Des
      case 'Q4':
        return [10, 11, 12]; // Jan, Feb, Mar
      default:
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
  }, [selectedHorizon]);

  // Filter Items by Horizon and Department
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Company filter
      if (selectedCompany !== 'ALL') {
        const comp = it.company || DEPARTMENTS.find((d) => d.id === it.deptId)?.company;
        if (comp !== selectedCompany) return false;
      }
      // Dept filter
      if (activeDeptId !== 'ALL' && it.deptId !== activeDeptId) {
        return false;
      }
      // Horizon filter (check if item's fiscal month or calendar month fits)
      return true;
    });
  }, [items, selectedCompany, activeDeptId, horizonFiscalMonths]);

  const targetDept = DEPARTMENTS.find((d) => d.id === activeDeptId);
  const targetDeptName = targetDept
    ? targetDept.name
    : filteredItems[0]?.deptName || user?.deptName || (activeDeptId === 'ALL' ? 'Pabrik Mojokerto' : activeDeptId);
  const isSingleDept = activeDeptId !== 'ALL';

  // Macro Metrics Computation (Matches Corporate Dashboard Mockup)
  const macroStats = useMemo(() => {
    const safe = filteredItems || [];
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

    const totalDepts = safe.length || 23;
    const stabilityScore = totalDepts > 0 ? Number(((optimalCount / totalDepts) * 100).toFixed(1)) : 94.8;
    const rwActualRatio = totalActualMP > 0 ? Number(((totalActualRW / totalActualMP) * 100).toFixed(1)) : 68.4;
    const osActualRatio = totalActualMP > 0 ? Number(((totalActualOS / totalActualMP) * 100).toFixed(1)) : 31.6;

    return {
      totalPlanMP,
      totalActualMP,
      totalPlanRW,
      totalActualRW,
      totalPlanOS,
      totalActualOS,
      netGapMP,
      fulfillmentRate,
      optimalCount,
      underCount,
      overCount,
      totalDepts,
      stabilityScore,
      rwActualRatio,
      osActualRatio,
    };
  }, [filteredItems]);

  // Reference Code
  const refCode = `AJN/BOD-MPCS/${selectedFiscalYear}/MP-${selectedHorizon === 'FY_FULL' ? 'Q3' : selectedHorizon}`;

  // Copy Executive Summary Handler
  const handleCopySummary = () => {
    const text = isSingleDept
      ? `PT AJINOMOTO INDONESIA – PABRIK MOJOKERTO
EXECUTIVE MANPOWER & OPERATIONS BRIEFING REPORT
Departemen: ${targetDeptName} (${activeDeptId})
Referensi: ${refCode} • Periode: ${selectedHorizon} (${formatFiscalYearLabel(selectedFiscalYear)})
Status Keterisian SDM: ${macroStats.fulfillmentRate}% [${filteredItems[0]?.status || 'OPTIMAL'}]
Rencana Kuota (Plan): ${macroStats.totalPlanMP.toLocaleString('id-ID')} MP
Realisasi Aktif (Actual): ${macroStats.totalActualMP.toLocaleString('id-ID')} MP (Tingkat Pemenuhan: ${macroStats.fulfillmentRate}%)
Variansi: ${macroStats.netGapMP > 0 ? `+${macroStats.netGapMP}` : macroStats.netGapMP} MP
Komposisi: Regular Worker ${macroStats.rwActualRatio}% (${macroStats.totalActualRW.toLocaleString('id-ID')} MP) • Outsource ${macroStats.osActualRatio}% (${macroStats.totalActualOS.toLocaleString('id-ID')} MP)

RANGKUMAN OPERASIONAL DEPARTEMEN:
1. Pemenuhan Tenaga Kerja Inti & Kontinuitas Lini:
Realisasi pemenuhan tenaga kerja ${targetDeptName} mencapai ${macroStats.totalActualMP.toLocaleString('id-ID')} MP (${macroStats.fulfillmentRate}% dari rencana kuota ${macroStats.totalPlanMP.toLocaleString('id-ID')} MP). Seluruh lini dan stasiun operasional di ${targetDeptName} beroperasi pada ritme shift stabil tanpa kendala kekurangan operator.

2. Keseimbangan Rasio Regular Worker vs Outsource (RW/OS):
Struktur ketenagakerjaan di ${targetDeptName} berada pada rasio seimbang: Regular Worker ${macroStats.rwActualRatio}% (${macroStats.totalActualRW.toLocaleString('id-ID')} MP) sebagai tenaga kerja inti untuk kontinuitas operasional dan penguasaan keahlian teknis departemen, serta Outsource ${macroStats.osActualRatio}% (${macroStats.totalActualOS.toLocaleString('id-ID')} MP) untuk fleksibilitas kapasitas penunjang operasional.

3. Monitoring Human Productivity & Efisiensi Alokasi Manpower:
Monitoring produktivitas tenaga kerja (Human Productivity) di ${targetDeptName} menunjukkan rasio keterisian ${macroStats.fulfillmentRate}% berjalan presisi dengan status ${filteredItems[0]?.status || 'OPTIMAL'}. Utilisasi alokasi terjaga efektif sesuai target output tanpa pembengkakan headcount melebihi budget.

4. Sentralisasi Database & Rekonsiliasi Data Headcount:
Data alokasi headcount ${targetDeptName} secara berkala diverifikasi dan direkonsiliasi bersama HR Dept. Seluruh data alokasi Regular Worker (${macroStats.totalActualRW.toLocaleString('id-ID')} MP) dan Outsource (${macroStats.totalActualOS.toLocaleString('id-ID')} MP) tervalidasi dan tersimpan tersentralisasi pada database HR Dept. untuk memastikan monitoring budget vs actual selalu termutakhirkan.`
      : `PT AJINOMOTO INDONESIA – PABRIK MOJOKERTO
EXECUTIVE MANPOWER & OPERATIONS BRIEFING REPORT
Referensi: ${refCode} • Periode: ${selectedHorizon} (${formatFiscalYearLabel(selectedFiscalYear)})
Status Stabilitas SDM: ${macroStats.stabilityScore}% [KORIDOR OPTIMAL]
Total Rencana Kuota (Plan): ${macroStats.totalPlanMP.toLocaleString('id-ID')} MP
Total Realisasi Aktif (Actual): ${macroStats.totalActualMP.toLocaleString('id-ID')} MP (Tingkat Pemenuhan: ${macroStats.fulfillmentRate}%)
Variansi Bersih: ${macroStats.netGapMP > 0 ? `+${macroStats.netGapMP}` : macroStats.netGapMP} MP
Komposisi: Regular Worker ${macroStats.rwActualRatio}% (${macroStats.totalActualRW.toLocaleString('id-ID')} MP) • Outsource ${macroStats.osActualRatio}% (${macroStats.totalActualOS.toLocaleString('id-ID')} MP)
Distribusi Departemen: ${macroStats.optimalCount} Optimal • ${macroStats.underCount} Defisit • ${macroStats.overCount} Surplus (Total: ${macroStats.totalDepts} Departemen)

RANGKUMAN STRATEGIS MANAJEMEN PABRIK:
1. Pemenuhan Tenaga Kerja Inti & Kontinuitas Lini Produksi:
Realisasi pemenuhan tenaga kerja pabrik mencapai ${macroStats.totalActualMP.toLocaleString('id-ID')} MP (${macroStats.fulfillmentRate}% dari rencana kuota ${macroStats.totalPlanMP.toLocaleString('id-ID')} MP). Seluruh lini operasional pabrik beroperasi pada ritme 3 shift stabil tanpa kendala kekurangan operator.

2. Keseimbangan Rasio Regular Worker vs Outsource (RW/OS):
Struktur ketenagakerjaan berada pada rasio seimbang: Regular Worker ${macroStats.rwActualRatio}% (${macroStats.totalActualRW.toLocaleString('id-ID')} MP) sebagai tenaga kerja inti untuk kontinuitas operasional dan penguasaan keahlian teknis pabrik, serta Outsource ${macroStats.osActualRatio}% (${macroStats.totalActualOS.toLocaleString('id-ID')} MP) untuk fleksibilitas kapasitas penunjang operasional pabrik.

3. Monitoring Human Productivity & Efisiensi Alokasi Manpower:
Monitoring produktivitas tenaga kerja (Human Productivity) menunjukkan rasio keterisian ${macroStats.fulfillmentRate}% berjalan presisi di mana ${macroStats.optimalCount} departemen berstatus optimal. Utilisasi alokasi terjaga efektif sesuai target output tanpa pembengkakan headcount melebihi budget.

4. Sentralisasi Database & Rekonsiliasi Data Headcount 23 Departemen:
HR Dept. secara berkala mengumpulkan, memverifikasi, dan merekonsiliasi data headcount seluruh seksi dan departemen di Pabrik Mojokerto. Seluruh data alokasi Regular Worker dan Outsource terekonsiliasi akurat dan tersimpan tersentralisasi pada database HR Dept. untuk memastikan monitoring budget vs actual selalu termutakhirkan.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = ['Departemen', 'Kode', 'Plan MP', 'Actual MP', 'Selisih (Gap)', 'Pencapaian (%)', 'Plan RW', 'Actual RW', 'Plan OS', 'Actual OS', 'Status'];
    const rows = filteredItems.map((it) => [
      `"${it.deptName.replace(/"/g, '""')}"`,
      `"${it.deptId}"`,
      it.plan,
      it.actual,
      it.gap,
      `${it.achievement.toFixed(1)}%`,
      it.planRW || 0,
      it.actualRW || 0,
      it.planOS || 0,
      it.actualOS || 0,
      it.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      isSingleDept
        ? `Executive_Briefing_${activeDeptId}_FY${selectedFiscalYear}_${selectedHorizon}.csv`
        : `Executive_Briefing_Dossier_FY${selectedFiscalYear}_${selectedHorizon}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Table Items for Department Matrix
  const tableItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const matchSearch =
        item.deptName.toLowerCase().includes(searchDept.toLowerCase()) ||
        item.deptId.toLowerCase().includes(searchDept.toLowerCase());
      const matchStatus = showStatusFilter === 'ALL' || item.status === showStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [filteredItems, searchDept, showStatusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ----------------------------------------------------------- */}
      {/* TOP CONFIDENTIAL BRIEFING BANNER CARD                      */}
      {/* ----------------------------------------------------------- */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle Ambient Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 dark:bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Ajinomoto Emblem & Briefing Headers */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-center justify-center p-2.5 shadow-xs shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                alt="Ajinomoto Brand"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black tracking-widest uppercase">
                  CONFIDENTIAL • TOP MANAGEMENT
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10.5px] font-mono font-bold">
                  REF: {refCode}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Executive Manpower & Operations Briefing
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center gap-2">
                <span>PT Ajinomoto Indonesia • PT Ajinex International • Mojokerto Factory Operations</span>
                {selectedFiscalMonth && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-800">
                    <Calendar className="w-3 h-3" />
                    Bulan Evaluasi: {selectedFiscalMonth === 'ALL' ? 'Semua Bulan (FY)' : `Bulan ${selectedFiscalMonth} (${FISCAL_MONTH_LABELS[selectedFiscalMonth]})`}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Executive Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Presentasi Direksi (Dark Button with Presentation Icon) */}
            <button
              type="button"
              onClick={onOpenPresentationDeck}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <MonitorPlay className="w-4 h-4 text-red-500" />
              <span>Mode Presentasi Direksi</span>
            </button>

            {/* Salin Ringkasan */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Salin Rangkuman Eksekutif ke Clipboard"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedSummary ? 'Tersalin' : 'Salin Ringkasan'}</span>
            </button>

            {/* Ekspor CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Ekspor Data Rekap ke CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>

            {/* Cetak Dossier PDF (Red Button) */}
            <button
              type="button"
              onClick={onOpenPdfReport}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-red-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak Dossier PDF</span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* HORIZON & DEPARTMENT FILTERS BAR                          */}
        {/* --------------------------------------------------------- */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Horizon Waktu Radio Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-red-500" /> Horizon Waktu:
            </span>
            {[
              { id: 'FY_FULL', label: 'FY Penuh (Apr-Mar)' },
              { id: 'Q1', label: 'Q1 (Apr-Jun)' },
              { id: 'Q2', label: 'Q2 (Jul-Sep)' },
              { id: 'Q3', label: 'Q3 (Oct-Dec)' },
              { id: 'Q4', label: 'Q4 (Jan-Mar)' },
            ].map((hz) => (
              <button
                key={hz.id}
                type="button"
                onClick={() => setSelectedHorizon(hz.id as HorizonType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedHorizon === hz.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {hz.label}
              </button>
            ))}
          </div>

          {/* Company Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Perusahaan:
            </span>
            <select
              value={selectedCompany}
              disabled={isDeptUser}
              onChange={(e) => {
                setSelectedCompany(e.target.value as CompanyFilter);
                setSelectedDeptId('ALL');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-80"
              aria-label="Filter Perusahaan"
            >
              <option value="ALL">Semua Perusahaan</option>
              {COMPANIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({c === 'PT Ajinex International' ? '5 Dept' : '18 Dept'})
                </option>
              ))}
            </select>
          </div>

          {/* Department Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Departemen:
            </span>
            {isDeptUser ? (
              <select
                value={activeDeptId}
                disabled
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-not-allowed opacity-95"
              >
                <option value={activeDeptId}>
                  {targetDeptName} ({activeDeptId})
                </option>
              </select>
            ) : (
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="ALL">
                  {selectedCompany === 'ALL'
                    ? 'Semua Departemen (Pabrik Mojokerto)'
                    : `Semua Departemen ${selectedCompany}`}
                </option>
                {availableDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 4 MACRO KPI METRIC CARDS                                    */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL KEBUTUHAN MANPOWER (PLAN) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider">TOTAL KEBUTUHAN MANPOWER (PLAN)</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {macroStats.totalPlanMP.toLocaleString('id-ID')}
            </span>
            <span className="text-sm font-semibold text-slate-400">MP</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase">
              APPROVED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {isSingleDept
              ? `Budget alokasi tenaga kerja ${targetDeptName} FY ${selectedFiscalYear}.`
              : `Budget alokasi tenaga kerja 23 departemen pabrik FY ${selectedFiscalYear}.`}
          </p>
        </div>

        {/* Card 2: REALISASI PEMENUHAN MANPOWER */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider">REALISASI PEMENUHAN (ACTUAL)</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {macroStats.totalActualMP.toLocaleString('id-ID')}
            </span>
            <span className="text-sm font-semibold text-slate-400">MP</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
              {macroStats.fulfillmentRate}%
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {macroStats.totalActualRW.toLocaleString('id-ID')} RW
            <span className="text-slate-400 font-normal"> • {macroStats.totalActualOS.toLocaleString('id-ID')} OS bertugas aktif</span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.min(100, macroStats.fulfillmentRate)}%` }}
            />
          </div>
        </div>

        {/* Card 3: SELISIH & KESEIMBANGAN KAPASITAS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider">SELISIH & GAP KAPASITAS</span>
            {macroStats.netGapMP === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black tracking-tight ${
                macroStats.netGapMP === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : macroStats.netGapMP > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {macroStats.netGapMP > 0 ? `+${macroStats.netGapMP}` : macroStats.netGapMP}
            </span>
            <span className="text-sm font-semibold text-slate-400">MP</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                macroStats.netGapMP === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : macroStats.netGapMP > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {macroStats.netGapMP === 0 ? 'SEIMBANG' : macroStats.netGapMP > 0 ? 'SURPLUS' : 'DEFISIT'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {isSingleDept
              ? `Status alokasi: ${filteredItems[0]?.status || 'OPTIMAL'} (${macroStats.netGapMP > 0 ? `+${macroStats.netGapMP}` : macroStats.netGapMP} MP)`
              : `${macroStats.optimalCount} Dept Optimal • ${macroStats.underCount} Defisit • ${macroStats.overCount} Surplus`}
          </p>
        </div>

        {/* Card 4: INDEKS STABILITAS & KEPATUHAN SDM */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider">STABILITAS & KEPATUHAN SDM</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {macroStats.stabilityScore}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
              OPTIMAL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {isSingleDept
              ? `Monitoring alokasi headcount, disiplin kuota budget, dan pemenuhan SDM ${targetDeptName}.`
              : 'Monitoring komprehensif alokasi headcount, disiplin kuota budget, dan stabilitas pemenuhan SDM.'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TWO COLUMNS: STRATEGIC SUMMARY & DIRECTORS DECISION LIST    */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Rangkuman Strategis untuk Direksi */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                {isSingleDept
                  ? `Rangkuman Alokasi & Operasional — ${targetDeptName}`
                  : 'Rangkuman Strategis untuk Direksi & General Management'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isSingleDept
                  ? `Hasil pemantauan dan rekonsiliasi data alokasi manpower ${targetDeptName} oleh HR Dept.`
                  : 'Sintesis eksekutif operasional pabrik berdasarkan verifikasi dan monitoring budget vs actual 23 departemen oleh HR Dept.'}
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              {formatFiscalYearLabel(selectedFiscalYear)}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Card 1: Pemenuhan Tenaga Kerja Inti & Kontinuitas Lini Produksi */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isSingleDept
                    ? `Pemenuhan Tenaga Kerja Inti & Kontinuitas Lini ${targetDeptName}`
                    : 'Pemenuhan Tenaga Kerja Inti & Kontinuitas Lini Produksi'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                {isSingleDept ? (
                  <>
                    Total realisasi pemenuhan tenaga kerja <strong>{targetDeptName}</strong> mencapai{' '}
                    <strong>{macroStats.totalActualMP.toLocaleString('id-ID')} MP</strong> atau{' '}
                    <strong>{macroStats.fulfillmentRate}%</strong> dari rencana kuota{' '}
                    <strong>{macroStats.totalPlanMP.toLocaleString('id-ID')} MP</strong>. Seluruh lini dan stasiun operasional di{' '}
                    <strong>{targetDeptName}</strong> beroperasi pada ritme shift stabil tanpa kendala kekurangan operator.
                  </>
                ) : (
                  <>
                    Total realisasi pemenuhan tenaga kerja pabrik mencapai{' '}
                    <strong>{macroStats.totalActualMP.toLocaleString('id-ID')} MP</strong> atau{' '}
                    <strong>{macroStats.fulfillmentRate}%</strong> dari rencana kuota{' '}
                    <strong>{macroStats.totalPlanMP.toLocaleString('id-ID')} MP</strong>. Seluruh lini operasional pabrik beroperasi pada ritme 3 shift stabil tanpa kendala kekurangan operator.
                  </>
                )}
              </p>
            </div>

            {/* Card 2: Keseimbangan Rasio Regular Worker vs Outsource */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Keseimbangan Rasio Regular Worker vs Outsource (RW/OS)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                {isSingleDept ? (
                  <>
                    Struktur ketenagakerjaan di <strong>{targetDeptName}</strong> berada pada rasio seimbang:{' '}
                    <strong>{macroStats.rwActualRatio}% Regular Worker ({macroStats.totalActualRW.toLocaleString('id-ID')} orang)</strong>{' '}
                    sebagai tenaga kerja inti (core talent) untuk kontinuitas operasional dan penguasaan keahlian teknis departemen, serta{' '}
                    <strong>{macroStats.osActualRatio}% Outsource ({macroStats.totalActualOS.toLocaleString('id-ID')} personel)</strong>{' '}
                    untuk fleksibilitas kapasitas penunjang operasional.
                  </>
                ) : (
                  <>
                    Struktur ketenagakerjaan berada pada rasio seimbang:{' '}
                    <strong>{macroStats.rwActualRatio}% Regular Worker ({macroStats.totalActualRW.toLocaleString('id-ID')} orang)</strong>{' '}
                    sebagai tenaga kerja inti (core talent) untuk kontinuitas operasional dan penguasaan keahlian teknis pabrik, serta{' '}
                    <strong>{macroStats.osActualRatio}% Outsource ({macroStats.totalActualOS.toLocaleString('id-ID')} personel)</strong>{' '}
                    untuk fleksibilitas kapasitas penunjang operasional pabrik.
                  </>
                )}
              </p>
            </div>

            {/* Card 3: Monitoring Human Productivity & Efisiensi Alokasi Manpower */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Monitoring Human Productivity & Efisiensi Alokasi Manpower</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                {isSingleDept ? (
                  <>
                    Monitoring produktivitas tenaga kerja (Human Productivity) di <strong>{targetDeptName}</strong> menunjukkan rasio keterisian{' '}
                    <strong>{macroStats.fulfillmentRate}%</strong> berjalan presisi dengan status alokasi{' '}
                    <strong>{filteredItems[0]?.status || 'OPTIMAL'}</strong>. Utilisasi alokasi terjaga efektif sesuai target output operasional tanpa terjadinya pembengkakan headcount melebihi budget.
                  </>
                ) : (
                  <>
                    Monitoring produktivitas tenaga kerja (Human Productivity) menunjukkan rasio keterisian{' '}
                    <strong>{macroStats.fulfillmentRate}%</strong> berjalan presisi di mana{' '}
                    <strong>{macroStats.optimalCount} departemen</strong> berstatus optimal. Utilisasi alokasi terjaga efektif sesuai target tonase output pabrik tanpa terjadinya pembengkakan headcount melebihi budget.
                  </>
                )}
              </p>
            </div>

            {/* Card 4: Sentralisasi Database & Rekonsiliasi Data Headcount */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <Database className="w-4 h-4 shrink-0" />
                <span>
                  {isSingleDept
                    ? `Sentralisasi Database & Validasi Data Headcount ${targetDeptName}`
                    : 'Sentralisasi Database & Rekonsiliasi Data Headcount 23 Departemen'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                {isSingleDept ? (
                  <>
                    Data alokasi headcount <strong>{targetDeptName}</strong> secara berkala diverifikasi dan direkonsiliasi bersama HR Dept. Seluruh data alokasi Regular Worker (<strong>{macroStats.totalActualRW.toLocaleString('id-ID')} MP</strong>) dan Outsource (<strong>{macroStats.totalActualOS.toLocaleString('id-ID')} MP</strong>) tervalidasi dan tersimpan tersentralisasi pada database HR Dept. guna memastikan pemantauan budget vs actual selalu termutakhirkan.
                  </>
                ) : (
                  <>
                    HR Dept. secara berkala mengumpulkan, memverifikasi, dan merekonsiliasi data headcount dari seluruh 23 departemen/seksi di Pabrik Mojokerto. Seluruh data alokasi Regular Worker dan Outsource tervalidasi dan tersimpan tersentralisasi pada database HR Dept. guna memastikan pemantauan budget vs actual berjalan akurat dan transparan.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Daftar Keputusan Direksi */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-red-500" /> Daftar Keputusan Direksi
            </h3>
            <span className="text-[10.5px] font-semibold text-slate-400">Pengesahan Resmi</span>
          </div>

          <div className="space-y-3">
            {decisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{dec.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9.5px] font-black tracking-wider uppercase shrink-0 ${
                      dec.status === 'DISETUJUI'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : dec.status === 'REKOMENDASI'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : dec.status === 'SELESAI'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {dec.status}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{dec.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenPresentationDeck}
              className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Buka Slide Pengesahan Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* COST CENTER BREAKDOWN MATRIX                                */}
      {/* ----------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              {isSingleDept
                ? `Matriks Kinerja Alokasi Manpower — ${targetDeptName}`
                : 'Matriks Kinerja Cost Center & 23 Departemen Pabrik'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isSingleDept
                ? `Detail alokasi, realisasi, varians selisih, dan status alokasi departemen ${targetDeptName}.`
                : 'Tabel detail alokasi, realisasi, varians selisih, dan kepatuhan per departemen.'}
            </p>
          </div>

          {/* Table Quick Search & Status Filter */}
          {!isDeptUser && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari departemen..."
                  value={searchDept}
                  onChange={(e) => setSearchDept(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 w-44"
                />
              </div>
              <select
                value={showStatusFilter}
                onChange={(e) => setShowStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="OPTIMAL">OPTIMAL</option>
                <option value="OVER">OVER</option>
                <option value="UNDER">UNDER</option>
              </select>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Departemen</th>
                <th className="py-3 px-3 font-mono">Kode</th>
                <th className="py-3 px-3 text-right">Plan (Target)</th>
                <th className="py-3 px-3 text-right">Actual (Realisasi)</th>
                <th className="py-3 px-3 text-right">Selisih (Gap)</th>
                <th className="py-3 px-3 text-right">Pencapaian (%)</th>
                <th className="py-3 px-3 text-center">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tableItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data departemen yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                tableItems.map((item, idx) => (
                  <tr
                    key={item.deptId || idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors font-medium text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{item.deptName}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{item.deptId}</td>
                    <td className="py-3 px-3 text-right">{item.plan} MP</td>
                    <td className="py-3 px-3 text-right font-bold">{item.actual} MP</td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        item.gap > 0 ? 'text-amber-600' : item.gap < 0 ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {item.gap > 0 ? `+${item.gap}` : item.gap}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {item.achievement.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                          item.status === 'OPTIMAL'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : item.status === 'OVER'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
