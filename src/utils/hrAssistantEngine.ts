import {
  User,
  PlanRecord,
  ActualRecord,
  DashboardItem,
  PendingApproval,
  AuditLog,
  CloudSyncState,
  CompanyFilter,
} from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { getDepartmentCapacity } from '../data/departmentCapacity';
import {
  fiscalToCalendarMonth,
  getFiscalMonth,
  getFiscalYear,
  formatFiscalYearLabel,
} from './fiscal';
import { getDashboardData, getMonthlyTrendDataByFY } from './storage';
import { Language, FISCAL_MONTH_LABELS_I18N } from '../i18n/translations';

export interface AssistantKpi {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
}

export interface AssistantTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface AssistantActionLink {
  label: string;
  page: string;
  deptId?: string;
}

export interface AssistantReply {
  id: string;
  title: string;
  badge: string;
  summary: string;
  kpis?: AssistantKpi[];
  table?: AssistantTable;
  draftText?: string;
  draftFilename?: string;
  followUps?: string[];
  actionLink?: AssistantActionLink;
  timestamp: string;
}

export interface HRAssistantContext {
  user: User;
  plans: PlanRecord[];
  actuals: ActualRecord[];
  dashboardItems: DashboardItem[];
  approvals: PendingApproval[];
  auditLogs: AuditLog[];
  users: User[];
  selectedFiscalMonth: number | 'ALL';
  selectedYear: number;
  selectedCompany: CompanyFilter;
  syncState: CloudSyncState;
  language: Language;
}

export type QuickCategoryKey = 'budget' | 'dept' | 'trend' | 'analytics';

export interface QuickPromptItem {
  id: string;
  label: string;
  prompt: string;
}

export interface DraftPromptItem {
  id: string;
  label: string;
  prompt: string;
  badge: string;
}

const fmtNum = (n: number, lang: Language = 'id'): string =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'id-ID').format(Math.round(n));

const fmtPct = (n: number): string => `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`;

const fmtGap = (gap: number, lang: Language = 'id'): string => {
  if (gap > 0) return `+${fmtNum(gap, lang)}`;
  if (gap < 0) return `-${fmtNum(Math.abs(gap), lang)}`;
  return '0';
};

const nowTimeStr = (): string => {
  const d = new Date();
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const todayDateStr = (lang: Language): string => {
  const d = new Date();
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Aliases & keywords to reliably identify any of the 23 Mojokerto Factory departments
 */
const DEPT_ALIASES: Record<string, string[]> = {
  D001: ['d001', 'food production 1', 'food prod 1', 'fp1', 'fp 1', 'produksi 1', 'seasoning'],
  D002: ['d002', 'food production 2', 'food prod 2', 'fp2', 'fp 2', 'produksi 2', 'packaging'],
  D003: ['d003', 'food ingredients 1', 'food ingredient 1', 'fi1', 'fi 1', 'ingredients 1'],
  D004: ['d004', 'food ingredients 2', 'food ingredient 2', 'fi2', 'fi 2', 'ingredients 2'],
  D005: ['d005', 'film lamination', 'film & lamination', 'film', 'lamination', 'laminasi'],
  D006: ['d006', 'production planning', 'ppic', 'ppc', 'planning control', 'planning & control'],
  D007: ['d007', 'inventory control', 'inventory', 'gudang', 'warehouse', 'ic'],
  D008: ['d008', 'procurement', 'exim', 'purchasing', 'pengadaan', 'ekspor impor'],
  D009: ['d009', 'factory operational excellence', 'operational excellence', 'foe', 'kaizen'],
  D010: ['d010', 'engineering', 'maintenance', 'eng', 'teknik', 'perawatan'],
  D011: ['d011', 'utility', 'utilitas', 'energi', 'listrik', 'boiler'],
  D012: ['d012', 'human resource', 'hrd', 'sdm', 'personalia'],
  D013: ['d013', 'general affairs', 'general affair', 'ga', 'umum'],
  D014: ['d014', 'agri development', 'agri', 'pertanian'],
  D015: ['d015', 'health safety', 'environment', 'hse', 'k3', 'k3l', 'safety'],
  D016: ['d016', 'quality assurance', 'qa ne', 'qa ajinomoto', 'mutu ne'],
  D017: ['d017', 'production ajinex', 'production nex', 'produksi ajinex', 'produksi nex'],
  D018: ['d018', 'itec project', 'project itec'],
  D019: ['d019', 'itec process', 'process itec'],
  D020: ['d020', 'quality assurance nex', 'qa nex', 'qa ajinex', 'mutu ajinex'],
  D021: ['d021', 'direktur ne', 'director ne', 'direksi ne'],
  D022: ['d022', 'direktur nex', 'director nex', 'direksi nex'],
  D023: ['d023', 'legal', 'hukum', 'kepatuhan hukum'],
};

function findMentionedDepartments(rawQuery: string, allowedDeptIds: Set<string>): string[] {
  const q = normalizeText(rawQuery);
  const matched: string[] = [];

  // 1. Explicit D0xx codes
  const codeMatches = q.match(/\bd0(0[1-9]|1[0-9]|2[0-3])\b/g);
  if (codeMatches) {
    codeMatches.forEach((c) => {
      const id = c.toUpperCase();
      if (allowedDeptIds.has(id) && !matched.includes(id)) {
        matched.push(id);
      }
    });
  }

  // 2. Exact & phrase aliases (longest phrases first to avoid D016 stealing D020)
  const orderedIds = Object.keys(DEPT_ALIASES).sort((a, b) => {
    const maxA = Math.max(...DEPT_ALIASES[a].map((x) => x.length));
    const maxB = Math.max(...DEPT_ALIASES[b].map((x) => x.length));
    return maxB - maxA;
  });

  // Check D020 before D016 if "nex" or "ajinex" appears with "qa" or "quality assurance"
  if (
    (q.includes('quality assurance') || /\bqa\b/.test(q)) &&
    (q.includes('nex') || q.includes('ajinex'))
  ) {
    if (allowedDeptIds.has('D020') && !matched.includes('D020')) {
      matched.push('D020');
    }
  } else if (q.includes('quality assurance') || /\bqa\b/.test(q)) {
    if (allowedDeptIds.has('D016') && !matched.includes('D016')) {
      matched.push('D016');
    }
  }

  for (const id of orderedIds) {
    if (!allowedDeptIds.has(id) || matched.includes(id)) continue;
    if (id === 'D016' || id === 'D020') continue; // handled above
    const aliases = DEPT_ALIASES[id];
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
      if (regex.test(q)) {
        matched.push(id);
        break;
      }
    }
  }

  // Special check for "Production" standalone when "ajinex" or "nex" is mentioned
  if (
    !matched.includes('D017') &&
    allowedDeptIds.has('D017') &&
    /\bproduction\b/.test(q) &&
    !q.includes('food production') &&
    !q.includes('production planning')
  ) {
    matched.push('D017');
  }

  return matched;
}

const MONTH_KEYWORDS: Array<{ fiscalMonth: number; calMonth: number; keys: string[] }> = [
  { fiscalMonth: 1, calMonth: 4, keys: ['april', 'apr', 'bulan 1', 'month 1'] },
  { fiscalMonth: 2, calMonth: 5, keys: ['mei', 'may', 'bulan 2', 'month 2'] },
  { fiscalMonth: 3, calMonth: 6, keys: ['juni', 'june', 'jun', 'bulan 3', 'month 3'] },
  { fiscalMonth: 4, calMonth: 7, keys: ['juli', 'july', 'jul', 'bulan 4', 'month 4'] },
  { fiscalMonth: 5, calMonth: 8, keys: ['agustus', 'august', 'agu', 'aug', 'bulan 5', 'month 5'] },
  { fiscalMonth: 6, calMonth: 9, keys: ['september', 'sep', 'sept', 'bulan 6', 'month 6'] },
  { fiscalMonth: 7, calMonth: 10, keys: ['oktober', 'october', 'okt', 'oct', 'bulan 7', 'month 7'] },
  { fiscalMonth: 8, calMonth: 11, keys: ['november', 'nov', 'bulan 8', 'month 8'] },
  { fiscalMonth: 9, calMonth: 12, keys: ['desember', 'december', 'des', 'dec', 'bulan 9', 'month 9'] },
  { fiscalMonth: 10, calMonth: 1, keys: ['januari', 'january', 'jan', 'bulan 10', 'month 10'] },
  { fiscalMonth: 11, calMonth: 2, keys: ['februari', 'february', 'feb', 'bulan 11', 'month 11'] },
  { fiscalMonth: 12, calMonth: 3, keys: ['maret', 'march', 'mar', 'bulan 12', 'month 12'] },
];

function detectRequestedFiscalMonth(rawQuery: string): number | null {
  const q = normalizeText(rawQuery);
  for (const m of MONTH_KEYWORDS) {
    for (const k of m.keys) {
      const regex = new RegExp(`(^|\\s)${k}(\\s|$)`, 'i');
      if (regex.test(q)) return m.fiscalMonth;
    }
  }
  return null;
}

function detectRequestedYear(rawQuery: string): number | null {
  const match = rawQuery.match(/\b(202[4-9]|2030)\b/);
  return match ? Number(match[1]) : null;
}

function detectRequestedCompany(rawQuery: string): CompanyFilter | null {
  const q = normalizeText(rawQuery);
  const hasAjinex = /\b(ajinex|nex)\b/.test(q);
  const hasAjinomoto = /\b(ajinomoto|ne)\b/.test(q);
  if (hasAjinex && !hasAjinomoto) return 'PT Ajinex International';
  if (hasAjinomoto && !hasAjinex) return 'PT Ajinomoto Indonesia';
  return null;
}

export interface AggregatedMetrics {
  items: DashboardItem[];
  totalDepts: number;
  totalPlan: number;
  totalPlanRW: number;
  totalPlanOS: number;
  totalActual: number;
  totalActualRW: number;
  totalActualOS: number;
  gap: number;
  gapRW: number;
  gapOS: number;
  achievement: number;
  rwRatioActual: number;
  osRatioActual: number;
  rwRatioPlan: number;
  osRatioPlan: number;
  overItems: DashboardItem[];
  optimalItems: DashboardItem[];
  underItems: DashboardItem[];
  complianceRate: number;
  complianceStatus: 'OPTIMAL' | 'WASPADA';
  zeroActualItems: DashboardItem[];
  zeroPlanItems: DashboardItem[];
}

/**
 * Collapse multi-month rows by deptId when selectedFiscalMonth === 'ALL' so dept counts stay accurate (max 23 depts)
 */
export function aggregateByDepartment(items: DashboardItem[]): DashboardItem[] {
  const map = new Map<string, DashboardItem>();
  items.forEach((item) => {
    const existing = map.get(item.deptId);
    if (!existing) {
      map.set(item.deptId, { ...item });
    } else {
      existing.plan += item.plan;
      existing.planRW += item.planRW;
      existing.planOS += item.planOS;
      existing.actual += item.actual;
      existing.actualRW += item.actualRW;
      existing.actualOS += item.actualOS;
      existing.gap = existing.actual - existing.plan;
      existing.achievement =
        existing.plan > 0
          ? Number(((existing.actual / existing.plan) * 100).toFixed(1))
          : existing.actual > 0
          ? 100
          : 0;
      if (existing.achievement > 100) existing.status = 'OVER';
      else if (existing.achievement < 90) existing.status = 'UNDER';
      else existing.status = 'OPTIMAL';
      if (item.remarks && !existing.remarks) existing.remarks = item.remarks;
    }
  });
  return Array.from(map.values()).sort((a, b) => a.deptId.localeCompare(b.deptId));
}

export function computeMetrics(rawItems: DashboardItem[]): AggregatedMetrics {
  const items = aggregateByDepartment(rawItems);
  const totalPlanRW = items.reduce((s, i) => s + i.planRW, 0);
  const totalPlanOS = items.reduce((s, i) => s + i.planOS, 0);
  const totalPlan = totalPlanRW + totalPlanOS;
  const totalActualRW = items.reduce((s, i) => s + i.actualRW, 0);
  const totalActualOS = items.reduce((s, i) => s + i.actualOS, 0);
  const totalActual = totalActualRW + totalActualOS;
  const gap = totalActual - totalPlan;
  const gapRW = totalActualRW - totalPlanRW;
  const gapOS = totalActualOS - totalPlanOS;
  const achievement = totalPlan > 0 ? Number(((totalActual / totalPlan) * 100).toFixed(1)) : 0;

  const rwRatioActual = totalActual > 0 ? Number(((totalActualRW / totalActual) * 100).toFixed(1)) : 0;
  const osRatioActual = totalActual > 0 ? Number(((totalActualOS / totalActual) * 100).toFixed(1)) : 0;
  const rwRatioPlan = totalPlan > 0 ? Number(((totalPlanRW / totalPlan) * 100).toFixed(1)) : 0;
  const osRatioPlan = totalPlan > 0 ? Number(((totalPlanOS / totalPlan) * 100).toFixed(1)) : 0;

  const overItems = items.filter((i) => i.status === 'OVER').sort((a, b) => b.gap - a.gap);
  const optimalItems = items.filter((i) => i.status === 'OPTIMAL').sort((a, b) => b.actual - a.actual);
  const underItems = items.filter((i) => i.status === 'UNDER').sort((a, b) => a.gap - b.gap);

  const totalDepts = items.length;
  // Exact MPCS compliance formula: (Optimal + Under) / Total Departments * 100%
  const compliantCount = optimalItems.length + underItems.length;
  const complianceRate = totalDepts > 0 ? Number(((compliantCount / totalDepts) * 100).toFixed(1)) : 100;
  const complianceStatus: 'OPTIMAL' | 'WASPADA' = complianceRate >= 80 ? 'OPTIMAL' : 'WASPADA';

  const zeroActualItems = items.filter((i) => i.plan > 0 && i.actual === 0);
  const zeroPlanItems = items.filter((i) => i.plan === 0 && i.actual > 0);

  return {
    items,
    totalDepts,
    totalPlan,
    totalPlanRW,
    totalPlanOS,
    totalActual,
    totalActualRW,
    totalActualOS,
    gap,
    gapRW,
    gapOS,
    achievement,
    rwRatioActual,
    osRatioActual,
    rwRatioPlan,
    osRatioPlan,
    overItems,
    optimalItems,
    underItems,
    complianceRate,
    complianceStatus,
    zeroActualItems,
    zeroPlanItems,
  };
}

export function getPeriodLabel(
  fiscalMonth: number | 'ALL',
  year: number,
  lang: Language
): string {
  if (fiscalMonth === 'ALL') {
    return lang === 'en' ? `Full Year ${year} (All Months)` : `Sepanjang Tahun ${year} (Semua Bulan)`;
  }
  const monthLabel = FISCAL_MONTH_LABELS_I18N[lang][fiscalMonth] || `M${fiscalMonth}`;
  const calMonth = fiscalToCalendarMonth(fiscalMonth);
  const fy = getFiscalYear(calMonth, year);
  return lang === 'en'
    ? `Month ${fiscalMonth} (${monthLabel} ${year}) · ${formatFiscalYearLabel(fy)}`
    : `Bulan ${fiscalMonth} (${monthLabel} ${year}) · ${formatFiscalYearLabel(fy)}`;
}

/**
 * Curated Quick Prompt Suggestions (4 Tabs x 4 Prompts = 16 Instant Prompts)
 * Automatically adapts for USER role (strict RBAC isolation) and ID/EN language.
 */
export function getQuickPromptCategories(
  isUserRole: boolean,
  deptName: string,
  lang: Language
): Record<QuickCategoryKey, { label: string; prompts: QuickPromptItem[] }> {
  const isEn = lang === 'en';

  if (isUserRole) {
    return {
      budget: {
        label: isEn ? 'Budget & Actual' : 'Budget & Actual',
        prompts: [
          {
            id: 'u-b1',
            label: isEn ? `Summarize ${deptName} manpower status now` : `Ringkas status manpower ${deptName} saat ini`,
            prompt: isEn ? `Summarize manpower status for ${deptName}` : `Ringkas status manpower ${deptName} saat ini`,
          },
          {
            id: 'u-b2',
            label: isEn ? 'Check RW vs OS composition & capacity limit' : 'Cek komposisi RW vs OS & batas standar kapasitas',
            prompt: isEn ? 'Analyze RW vs OS composition and capacity standards' : 'Analisis komposisi RW vs OS dan standar kapasitas departemen saya',
          },
          {
            id: 'u-b3',
            label: isEn ? 'Is my department Over, Optimal, or Under budget?' : 'Apakah departemen saya Over, Optimal, atau Under budget?',
            prompt: isEn ? 'Check budget compliance status and variance' : 'Cek status kepatuhan budget dan selisih gap departemen saya',
          },
          {
            id: 'u-b4',
            label: isEn ? 'Check missing inputs or variance anomalies' : 'Deteksi anomali atau bulan yang belum terisi Actual',
            prompt: isEn ? 'Detect data readiness and variance anomalies' : 'Deteksi kesiapan data dan anomali input departemen saya',
          },
        ],
      },
      dept: {
        label: isEn ? 'Capacity & PIC' : 'Kapasitas & PIC',
        prompts: [
          {
            id: 'u-d1',
            label: isEn ? 'Show standard capacity ceiling (RW/OS/Max)' : 'Tampilkan standar kapasitas maksimum (RW/OS/Max)',
            prompt: isEn ? 'Show capacity ceiling audit for my department' : 'Audit standar kapasitas maksimum departemen saya',
          },
          {
            id: 'u-d2',
            label: isEn ? 'Show my department PIC & HR contact info' : 'Tampilkan info PIC departemen & kontak HR Admin',
            prompt: isEn ? 'Show department PIC and HR contact directory' : 'Siapa PIC departemen saya dan kontak HR Development?',
          },
          {
            id: 'u-d3',
            label: isEn ? 'Show pending & historical Actual approvals' : 'Cek status pengajuan Approval Actual saya',
            prompt: isEn ? 'Check my actual approval requests and history' : 'Cek status antrean dan riwayat Approval Actual departemen saya',
          },
          {
            id: 'u-d4',
            label: isEn ? 'How is budget compliance percentage calculated?' : 'Bagaimana rumus persentase kepatuhan budget dihitung?',
            prompt: isEn ? 'Explain the budget compliance formula and thresholds' : 'Jelaskan rumus kepatuhan budget dan parameter Optimal vs Waspada',
          },
        ],
      },
      trend: {
        label: isEn ? 'FY Trend & Audit' : 'Tren FY & Audit',
        prompts: [
          {
            id: 'u-t1',
            label: isEn ? 'Show 12-month Fiscal Year pacing (Apr–Mar)' : 'Tampilkan tren 12 bulan Fiscal Year (Apr–Mar)',
            prompt: isEn ? 'Show 12-month fiscal year trend and pacing' : 'Tampilkan tren 12 bulan Fiscal Year departemen saya',
          },
          {
            id: 'u-t2',
            label: isEn ? 'Compare performance across Q1, Q2, Q3, Q4' : 'Bandingkan performa kuartal Q1, Q2, Q3, dan Q4',
            prompt: isEn ? 'Compare Q1 Q2 Q3 Q4 quarterly performance' : 'Bandingkan performa kuartal Q1 Q2 Q3 Q4',
          },
          {
            id: 'u-t3',
            label: isEn ? 'Show Month-over-Month (MoM) headcount shift' : 'Cek perubahan headcount dibanding bulan lalu (MoM)',
            prompt: isEn ? 'Compare current month vs previous month MoM' : 'Bandingkan bulan ini dengan bulan sebelumnya (MoM)',
          },
          {
            id: 'u-t4',
            label: isEn ? 'Show recent audit log & database sync status' : 'Tampilkan log aktivitas terbaru & status sinkron DB',
            prompt: isEn ? 'Show recent audit logs and cloud sync status' : 'Tampilkan audit log terbaru dan status sinkronisasi database',
          },
        ],
      },
      analytics: {
        label: isEn ? 'Action & Guides' : 'Rekomendasi',
        prompts: [
          {
            id: 'u-a1',
            label: isEn ? 'Give actionable HR recommendations for my dept' : 'Berikan rekomendasi tindakan HR untuk departemen saya',
            prompt: isEn ? 'Give strategic recommendations for my department' : 'Berikan rekomendasi tindakan pengendalian manpower departemen saya',
          },
          {
            id: 'u-a2',
            label: isEn ? 'Check readiness before monthly closing' : 'Cek kesiapan data sebelum tutup buku bulanan',
            prompt: isEn ? 'Create monthly closing readiness checklist' : 'Buatkan checklist kesiapan tutup buku bulanan departemen saya',
          },
          {
            id: 'u-a3',
            label: isEn ? 'What data modules are connected right now?' : 'Modul data apa saja yang terhubung di HR Assistant?',
            prompt: isEn ? 'List all connected live data modules and capabilities' : 'Apa saja modul data aktif dan kemampuan HR Assistant ini?',
          },
          {
            id: 'u-a4',
            label: isEn ? 'Check peak & lowest headcount month this FY' : 'Bulan mana headcount tertinggi & terendah tahun ini?',
            prompt: isEn ? 'Show peak and lowest headcount months in FY' : 'Bulan mana headcount tertinggi dan terendah di Fiscal Year ini?',
          },
        ],
      },
    };
  }

  // ADMIN & HR1 full 23-department intelligence prompts
  return {
    budget: {
      label: isEn ? 'Budget & Actual' : 'Budget & Actual',
      prompts: [
        {
          id: 'a-b1',
          label: isEn ? 'Which departments are currently OVER budget?' : 'Departemen apa saja yang berstatus OVER budget?',
          prompt: isEn ? 'Which departments are currently OVER budget?' : 'Departemen apa saja yang saat ini berstatus OVER budget?',
        },
        {
          id: 'a-b2',
          label: isEn ? 'Which departments are UNDER budget / deficit?' : 'Departemen apa saja yang UNDER budget / defisit HC?',
          prompt: isEn ? 'Which departments are UNDER budget or have headcount deficit?' : 'Departemen apa saja yang berstatus UNDER budget atau defisit tenaga kerja?',
        },
        {
          id: 'a-b3',
          label: isEn ? 'Full executive summary (Plan vs Actual & Compliance)' : 'Ringkasan eksekutif menyeluruh (Plan vs Actual & Kepatuhan)',
          prompt: isEn ? 'Give a complete executive manpower summary for this period' : 'Berikan ringkasan eksekutif menyeluruh Plan vs Actual dan kepatuhan budget periode ini',
        },
        {
          id: 'a-b4',
          label: isEn ? 'Analyze RW vs OS composition & capacity breaches' : 'Analisis komposisi RW vs OS & pelanggaran kapasitas standar',
          prompt: isEn ? 'Analyze RW vs OS composition and standard capacity ceiling' : 'Analisis komposisi Regular Worker (RW) vs Outsource (OS) serta audit kapasitas standar',
        },
      ],
    },
    dept: {
      label: isEn ? 'Depts & Entities' : 'Dept & Entitas',
      prompts: [
        {
          id: 'a-d1',
          label: isEn ? 'Compare PT Ajinomoto Indonesia vs PT Ajinex International' : 'Bandingkan PT Ajinomoto Indonesia vs PT Ajinex International',
          prompt: isEn ? 'Compare PT Ajinomoto Indonesia vs PT Ajinex International manpower' : 'Bandingkan data manpower PT Ajinomoto Indonesia (NE) vs PT Ajinex International (NEX)',
        },
        {
          id: 'a-d2',
          label: isEn ? 'Top 5 largest manpower departments & variance' : 'Top 5 departemen dengan tenaga kerja terbesar & variansinya',
          prompt: isEn ? 'Show top 5 largest departments by headcount' : 'Tampilkan top 5 departemen dengan jumlah tenaga kerja terbesar',
        },
        {
          id: 'a-d3',
          label: isEn ? 'Check departments with missing Actual (0 HC) or anomalies' : 'Cek departemen yang belum input Actual (0) atau anomali data',
          prompt: isEn ? 'Detect missing actual inputs and extreme variance anomalies' : 'Deteksi departemen yang belum input Actual atau memiliki anomali variansi ekstrem',
        },
        {
          id: 'a-d4',
          label: isEn ? 'Show active Pending Approval queue & history' : 'Tampilkan antrean Approval Actual yang menunggu persetujuan',
          prompt: isEn ? 'Show all pending actual approval requests and history' : 'Tampilkan daftar antrean Approval Actual yang masih pending dan riwayat terbaru',
        },
      ],
    },
    trend: {
      label: isEn ? 'FY Trend & Audit' : 'Tren FY & Audit',
      prompts: [
        {
          id: 'a-t1',
          label: isEn ? '12-Month Fiscal Year trend & pacing (Apr–Mar)' : 'Tren & pacing 12 bulan Fiscal Year (Apr–Mar)',
          prompt: isEn ? 'Show 12-month Fiscal Year manpower trend and peak months' : 'Tampilkan tren 12 bulan Fiscal Year (Apr-Mar) dan bulan puncak manpower',
        },
        {
          id: 'a-t2',
          label: isEn ? 'Quarterly breakdown comparison (Q1, Q2, Q3, Q4)' : 'Perbandingan performa per kuartal (Q1, Q2, Q3, Q4)',
          prompt: isEn ? 'Show quarterly manpower comparison Q1 Q2 Q3 Q4' : 'Bandingkan performa manpower per kuartal Q1, Q2, Q3, dan Q4',
        },
        {
          id: 'a-t3',
          label: isEn ? 'Month-over-Month (MoM) delta vs previous month' : 'Perbandingan bulan ini vs bulan sebelumnya (MoM)',
          prompt: isEn ? 'Compare current month vs previous fiscal month MoM' : 'Bandingkan realisasi manpower bulan ini terhadap bulan sebelumnya (MoM)',
        },
        {
          id: 'a-t4',
          label: isEn ? 'Recent Audit Log activity & Cloud Database Sync status' : 'Riwayat Audit Log terbaru & status sinkronisasi Cloud DB',
          prompt: isEn ? 'Show recent audit log activity and Supabase cloud sync status' : 'Tampilkan aktivitas Audit Log terbaru dan status sinkronisasi database cloud',
        },
      ],
    },
    analytics: {
      label: isEn ? 'Rebalance & PIC' : 'Realokasi & PIC',
      prompts: [
        {
          id: 'a-a1',
          label: isEn ? 'Simulate cross-dept Outsource (OS) reallocation plan' : 'Simulasi realokasi Outsource (OS) dari dept surplus ke defisit',
          prompt: isEn ? 'Simulate cross-department Outsource OS reallocation and rebalancing' : 'Buatkan simulasi realokasi & rebalancing Outsource (OS) antar departemen',
        },
        {
          id: 'a-a2',
          label: isEn ? 'Show all 23 Department PIC directory & contacts' : 'Tampilkan direktori PIC & kontak seluruh departemen',
          prompt: isEn ? 'Show department PIC directory and contact list' : 'Tampilkan direktori PIC, jabatan, email, dan nomor kontak departemen',
        },
        {
          id: 'a-a3',
          label: isEn ? 'Explain Compliance % parameter (Optimal vs Waspada)' : 'Jelaskan parameter kepatuhan budget (Optimal vs Waspada)',
          prompt: isEn ? 'Explain how budget compliance percentage and caution threshold work' : 'Jelaskan parameter persentase kepatuhan budget dan kenapa di bawah 80% dianggap Waspada',
        },
        {
          id: 'a-a4',
          label: isEn ? 'Inspect Food Production 1 (D001) deep profile' : 'Bedah profil lengkap departemen Food Production 1 (D001)',
          prompt: isEn ? 'Inspect full profile of Food Production 1 (D001)' : 'Cek detail profil lengkap departemen Food Production 1 (D001)',
        },
      ],
    },
  };
}

/**
 * Curated 1-Click Official HR Document Draft Prompts (Right Sidebar Bottom Panel)
 */
export function getDocumentDraftPrompts(
  isUserRole: boolean,
  deptName: string,
  lang: Language
): DraftPromptItem[] {
  const isEn = lang === 'en';

  if (isUserRole) {
    return [
      {
        id: 'ud-1',
        badge: isEn ? 'Memo' : 'Memo',
        label: isEn
          ? `Draft monthly manpower status memo for ${deptName}`
          : `Buatkan draf memo laporan status manpower bulanan ${deptName}`,
        prompt: isEn
          ? `Draft an official monthly manpower status memo for ${deptName}`
          : `Buatkan draf memo resmi laporan status manpower bulanan untuk ${deptName}`,
      },
      {
        id: 'ud-2',
        badge: isEn ? 'Justification' : 'Justifikasi',
        label: isEn
          ? 'Draft variance / Actual headcount change justification note'
          : 'Buatkan catatan justifikasi variansi / usulan perubahan Actual ke HR',
        prompt: isEn
          ? 'Draft an official justification note for headcount variance to HR Development'
          : 'Buatkan draf catatan justifikasi resmi variansi atau permohonan perubahan Actual ke HR Development',
      },
      {
        id: 'ud-3',
        badge: isEn ? 'Checklist' : 'Checklist',
        label: isEn
          ? 'Create monthly MPP closing checklist for my department'
          : 'Buatkan daftar periksa (checklist) persiapan tutup buku MPP departemen',
        prompt: isEn
          ? 'Create a monthly MPP closing readiness checklist'
          : 'Buatkan daftar periksa (checklist) persiapan laporan dan tutup buku MPP bulanan',
      },
    ];
  }

  return [
    {
      id: 'ad-1',
      badge: isEn ? 'Memo' : 'Memo',
      label: isEn
        ? 'Draft internal HR memo on Over-Budget manpower control'
        : 'Buatkan draf memo internal HR pengendalian departemen Over-Budget',
      prompt: isEn
        ? 'Draft an official internal HR memo for Over-Budget manpower control'
        : 'Buatkan draf memo internal HR pengendalian departemen Over-Budget manpower',
    },
    {
      id: 'ad-2',
      badge: isEn ? 'Board Brief' : 'Direksi',
      label: isEn
        ? 'Draft Executive Briefing summary for Factory Management / Directors'
        : 'Buatkan draf Ringkasan Eksekutif (Executive Brief) untuk Direksi / Manajemen',
      prompt: isEn
        ? 'Draft an Executive Briefing summary for Factory Management and Directors'
        : 'Buatkan draf Ringkasan Eksekutif (Executive Brief) manpower untuk Direksi & Factory Manager',
    },
    {
      id: 'ad-3',
      badge: isEn ? 'Reminder' : 'Pengingat',
      label: isEn
        ? 'Draft reminder message for PICs on Actual submission & pending approvals'
        : 'Buatkan draf pesan pengingat input Realisasi & verifikasi Approval bulanan',
      prompt: isEn
        ? 'Draft a reminder message to department PICs for Actual input and pending approvals'
        : 'Buatkan draf pesan pengingat input Realisasi Actual dan verifikasi Approval bulanan ke PIC Departemen',
    },
    {
      id: 'ad-4',
      badge: isEn ? 'Checklist' : 'Checklist',
      label: isEn
        ? 'Generate HR Dept monthly MPP closing & reporting readiness checklist'
        : 'Buatkan daftar periksa (checklist) persiapan laporan bulanan MPP HR Dept',
      prompt: isEn
        ? 'Generate an HR Dept monthly MPP closing and reporting checklist'
        : 'Buatkan daftar periksa (checklist) persiapan tutup buku dan laporan bulanan MPP HR Dept',
    },
    {
      id: 'ad-5',
      badge: isEn ? 'Reallocation' : 'Realokasi',
      label: isEn
        ? 'Draft official cross-department Outsource (OS) reallocation proposal'
        : 'Buatkan draf surat rekomendasi realokasi Outsource (OS) antar departemen',
      prompt: isEn
        ? 'Draft an official cross-department Outsource OS reallocation recommendation letter'
        : 'Buatkan draf surat rekomendasi resmi realokasi Outsource (OS) antar departemen',
    },
  ];
}

/**
 * Build the initial Welcome message shown in the chat console
 */
export function buildWelcomeMessage(ctx: HRAssistantContext): AssistantReply {
  const isEn = ctx.language === 'en';
  const isUserRole = ctx.user.role === 'USER';
  const periodLabel = getPeriodLabel(ctx.selectedFiscalMonth, ctx.selectedYear, ctx.language);
  const m = computeMetrics(ctx.dashboardItems);
  const pendingCount = ctx.approvals.filter(
    (a) => a.status === 'PENDING' && (!isUserRole || a.deptId === ctx.user.deptId)
  ).length;

  const deptLabel = isUserRole
    ? ctx.user.deptName || DEPARTMENTS.find((d) => d.id === ctx.user.deptId)?.name || ctx.user.deptId
    : isEn
    ? 'all 23 factory departments (PT Ajinomoto Indonesia & PT Ajinex International)'
    : 'seluruh 23 departemen pabrik (PT Ajinomoto Indonesia & PT Ajinex International)';

  const summary = isEn
    ? `Hello **${ctx.user.nama}**! I am **HR Assistant MPCS**, connected directly in real time to **all 12 active Manpower Planning modules** (*Manpower Budget RW/OS, Actual Realization, Budget Compliance Index, Standard Capacity Ceilings, NE vs NEX Entity Comparison, 23 Department Profiles, 12-Month Fiscal Year & Quarterly Pacing, Cross-Dept Outsource Reallocation Simulator, Actual Approval Queue, Department PIC Directory, Data Readiness & Anomaly Audit, plus Audit Log & Cloud Database Sync*).\n\nActive scope: **${periodLabel}** — covering **${deptLabel}**.\n\nAsk me for any headcount number, specific department deep-dive (e.g. *"Check Food Production 1"* or *"Compare D001 vs D010"*), month/quarter breakdown, PIC contact lookup, OS reallocation simulation, or 1-click official HR memos & executive drafts.`
    : `Halo **${ctx.user.nama}**! Saya **HR Assistant MPCS** yang terhubung langsung secara real-time ke **seluruh 12 modul data MPP aktif** (*Manpower Budget RW/OS, Realisasi Actual, Indeks Kepatuhan Budget, Standar Kapasitas Maksimum Dept, Perbandingan Entitas NE vs NEX, Profil 23 Departemen, Tren 12 Bulan Fiscal Year & Kuartal Q1–Q4, Simulasi Realokasi Outsource, Antrean Approval Actual, Direktori PIC Departemen, Audit Kesiapan & Anomali Data, serta Audit Log & Sinkronisasi Cloud DB*).\n\nLingkup data aktif: **${periodLabel}** — mencakup **${deptLabel}**.\n\nSilakan tanyakan data angka apa pun, bedah departemen spesifik (mis. *"Cek Food Production 1"* atau *"Bandingkan D001 vs D010"*), evaluasi bulan/kuartal tertentu, pencarian kontak PIC, simulasi realokasi OS, atau pembuatan draf memo & laporan resmi HR.`;

  return {
    id: 'welcome-msg',
    title: isEn ? 'Live MPP Intelligence Ready' : 'Mesin Intelijen Data MPP Siap Membantu',
    badge: isEn ? '12 Active Modules · Live' : '12 Modul Aktif · Real-Time',
    summary,
    kpis: [
      {
        label: isEn ? 'Total Budget (Plan)' : 'Total Budget (Plan)',
        value: `${fmtNum(m.totalPlan, ctx.language)} HC`,
        sub: `RW ${fmtNum(m.totalPlanRW, ctx.language)} · OS ${fmtNum(m.totalPlanOS, ctx.language)}`,
        tone: 'default',
      },
      {
        label: isEn ? 'Actual Realization' : 'Realisasi Actual',
        value: `${fmtNum(m.totalActual, ctx.language)} HC`,
        sub: `${fmtPct(m.achievement)} (${fmtGap(m.gap, ctx.language)} HC)`,
        tone: m.gap > 0 ? 'danger' : m.achievement >= 90 ? 'success' : 'warning',
      },
      {
        label: isEn ? 'Budget Compliance' : 'Kepatuhan Budget',
        value: fmtPct(m.complianceRate),
        sub:
          m.complianceStatus === 'OPTIMAL'
            ? isEn
              ? `OPTIMAL · ${m.overItems.length} Over`
              : `OPTIMAL · ${m.overItems.length} Over`
            : isEn
            ? `CAUTION · ${m.overItems.length} Over`
            : `WASPADA · ${m.overItems.length} Over`,
        tone: m.complianceStatus === 'OPTIMAL' ? 'success' : 'warning',
      },
      {
        label: isEn ? 'Pending Approvals' : 'Antrean Approval',
        value: `${pendingCount}`,
        sub: ctx.syncState.isConfigured
          ? isEn
            ? 'Cloud DB Connected'
            : 'Cloud DB Terhubung'
          : isEn
          ? 'Local Active DB'
          : 'Database Lokal Aktif',
        tone: pendingCount > 0 ? 'accent' : 'default',
      },
    ],
    followUps: isUserRole
      ? isEn
        ? ['Summarize my department status', 'Show 12-month Fiscal Year trend', 'Create monthly closing checklist']
        : ['Ringkas status departemen saya', 'Tampilkan tren 12 bulan Fiscal Year', 'Buatkan checklist tutup buku bulanan']
      : isEn
      ? [
          'Which departments are OVER budget?',
          'Compare PT Ajinomoto Indonesia vs PT Ajinex International',
          'Simulate Outsource (OS) reallocation',
        ]
      : [
          'Departemen apa saja yang OVER budget?',
          'Bandingkan PT Ajinomoto Indonesia vs PT Ajinex International',
          'Simulasi realokasi Outsource (OS)',
        ],
    timestamp: nowTimeStr(),
  };
}

/**
 * Main Deterministic Query Processor for HR Assistant MPCS
 */
export function processHRAssistantQuery(
  rawQuery: string,
  ctx: HRAssistantContext
): AssistantReply {
  const isEn = ctx.language === 'en';
  const isUserRole = ctx.user.role === 'USER';
  const q = normalizeText(rawQuery);
  const id = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Full allowed dept list for cross-company queries (ADMIN/HR1 can ask about Ajinex even if filtered; USER strictly locked to own dept)
  const allAccessibleDeptIds = new Set<string>(
    isUserRole ? [ctx.user.deptId] : DEPARTMENTS.map((d) => d.id)
  );

  // Detect if user asked about a specific month, year, or company inline
  const askedFiscalMonth = detectRequestedFiscalMonth(rawQuery);
  const askedYear = detectRequestedYear(rawQuery);
  const askedCompany = !isUserRole ? detectRequestedCompany(rawQuery) : null;

  const effectiveFiscalMonth = askedFiscalMonth ?? ctx.selectedFiscalMonth;
  const effectiveYear = askedYear ?? ctx.selectedYear;
  const effectiveCompany = askedCompany ?? ctx.selectedCompany;

  const calMonth =
    effectiveFiscalMonth === 'ALL' ? undefined : fiscalToCalendarMonth(effectiveFiscalMonth);
  const effectiveFY = getFiscalYear(calMonth || 4, effectiveYear);
  const periodLabel = getPeriodLabel(effectiveFiscalMonth, effectiveYear, ctx.language);

  // Fetch live scoped items (if query overrides month/year/company, compute fresh from storage; else reuse dashboardItems)
  const scopedItems: DashboardItem[] =
    askedFiscalMonth !== null || askedYear !== null || askedCompany !== null
      ? getDashboardData(
          isUserRole ? ctx.user.deptId : 'ALL',
          calMonth,
          effectiveYear,
          undefined,
          effectiveCompany
        )
      : ctx.dashboardItems;

  const metrics = computeMetrics(scopedItems);

  // RBAC-scoped approvals, users, logs
  const scopedApprovals = isUserRole
    ? ctx.approvals.filter((a) => a.deptId === ctx.user.deptId)
    : ctx.approvals;
  const scopedUsers = isUserRole
    ? ctx.users.filter((u) => u.deptId === ctx.user.deptId || u.role === 'ADMIN' || u.role === 'HR1')
    : ctx.users;
  const scopedLogs = isUserRole
    ? ctx.auditLogs.filter((l) => l.dept === ctx.user.deptId || l.user === ctx.user.email || l.user === ctx.user.userId)
    : ctx.auditLogs;

  // Helper to get OS reallocation pairings (used by both simulator & reallocation draft)
  const buildReallocationPlan = () => {
    const surplusDepts = metrics.items
      .filter((i) => i.actualOS > i.planOS && i.actualOS - i.planOS > 0)
      .map((i) => ({ ...i, excessOS: i.actualOS - i.planOS }))
      .sort((a, b) => b.excessOS - a.excessOS);

    const deficitDepts = metrics.items
      .filter((i) => i.planOS > i.actualOS && i.planOS - i.actualOS > 0 && i.actual > 0)
      .map((i) => ({ ...i, neededOS: i.planOS - i.actualOS }))
      .sort((a, b) => b.neededOS - a.neededOS);

    const transfers: Array<{
      fromDept: string;
      fromId: string;
      toDept: string;
      toId: string;
      hc: number;
      fromExcessAfter: number;
      toNeedAfter: number;
    }> = [];

    const sPool = surplusDepts.map((s) => ({ ...s }));
    const dPool = deficitDepts.map((d) => ({ ...d }));

    for (const src of sPool) {
      for (const dst of dPool) {
        if (src.excessOS <= 0) break;
        if (dst.neededOS <= 0) continue;
        if (src.deptId === dst.deptId) continue;
        const move = Math.min(src.excessOS, dst.neededOS);
        src.excessOS -= move;
        dst.neededOS -= move;
        transfers.push({
          fromDept: src.deptName,
          fromId: src.deptId,
          toDept: dst.deptName,
          toId: dst.deptId,
          hc: move,
          fromExcessAfter: src.excessOS,
          toNeedAfter: dst.neededOS,
        });
      }
    }

    const totalSurplusOS = surplusDepts.reduce((s, d) => s + d.excessOS, 0);
    const totalDeficitOS = deficitDepts.reduce((s, d) => s + d.neededOS, 0);
    const totalTransferred = transfers.reduce((s, t) => s + t.hc, 0);
    return { surplusDepts, deficitDepts, transfers, totalSurplusOS, totalDeficitOS, totalTransferred };
  };

  // =========================================================================
  // 1. OFFICIAL HR DOCUMENT DRAFT GENERATORS (Check first for high precision!)
  // =========================================================================
  const isDraftRequest =
    /\b(draf|draft|memo|surat|pengumuman|pesan pengingat|reminder|checklist|daftar periksa|justifikasi|executive brief|ringkasan untuk direksi|email pengingat)\b/.test(
      q
    );

  if (isDraftRequest) {
    // 1A. Checklist Persiapan Laporan / Tutup Buku MPP
    if (/\b(checklist|daftar periksa|tutup buku|closing|persiapan laporan)\b/.test(q)) {
      const pendingApprovals = scopedApprovals.filter((a) => a.status === 'PENDING');
      const inputRate =
        metrics.totalDepts > 0
          ? Number((((metrics.totalDepts - metrics.zeroActualItems.length) / metrics.totalDepts) * 100).toFixed(1))
          : 100;
      const checks = [
        {
          ok: metrics.totalPlan > 0 && metrics.zeroPlanItems.length === 0,
          label: isEn
            ? `Manpower Budget (Plan) complete for all active departments (${fmtNum(metrics.totalPlan, ctx.language)} HC)`
            : `Data Manpower Budget (Plan) lengkap untuk seluruh departemen aktif (${fmtNum(metrics.totalPlan, ctx.language)} HC)`,
        },
        {
          ok: metrics.zeroActualItems.length === 0,
          label: isEn
            ? `Actual realization input completeness: ${inputRate}% (${metrics.zeroActualItems.length} dept(s) still at 0 HC)`
            : `Kelengkapan input Realisasi Actual: ${inputRate}% (${metrics.zeroActualItems.length} dept masih 0 HC)`,
        },
        {
          ok: pendingApprovals.length === 0,
          label: isEn
            ? `Approval Actual queue cleared (${pendingApprovals.length} request(s) still pending)`
            : `Antrean Approval Actual terselesaikan (${pendingApprovals.length} permohonan masih pending)`,
        },
        {
          ok: metrics.complianceRate >= 80,
          label: isEn
            ? `Budget compliance index ≥ 80% target (Current: ${fmtPct(metrics.complianceRate)}, ${metrics.overItems.length} OVER dept)`
            : `Indeks kepatuhan budget ≥ target 80% (Saat ini: ${fmtPct(metrics.complianceRate)}, ${metrics.overItems.length} dept OVER)`,
        },
        {
          ok: ctx.syncState.pendingSyncCount === 0,
          label: isEn
            ? `Cloud / Local database synchronization clean (${ctx.syncState.pendingSyncCount} pending sync items)`
            : `Sinkronisasi database Cloud / Lokal bersih (${ctx.syncState.pendingSyncCount} antrean sinkron tertunda)`,
        },
      ];
      const passedCount = checks.filter((c) => c.ok).length;
      const readinessPct = Math.round((passedCount / checks.length) * 100);

      const draftLines = isEn
        ? [
            `MONTHLY MPP CLOSING & REPORTING CHECKLIST — HR DEVELOPMENT`,
            `Entity: PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
            `Period: ${periodLabel}`,
            `Prepared Date: ${todayDateStr('en')} | Readiness Score: ${readinessPct}% (${passedCount}/${checks.length} Passed)`,
            `------------------------------------------------------------`,
            ...checks.map((c, idx) => `${idx + 1}. [${c.ok ? 'DONE' : 'ACTION NEEDED'}] ${c.label}`),
            ``,
            `IMMEDIATE FOLLOW-UP ACTIONS:`,
            metrics.zeroActualItems.length > 0
              ? `- Follow up Actual submission from: ${metrics.zeroActualItems.slice(0, 8).map((d) => `${d.deptName} (${d.deptId})`).join(', ')}`
              : `- All active departments have submitted Actual headcount.`,
            metrics.overItems.length > 0
              ? `- Collect variance justification from OVER-budget departments: ${metrics.overItems.slice(0, 6).map((d) => `${d.deptName} (+${d.gap} HC)`).join(', ')}`
              : `- Zero OVER-budget departments; budget control is fully optimal.`,
            pendingApprovals.length > 0
              ? `- Review & process ${pendingApprovals.length} pending Approval Actual request(s) before locking the monthly report.`
              : `- Approval queue is clear.`,
            `- Finalize & export Executive Dossier PDF + Master Excel (.xlsx) for Factory Management sign-off.`,
          ].join('\n')
        : [
            `DAFTAR PERIKSA (CHECKLIST) TUTUP BUKU & LAPORAN BULANAN MPP — HR DEPT`,
            `Entitas: PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
            `Periode Evaluasi: ${periodLabel}`,
            `Tanggal Penyusunan: ${todayDateStr('id')} | Skor Kesiapan: ${readinessPct}% (${passedCount}/${checks.length} Terpenuhi)`,
            `------------------------------------------------------------`,
            ...checks.map((c, idx) => `${idx + 1}. [${c.ok ? 'SELESAI' : 'PERLU TINDAK LANJUT'}] ${c.label}`),
            ``,
            `LANGKAH TINDAK LANJUT PRIORITAS:`,
            metrics.zeroActualItems.length > 0
              ? `- Konfirmasi input Realisasi Actual ke PIC: ${metrics.zeroActualItems.slice(0, 8).map((d) => `${d.deptName} (${d.deptId})`).join(', ')}`
              : `- Seluruh departemen aktif telah melengkapi input Realisasi Actual.`,
            metrics.overItems.length > 0
              ? `- Kumpulkan justifikasi variansi dari departemen OVER budget: ${metrics.overItems.slice(0, 6).map((d) => `${d.deptName} (+${d.gap} HC)`).join(', ')}`
              : `- Tidak ada departemen OVER budget; pengendalian kuota optimal.`,
            pendingApprovals.length > 0
              ? `- Verifikasi & proses ${pendingApprovals.length} antrean Approval Actual sebelum finalisasi laporan.`
              : `- Seluruh antrean Approval Actual sudah tuntas.`,
            `- Finalisasi ekspor Executive Dossier PDF & Master Excel (.xlsx) untuk pelaporan ke Manajemen Pabrik.`,
          ].join('\n');

      return {
        id,
        title: isEn
          ? 'Monthly MPP Closing Readiness Checklist'
          : 'Daftar Periksa (Checklist) Persiapan Laporan Bulanan MPP',
        badge: isEn ? 'HR Document Draft' : 'Draf Dokumen HR',
        summary: isEn
          ? `Live readiness audit completed for **${periodLabel}**. Current closing readiness stands at **${readinessPct}%** (**${passedCount}/${checks.length}** criteria satisfied). You can copy or download this checklist directly below.`
          : `Audit kesiapan tutup buku untuk **${periodLabel}** selesai dihitung secara otomatis. Skor kesiapan saat ini adalah **${readinessPct}%** (**${passedCount}/${checks.length}** kriteria terpenuhi). Anda dapat langsung menyalin atau mengunduh draf di bawah.`,
        kpis: [
          {
            label: isEn ? 'Readiness Score' : 'Skor Kesiapan',
            value: `${readinessPct}%`,
            sub: `${passedCount}/${checks.length} ${isEn ? 'checks passed' : 'kriteria lolos'}`,
            tone: readinessPct >= 80 ? 'success' : readinessPct >= 60 ? 'warning' : 'danger',
          },
          {
            label: isEn ? 'Actual Input Rate' : 'Kelengkapan Actual',
            value: `${inputRate}%`,
            sub: `${metrics.zeroActualItems.length} ${isEn ? 'missing' : 'belum input'}`,
            tone: metrics.zeroActualItems.length === 0 ? 'success' : 'warning',
          },
          {
            label: isEn ? 'Pending Approval' : 'Approval Pending',
            value: `${pendingApprovals.length}`,
            sub: isEn ? 'Requests in queue' : 'Permohonan menunggu',
            tone: pendingApprovals.length === 0 ? 'success' : 'accent',
          },
        ],
        draftText: draftLines,
        draftFilename: `Checklist_Tutup_Buku_MPP_${effectiveYear}.txt`,
        followUps: isEn
          ? ['Draft reminder message to PICs', 'Draft Executive Brief for Directors']
          : ['Buatkan draf pesan pengingat ke PIC Departemen', 'Buatkan draf Ringkasan Eksekutif Direksi'],
        timestamp: nowTimeStr(),
      };
    }

    // 1B. Draf Surat Rekomendasi Realokasi Outsource (OS)
    if (/\b(realokasi|reallocation|rebalancing|perpindahan|transfer os)\b/.test(q) && !isUserRole) {
      const plan = buildReallocationPlan();
      const draftText = isEn
        ? [
            `INTERNAL RECOMMENDATION MEMO — CROSS-DEPARTMENT OUTSOURCE (OS) REALLOCATION`,
            `To: Factory Management & Related Department Heads`,
            `From: HR Development – Manpower Control Section`,
            `Date: ${todayDateStr('en')} | Period: ${periodLabel}`,
            `Location: PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
            ``,
            `Dear Management & Department Heads,`,
            ``,
            `Based on real-time Manpower Control System (MPCS) evaluation for ${periodLabel}, factory-wide Outsource (OS) realization currently stands at ${fmtNum(metrics.totalActualOS, 'en')} HC against a budget of ${fmtNum(metrics.totalPlanOS, 'en')} HC (${fmtGap(metrics.gapOS, 'en')} HC variance).`,
            ``,
            `To optimize labor costs without external recruitment, HR recommends reallocating ${fmtNum(plan.totalTransferred, 'en')} OS headcount from surplus units to deficit units as follows:`,
            ...(plan.transfers.length > 0
              ? plan.transfers.slice(0, 8).map(
                  (t, i) =>
                    `${i + 1}. Transfer ${t.hc} OS HC from ${t.fromDept} (${t.fromId}) -> ${t.toDept} (${t.toId})`
                )
              : [`- Currently no paired surplus-to-deficit OS transfer is required for this period.`]),
            ``,
            `Expected Impact:`,
            `- Immediate reduction of Over-Budget OS exposure by ${fmtNum(plan.totalTransferred, 'en')} HC.`,
            `- Faster fulfillment of understaffed operational shifts without additional vendor billing.`,
            ``,
            `We kindly request your review and confirmation within 2 working days so HR can coordinate with the OS vendor PIC.`,
            ``,
            `Best regards,`,
            `${ctx.user.nama} — HR Development, Mojokerto Factory`,
          ].join('\n')
        : [
            `SURAT REKOMENDASI INTERNAL — REALOKASI OUTSOURCE (OS) ANTAR DEPARTEMEN`,
            `Kepada Yth.: Manajemen Pabrik & Kepala Departemen Terkait`,
            `Dari: HR Development — Seksi Manpower Control`,
            `Tanggal: ${todayDateStr('id')} | Periode: ${periodLabel}`,
            `Lokasi: PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
            ``,
            `Dengan hormat,`,
            ``,
            `Berdasarkan hasil monitoring real-time Manpower Control System (MPCS) untuk periode ${periodLabel}, realisasi tenaga kerja Outsource (OS) tercatat sebesar ${fmtNum(metrics.totalActualOS, 'id')} HC dibandingkan budget ${fmtNum(metrics.totalPlanOS, 'id')} HC (selisih ${fmtGap(metrics.gapOS, 'id')} HC).`,
            ``,
            `Guna menjaga efisiensi biaya tenaga kerja tanpa rekrutmen eksternal baru, HR Development merekomendasikan realokasi sebanyak ${fmtNum(plan.totalTransferred, 'id')} HC Outsource dari unit surplus ke unit defisit sebagai berikut:`,
            ...(plan.transfers.length > 0
              ? plan.transfers.slice(0, 8).map(
                  (t, i) =>
                    `${i + 1}. Realokasi ${t.hc} HC OS dari ${t.fromDept} (${t.fromId}) -> ${t.toDept} (${t.toId})`
                )
              : [`- Saat ini tidak terdapat pasangan surplus & defisit OS yang memerlukan realokasi langsung.`]),
            ``,
            `Dampak yang Diharapkan:`,
            `- Menurunkan eksposur Over-Budget OS secara langsung sebesar ${fmtNum(plan.totalTransferred, 'id')} HC.`,
            `- Mempercepat pemenuhan kapasitas shift di departemen defisit tanpa tambahan biaya vendor.`,
            ``,
            `Mohon konfirmasi persetujuan dari masing-masing Kepala Departemen maksimal 2 hari kerja agar tim HR dapat segera berkoordinasi dengan PIC vendor Outsource terkait.`,
            ``,
            `Hormat kami,`,
            `${ctx.user.nama} — HR Development, Mojokerto Factory`,
          ].join('\n');

      return {
        id,
        title: isEn
          ? 'Draft — Cross-Department OS Reallocation Proposal'
          : 'Draf Surat Rekomendasi Realokasi Outsource (OS)',
        badge: isEn ? 'HR Document Draft' : 'Draf Dokumen HR',
        summary: isEn
          ? `Prepared an official OS reallocation recommendation letter based on **${plan.transfers.length}** auto-matched department pairs totaling **${fmtNum(plan.totalTransferred, 'en')} HC**.`
          : `Draf surat rekomendasi realokasi OS telah disusun berdasarkan **${plan.transfers.length}** pasangan departemen surplus–defisit dengan total potensi perpindahan **${fmtNum(plan.totalTransferred, 'id')} HC**.`,
        draftText,
        draftFilename: `Rekomendasi_Realokasi_OS_${effectiveYear}.txt`,
        table:
          plan.transfers.length > 0
            ? {
                caption: isEn ? 'Recommended OS Transfer Matrix' : 'Matriks Rekomendasi Perpindahan OS',
                headers: isEn
                  ? ['From (Surplus OS)', 'To (Deficit OS)', 'Transfer HC']
                  : ['Dari (Surplus OS)', 'Ke (Defisit OS)', 'Jumlah Pindah'],
                rows: plan.transfers
                  .slice(0, 8)
                  .map((t) => [`${t.fromDept} (${t.fromId})`, `${t.toDept} (${t.toId})`, `${t.hc} HC`]),
              }
            : undefined,
        timestamp: nowTimeStr(),
      };
    }

    // 1C. Draf Pesan Pengingat Input Realisasi & Approval ke PIC
    if (/\b(pengingat|reminder|ingat|pic|belum input|pending approval)\b/.test(q) && !isUserRole) {
      const pendingApprovals = scopedApprovals.filter((a) => a.status === 'PENDING');
      const missingList = metrics.zeroActualItems.slice(0, 10);
      const draftText = isEn
        ? [
            `Subject: [REMINDER] Monthly Manpower Realization (Actual) Input & Approval — ${periodLabel}`,
            ``,
            `Dear Department PICs & Section Coordinators,`,
            `PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
            ``,
            `As we approach monthly MPP closing for ${periodLabel}, kindly ensure your department's Actual headcount (RW & OS) is accurately updated in MPCS.`,
            ``,
            `Current Live Status (${todayDateStr('en')}):`,
            `- Departments completed Actual input: ${metrics.totalDepts - metrics.zeroActualItems.length} of ${metrics.totalDepts} departments`,
            `- Pending Actual Approval requests in queue: ${pendingApprovals.length} request(s)`,
            ...(missingList.length > 0
              ? [
                  ``,
                  `Departments still awaiting Actual submission (0 HC recorded):`,
                  ...missingList.map((d, i) => `${i + 1}. ${d.deptName} (${d.deptId}) — Budget: ${d.plan} HC`),
                ]
              : [``, `All active departments have submitted Actual figures. Kindly double-check RW/OS accuracy.`]),
            ...(pendingApprovals.length > 0
              ? [
                  ``,
                  `Pending Approval Queue awaiting HR verification:`,
                  ...pendingApprovals
                    .slice(0, 5)
                    .map(
                      (p, i) =>
                        `${i + 1}. ${p.deptName} (${p.deptId}) — Proposed RW ${p.actualRW} / OS ${p.actualOS} by ${p.requestedBy}`
                    ),
                ]
              : []),
            ``,
            `Please complete updates before 15:00 WIB today to ensure timely Executive Dossier consolidation.`,
            ``,
            `Thank you for your cooperation,`,
            `${ctx.user.nama} | HR Development — Mojokerto Factory`,
          ].join('\n')
        : [
            `Subjek: [PENGINGAT] Input Realisasi Manpower (Actual) & Verifikasi Approval — ${periodLabel}`,
            ``,
            `Yth. Rekan-Rekan PIC Departemen & Section Coordinator,`,
            `PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
            ``,
            `Sehubungan dengan persiapan tutup buku pelaporan MPP periode ${periodLabel}, mohon bantuannya untuk memastikan data Realisasi Tenaga Kerja (Actual RW & OS) departemen masing-masing telah diperbarui pada sistem MPCS.`,
            ``,
            `Status Real-Time (${todayDateStr('id')}):`,
            `- Departemen sudah input Actual: ${metrics.totalDepts - metrics.zeroActualItems.length} dari ${metrics.totalDepts} departemen`,
            `- Permohonan Approval Actual menunggu verifikasi: ${pendingApprovals.length} pengajuan`,
            ...(missingList.length > 0
              ? [
                  ``,
                  `Daftar Departemen yang Belum Melengkapi Realisasi (Actual = 0):`,
                  ...missingList.map((d, i) => `${i + 1}. ${d.deptName} (${d.deptId}) — Budget: ${d.plan} HC`),
                ]
              : [``, `Seluruh departemen aktif telah menginput data Actual. Mohon pastikan kembali kesesuaian angka RW & OS.`]),
            ...(pendingApprovals.length > 0
              ? [
                  ``,
                  `Antrean Approval Actual Menunggu Verifikasi HR:`,
                  ...pendingApprovals
                    .slice(0, 5)
                    .map(
                      (p, i) =>
                        `${i + 1}. ${p.deptName} (${p.deptId}) — Usulan RW ${p.actualRW} / OS ${p.actualOS} (oleh ${p.requestedBy})`
                    ),
                ]
              : []),
            ``,
            `Mohon pembaruan diselesaikan paling lambat pukul 15.00 WIB hari ini agar konsolidasi Report to Management berjalan tepat waktu.`,
            ``,
            `Terima kasih atas kerja samanya,`,
            `${ctx.user.nama} | HR Development — Mojokerto Factory`,
          ].join('\n');

      return {
        id,
        title: isEn
          ? 'Draft — PIC Reminder Message (Actual & Approval)'
          : 'Draf Pesan Pengingat Input Realisasi & Approval',
        badge: isEn ? 'HR Document Draft' : 'Draf Dokumen HR',
        summary: isEn
          ? `Generated a ready-to-send WhatsApp / Email reminder for **${periodLabel}**, automatically flagging **${metrics.zeroActualItems.length}** unsubmitted department(s) and **${pendingApprovals.length}** pending approval(s).`
          : `Draf pesan pengingat (siap kirim via WhatsApp / Email) telah dibuat untuk **${periodLabel}** dengan menyertakan otomatis **${metrics.zeroActualItems.length}** departemen belum input Actual dan **${pendingApprovals.length}** antrean approval pending.`,
        draftText,
        draftFilename: `Pengingat_PIC_MPP_${effectiveYear}.txt`,
        actionLink:
          pendingApprovals.length > 0
            ? { label: isEn ? 'Open Actual Approvals' : 'Buka Approval Actual', page: 'approvals' }
            : undefined,
        timestamp: nowTimeStr(),
      };
    }

    // 1D. Draf Executive Brief untuk Direksi / Manajemen
    if (/\b(executive brief|direksi|manajemen|board|factory manager|ringkasan eksekutif)\b/.test(q) && !isUserRole) {
      const neItems = metrics.items.filter((i) => i.company === 'PT Ajinomoto Indonesia');
      const nexItems = metrics.items.filter((i) => i.company === 'PT Ajinex International');
      const neM = computeMetrics(neItems);
      const nexM = computeMetrics(nexItems);

      const draftText = isEn
        ? [
            `EXECUTIVE MANPOWER BRIEFING — MOJOKERTO FACTORY`,
            `Prepared for: Factory Management & Board of Directors`,
            `Prepared by: ${ctx.user.nama} (HR Development)`,
            `Period: ${periodLabel} | Date: ${todayDateStr('en')}`,
            `============================================================`,
            ``,
            `1. HEADLINE KPI SNAPSHOT`,
            `- Total Manpower Budget (Plan): ${fmtNum(metrics.totalPlan, 'en')} HC (RW ${fmtNum(metrics.totalPlanRW, 'en')} | OS ${fmtNum(metrics.totalPlanOS, 'en')})`,
            `- Total Realization (Actual):   ${fmtNum(metrics.totalActual, 'en')} HC (RW ${fmtNum(metrics.totalActualRW, 'en')} | OS ${fmtNum(metrics.totalActualOS, 'en')})`,
            `- Net Variance (GAP):           ${fmtGap(metrics.gap, 'en')} HC (${fmtPct(metrics.achievement)} fulfillment)`,
            `- Budget Compliance Index:      ${fmtPct(metrics.complianceRate)} [${metrics.complianceStatus === 'OPTIMAL' ? 'OPTIMAL' : 'CAUTION'}] (${metrics.optimalItems.length} Optimal, ${metrics.underItems.length} Under, ${metrics.overItems.length} Over)`,
            ``,
            `2. ENTITY BREAKDOWN (NE vs NEX)`,
            `- PT Ajinomoto Indonesia (${neM.totalDepts} depts): Plan ${fmtNum(neM.totalPlan, 'en')} vs Actual ${fmtNum(neM.totalActual, 'en')} (${fmtGap(neM.gap, 'en')} HC | Compliance ${fmtPct(neM.complianceRate)})`,
            `- PT Ajinex International (${nexM.totalDepts} depts): Plan ${fmtNum(nexM.totalPlan, 'en')} vs Actual ${fmtNum(nexM.totalActual, 'en')} (${fmtGap(nexM.gap, 'en')} HC | Compliance ${fmtPct(nexM.complianceRate)})`,
            ``,
            `3. KEY RISKS & OVER-BUDGET WATCHLIST`,
            ...(metrics.overItems.length > 0
              ? metrics.overItems
                  .slice(0, 5)
                  .map(
                    (d, i) =>
                      `${i + 1}. ${d.deptName} (${d.deptId}): Actual ${d.actual} vs Plan ${d.plan} (+${d.gap} HC | ${fmtPct(d.achievement)})`
                  )
              : [`- No Over-Budget departments recorded in this period.`]),
            ``,
            `4. STRATEGIC HR RECOMMENDATIONS`,
            `- Maintain strict OS requisition gatekeeping in units above 100% quota.`,
            `- Prioritize internal OS rebalancing before approving new external vendor additions.`,
            `- Accelerate fulfillment in critical UNDER-budget units (${metrics.underItems.length} dept(s)) to safeguard 3-shift production stability.`,
          ].join('\n')
        : [
            `RINGKASAN EKSEKUTIF MANPOWER (EXECUTIVE BRIEF) — PABRIK MOJOKERTO`,
            `Ditujukan Kepada: Direksi & Manajemen Pabrik (PT Ajinomoto Indonesia – PT Ajinex International)`,
            `Disusun Oleh: ${ctx.user.nama} (HR Development)`,
            `Periode Evaluasi: ${periodLabel} | Tanggal: ${todayDateStr('id')}`,
            `============================================================`,
            ``,
            `1. IKHTISAR KPI UTAMA`,
            `- Total Budget Manpower (Plan): ${fmtNum(metrics.totalPlan, 'id')} HC (RW ${fmtNum(metrics.totalPlanRW, 'id')} | OS ${fmtNum(metrics.totalPlanOS, 'id')})`,
            `- Total Realisasi (Actual):     ${fmtNum(metrics.totalActual, 'id')} HC (RW ${fmtNum(metrics.totalActualRW, 'id')} | OS ${fmtNum(metrics.totalActualOS, 'id')})`,
            `- Selisih Bersih (GAP):         ${fmtGap(metrics.gap, 'id')} HC (Pencapaian ${fmtPct(metrics.achievement)})`,
            `- Indeks Kepatuhan Budget:      ${fmtPct(metrics.complianceRate)} [${metrics.complianceStatus}] (${metrics.optimalItems.length} Optimal, ${metrics.underItems.length} Under, ${metrics.overItems.length} Over)`,
            ``,
            `2. PERBANDINGAN PER ENTITAS (NE vs NEX)`,
            `- PT Ajinomoto Indonesia (${neM.totalDepts} dept): Plan ${fmtNum(neM.totalPlan, 'id')} vs Actual ${fmtNum(neM.totalActual, 'id')} (${fmtGap(neM.gap, 'id')} HC | Kepatuhan ${fmtPct(neM.complianceRate)})`,
            `- PT Ajinex International (${nexM.totalDepts} dept): Plan ${fmtNum(nexM.totalPlan, 'id')} vs Actual ${fmtNum(nexM.totalActual, 'id')} (${fmtGap(nexM.gap, 'id')} HC | Kepatuhan ${fmtPct(nexM.complianceRate)})`,
            ``,
            `3. RISIKO UTAMA & WATCHLIST OVER-BUDGET`,
            ...(metrics.overItems.length > 0
              ? metrics.overItems
                  .slice(0, 5)
                  .map(
                    (d, i) =>
                      `${i + 1}. ${d.deptName} (${d.deptId}): Actual ${d.actual} vs Plan ${d.plan} (+${d.gap} HC | ${fmtPct(d.achievement)})`
                  )
              : [`- Tidak ada departemen Over-Budget pada periode ini.`]),
            ``,
            `4. REKOMENDASI STRATEGIS HR`,
            `- Terapkan kontrol ketat penambahan OS pada departemen dengan utilisasi di atas 100%.`,
            `- Prioritaskan realokasi internal OS dari unit surplus ke unit defisit sebelum pengadaan vendor baru.`,
            `- Akselerasi pemenuhan SDM pada ${metrics.underItems.length} departemen berstatus UNDER guna menjaga stabilitas operasi 3 shift.`,
          ].join('\n');

      return {
        id,
        title: isEn
          ? 'Draft — Executive Manpower Briefing for Management'
          : 'Draf Ringkasan Eksekutif Manpower untuk Direksi',
        badge: isEn ? 'Boardroom Draft' : 'Draf Direksi',
        summary: isEn
          ? `Executive briefing drafted for **${periodLabel}** consolidating both Mojokerto entities (**${fmtNum(metrics.totalActual, 'en')} / ${fmtNum(metrics.totalPlan, 'en')} HC**, Compliance **${fmtPct(metrics.complianceRate)}**). Ready to copy into email, slides, or meeting minutes.`
          : `Ringkasan eksekutif untuk **${periodLabel}** telah disusun dengan mengonsolidasikan kedua entitas pabrik (**${fmtNum(metrics.totalActual, 'id')} / ${fmtNum(metrics.totalPlan, 'id')} HC**, Kepatuhan **${fmtPct(metrics.complianceRate)}**). Siap disalin ke email, slide rapat, atau notulen manajemen.`,
        draftText,
        draftFilename: `Executive_Brief_MPP_${effectiveYear}.txt`,
        actionLink: { label: isEn ? 'Open Report to Management' : 'Buka Report to Management', page: 'executive' },
        timestamp: nowTimeStr(),
      };
    }

    // 1E. Default Memo Draft: Over-Budget Control Memo (Admin/HR) or Dept Variance/Status Memo (USER)
    if (isUserRole) {
      const dept = metrics.items[0];
      const deptTitle = dept?.deptName || ctx.user.deptName || ctx.user.deptId;
      const draftText = isEn
        ? [
            `INTERNAL DEPARTMENT MEMORANDUM — MANPOWER STATUS & JUSTIFICATION`,
            `To: HR Development – Manpower Control Section`,
            `From: ${ctx.user.nama} (${deptTitle} – ${ctx.user.deptId})`,
            `Date: ${todayDateStr('en')} | Period: ${periodLabel}`,
            ``,
            `Dear HR Development Team,`,
            ``,
            `Please find below the latest manpower status and variance justification for ${deptTitle} (${ctx.user.deptId}):`,
            `- Budget (Plan): ${dept ? `${dept.plan} HC (RW ${dept.planRW} / OS ${dept.planOS})` : '0 HC'}`,
            `- Realization (Actual): ${dept ? `${dept.actual} HC (RW ${dept.actualRW} / OS ${dept.actualOS})` : '0 HC'}`,
            `- Variance (GAP): ${dept ? `${fmtGap(dept.gap, 'en')} HC (${fmtPct(dept.achievement)} | Status: ${dept.status})` : '0 HC'}`,
            `- Operational Remarks: ${dept?.remarks || 'Aligned with current shift production schedule.'}`,
            ``,
            `We kindly request HR review and confirmation in MPCS. Thank you.`,
            ``,
            `Best regards,`,
            `${ctx.user.nama} | ${ctx.user.title || deptTitle}`,
          ].join('\n')
        : [
            `MEMO INTERNAL DEPARTEMEN — LAPORAN STATUS & JUSTIFIKASI MANPOWER`,
            `Kepada Yth.: HR Development — Seksi Manpower Control`,
            `Dari: ${ctx.user.nama} (${deptTitle} – ${ctx.user.deptId})`,
            `Tanggal: ${todayDateStr('id')} | Periode: ${periodLabel}`,
            ``,
            `Dengan hormat,`,
            ``,
            `Bersama ini kami sampaikan pembaruan status dan justifikasi realisasi tenaga kerja untuk ${deptTitle} (${ctx.user.deptId}):`,
            `- Budget (Plan): ${dept ? `${dept.plan} HC (RW ${dept.planRW} / OS ${dept.planOS})` : '0 HC'}`,
            `- Realisasi (Actual): ${dept ? `${dept.actual} HC (RW ${dept.actualRW} / OS ${dept.actualOS})` : '0 HC'}`,
            `- Selisih (GAP): ${dept ? `${fmtGap(dept.gap, 'id')} HC (${fmtPct(dept.achievement)} | Status: ${dept.status})` : '0 HC'}`,
            `- Catatan Operasional: ${dept?.remarks || 'Disesuaikan dengan jadwal produksi dan kebutuhan shift berjalan.'}`,
            ``,
            `Mohon verifikasi dan konfirmasi dari tim HR Development pada sistem MPCS. Terima kasih.`,
            ``,
            `Hormat kami,`,
            `${ctx.user.nama} | ${ctx.user.title || deptTitle}`,
          ].join('\n');

      return {
        id,
        title: isEn ? `Draft — ${deptTitle} Manpower Memo` : `Draf Memo Manpower — ${deptTitle}`,
        badge: isEn ? 'HR Document Draft' : 'Draf Dokumen HR',
        summary: isEn
          ? `Prepared an official department manpower memo for **${deptTitle}** covering **${periodLabel}**.`
          : `Draf memo resmi departemen **${deptTitle}** untuk periode **${periodLabel}** siap disalin atau diunduh.`,
        draftText,
        draftFilename: `Memo_Manpower_${ctx.user.deptId}_${effectiveYear}.txt`,
        timestamp: nowTimeStr(),
      };
    }

    // Admin/HR Over-Budget Control Memo
    const overList = metrics.overItems;
    const totalOverHC = overList.reduce((s, d) => s + d.gap, 0);
    const draftText = isEn
      ? [
          `INTERNAL HR MEMORANDUM — OVER-BUDGET MANPOWER CONTROL`,
          `To: Heads of Over-Budget Departments & Section Managers`,
          `From: HR Development — Manpower Control System (MPCS)`,
          `Date: ${todayDateStr('en')} | Evaluation Period: ${periodLabel}`,
          `Location: PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
          ``,
          `Dear Department Heads,`,
          ``,
          `Based on real-time MPCS monitoring for ${periodLabel}, Mojokerto Factory currently records a Budget Compliance Index of ${fmtPct(metrics.complianceRate)} (${metrics.complianceStatus}) with ${overList.length} department(s) exceeding their approved manpower quota (total excess: +${fmtNum(totalOverHC, 'en')} HC):`,
          ``,
          ...(overList.length > 0
            ? overList.map(
                (d, i) =>
                  `${i + 1}. ${d.deptName} (${d.deptId}) — Plan ${d.plan} vs Actual ${d.actual} (+${d.gap} HC | ${fmtPct(d.achievement)} | RW ${d.actualRW}/${d.planRW}, OS ${d.actualOS}/${d.planOS})`
              )
            : [`- No departments are currently Over-Budget. All units remain within approved quota.`]),
          ``,
          `Action Items Requested:`,
          `1. Submit operational justification for any headcount above budget via MPCS remarks/approval.`,
          `2. Prioritize Outsource (OS) reallocation to understaffed units before extending temporary contracts.`,
          `3. Target returning Factory Budget Compliance to ≥ 80.0% (OPTIMAL) before monthly closing.`,
          ``,
          `Thank you for your immediate attention and cooperation.`,
          ``,
          `Best regards,`,
          `${ctx.user.nama} — HR Development, Mojokerto Factory`,
        ].join('\n')
      : [
          `MEMO INTERNAL HR — PENGENDALIAN DEPARTEMEN OVER-BUDGET MANPOWER`,
          `Kepada Yth.: Kepala Departemen Terkait & Section Manager`,
          `Dari: HR Development — Manpower Control System (MPCS)`,
          `Tanggal: ${todayDateStr('id')} | Periode Evaluasi: ${periodLabel}`,
          `Lokasi: PT Ajinomoto Indonesia – PT Ajinex International (Mojokerto Factory)`,
          ``,
          `Dengan hormat,`,
          ``,
          `Berdasarkan hasil evaluasi real-time sistem MPCS untuk periode ${periodLabel}, tingkat Kepatuhan Budget Pabrik Mojokerto saat ini tercatat sebesar ${fmtPct(metrics.complianceRate)} (${metrics.complianceStatus}) dengan ${overList.length} departemen melebihi kuota budget yang disetujui (total kelebihan +${fmtNum(totalOverHC, 'id')} HC):`,
          ``,
          ...(overList.length > 0
            ? overList.map(
                (d, i) =>
                  `${i + 1}. ${d.deptName} (${d.deptId}) — Plan ${d.plan} vs Actual ${d.actual} (+${d.gap} HC | ${fmtPct(d.achievement)} | RW ${d.actualRW}/${d.planRW}, OS ${d.actualOS}/${d.planOS})`
              )
            : [`- Saat ini tidak terdapat departemen yang melebihi kuota budget (0 departemen OVER).`]),
          ``,
          `Mohon perhatian dan tindak lanjut sebagai berikut:`,
          `1. Melengkapi justifikasi operasional untuk kelebihan kuota melalui catatan/approval di sistem MPCS.`,
          `2. Memprioritaskan realokasi tenaga kerja Outsource (OS) ke unit defisit sebelum perpanjangan tambahan.`,
          `3. Menargetkan indeks Kepatuhan Budget kembali ke koridor OPTIMAL (≥ 80,0%) sebelum tutup buku bulanan.`,
          ``,
          `Demikian memo ini kami sampaikan. Atas perhatian dan kerja samanya kami ucapkan terima kasih.`,
          ``,
          `Hormat kami,`,
          `${ctx.user.nama} — HR Development, Mojokerto Factory`,
        ].join('\n');

    return {
      id,
      title: isEn
        ? 'Draft — Internal HR Over-Budget Control Memo'
        : 'Draf Memo Internal HR — Pengendalian Over-Budget Manpower',
      badge: isEn ? 'HR Document Draft' : 'Draf Dokumen HR',
      summary: isEn
        ? `Drafted an official internal HR control memo listing **${overList.length}** Over-Budget department(s) (+${fmtNum(totalOverHC, 'en')} HC total excess) for **${periodLabel}**.`
        : `Draf memo internal pengendalian Over-Budget telah disusun secara otomatis dengan mencantumkan **${overList.length}** departemen OVER (total kelebihan +${fmtNum(totalOverHC, 'id')} HC) untuk **${periodLabel}**.`,
      draftText,
      draftFilename: `Memo_Pengendalian_OverBudget_${effectiveYear}.txt`,
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 2. SPECIFIC DEPARTMENT COMPARISON (e.g. "bandingkan D001 vs D010")
  // =========================================================================
  const mentionedDepts = findMentionedDepartments(rawQuery, allAccessibleDeptIds);
  if (mentionedDepts.length >= 2 && !isUserRole) {
    const compareAll = getDashboardData('ALL', calMonth, effectiveYear, undefined, 'ALL');
    const aggAll = aggregateByDepartment(compareAll);
    const chosen = mentionedDepts
      .slice(0, 4)
      .map((deptId) => aggAll.find((i) => i.deptId === deptId))
      .filter((x): x is DashboardItem => Boolean(x));

    if (chosen.length >= 2) {
      return {
        id,
        title: isEn
          ? `Department Comparison (${chosen.map((c) => c.deptId).join(' vs ')})`
          : `Perbandingan Departemen (${chosen.map((c) => c.deptId).join(' vs ')})`,
        badge: isEn ? 'Comparative Analytics' : 'Analitik Perbandingan',
        summary: isEn
          ? `Side-by-side comparison for **${periodLabel}** across **${chosen.map((c) => c.deptName).join(' vs ')}**.`
          : `Perbandingan langsung untuk periode **${periodLabel}** antara **${chosen.map((c) => c.deptName).join(' vs ')}**.`,
        table: {
          headers: isEn
            ? ['Department', 'Entity', 'Plan (RW/OS)', 'Actual (RW/OS)', 'GAP', 'Achv %', 'Status']
            : ['Departemen', 'Entitas', 'Plan (RW/OS)', 'Actual (RW/OS)', 'GAP', 'Pencapaian', 'Status'],
          rows: chosen.map((d) => [
            `${d.deptName} (${d.deptId})`,
            d.company === 'PT Ajinex International' ? 'NEX' : 'NE',
            `${d.plan} (${d.planRW}/${d.planOS})`,
            `${d.actual} (${d.actualRW}/${d.actualOS})`,
            `${fmtGap(d.gap, ctx.language)} HC`,
            fmtPct(d.achievement),
            d.status,
          ]),
        },
        followUps: chosen.slice(0, 2).map((d) =>
          isEn ? `Inspect full profile of ${d.deptName}` : `Bedah profil lengkap ${d.deptName}`
        ),
        timestamp: nowTimeStr(),
      };
    }
  }

  // =========================================================================
  // 3. SINGLE SPECIFIC DEPARTMENT DEEP-DIVE (e.g. "cek Food Production 1", "detail D010")
  // =========================================================================
  if (
    mentionedDepts.length === 1 &&
    !/\b(pic|kontak|telepon|email|nomor|siapa)\b/.test(q)
  ) {
    const targetId = mentionedDepts[0];
    const deptAll = getDashboardData(targetId, calMonth, effectiveYear, undefined, 'ALL');
    const deptAgg = aggregateByDepartment(deptAll)[0];
    const deptMeta = DEPARTMENTS.find((d) => d.id === targetId);
    const cap = getDepartmentCapacity(targetId);
    const pic = scopedUsers.find((u) => u.deptId === targetId && u.role === 'USER');
    const fyTrend = getMonthlyTrendDataByFY(targetId, effectiveFY, 'ALL');
    const activeMonths = fyTrend.filter((t) => t.plan > 0 || t.actual > 0);
    const deptPending = scopedApprovals.filter((a) => a.deptId === targetId && a.status === 'PENDING').length;

    const plan = deptAgg?.plan ?? 0;
    const actual = deptAgg?.actual ?? 0;
    const planRW = deptAgg?.planRW ?? 0;
    const planOS = deptAgg?.planOS ?? 0;
    const actualRW = deptAgg?.actualRW ?? 0;
    const actualOS = deptAgg?.actualOS ?? 0;
    const gap = deptAgg?.gap ?? 0;
    const achv = deptAgg?.achievement ?? 0;
    const status = deptAgg?.status ?? 'OPTIMAL';
    const capPct = cap.maxTotal > 0 ? Number(((actual / cap.maxTotal) * 100).toFixed(1)) : 0;

    return {
      id,
      title: `${deptMeta?.name || targetId} (${targetId})`,
      badge: isEn ? 'Department Deep-Dive' : 'Profil Departemen',
      summary: isEn
        ? `**Entity:** ${deptMeta?.company || 'PT Ajinomoto Indonesia'} · **Scope:** ${periodLabel}\n**Function:** ${cap.description || 'Operational Unit'}\n**PIC Coordinator:** ${pic ? `${pic.nama} (${pic.email || pic.userId}${pic.phone ? ` · ${pic.phone}` : ''})` : 'Managed by HR Admin'}\n**Standard Capacity Ceiling:** Max **${cap.maxTotal} HC** (Std RW ${cap.standardRW} / Std OS ${cap.standardOS}) — Current load: **${capPct}%**${actual > cap.maxTotal ? ' ⚠️ *Exceeds standard ceiling!*' : ''}\n**Pending Approvals:** ${deptPending} request(s)\n**Remarks:** ${deptAgg?.remarks || 'No operational remarks logged for this period.'}`
        : `**Entitas:** ${deptMeta?.company || 'PT Ajinomoto Indonesia'} · **Periode:** ${periodLabel}\n**Fungsi Unit:** ${cap.description || 'Unit Operasional Pabrik'}\n**PIC Departemen:** ${pic ? `${pic.nama} (${pic.email || pic.userId}${pic.phone ? ` · ${pic.phone}` : ''})` : 'Dikelola Admin HR'}\n**Batas Standar Kapasitas:** Maks **${cap.maxTotal} HC** (Std RW ${cap.standardRW} / Std OS ${cap.standardOS}) — Beban saat ini: **${capPct}%**${actual > cap.maxTotal ? ' ⚠️ *Melebihi batas kapasitas standar!*' : ''}\n**Approval Pending:** ${deptPending} pengajuan\n**Catatan:** ${deptAgg?.remarks || 'Tidak ada catatan khusus pada periode ini.'}`,
      kpis: [
        {
          label: isEn ? 'Budget (Plan)' : 'Budget (Plan)',
          value: `${plan} HC`,
          sub: `RW ${planRW} · OS ${planOS}`,
          tone: 'default',
        },
        {
          label: isEn ? 'Actual Headcount' : 'Realisasi Actual',
          value: `${actual} HC`,
          sub: `RW ${actualRW} · OS ${actualOS}`,
          tone: status === 'OVER' ? 'danger' : status === 'UNDER' ? 'warning' : 'success',
        },
        {
          label: isEn ? 'Variance (GAP)' : 'Selisih (GAP)',
          value: `${fmtGap(gap, ctx.language)} HC`,
          sub: `${fmtPct(achv)} · ${status}`,
          tone: gap > 0 ? 'danger' : gap < 0 ? 'warning' : 'success',
        },
        {
          label: isEn ? 'Capacity Load' : 'Beban Kapasitas',
          value: `${capPct}%`,
          sub: `Max ${cap.maxTotal} HC`,
          tone: capPct > 100 ? 'danger' : 'accent',
        },
      ],
      table:
        activeMonths.length > 0
          ? {
              caption: isEn
                ? `${formatFiscalYearLabel(effectiveFY)} Monthly Pacing — ${deptMeta?.name || targetId}`
                : `Tren Bulanan ${formatFiscalYearLabel(effectiveFY)} — ${deptMeta?.name || targetId}`,
              headers: isEn
                ? ['Fiscal Month', 'Plan', 'Actual', 'GAP', 'Achv %']
                : ['Bulan Fiskal', 'Plan', 'Actual', 'GAP', 'Pencapaian'],
              rows: activeMonths.slice(0, 12).map((t) => {
                const mLabel = FISCAL_MONTH_LABELS_I18N[ctx.language][t.fiscalMonth];
                const g = t.actual - t.plan;
                const p = t.plan > 0 ? (t.actual / t.plan) * 100 : 0;
                return [
                  `M${t.fiscalMonth} (${mLabel})`,
                  `${t.plan}`,
                  `${t.actual}`,
                  fmtGap(g, ctx.language),
                  fmtPct(p),
                ];
              }),
            }
          : undefined,
      actionLink: {
        label: isEn ? `Focus ${deptMeta?.name || targetId} on Dashboard` : `Fokuskan ${deptMeta?.name || targetId} di Dashboard`,
        page: 'dashboard',
        deptId: targetId,
      },
      followUps: isEn
        ? [`Show PIC contact for ${targetId}`, 'Compare with another department', 'Back to overall summary']
        : [`Kontak PIC ${targetId}`, 'Ringkasan seluruh pabrik', 'Cek departemen OVER budget'],
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 4. COMPLIANCE FORMULA / "KENAPA WASPADA" / PARAMETER EXPLANATION
  // =========================================================================
  if (
    /\b(rumus|formula|parameter|kenapa waspada|mengapa waspada|threshold|ambang batas|kepatuhan|compliance|stabilitas)\b/.test(
      q
    ) &&
    !/\b(bandingkan|compare|ajinex|over budget saja)\b/.test(q)
  ) {
    const compliantCount = metrics.optimalItems.length + metrics.underItems.length;
    return {
      id,
      title: isEn
        ? 'Budget Compliance Index & Threshold Parameters'
        : 'Parameter Kepatuhan Budget (Optimal vs Waspada)',
      badge: isEn ? 'Policy & Formula' : 'Kebijakan & Rumus',
      summary: isEn
        ? `In MPCS, **Budget Compliance** measures how many departments stay within or below their approved headcount quota without causing budget overrun (**OVER**):\n\n• **Formula:** \`(Optimal Depts + Under Depts) ÷ Total Active Depts × 100%\`\n• **Department Status Rules:**\n  1. **OPTIMAL:** Achievement \`90.0% – 100.0%\` (within controlled budget)\n  2. **UNDER:** Achievement \`< 90.0%\` (below budget — compliant on cost, monitored for fulfillment)\n  3. **OVER:** Achievement \`> 100.0%\` (exceeds approved quota — non-compliant)\n• **Factory Health Threshold:**\n  - **≥ 80.0% → OPTIMAL** (Cost & quota well controlled)\n  - **< 80.0% → CAUTION (WASPADA)** (More than 20% of units are exceeding budget)\n\n**Current Live Calculation (${periodLabel}):**\n(${metrics.optimalItems.length} Optimal + ${metrics.underItems.length} Under) ÷ ${metrics.totalDepts} Depts = **${compliantCount}/${metrics.totalDepts} = ${fmtPct(metrics.complianceRate)} (${metrics.complianceStatus === 'OPTIMAL' ? 'OPTIMAL' : 'CAUTION'})** with **${metrics.overItems.length}** Over-Budget department(s).`
        : `Di dalam sistem MPCS, **Stabilitas & Kepatuhan Budget SDM** mengukur persentase departemen yang berhasil menjaga alokasi tenaga kerja agar **tidak membengkak melebihi kuota budget (OVER)**:\n\n• **Rumus:** \`(Jumlah Dept Optimal + Jumlah Dept Under) ÷ Total Dept Aktif × 100%\`\n• **Klasifikasi Status Per Departemen:**\n  1. **OPTIMAL:** Pencapaian \`90,0% – 100,0%\` (sesuai koridor budget)\n  2. **UNDER:** Pencapaian \`< 90,0%\` (di bawah budget — tetap patuh biaya, dipantau pemenuhannya)\n  3. **OVER:** Pencapaian \`> 100,0%\` (melebihi kuota budget — tidak patuh)\n• **Ambang Batas Kesehatan Pabrik:**\n  - **≥ 80,0% → OPTIMAL** (Pengendalian biaya & kuota sangat terjaga)\n  - **< 80,0% → WASPADA** (Lebih dari 20% departemen mengalami kelebihan kuota / Over-Budget)\n\n**Perhitungan Live Saat Ini (${periodLabel}):**\n(${metrics.optimalItems.length} Optimal + ${metrics.underItems.length} Under) ÷ ${metrics.totalDepts} Dept = **${compliantCount}/${metrics.totalDepts} = ${fmtPct(metrics.complianceRate)} (${metrics.complianceStatus})** dengan **${metrics.overItems.length}** departemen berstatus OVER.`,
      kpis: [
        {
          label: isEn ? 'Compliance Rate' : 'Indeks Kepatuhan',
          value: fmtPct(metrics.complianceRate),
          sub: metrics.complianceStatus === 'OPTIMAL' ? '≥ 80% OPTIMAL' : '< 80% WASPADA',
          tone: metrics.complianceStatus === 'OPTIMAL' ? 'success' : 'warning',
        },
        {
          label: 'OPTIMAL (90–100%)',
          value: `${metrics.optimalItems.length} ${isEn ? 'depts' : 'dept'}`,
          tone: 'success',
        },
        {
          label: 'UNDER (< 90%)',
          value: `${metrics.underItems.length} ${isEn ? 'depts' : 'dept'}`,
          tone: 'warning',
        },
        {
          label: 'OVER (> 100%)',
          value: `${metrics.overItems.length} ${isEn ? 'depts' : 'dept'}`,
          tone: metrics.overItems.length > 0 ? 'danger' : 'success',
        },
      ],
      followUps: isUserRole
        ? undefined
        : isEn
        ? ['Which departments are OVER budget?', 'Draft Over-Budget control memo']
        : ['Departemen apa saja yang OVER budget?', 'Buatkan draf memo pengendalian Over-Budget'],
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 5. OVER-BUDGET ANALYSIS
  // =========================================================================
  if (/\b(over|kelebihan|melebihi|pembengkakan|bengkak|surplus)\b/.test(q) && !/\b(realokasi|reallocation|rebalancing)\b/.test(q)) {
    const list = metrics.overItems;
    const totalExcess = list.reduce((s, d) => s + d.gap, 0);
    const excessRW = list.reduce((s, d) => s + Math.max(0, d.actualRW - d.planRW), 0);
    const excessOS = list.reduce((s, d) => s + Math.max(0, d.actualOS - d.planOS), 0);

    return {
      id,
      title: isEn
        ? `Over-Budget Departments Watchlist (${list.length})`
        : `Daftar Departemen OVER Budget (${list.length} Unit)`,
      badge: isEn ? 'Budget Risk Monitor' : 'Monitor Risiko Budget',
      summary:
        list.length === 0
          ? isEn
            ? `Excellent! There are **0 Over-Budget departments** in **${periodLabel}**. All **${metrics.totalDepts}** active departments are operating within or below their approved manpower quota (**${fmtPct(metrics.complianceRate)} Compliance**).`
            : `Sangat baik! Tidak ada (**0**) departemen berstatus **OVER budget** pada **${periodLabel}**. Seluruh **${metrics.totalDepts}** departemen aktif beroperasi sesuai atau di bawah kuota budget (**Kepatuhan ${fmtPct(metrics.complianceRate)}**).`
          : isEn
          ? `Detected **${list.length} department(s)** exceeding approved budget in **${periodLabel}** with a combined overrun of **+${fmtNum(totalExcess, 'en')} HC** (Excess RW: **+${excessRW}**, Excess OS: **+${excessOS}**). Top driver: **${list[0].deptName}** (+${list[0].gap} HC / ${fmtPct(list[0].achievement)}).`
          : `Terdeteksi **${list.length} departemen** melebihi kuota budget pada **${periodLabel}** dengan total pembengkakan **+${fmtNum(totalExcess, 'id')} HC** (Kelebihan RW: **+${excessRW}**, Kelebihan OS: **+${excessOS}**). Kontributor terbesar: **${list[0].deptName}** (+${list[0].gap} HC / ${fmtPct(list[0].achievement)}).`,
      kpis: [
        {
          label: isEn ? 'OVER Units' : 'Unit OVER',
          value: `${list.length} / ${metrics.totalDepts}`,
          sub: fmtPct(metrics.complianceRate) + (isEn ? ' Compliance' : ' Kepatuhan'),
          tone: list.length > 0 ? 'danger' : 'success',
        },
        {
          label: isEn ? 'Total Excess HC' : 'Total Kelebihan HC',
          value: `+${fmtNum(totalExcess, ctx.language)} HC`,
          sub: `RW +${excessRW} · OS +${excessOS}`,
          tone: totalExcess > 0 ? 'danger' : 'success',
        },
        {
          label: isEn ? 'Primary Driver' : 'Kontributor Utama',
          value: list.length > 0 ? list[0].deptId : '-',
          sub: list.length > 0 ? `${list[0].deptName} (+${list[0].gap})` : isEn ? 'None' : 'Nihil',
          tone: list.length > 0 ? 'warning' : 'default',
        },
      ],
      table:
        list.length > 0
          ? {
              headers: isEn
                ? ['Dept', 'Plan', 'Actual', 'GAP', 'RW (A/P)', 'OS (A/P)', 'Achv %']
                : ['Departemen', 'Plan', 'Actual', 'GAP', 'RW (A/P)', 'OS (A/P)', 'Pencapaian'],
              rows: list.map((d) => [
                `${d.deptName} (${d.deptId})`,
                `${d.plan}`,
                `${d.actual}`,
                `+${d.gap}`,
                `${d.actualRW}/${d.planRW}`,
                `${d.actualOS}/${d.planOS}`,
                fmtPct(d.achievement),
              ]),
            }
          : undefined,
      followUps:
        list.length > 0 && !isUserRole
          ? isEn
            ? ['Draft Over-Budget control memo', 'Simulate Outsource (OS) reallocation', `Inspect ${list[0].deptName}`]
            : ['Buatkan draf memo pengendalian Over-Budget', 'Simulasi realokasi Outsource (OS)', `Cek detail ${list[0].deptName}`]
          : undefined,
      actionLink: { label: isEn ? 'Review on Dashboard' : 'Tinjau di Dashboard', page: 'dashboard' },
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 6. UNDER-BUDGET / DEFICIT / VACANCY ANALYSIS
  // =========================================================================
  if (/\b(under|defisit|kurang|kekurangan|lowong|vacancy|kekosongan|bawah target|bawah budget)\b/.test(q)) {
    const list = metrics.underItems;
    const totalDeficit = list.reduce((s, d) => s + Math.abs(Math.min(0, d.gap)), 0);
    const activeUnder = list.filter((d) => d.actual > 0);
    const zeroUnder = list.filter((d) => d.actual === 0 && d.plan > 0);

    return {
      id,
      title: isEn
        ? `Under-Budget & Headcount Deficit Units (${list.length})`
        : `Daftar Departemen UNDER Budget / Defisit HC (${list.length} Unit)`,
      badge: isEn ? 'Fulfillment Monitor' : 'Monitor Pemenuhan',
      summary:
        list.length === 0
          ? isEn
            ? `There are **0 Under-Budget departments** (<90% fulfillment) in **${periodLabel}**. Staffing fulfillment across active departments is strong.`
            : `Tidak terdapat departemen berstatus **UNDER budget** (<90% pemenuhan) pada **${periodLabel}**. Tingkat pemenuhan tenaga kerja sangat solid.`
          : isEn
          ? `Found **${list.length} department(s)** below 90% fulfillment in **${periodLabel}** with a combined headcount gap of **-${fmtNum(totalDeficit, 'en')} HC**. Note: **${zeroUnder.length}** unit(s) currently show 0 Actual (awaiting input) while **${activeUnder.length}** unit(s) have active operational shortfalls.`
          : `Ditemukan **${list.length} departemen** dengan pemenuhan di bawah 90% pada **${periodLabel}** dengan total defisit **-${fmtNum(totalDeficit, 'id')} HC**. Catatan: **${zeroUnder.length}** departemen masih tercatat 0 Actual (belum input), sedangkan **${activeUnder.length}** departemen mengalami kekurangan aktual operasional.`,
      kpis: [
        {
          label: isEn ? 'UNDER Units' : 'Unit UNDER',
          value: `${list.length} / ${metrics.totalDepts}`,
          sub: `${activeUnder.length} ${isEn ? 'active' : 'aktif'} · ${zeroUnder.length} ${isEn ? 'unsubmitted' : 'belum input'}`,
          tone: 'warning',
        },
        {
          label: isEn ? 'Total Deficit' : 'Total Defisit',
          value: `-${fmtNum(totalDeficit, ctx.language)} HC`,
          sub: isEn ? 'Below planned quota' : 'Di bawah kuota Plan',
          tone: 'warning',
        },
      ],
      table:
        list.length > 0
          ? {
              headers: isEn
                ? ['Dept', 'Plan', 'Actual', 'Deficit', 'Achv %', 'Note']
                : ['Departemen', 'Plan', 'Actual', 'Defisit', 'Pencapaian', 'Keterangan'],
              rows: list.slice(0, 12).map((d) => [
                `${d.deptName} (${d.deptId})`,
                `${d.plan}`,
                `${d.actual}`,
                fmtGap(d.gap, ctx.language),
                fmtPct(d.achievement),
                d.actual === 0
                  ? isEn
                    ? 'Actual not input yet'
                    : 'Actual belum diinput'
                  : isEn
                  ? 'Active shortfall'
                  : 'Kekurangan aktif',
              ]),
            }
          : undefined,
      followUps: !isUserRole
        ? isEn
          ? ['Simulate Outsource (OS) reallocation', 'Draft PIC reminder for missing inputs']
          : ['Simulasi realokasi Outsource (OS)', 'Buatkan draf pesan pengingat PIC']
        : undefined,
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 7. ENTITY COMPARISON: PT AJINOMOTO INDONESIA (NE) vs PT AJINEX INTERNATIONAL (NEX)
  // =========================================================================
  if (
    !isUserRole &&
    (/\b(entitas|entity|perusahaan|company|bandingkan|compare|vs)\b/.test(q) ||
      (/\b(ajinomoto|ne)\b/.test(q) && /\b(ajinex|nex)\b/.test(q)))
  ) {
    const allEntityItems = getDashboardData('ALL', calMonth, effectiveYear, undefined, 'ALL');
    const neM = computeMetrics(allEntityItems.filter((i) => i.company === 'PT Ajinomoto Indonesia'));
    const nexM = computeMetrics(allEntityItems.filter((i) => i.company === 'PT Ajinex International'));
    const allM = computeMetrics(allEntityItems);
    const neShare = allM.totalActual > 0 ? Number(((neM.totalActual / allM.totalActual) * 100).toFixed(1)) : 0;
    const nexShare = allM.totalActual > 0 ? Number(((nexM.totalActual / allM.totalActual) * 100).toFixed(1)) : 0;

    return {
      id,
      title: isEn
        ? 'Entity Comparison: PT Ajinomoto Indonesia vs PT Ajinex International'
        : 'Perbandingan Entitas: PT Ajinomoto Indonesia (NE) vs PT Ajinex International (NEX)',
      badge: isEn ? 'Entity Analytics' : 'Analitik Entitas',
      summary: isEn
        ? `Comparative manpower telemetry across both Mojokerto Factory entities for **${periodLabel}**:\n\n• **PT Ajinomoto Indonesia (NE — ${neM.totalDepts} depts):** Contributes **${neShare}%** of total active workforce (**${fmtNum(neM.totalActual, 'en')} / ${fmtNum(neM.totalPlan, 'en')} HC**, GAP **${fmtGap(neM.gap, 'en')} HC**, Compliance **${fmtPct(neM.complianceRate)}**).\n• **PT Ajinex International (NEX — ${nexM.totalDepts} depts):** Contributes **${nexShare}%** of total active workforce (**${fmtNum(nexM.totalActual, 'en')} / ${fmtNum(nexM.totalPlan, 'en')} HC**, GAP **${fmtGap(nexM.gap, 'en')} HC**, Compliance **${fmtPct(nexM.complianceRate)}**).`
        : `Perbandingan data manpower real-time kedua entitas Pabrik Mojokerto untuk **${periodLabel}**:\n\n• **PT Ajinomoto Indonesia (NE — ${neM.totalDepts} dept):** Menyumbang **${neShare}%** total tenaga kerja aktif (**${fmtNum(neM.totalActual, 'id')} / ${fmtNum(neM.totalPlan, 'id')} HC**, GAP **${fmtGap(neM.gap, 'id')} HC**, Kepatuhan **${fmtPct(neM.complianceRate)}**).\n• **PT Ajinex International (NEX — ${nexM.totalDepts} dept):** Menyumbang **${nexShare}%** total tenaga kerja aktif (**${fmtNum(nexM.totalActual, 'id')} / ${fmtNum(nexM.totalPlan, 'id')} HC**, GAP **${fmtGap(nexM.gap, 'id')} HC**, Kepatuhan **${fmtPct(nexM.complianceRate)}**).`,
      kpis: [
        {
          label: 'PT Ajinomoto Indonesia (NE)',
          value: `${fmtNum(neM.totalActual, ctx.language)} HC`,
          sub: `Plan ${fmtNum(neM.totalPlan, ctx.language)} · ${fmtPct(neM.complianceRate)}`,
          tone: neM.complianceStatus === 'OPTIMAL' ? 'success' : 'warning',
        },
        {
          label: 'PT Ajinex International (NEX)',
          value: `${fmtNum(nexM.totalActual, ctx.language)} HC`,
          sub: `Plan ${fmtNum(nexM.totalPlan, ctx.language)} · ${fmtPct(nexM.complianceRate)}`,
          tone: nexM.complianceStatus === 'OPTIMAL' ? 'success' : 'warning',
        },
      ],
      table: {
        headers: isEn
          ? ['Metric', 'PT Ajinomoto Indonesia (NE)', 'PT Ajinex International (NEX)', 'Consolidated Factory']
          : ['Indikator', 'PT Ajinomoto Indonesia (NE)', 'PT Ajinex International (NEX)', 'Konsolidasi Pabrik'],
        rows: [
          [isEn ? 'Active Departments' : 'Jumlah Departemen', `${neM.totalDepts}`, `${nexM.totalDepts}`, `${allM.totalDepts}`],
          [
            'Budget (Plan)',
            `${fmtNum(neM.totalPlan, ctx.language)} (RW ${neM.totalPlanRW} / OS ${neM.totalPlanOS})`,
            `${fmtNum(nexM.totalPlan, ctx.language)} (RW ${nexM.totalPlanRW} / OS ${nexM.totalPlanOS})`,
            `${fmtNum(allM.totalPlan, ctx.language)}`,
          ],
          [
            'Realisasi (Actual)',
            `${fmtNum(neM.totalActual, ctx.language)} (RW ${neM.totalActualRW} / OS ${neM.totalActualOS})`,
            `${fmtNum(nexM.totalActual, ctx.language)} (RW ${nexM.totalActualRW} / OS ${nexM.totalActualOS})`,
            `${fmtNum(allM.totalActual, ctx.language)}`,
          ],
          [
            'Variance (GAP)',
            `${fmtGap(neM.gap, ctx.language)} HC`,
            `${fmtGap(nexM.gap, ctx.language)} HC`,
            `${fmtGap(allM.gap, ctx.language)} HC`,
          ],
          [
            isEn ? 'Fulfillment %' : 'Pencapaian %',
            fmtPct(neM.achievement),
            fmtPct(nexM.achievement),
            fmtPct(allM.achievement),
          ],
          [
            isEn ? 'Budget Compliance' : 'Kepatuhan Budget',
            `${fmtPct(neM.complianceRate)} (${neM.overItems.length} Over)`,
            `${fmtPct(nexM.complianceRate)} (${nexM.overItems.length} Over)`,
            `${fmtPct(allM.complianceRate)} (${allM.overItems.length} Over)`,
          ],
          [
            isEn ? 'RW : OS Ratio (Actual)' : 'Rasio RW : OS (Actual)',
            `${neM.rwRatioActual}% : ${neM.osRatioActual}%`,
            `${nexM.rwRatioActual}% : ${nexM.osRatioActual}%`,
            `${allM.rwRatioActual}% : ${allM.osRatioActual}%`,
          ],
        ],
      },
      followUps: isEn
        ? ['Draft Executive Brief for Management', 'Show 12-month Fiscal Year trend']
        : ['Buatkan draf Ringkasan Eksekutif Direksi', 'Tampilkan tren 12 bulan Fiscal Year'],
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 8. SIMULASI REALOKASI & REBALANCING OUTSOURCE (OS)
  // =========================================================================
  if (/\b(realokasi|reallocation|rebalancing|rebalance|simulasi|pindah|transfer)\b/.test(q) && !isUserRole) {
    const plan = buildReallocationPlan();
    const projectedOverReduction = Math.min(metrics.overItems.length, plan.transfers.length);
    return {
      id,
      title: isEn
        ? 'Cross-Department Outsource (OS) Reallocation Simulation'
        : 'Simulasi Realokasi & Rebalancing Outsource (OS)',
      badge: isEn ? 'Optimization Engine' : 'Mesin Optimasi',
      summary:
        plan.transfers.length === 0
          ? isEn
            ? `No paired OS surplus-to-deficit transfers are detected for **${periodLabel}** (Total OS surplus: **${plan.totalSurplusOS} HC**, active OS deficit: **${plan.totalDeficitOS} HC**).`
            : `Tidak ditemukan pasangan realokasi OS surplus-ke-defisit yang aktif pada **${periodLabel}** (Surplus OS: **${plan.totalSurplusOS} HC**, Defisit OS aktif: **${plan.totalDeficitOS} HC**).`
          : isEn
          ? `Automated rebalancing identified **${plan.transfers.length} optimal transfer pairing(s)** totaling **${fmtNum(plan.totalTransferred, 'en')} OS HC** for **${periodLabel}** — immediately absorbing surplus OS cost without external vendor hiring and helping resolve up to **${projectedOverReduction}** over-budget pressure point(s).`
          : `Mesin optimasi menemukan **${plan.transfers.length} pasangan realokasi optimal** dengan total perpindahan **${fmtNum(plan.totalTransferred, 'id')} HC Outsource** untuk **${periodLabel}** — langsung menyerap kelebihan biaya OS tanpa rekrutmen vendor baru serta meredam tekanan over-budget di hingga **${projectedOverReduction}** unit.`,
      kpis: [
        {
          label: isEn ? 'Transferable OS' : 'Potensi Realokasi OS',
          value: `${fmtNum(plan.totalTransferred, ctx.language)} HC`,
          sub: `${plan.transfers.length} ${isEn ? 'pairings' : 'pasangan dept'}`,
          tone: 'accent',
        },
        {
          label: isEn ? 'Surplus OS Pool' : 'Total Surplus OS',
          value: `+${fmtNum(plan.totalSurplusOS, ctx.language)} HC`,
          sub: `${plan.surplusDepts.length} ${isEn ? 'source units' : 'unit sumber'}`,
          tone: plan.totalSurplusOS > 0 ? 'danger' : 'success',
        },
        {
          label: isEn ? 'Active OS Deficit' : 'Defisit OS Aktif',
          value: `-${fmtNum(plan.totalDeficitOS, ctx.language)} HC`,
          sub: `${plan.deficitDepts.length} ${isEn ? 'target units' : 'unit tujuan'}`,
          tone: plan.totalDeficitOS > 0 ? 'warning' : 'success',
        },
      ],
      table:
        plan.transfers.length > 0
          ? {
              headers: isEn
                ? ['Source Dept (Surplus OS)', 'Target Dept (Deficit OS)', 'Move OS', 'Rem. Surplus']
                : ['Dept Sumber (Surplus OS)', 'Dept Tujuan (Defisit OS)', 'Pindah OS', 'Sisa Surplus'],
              rows: plan.transfers.slice(0, 10).map((t) => [
                `${t.fromDept} (${t.fromId})`,
                `${t.toDept} (${t.toId})`,
                `${t.hc} HC`,
                `${t.fromExcessAfter} HC`,
              ]),
            }
          : undefined,
      followUps: isEn
        ? ['Draft official OS reallocation recommendation letter', 'Check OVER budget departments']
        : ['Buatkan draf surat rekomendasi realokasi OS', 'Cek departemen OVER budget'],
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 9. RW vs OS COMPOSITION & STANDARD CAPACITY CEILING AUDIT
  // =========================================================================
  if (/\b(rw|os|regular|outsource|komposisi|rasio|ratio|kapasitas|capacity|standar|maksimum|ceiling)\b/.test(q)) {
    const capBreaches = metrics.items
      .map((item) => {
        const cap = getDepartmentCapacity(item.deptId);
        return {
          ...item,
          maxTotal: cap.maxTotal,
          standardRW: cap.standardRW,
          standardOS: cap.standardOS,
          excessMax: item.actual - cap.maxTotal,
          loadPct: cap.maxTotal > 0 ? Number(((item.actual / cap.maxTotal) * 100).toFixed(1)) : 0,
        };
      })
      .filter((x) => x.actual > x.maxTotal || x.actualRW > x.standardRW || x.actualOS > x.standardOS)
      .sort((a, b) => b.loadPct - a.loadPct);

    const topOsDepts = [...metrics.items]
      .filter((i) => i.actual > 0)
      .sort((a, b) => b.actualOS / b.actual - a.actualOS / a.actual)
      .slice(0, 6);

    return {
      id,
      title: isEn
        ? 'RW vs OS Composition & Standard Capacity Audit'
        : 'Analisis Komposisi RW vs OS & Audit Kapasitas Standar',
      badge: isEn ? 'Workforce Structure' : 'Struktur Tenaga Kerja',
      summary: isEn
        ? `Workforce composition breakdown for **${periodLabel}**:\n\n• **Regular Worker (RW):** Actual **${fmtNum(metrics.totalActualRW, 'en')} HC** vs Plan **${fmtNum(metrics.totalPlanRW, 'en')} HC** (GAP **${fmtGap(metrics.gapRW, 'en')} HC**) — **${metrics.rwRatioActual}%** of active workforce (Plan ratio: ${metrics.rwRatioPlan}%).\n• **Outsource (OS):** Actual **${fmtNum(metrics.totalActualOS, 'en')} HC** vs Plan **${fmtNum(metrics.totalPlanOS, 'en')} HC** (GAP **${fmtGap(metrics.gapOS, 'en')} HC**) — **${metrics.osRatioActual}%** of active workforce (Plan ratio: ${metrics.osRatioPlan}%).\n• **Capacity Standard Check:** **${capBreaches.length}** department(s) currently exceed standard RW/OS/Max capacity reference thresholds.`
        : `Analisis struktur komposisi tenaga kerja untuk **${periodLabel}**:\n\n• **Regular Worker (RW):** Actual **${fmtNum(metrics.totalActualRW, 'id')} HC** vs Plan **${fmtNum(metrics.totalPlanRW, 'id')} HC** (GAP **${fmtGap(metrics.gapRW, 'id')} HC**) — porsi **${metrics.rwRatioActual}%** dari total aktif (rasio Plan: ${metrics.rwRatioPlan}%).\n• **Outsource (OS):** Actual **${fmtNum(metrics.totalActualOS, 'id')} HC** vs Plan **${fmtNum(metrics.totalPlanOS, 'id')} HC** (GAP **${fmtGap(metrics.gapOS, 'id')} HC**) — porsi **${metrics.osRatioActual}%** dari total aktif (rasio Plan: ${metrics.osRatioPlan}%).\n• **Audit Batas Kapasitas Standar:** **${capBreaches.length}** departemen tercatat melampaui ambang batas kapasitas standar RW/OS/Maksimum.`,
      kpis: [
        {
          label: 'Regular Worker (RW)',
          value: `${fmtNum(metrics.totalActualRW, ctx.language)} HC`,
          sub: `Plan ${fmtNum(metrics.totalPlanRW, ctx.language)} (${fmtGap(metrics.gapRW, ctx.language)}) · ${metrics.rwRatioActual}%`,
          tone: metrics.gapRW > 0 ? 'warning' : 'default',
        },
        {
          label: 'Outsource (OS)',
          value: `${fmtNum(metrics.totalActualOS, ctx.language)} HC`,
          sub: `Plan ${fmtNum(metrics.totalPlanOS, ctx.language)} (${fmtGap(metrics.gapOS, ctx.language)}) · ${metrics.osRatioActual}%`,
          tone: metrics.gapOS > 0 ? 'danger' : 'success',
        },
        {
          label: isEn ? 'Capacity Alerts' : 'Alert Kapasitas',
          value: `${capBreaches.length} ${isEn ? 'depts' : 'dept'}`,
          sub: isEn ? 'Above std RW/OS/Max' : 'Di atas std RW/OS/Max',
          tone: capBreaches.length > 0 ? 'warning' : 'success',
        },
      ],
      table:
        capBreaches.length > 0
          ? {
              caption: isEn ? 'Departments Above Standard Capacity Reference' : 'Departemen Melampaui Standar Kapasitas',
              headers: isEn
                ? ['Department', 'Act RW / Std', 'Act OS / Std', 'Total / Max', 'Load %']
                : ['Departemen', 'Act RW / Std', 'Act OS / Std', 'Total / Max', 'Beban %'],
              rows: capBreaches.slice(0, 8).map((c) => [
                `${c.deptName} (${c.deptId})`,
                `${c.actualRW} / ${c.standardRW}`,
                `${c.actualOS} / ${c.standardOS}`,
                `${c.actual} / ${c.maxTotal}`,
                `${c.loadPct}%`,
              ]),
            }
          : topOsDepts.length > 0
          ? {
              caption: isEn ? 'Highest Outsource (OS) Ratio Departments' : 'Departemen dengan Rasio Outsource (OS) Tertinggi',
              headers: isEn
                ? ['Department', 'RW', 'OS', 'Total', 'OS Share']
                : ['Departemen', 'RW', 'OS', 'Total', 'Porsi OS'],
              rows: topOsDepts.map((d) => [
                `${d.deptName} (${d.deptId})`,
                `${d.actualRW}`,
                `${d.actualOS}`,
                `${d.actual}`,
                fmtPct((d.actualOS / d.actual) * 100),
              ]),
            }
          : undefined,
      followUps: !isUserRole
        ? isEn
          ? ['Simulate Outsource (OS) reallocation', 'Check OVER budget departments']
          : ['Simulasi realokasi Outsource (OS)', 'Cek departemen OVER budget']
        : undefined,
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 10. QUARTERLY (Q1–Q4) OR 12-MONTH FISCAL YEAR TREND / MoM COMPARISON
  // =========================================================================
  if (/\b(mom|bulan lalu|bulan sebelumnya|previous month|perubahan bulanan)\b/.test(q)) {
    const targetFM = effectiveFiscalMonth === 'ALL' ? getFiscalMonth(new Date().getMonth() + 1) : effectiveFiscalMonth;
    const prevFM = targetFM === 1 ? 12 : targetFM - 1;
    const trend = getMonthlyTrendDataByFY(isUserRole ? ctx.user.deptId : 'ALL', effectiveFY, effectiveCompany);
    const curRow = trend.find((t) => t.fiscalMonth === targetFM) || { fiscalMonth: targetFM, plan: 0, actual: 0 };
    const prevRow = trend.find((t) => t.fiscalMonth === prevFM) || { fiscalMonth: prevFM, plan: 0, actual: 0 };
    const deltaActual = curRow.actual - prevRow.actual;
    const deltaPlan = curRow.plan - prevRow.plan;
    const pctShift = prevRow.actual > 0 ? Number(((deltaActual / prevRow.actual) * 100).toFixed(1)) : 0;
    const curName = FISCAL_MONTH_LABELS_I18N[ctx.language][targetFM];
    const prevName = FISCAL_MONTH_LABELS_I18N[ctx.language][prevFM];

    return {
      id,
      title: isEn
        ? `Month-over-Month (MoM) Shift: ${prevName} → ${curName}`
        : `Perbandingan Bulanan (MoM): ${prevName} → ${curName}`,
      badge: isEn ? 'MoM Pacing' : 'Tren Bulanan (MoM)',
      summary: isEn
        ? `Comparing **Month ${targetFM} (${curName})** against **Month ${prevFM} (${prevName})** in **${formatFiscalYearLabel(effectiveFY)}**:\n\n• **Actual Headcount Shift:** **${fmtNum(prevRow.actual, 'en')} HC → ${fmtNum(curRow.actual, 'en')} HC** (**${fmtGap(deltaActual, 'en')} HC** / **${deltaActual >= 0 ? '+' : ''}${pctShift}%**)\n• **Budget (Plan) Shift:** **${fmtNum(prevRow.plan, 'en')} HC → ${fmtNum(curRow.plan, 'en')} HC** (**${fmtGap(deltaPlan, 'en')} HC**)`
        : `Perbandingan **Bulan ${targetFM} (${curName})** terhadap **Bulan ${prevFM} (${prevName})** pada **${formatFiscalYearLabel(effectiveFY)}**:\n\n• **Perubahan Realisasi Actual:** **${fmtNum(prevRow.actual, 'id')} HC → ${fmtNum(curRow.actual, 'id')} HC** (**${fmtGap(deltaActual, 'id')} HC** / **${deltaActual >= 0 ? '+' : ''}${pctShift}%**)\n• **Perubahan Budget (Plan):** **${fmtNum(prevRow.plan, 'id')} HC → ${fmtNum(curRow.plan, 'id')} HC** (**${fmtGap(deltaPlan, 'id')} HC**)`,
      kpis: [
        {
          label: `${prevName} (M${prevFM})`,
          value: `${fmtNum(prevRow.actual, ctx.language)} HC`,
          sub: `Plan ${fmtNum(prevRow.plan, ctx.language)}`,
        },
        {
          label: `${curName} (M${targetFM})`,
          value: `${fmtNum(curRow.actual, ctx.language)} HC`,
          sub: `Plan ${fmtNum(curRow.plan, ctx.language)}`,
          tone: 'accent',
        },
        {
          label: 'MoM Delta',
          value: `${fmtGap(deltaActual, ctx.language)} HC`,
          sub: `${deltaActual >= 0 ? '+' : ''}${pctShift}%`,
          tone: deltaActual > 0 ? 'warning' : deltaActual < 0 ? 'default' : 'success',
        },
      ],
      followUps: isEn
        ? ['Show 12-month Fiscal Year trend', 'Compare Q1 Q2 Q3 Q4 performance']
        : ['Tampilkan tren 12 bulan Fiscal Year', 'Bandingkan performa Q1 Q2 Q3 Q4'],
      timestamp: nowTimeStr(),
    };
  }

  if (/\b(kuartal|quarter|q1|q2|q3|q4|tren|trend|pacing|fiscal|12 bulan|puncak|tertinggi|terendah|peak|lowest)\b/.test(q)) {
    const trend = getMonthlyTrendDataByFY(isUserRole ? ctx.user.deptId : 'ALL', effectiveFY, effectiveCompany);
    const isQuarterly = /\b(kuartal|quarter|q1|q2|q3|q4)\b/.test(q);

    if (isQuarterly) {
      const quarters = [
        { name: 'Q1 (Apr–Jun)', months: [1, 2, 3] },
        { name: 'Q2 (Jul–Sep)', months: [4, 5, 6] },
        { name: 'Q3 (Okt–Des)', months: [7, 8, 9] },
        { name: 'Q4 (Jan–Mar)', months: [10, 11, 12] },
      ].map((qt) => {
        const rows = trend.filter((t) => qt.months.includes(t.fiscalMonth));
        const sumPlan = rows.reduce((s, r) => s + r.plan, 0);
        const sumActual = rows.reduce((s, r) => s + r.actual, 0);
        const avgPlan = Math.round(sumPlan / 3);
        const avgActual = Math.round(sumActual / 3);
        const achv = sumPlan > 0 ? (sumActual / sumPlan) * 100 : 0;
        return { ...qt, avgPlan, avgActual, gap: avgActual - avgPlan, achv };
      });

      return {
        id,
        title: isEn
          ? `Quarterly Manpower Breakdown — ${formatFiscalYearLabel(effectiveFY)}`
          : `Perbandingan Performa Kuartal (Q1–Q4) — ${formatFiscalYearLabel(effectiveFY)}`,
        badge: isEn ? 'Quarterly Analytics' : 'Analitik Kuartalan',
        summary: isEn
          ? `Average monthly Plan vs Actual headcount across all 4 quarters of **${formatFiscalYearLabel(effectiveFY)}** (Ajinomoto Fiscal Calendar: April–March).`
          : `Rata-rata bulanan Budget (Plan) vs Realisasi (Actual) di seluruh 4 kuartal **${formatFiscalYearLabel(effectiveFY)}** (Kalender Fiskal Ajinomoto: April–Maret).`,
        kpis: quarters.map((qt) => ({
          label: qt.name,
          value: `${fmtNum(qt.avgActual, ctx.language)} HC`,
          sub: `Plan ${fmtNum(qt.avgPlan, ctx.language)} · ${fmtPct(qt.achv)}`,
          tone: qt.achv > 100 ? 'danger' : qt.achv >= 90 ? 'success' : 'warning',
        })),
        table: {
          headers: isEn
            ? ['Quarter', 'Avg Plan / Mo', 'Avg Actual / Mo', 'Avg GAP', 'Fulfillment %']
            : ['Kuartal', 'Rata2 Plan / Bln', 'Rata2 Actual / Bln', 'Rata2 GAP', 'Pencapaian'],
          rows: quarters.map((qt) => [
            qt.name,
            `${fmtNum(qt.avgPlan, ctx.language)} HC`,
            `${fmtNum(qt.avgActual, ctx.language)} HC`,
            `${fmtGap(qt.gap, ctx.language)} HC`,
            fmtPct(qt.achv),
          ]),
        },
        followUps: isEn
          ? ['Show 12-month Fiscal Year pacing', 'Compare current month vs previous month']
          : ['Tampilkan tren 12 bulan Fiscal Year', 'Bandingkan bulan ini vs bulan lalu (MoM)'],
        timestamp: nowTimeStr(),
      };
    }

    const withActual = trend.filter((t) => t.actual > 0);
    const peak = withActual.length > 0 ? [...withActual].sort((a, b) => b.actual - a.actual)[0] : null;
    const lowest = withActual.length > 0 ? [...withActual].sort((a, b) => a.actual - b.actual)[0] : null;
    const avgPlan = Math.round(trend.reduce((s, t) => s + t.plan, 0) / 12);
    const avgActual = withActual.length > 0 ? Math.round(withActual.reduce((s, t) => s + t.actual, 0) / withActual.length) : 0;

    return {
      id,
      title: isEn
        ? `12-Month Fiscal Year Trend — ${formatFiscalYearLabel(effectiveFY)}`
        : `Tren & Pacing 12 Bulan Fiscal Year — ${formatFiscalYearLabel(effectiveFY)}`,
      badge: isEn ? 'FY Pacing' : 'Pacing 12 Bulan',
      summary: isEn
        ? `Full **${formatFiscalYearLabel(effectiveFY)}** trajectory (April – March) covering **${withActual.length} active actual-recorded month(s)**:\n\n• **Peak Headcount Month:** ${peak ? `**M${peak.fiscalMonth} (${FISCAL_MONTH_LABELS_I18N.en[peak.fiscalMonth]})** with **${fmtNum(peak.actual, 'en')} HC** (Plan ${fmtNum(peak.plan, 'en')})` : 'No actual data yet'}\n• **Lowest Active Month:** ${lowest ? `**M${lowest.fiscalMonth} (${FISCAL_MONTH_LABELS_I18N.en[lowest.fiscalMonth]})** with **${fmtNum(lowest.actual, 'en')} HC** (Plan ${fmtNum(lowest.plan, 'en')})` : 'No actual data yet'}\n• **Monthly Average:** Plan **${fmtNum(avgPlan, 'en')} HC** vs Active Actual **${fmtNum(avgActual, 'en')} HC**.`
        : `Lintasan lengkap **${formatFiscalYearLabel(effectiveFY)}** (April – Maret) dengan **${withActual.length} bulan tercatat realisasi Actual**:\n\n• **Bulan Headcount Tertinggi (Peak):** ${peak ? `**Bulan ${peak.fiscalMonth} (${FISCAL_MONTH_LABELS_I18N.id[peak.fiscalMonth]})** sebesar **${fmtNum(peak.actual, 'id')} HC** (Plan ${fmtNum(peak.plan, 'id')})` : 'Belum ada data actual'}\n• **Bulan Aktif Terendah:** ${lowest ? `**Bulan ${lowest.fiscalMonth} (${FISCAL_MONTH_LABELS_I18N.id[lowest.fiscalMonth]})** sebesar **${fmtNum(lowest.actual, 'id')} HC** (Plan ${fmtNum(lowest.plan, 'id')})` : 'Belum ada data actual'}\n• **Rata-rata Bulanan:** Plan **${fmtNum(avgPlan, 'id')} HC** vs Actual aktif **${fmtNum(avgActual, 'id')} HC**.`,
      table: {
        headers: isEn
          ? ['Fiscal Month', 'Budget (Plan)', 'Actual', 'GAP', 'Achv %']
          : ['Bulan Fiskal', 'Budget (Plan)', 'Actual', 'GAP', 'Pencapaian'],
        rows: trend.map((t) => {
          const g = t.actual - t.plan;
          const p = t.plan > 0 ? (t.actual / t.plan) * 100 : 0;
          return [
            `M${t.fiscalMonth} (${FISCAL_MONTH_LABELS_I18N[ctx.language][t.fiscalMonth]})`,
            fmtNum(t.plan, ctx.language),
            fmtNum(t.actual, ctx.language),
            fmtGap(g, ctx.language),
            fmtPct(p),
          ];
        }),
      },
      actionLink: { label: isEn ? 'Open Executive Dossier' : 'Buka Report to Management', page: 'executive' },
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 11. APPROVAL QUEUE & HISTORY
  // =========================================================================
  if (/\b(approval|persetujuan|pending|pengajuan|antrean|verifikasi|ditolak|disetujui|rejected|approved)\b/.test(q)) {
    const pending = scopedApprovals.filter((a) => a.status === 'PENDING');
    const approved = scopedApprovals.filter((a) => a.status === 'APPROVED');
    const rejected = scopedApprovals.filter((a) => a.status === 'REJECTED');

    return {
      id,
      title: isEn
        ? `Actual Headcount Approval Status (${pending.length} Pending)`
        : `Status Antrean Approval Actual (${pending.length} Pending)`,
      badge: isEn ? 'Approval Workflow' : 'Alur Approval',
      summary:
        pending.length === 0
          ? isEn
            ? `All Actual headcount change requests are completely processed! There are **0 pending approvals** right now (**${approved.length}** approved, **${rejected.length}** rejected in history).`
            : `Seluruh permohonan perubahan realisasi Actual telah tuntas diproses! Saat ini terdapat **0 antrean pending** (riwayat: **${approved.length}** disetujui, **${rejected.length}** ditolak).`
          : isEn
          ? `There are currently **${pending.length} pending Actual approval request(s)** awaiting HR/Admin verification (historical: **${approved.length}** approved, **${rejected.length}** rejected).`
          : `Saat ini terdapat **${pending.length} permohonan Approval Actual** yang masih menunggu verifikasi Admin/HR Development (riwayat: **${approved.length}** disetujui, **${rejected.length}** ditolak).`,
      kpis: [
        { label: 'Pending', value: `${pending.length}`, tone: pending.length > 0 ? 'accent' : 'success' },
        { label: isEn ? 'Approved' : 'Disetujui', value: `${approved.length}`, tone: 'success' },
        { label: isEn ? 'Rejected' : 'Ditolak', value: `${rejected.length}`, tone: rejected.length > 0 ? 'danger' : 'default' },
      ],
      table:
        pending.length > 0
          ? {
              caption: isEn ? 'Active Pending Queue' : 'Antrean Menunggu Verifikasi',
              headers: isEn
                ? ['Department', 'Period', 'Proposed RW/OS', 'Requested By', 'Remarks']
                : ['Departemen', 'Periode', 'Usulan RW/OS', 'Pengaju', 'Catatan'],
              rows: pending.slice(0, 10).map((a) => [
                `${a.deptName} (${a.deptId})`,
                `${a.bulan}/${a.tahun}`,
                `RW ${a.actualRW} / OS ${a.actualOS} (${a.actualRW + a.actualOS})`,
                a.requestedBy,
                a.remarks || '-',
              ]),
            }
          : scopedApprovals.length > 0
          ? {
              caption: isEn ? 'Recent Processed History' : 'Riwayat Approval Terbaru',
              headers: isEn
                ? ['Department', 'Period', 'RW/OS', 'Status', 'Reviewed By']
                : ['Departemen', 'Periode', 'RW/OS', 'Status', 'Peninjau'],
              rows: scopedApprovals.slice(0, 6).map((a) => [
                `${a.deptName} (${a.deptId})`,
                `${a.bulan}/${a.tahun}`,
                `${a.actualRW}/${a.actualOS}`,
                a.status,
                a.reviewedBy || '-',
              ]),
            }
          : undefined,
      actionLink: !isUserRole
        ? { label: isEn ? 'Open Approval Actual Page' : 'Buka Halaman Approval Actual', page: 'approvals' }
        : undefined,
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 12. ANOMALY DETECTION & DATA READINESS AUDIT
  // =========================================================================
  if (/\b(anomali|anomaly|belum input|kosong|missing|kesiapan|audit data|ekstrem|extreme|0 hc)\b/.test(q)) {
    const extremeOver = metrics.items.filter((i) => i.achievement > 110);
    const extremeUnder = metrics.items.filter((i) => i.actual > 0 && i.achievement < 85);
    const totalIssues =
      metrics.zeroActualItems.length +
      metrics.zeroPlanItems.length +
      extremeOver.length +
      extremeUnder.length;

    const issueRows: string[][] = [];
    metrics.zeroActualItems.forEach((d) =>
      issueRows.push([
        `${d.deptName} (${d.deptId})`,
        isEn ? 'Missing Actual (0 HC)' : 'Belum Input Actual (0)',
        `Plan ${d.plan} / Act 0`,
        isEn ? 'High — Contact PIC' : 'Tinggi — Hubungi PIC',
      ])
    );
    metrics.zeroPlanItems.forEach((d) =>
      issueRows.push([
        `${d.deptName} (${d.deptId})`,
        isEn ? 'Missing Budget (Plan 0)' : 'Belum Ada Budget (Plan 0)',
        `Plan 0 / Act ${d.actual}`,
        isEn ? 'High — Verify Budget' : 'Tinggi — Cek Budget',
      ])
    );
    extremeOver.forEach((d) =>
      issueRows.push([
        `${d.deptName} (${d.deptId})`,
        isEn ? 'Extreme Over-Budget (>110%)' : 'Over-Budget Ekstrem (>110%)',
        `+${d.gap} HC (${fmtPct(d.achievement)})`,
        isEn ? 'Critical — Review OS/RW' : 'Kritis — Tinjau OS/RW',
      ])
    );
    extremeUnder.forEach((d) =>
      issueRows.push([
        `${d.deptName} (${d.deptId})`,
        isEn ? 'Severe Understaffing (<85%)' : 'Defisit Signifikan (<85%)',
        `${fmtGap(d.gap, ctx.language)} HC (${fmtPct(d.achievement)})`,
        isEn ? 'Medium — Expedite Hiring' : 'Sedang — Percepat Pemenuhan',
      ])
    );

    return {
      id,
      title: isEn
        ? `Data Readiness & Anomaly Audit (${totalIssues} Findings)`
        : `Audit Kesiapan & Deteksi Anomali Data (${totalIssues} Temuan)`,
      badge: isEn ? 'Data Quality Audit' : 'Audit Kualitas Data',
      summary:
        totalIssues === 0
          ? isEn
            ? `Data hygiene for **${periodLabel}** is **100% clean** — zero missing Actual submissions, zero unbudgeted Actuals, and zero extreme variance spikes.`
            : `Kualitas data untuk **${periodLabel}** **100% bersih** — tidak ada departemen yang belum input Actual, tidak ada realisasi tanpa budget, dan tidak ada lonjakan variansi ekstrem.`
          : isEn
          ? `Automated data quality scan for **${periodLabel}** flagged **${totalIssues} finding(s)**: **${metrics.zeroActualItems.length}** missing Actual input(s), **${metrics.zeroPlanItems.length}** missing Plan record(s), **${extremeOver.length}** extreme overrun (>110%), and **${extremeUnder.length}** severe understaffing (<85%).`
          : `Pemindaian kualitas data otomatis untuk **${periodLabel}** mendeteksi **${totalIssues} temuan**: **${metrics.zeroActualItems.length}** dept belum input Actual, **${metrics.zeroPlanItems.length}** dept tanpa Budget Plan, **${extremeOver.length}** over-budget ekstrem (>110%), dan **${extremeUnder.length}** defisit signifikan (<85%).`,
      kpis: [
        {
          label: isEn ? 'Missing Actual' : 'Belum Input Actual',
          value: `${metrics.zeroActualItems.length}`,
          tone: metrics.zeroActualItems.length > 0 ? 'warning' : 'success',
        },
        {
          label: isEn ? 'Extreme Over (>110%)' : 'Over Ekstrem (>110%)',
          value: `${extremeOver.length}`,
          tone: extremeOver.length > 0 ? 'danger' : 'success',
        },
        {
          label: isEn ? 'Severe Under (<85%)' : 'Defisit (<85%)',
          value: `${extremeUnder.length}`,
          tone: extremeUnder.length > 0 ? 'warning' : 'success',
        },
      ],
      table:
        issueRows.length > 0
          ? {
              headers: isEn
                ? ['Department', 'Anomaly Type', 'Detail', 'Priority']
                : ['Departemen', 'Jenis Anomali', 'Detail', 'Prioritas'],
              rows: issueRows.slice(0, 12),
            }
          : undefined,
      followUps: !isUserRole
        ? isEn
          ? ['Draft PIC reminder message', 'Generate monthly closing checklist']
          : ['Buatkan draf pesan pengingat PIC', 'Buatkan checklist tutup buku bulanan']
        : undefined,
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 13. DEPARTMENT PIC & CONTACT DIRECTORY (NEVER EXPOSE PASSWORDS/PINS!)
  // =========================================================================
  if (/\b(pic|kontak|contact|telepon|telp|hp|wa|whatsapp|email|direktori|directory|siapa|koordinator|akun)\b/.test(q)) {
    const specificDept = mentionedDepts[0];
    const filteredUsers = specificDept
      ? scopedUsers.filter((u) => u.deptId === specificDept)
      : scopedUsers;

    return {
      id,
      title: specificDept
        ? isEn
          ? `PIC Directory — ${DEPARTMENTS.find((d) => d.id === specificDept)?.name || specificDept}`
          : `Info PIC Departemen — ${DEPARTMENTS.find((d) => d.id === specificDept)?.name || specificDept}`
        : isEn
        ? `Department PIC & HR Contact Directory (${filteredUsers.length} Accounts)`
        : `Direktori PIC Departemen & Kontak HR (${filteredUsers.length} Akun)`,
      badge: isEn ? 'PIC Directory · Secured' : 'Direktori PIC · Aman',
      summary: isEn
        ? `Showing active authorized contact directory (**${filteredUsers.length}** account(s)). *For security compliance, passwords and PINs are strictly hidden from HR Assistant responses.*`
        : `Menampilkan direktori kontak PIC resmi yang aktif (**${filteredUsers.length}** akun). *Demi kepatuhan keamanan sistem, kata sandi dan PIN tidak pernah ditampilkan di HR Assistant.*`,
      table: {
        headers: isEn
          ? ['Dept / Role', 'PIC Name', 'Email', 'Phone / Contact']
          : ['Dept / Role', 'Nama PIC', 'Email Korporat', 'Telepon / Kontak'],
        rows: filteredUsers.slice(0, 15).map((u) => [
          `${u.deptId === 'ALL' ? 'ALL' : u.deptId} · ${u.role}`,
          u.nama,
          u.email || u.userId,
          u.phone || '-',
        ]),
      },
      actionLink: !isUserRole
        ? { label: isEn ? 'Open Dept Credentials Panel' : 'Buka User & Pass Dept', page: 'usermanagement' }
        : undefined,
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 14. AUDIT LOG & CLOUD DATABASE SYNC STATUS
  // =========================================================================
  if (/\b(audit|log|aktivitas|riwayat|history|sinkron|sync|database|supabase|cloud|db)\b/.test(q)) {
    const recent = scopedLogs.slice(0, 10);
    const syncStatusLabel = ctx.syncState.isConfigured
      ? ctx.syncState.isOnline
        ? isEn
          ? 'Connected & Online (Supabase Cloud DB)'
          : 'Terhubung & Online (Supabase Cloud DB)'
        : isEn
        ? 'Configured (Offline Queue Active)'
        : 'Terkonfigurasi (Antrean Offline Aktif)'
      : isEn
      ? 'Local Browser Storage Mode'
      : 'Mode Penyimpanan Lokal Browser';

    return {
      id,
      title: isEn
        ? 'System Audit Trail & Database Synchronization Status'
        : 'Audit Log Aktivitas & Status Sinkronisasi Database',
      badge: isEn ? 'Governance & Sync' : 'Tata Kelola & Sinkron',
      summary: isEn
        ? `**Database Connection:** ${syncStatusLabel}\n**Last Synced:** ${ctx.syncState.lastSynced || 'Not yet synced'}\n**Pending Sync Queue:** ${ctx.syncState.pendingSyncCount} item(s)\n**Total Recorded Audit Logs:** ${scopedLogs.length} events (Total Plans: **${ctx.plans.length}** records, Total Actuals: **${ctx.actuals.length}** records).`
        : `**Status Koneksi Database:** ${syncStatusLabel}\n**Sinkronisasi Terakhir:** ${ctx.syncState.lastSynced || 'Belum tersinkronisasi'}\n**Antrean Sinkron Tertunda:** ${ctx.syncState.pendingSyncCount} item\n**Total Catatan Audit Log:** ${scopedLogs.length} aktivitas (Total Record Plan: **${ctx.plans.length}**, Total Record Actual: **${ctx.actuals.length}**).`,
      kpis: [
        {
          label: isEn ? 'Cloud Sync' : 'Sinkron Cloud',
          value: ctx.syncState.isConfigured ? (isEn ? 'ACTIVE' : 'AKTIF') : isEn ? 'LOCAL' : 'LOKAL',
          sub: `${ctx.syncState.pendingSyncCount} ${isEn ? 'pending' : 'tertunda'}`,
          tone: ctx.syncState.isConfigured ? 'success' : 'warning',
        },
        {
          label: isEn ? 'Plan Records' : 'Record Plan',
          value: fmtNum(ctx.plans.length, ctx.language),
          tone: 'default',
        },
        {
          label: isEn ? 'Actual Records' : 'Record Actual',
          value: fmtNum(ctx.actuals.length, ctx.language),
          tone: 'default',
        },
        {
          label: 'Audit Logs',
          value: fmtNum(scopedLogs.length, ctx.language),
          tone: 'accent',
        },
      ],
      table:
        recent.length > 0
          ? {
              caption: isEn ? 'Latest Audit Events' : '10 Aktivitas Audit Log Terbaru',
              headers: isEn
                ? ['Time', 'Action', 'User', 'Dept', 'Detail']
                : ['Waktu', 'Aksi', 'Pengguna', 'Dept', 'Detail'],
              rows: recent.map((l) => [l.time, l.action, l.user, l.dept, l.detail]),
            }
          : undefined,
      actionLink: { label: isEn ? 'Open Full Audit Log' : 'Buka Audit Log Lengkap', page: 'logs' },
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 15. TOP-N RANKINGS (LARGEST / SMALLEST / HIGHEST ACHIEVEMENT)
  // =========================================================================
  if (/\b(top|terbesar|terbanyak|terkecil|ranking|peringkat|urutan|largest|smallest|biggest)\b/.test(q)) {
    const isSmallest = /\b(terkecil|smallest|paling sedikit|lowest)\b/.test(q);
    const numMatch = q.match(/\b([3-9]|10|15|20)\b/);
    const limit = numMatch ? Number(numMatch[1]) : 5;
    const sorted = [...metrics.items].sort((a, b) =>
      isSmallest ? a.actual - b.actual || a.plan - b.plan : b.actual - a.actual || b.plan - a.plan
    );
    const slice = sorted.slice(0, limit);

    return {
      id,
      title: isEn
        ? `Top ${slice.length} ${isSmallest ? 'Smallest' : 'Largest'} Departments by Headcount`
        : `Top ${slice.length} Departemen dengan Manpower ${isSmallest ? 'Terkecil' : 'Terbesar'}`,
      badge: isEn ? 'Department Ranking' : 'Peringkat Departemen',
      summary: isEn
        ? `Ranked across **${metrics.totalDepts}** active departments for **${periodLabel}**.`
        : `Peringkat dari total **${metrics.totalDepts}** departemen aktif pada **${periodLabel}**.`,
      table: {
        headers: isEn
          ? ['#', 'Department', 'Plan', 'Actual (RW/OS)', 'GAP', 'Achv %', 'Status']
          : ['#', 'Departemen', 'Plan', 'Actual (RW/OS)', 'GAP', 'Pencapaian', 'Status'],
        rows: slice.map((d, idx) => [
          `${idx + 1}`,
          `${d.deptName} (${d.deptId})`,
          `${d.plan}`,
          `${d.actual} (${d.actualRW}/${d.actualOS})`,
          fmtGap(d.gap, ctx.language),
          fmtPct(d.achievement),
          d.status,
        ]),
      },
      timestamp: nowTimeStr(),
    };
  }

  // =========================================================================
  // 16. HELP / CAPABILITIES / CONNECTED MODULES
  // =========================================================================
  if (/\b(modul|kemampuan|bisa apa|bantuan|help|fitur|panduan|halo|hai|hello|hi)\b/.test(q)) {
    return buildWelcomeMessage(ctx);
  }

  // =========================================================================
  // 17. STRATEGIC RECOMMENDATIONS / EXECUTIVE SUMMARY (Default Intelligent Fallback)
  // =========================================================================
  const topRisks = metrics.overItems.slice(0, 3);
  const activeDeficits = metrics.underItems.filter((i) => i.actual > 0).slice(0, 3);
  const pendingCount = scopedApprovals.filter((a) => a.status === 'PENDING').length;

  const recBullets = isEn
    ? [
        metrics.overItems.length > 0
          ? `**Over-Budget Control:** Focus immediately on **${topRisks.map((d) => `${d.deptName} (+${d.gap})`).join(', ')}** to pull Factory Compliance back toward ≥ 80%.`
          : `**Budget Discipline:** Zero Over-Budget units — sustain current monthly monitoring cadence.`,
        activeDeficits.length > 0
          ? `**Fulfillment Priority:** Expedite staffing / OS transfer for **${activeDeficits.map((d) => `${d.deptName} (${fmtGap(d.gap, 'en')})`).join(', ')}**.`
          : `**Staffing Stability:** No critical active understaffing gaps detected.`,
        metrics.zeroActualItems.length > 0
          ? `**Data Completeness:** Follow up with **${metrics.zeroActualItems.length}** department(s) still showing 0 Actual headcount.`
          : `**Data Hygiene:** 100% of active departments have logged Actual headcount.`,
        pendingCount > 0
          ? `**Approval Queue:** Process **${pendingCount}** pending Actual request(s) before monthly closing.`
          : `**Approval Queue:** Clean (0 pending requests).`,
      ]
    : [
        metrics.overItems.length > 0
          ? `**Pengendalian Over-Budget:** Fokus segera pada **${topRisks.map((d) => `${d.deptName} (+${d.gap})`).join(', ')}** agar Kepatuhan Budget kembali ke zona OPTIMAL (≥ 80%).`
          : `**Disiplin Budget:** Nihil departemen OVER — pertahankan kontrol bulanan saat ini.`,
        activeDeficits.length > 0
          ? `**Prioritas Pemenuhan:** Percepat pemenuhan/realokasi OS pada **${activeDeficits.map((d) => `${d.deptName} (${fmtGap(d.gap, 'id')})`).join(', ')}**.`
          : `**Stabilitas Shift:** Tidak ada defisit tenaga kerja aktif yang kritis.`,
        metrics.zeroActualItems.length > 0
          ? `**Kelengkapan Data:** Konfirmasi ke **${metrics.zeroActualItems.length}** departemen yang masih tercatat 0 Actual.`
          : `**Kelengkapan Data:** 100% departemen aktif telah melengkapi input Actual.`,
        pendingCount > 0
          ? `**Antrean Approval:** Tuntaskan verifikasi **${pendingCount}** pengajuan Approval Actual sebelum tutup buku.`
          : `**Antrean Approval:** Bersih (0 permohonan pending).`,
      ];

  return {
    id,
    title: isEn
      ? `Executive Manpower Summary — ${periodLabel}`
      : `Ringkasan Eksekutif Manpower — ${periodLabel}`,
    badge: isEn ? 'Live Executive Brief' : 'Ringkasan Eksekutif Live',
    summary: isEn
      ? `Real-time snapshot across **${metrics.totalDepts}** active department(s) (${effectiveCompany === 'ALL' ? 'All Entities' : effectiveCompany}):\n\n• **Budget vs Actual:** **${fmtNum(metrics.totalActual, 'en')} HC** realized out of **${fmtNum(metrics.totalPlan, 'en')} HC** planned (**${fmtPct(metrics.achievement)}** · GAP **${fmtGap(metrics.gap, 'en')} HC**)\n• **Workforce Mix:** Regular Worker **${fmtNum(metrics.totalActualRW, 'en')} HC** (${metrics.rwRatioActual}%) · Outsource **${fmtNum(metrics.totalActualOS, 'en')} HC** (${metrics.osRatioActual}%)\n• **Status Distribution:** **${metrics.optimalItems.length}** Optimal · **${metrics.underItems.length}** Under · **${metrics.overItems.length}** Over (**${fmtPct(metrics.complianceRate)} ${metrics.complianceStatus === 'OPTIMAL' ? 'OPTIMAL' : 'CAUTION'}**)\n\n**Key Action Recommendations:**\n${recBullets.map((b) => `• ${b}`).join('\n')}`
      : `Ikhtisar real-time mencakup **${metrics.totalDepts}** departemen aktif (${effectiveCompany === 'ALL' ? 'Semua Entitas' : effectiveCompany}):\n\n• **Budget vs Actual:** Realisasi **${fmtNum(metrics.totalActual, 'id')} HC** dari rencana **${fmtNum(metrics.totalPlan, 'id')} HC** (**${fmtPct(metrics.achievement)}** · GAP **${fmtGap(metrics.gap, 'id')} HC**)\n• **Komposisi Tenaga Kerja:** Regular Worker **${fmtNum(metrics.totalActualRW, 'id')} HC** (${metrics.rwRatioActual}%) · Outsource **${fmtNum(metrics.totalActualOS, 'id')} HC** (${metrics.osRatioActual}%)\n• **Sebaran Status:** **${metrics.optimalItems.length}** Optimal · **${metrics.underItems.length}** Under · **${metrics.overItems.length}** Over (**${fmtPct(metrics.complianceRate)} ${metrics.complianceStatus}**)\n\n**Rekomendasi Tindakan Utama:**\n${recBullets.map((b) => `• ${b}`).join('\n')}`,
    kpis: [
      {
        label: 'Budget (Plan)',
        value: `${fmtNum(metrics.totalPlan, ctx.language)} HC`,
        sub: `RW ${fmtNum(metrics.totalPlanRW, ctx.language)} · OS ${fmtNum(metrics.totalPlanOS, ctx.language)}`,
      },
      {
        label: 'Realisasi (Actual)',
        value: `${fmtNum(metrics.totalActual, ctx.language)} HC`,
        sub: `${fmtPct(metrics.achievement)} (${fmtGap(metrics.gap, ctx.language)})`,
        tone: metrics.gap > 0 ? 'danger' : metrics.achievement >= 90 ? 'success' : 'warning',
      },
      {
        label: isEn ? 'Compliance' : 'Kepatuhan',
        value: fmtPct(metrics.complianceRate),
        sub: `${metrics.overItems.length} Over · ${metrics.optimalItems.length} Opt`,
        tone: metrics.complianceStatus === 'OPTIMAL' ? 'success' : 'warning',
      },
      {
        label: isEn ? 'RW : OS Mix' : 'Rasio RW : OS',
        value: `${metrics.rwRatioActual}% : ${metrics.osRatioActual}%`,
        sub: isEn ? 'Active composition' : 'Komposisi aktif',
        tone: 'accent',
      },
    ],
    table:
      metrics.overItems.length > 0
        ? {
            caption: isEn ? 'Top Priority Watchlist (Over-Budget Units)' : 'Prioritas Pantauan Utama (Unit Over-Budget)',
            headers: isEn
              ? ['Department', 'Plan', 'Actual', 'GAP', 'Achv %']
              : ['Departemen', 'Plan', 'Actual', 'GAP', 'Pencapaian'],
            rows: metrics.overItems.slice(0, 5).map((d) => [
              `${d.deptName} (${d.deptId})`,
              `${d.plan}`,
              `${d.actual}`,
              `+${d.gap}`,
              fmtPct(d.achievement),
            ]),
          }
        : undefined,
    followUps: isUserRole
      ? isEn
        ? ['Show 12-month Fiscal Year trend', 'Check capacity standards', 'Draft monthly status memo']
        : ['Tampilkan tren 12 bulan Fiscal Year', 'Audit standar kapasitas', 'Buatkan draf memo status bulanan']
      : isEn
      ? [
          'Which departments are OVER budget?',
          'Compare PT Ajinomoto Indonesia vs PT Ajinex International',
          'Draft Executive Brief for Management',
        ]
      : [
          'Departemen apa saja yang OVER budget?',
          'Bandingkan PT Ajinomoto Indonesia vs PT Ajinex International',
          'Buatkan draf Ringkasan Eksekutif Direksi',
        ],
    timestamp: nowTimeStr(),
  };
}
