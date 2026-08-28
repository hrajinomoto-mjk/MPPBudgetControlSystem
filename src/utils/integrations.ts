import * as XLSX from 'xlsx';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PlanRecord,
  ActualRecord,
  ImportPreviewItem,
  ImportResult,
  GoogleSheetsConfig,
  SupabaseConfig,
  PendingApproval,
  AuditLog,
  User,
} from '../types';
import { DEPARTMENTS, INITIAL_USERS } from '../data/initialData';
import {
  getStoredPlans,
  saveStoredPlans,
  getStoredActuals,
  saveStoredActuals,
  getStoredUsers,
  saveStoredUsers,
  getStoredApprovals,
  saveStoredApprovals,
  getStoredAuditLogs,
  saveStoredAuditLogs,
  addAuditLog,
  addNotification,
} from './storage';

const STORAGE_KEYS = {
  GSHEETS: 'mpcs_gsheets_config_v2',
  SUPABASE: 'mpcs_supabase_config_v2',
};

// -------------------------------------------------------------
// 1. HELPER & VALIDATION FUNCTIONS
// -------------------------------------------------------------

export function getDeptMap(): Record<string, string> {
  const map: Record<string, string> = {};
  DEPARTMENTS.forEach((d) => {
    map[d.id.toUpperCase()] = d.name;
    map[d.name.toLowerCase()] = d.id;
  });
  return map;
}

const DEPT_ALIASES: Record<string, string> = {
  // D001 - Food Production 1
  'D001': 'D001', 'D1': 'D001', 'D01': 'D001', '1': 'D001', '01': 'D001', '001': 'D001',
  'FOOD PRODUCTION 1': 'D001', 'FOOD PROD 1': 'D001', 'FP1': 'D001', 'FP 1': 'D001', 'FOOD 1': 'D001', 'FOOD PRODUCTION I': 'D001', 'PROD 1': 'D001',
  
  // D002 - Food Production 2
  'D002': 'D002', 'D2': 'D002', 'D02': 'D002', '2': 'D002', '02': 'D002', '002': 'D002',
  'FOOD PRODUCTION 2': 'D002', 'FOOD PROD 2': 'D002', 'FP2': 'D002', 'FP 2': 'D002', 'FOOD 2': 'D002', 'FOOD PRODUCTION II': 'D002', 'PROD 2': 'D002',

  // D003 - Food Ingredients 1
  'D003': 'D003', 'D3': 'D003', 'D03': 'D003', '3': 'D003', '03': 'D003', '003': 'D003',
  'FOOD INGREDIENTS 1': 'D003', 'FOOD ING 1': 'D003', 'FI1': 'D003', 'FI 1': 'D003', 'INGREDIENTS 1': 'D003', 'FOOD INGREDIENTS I': 'D003',

  // D004 - Food Ingredients 2
  'D004': 'D004', 'D4': 'D004', 'D04': 'D004', '4': 'D004', '04': 'D004', '004': 'D004',
  'FOOD INGREDIENTS 2': 'D004', 'FOOD ING 2': 'D004', 'FI2': 'D004', 'FI 2': 'D004', 'INGREDIENTS 2': 'D004', 'FOOD INGREDIENTS II': 'D004',

  // D005 - Film & Lamination
  'D005': 'D005', 'D5': 'D005', 'D05': 'D005', '5': 'D005', '05': 'D005', '005': 'D005',
  'FILM & LAMINATION': 'D005', 'FILM AND LAMINATION': 'D005', 'FILM': 'D005', 'LAMINATION': 'D005', 'FL': 'D005', 'F&L': 'D005',

  // D006 - Production Planning & Control
  'D006': 'D006', 'D6': 'D006', 'D06': 'D006', '6': 'D006', '06': 'D006', '006': 'D006',
  'PRODUCTION PLANNING & CONTROL': 'D006', 'PRODUCTION PLANNING AND CONTROL': 'D006', 'PPC': 'D006', 'PPIC': 'D006', 'PRODUCTION PLANNING': 'D006',

  // D007 - Inventory Control
  'D007': 'D007', 'D7': 'D007', 'D07': 'D007', '7': 'D007', '07': 'D007', '007': 'D007',
  'INVENTORY CONTROL': 'D007', 'INVENTORY': 'D007', 'IC': 'D007', 'GUDANG': 'D007', 'WAREHOUSE': 'D007', 'WH': 'D007',

  // D008 - Procurement & EXIM
  'D008': 'D008', 'D8': 'D008', 'D08': 'D008', '8': 'D008', '08': 'D008', '008': 'D008',
  'PROCUREMENT & EXIM': 'D008', 'PROCUREMENT AND EXIM': 'D008', 'PROCUREMENT': 'D008', 'EXIM': 'D008', 'PURCHASING': 'D008', 'PROC': 'D008',

  // D009 - Factory Operational Excellence
  'D009': 'D009', 'D9': 'D009', 'D09': 'D009', '9': 'D009', '09': 'D009', '009': 'D009',
  'FACTORY OPERATIONAL EXCELLENCE': 'D009', 'OPERATIONAL EXCELLENCE': 'D009', 'FOX': 'D009', 'FOE': 'D009', 'OE': 'D009',

  // D010 - Engineering & Maintenance
  'D010': 'D010', 'D10': 'D010', '10': 'D010', '010': 'D010',
  'ENGINEERING & MAINTENANCE': 'D010', 'ENGINEERING AND MAINTENANCE': 'D010', 'ENGINEERING': 'D010', 'MAINTENANCE': 'D010', 'ENG': 'D010', 'MAINT': 'D010', 'E&M': 'D010',

  // D011 - Utility
  'D011': 'D011', 'D11': 'D011', '11': 'D011', '011': 'D011',
  'UTILITY': 'D011', 'UTL': 'D011', 'UTILITAS': 'D011',

  // D012 - Human Resource
  'D012': 'D012', 'D12': 'D012', '12': 'D012', '012': 'D012',
  'HUMAN RESOURCE': 'D012', 'HUMAN RESOURCES': 'D012', 'HR': 'D012', 'HRD': 'D012', 'HR DEVELOPMENT': 'D012', 'HR FACTORY': 'D012',

  // D013 - General Affairs
  'D013': 'D013', 'D13': 'D013', '13': 'D013', '013': 'D013',
  'GENERAL AFFAIRS': 'D013', 'GA': 'D013', 'GENERAL AFFAIR': 'D013',

  // D014 - Agri Development
  'D014': 'D014', 'D14': 'D014', '14': 'D014', '014': 'D014',
  'AGRI DEVELOPMENT': 'D014', 'AGRI': 'D014', 'AGRI DEV': 'D014', 'AGRICULTURE': 'D014',

  // D015 - Health Safety & Environment
  'D015': 'D015', 'D15': 'D015', '15': 'D015', '015': 'D015',
  'HEALTH SAFETY & ENVIRONMENT': 'D015', 'HEALTH SAFETY AND ENVIRONMENT': 'D015', 'HSE': 'D015', 'SAFETY': 'D015', 'K3': 'D015', 'SHE': 'D015', 'EHS': 'D015',

  // D016 - Quality Assurance
  'D016': 'D016', 'D16': 'D016', '16': 'D016', '016': 'D016',
  'QUALITY ASSURANCE': 'D016', 'QA': 'D016', 'QA FACTORY': 'D016',

  // D017 - Production
  'D017': 'D017', 'D17': 'D017', '17': 'D017', '017': 'D017',
  'PRODUCTION': 'D017', 'PRODUKSI': 'D017', 'PROD': 'D017',

  // D018 - ITEC Project
  'D018': 'D018', 'D18': 'D018', '18': 'D018', '018': 'D018',
  'ITEC PROJECT': 'D018', 'ITEC PROJ': 'D018', 'ITEC-PROJ': 'D018',

  // D019 - ITEC Process
  'D019': 'D019', 'D19': 'D019', '19': 'D019', '019': 'D019',
  'ITEC PROCESS': 'D019', 'ITEC PROC': 'D019', 'ITEC-PROC': 'D019',

  // D020 - Quality Assurance NEX
  'D020': 'D020', 'D20': 'D020', '20': 'D020', '020': 'D020',
  'QUALITY ASSURANCE NEX': 'D020', 'QA NEX': 'D020', 'QANEX': 'D020', 'QA-NEX': 'D020',

  // D021 - Direktur NE
  'D021': 'D021', 'D21': 'D021', '21': 'D021', '021': 'D021',
  'DIREKTUR NE': 'D021', 'DIRECTOR NE': 'D021', 'DIR NE': 'D021', 'DIRNE': 'D021',

  // D022 - Direktur NEX
  'D022': 'D022', 'D22': 'D022', '22': 'D022', '022': 'D022',
  'DIREKTUR NEX': 'D022', 'DIRECTOR NEX': 'D022', 'DIR NEX': 'D022', 'DIRNEX': 'D022',

  // D023 - Legal
  'D023': 'D023', 'D23': 'D023', '23': 'D023', '023': 'D023',
  'LEGAL': 'D023', 'HUKUM': 'D023', 'LEGAL & COMPLIANCE': 'D023',
};

export function normalizeDeptId(raw: string | undefined): { deptId: string; deptName: string; isValid: boolean } {
  if (!raw) return { deptId: '', deptName: '', isValid: false };
  const trimmed = String(raw).trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');

  // 1. Check alias dictionary
  if (DEPT_ALIASES[upper]) {
    const targetId = DEPT_ALIASES[upper];
    const dept = DEPARTMENTS.find((d) => d.id === targetId);
    if (dept) return { deptId: dept.id, deptName: dept.name, isValid: true };
  }

  // 2. Direct exact match by ID or Name
  const directMatch = DEPARTMENTS.find(
    (d) => d.id.toUpperCase() === upper || d.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) {
    return { deptId: directMatch.id, deptName: directMatch.name, isValid: true };
  }

  // 3. Normalized alphanumeric match
  const cleanRaw = upper.replace(/[^A-Z0-9]/g, '');
  const cleanMatch = DEPARTMENTS.find((d) => {
    const cleanId = d.id.replace(/[^A-Z0-9]/g, '');
    const cleanName = d.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleanId === cleanRaw || cleanName === cleanRaw;
  });
  if (cleanMatch) {
    return { deptId: cleanMatch.id, deptName: cleanMatch.name, isValid: true };
  }

  // 4. Partial substring match
  const partial = DEPARTMENTS.find((d) => d.name.toLowerCase().includes(trimmed.toLowerCase()));
  if (partial) {
    return { deptId: partial.id, deptName: partial.name, isValid: true };
  }

  return { deptId: trimmed, deptName: trimmed, isValid: false };
}

export function parseMonthValue(val: any): number {
  if (val === undefined || val === null || val === '') return 4;
  
  if (typeof val === 'number') {
    if (val >= 1 && val <= 12) return Math.floor(val);
    if (val > 1000) {
      const date = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date.getMonth() + 1;
    }
  }

  const s = String(val).trim().toLowerCase();
  const num = parseInt(s, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return num;
  }

  const monthMap: Record<string, number> = {
    jan: 1, januari: 1, january: 1,
    feb: 2, februari: 2, february: 2,
    mar: 3, maret: 3, march: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6, june: 6,
    jul: 7, juli: 7, july: 7,
    agu: 8, agt: 8, ags: 8, agustus: 8, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    okt: 10, oct: 10, oktober: 10, october: 10,
    nov: 11, nop: 11, november: 11,
    des: 12, dec: 12, desember: 12, december: 12,
  };

  for (const [key, mNum] of Object.entries(monthMap)) {
    if (s === key || s.startsWith(key)) {
      return mNum;
    }
  }

  const fmMatch = s.match(/(?:fm|m)\s*([1-9]|1[0-2])/);
  if (fmMatch && fmMatch[1]) {
    const fm = parseInt(fmMatch[1], 10);
    // Fiscal month 1 is April (4)
    return fm <= 9 ? fm + 3 : fm - 9;
  }

  const dateMatch = s.match(/(\d{4})[-/](\d{1,2})/) || s.match(/(\d{1,2})[-/](\d{4})/);
  if (dateMatch) {
    const p1 = parseInt(dateMatch[1], 10);
    const p2 = parseInt(dateMatch[2], 10);
    if (p1 >= 1 && p1 <= 12) return p1;
    if (p2 >= 1 && p2 <= 12) return p2;
  }

  return 4;
}

export function parseYearValue(val: any, fallbackYear = 2026): number {
  if (val === undefined || val === null || val === '') return fallbackYear;
  
  if (typeof val === 'number') {
    if (val >= 2000 && val <= 2100) return Math.floor(val);
    if (val >= 20 && val <= 50) return 2000 + Math.floor(val);
    if (val > 1000) {
      const date = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date.getFullYear();
    }
  }

  const s = String(val).trim();
  const yearMatch = s.match(/20\d{2}/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  const num = parseInt(s, 10);
  if (!isNaN(num) && num >= 2000 && num <= 2100) return num;
  if (!isNaN(num) && num >= 20 && num <= 50) return 2000 + num;

  return fallbackYear;
}

export function parseCleanNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, Math.round(val));
  
  let s = String(val).trim();
  // Remove words like 'orang', 'org', 'personil', 'pax', 'jiwa', 'headcount', etc.
  s = s.replace(/(?:orang|org|personil|pax|jiwa|headcount|people|workers|karyawan)/gi, '').trim();
  
  // Handle Indonesian / European number formats (e.g. "45,0" or "1.250")
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  } else if (s.includes('.') && s.includes(',')) {
    // e.g. "1.250,50" -> "1250.50"
    s = s.replace(/\./g, '').replace(',', '.');
  }
  
  const clean = s.replace(/[^0-9.-]/g, '');
  if (!clean || clean === '-' || clean === '.') return 0;
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.max(0, Math.round(num));
}

function hasValidCell(val: any): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  return s !== '' && s !== '-';
}

function pickFirstFilled(...candidates: any[]): any {
  for (const c of candidates) {
    if (hasValidCell(c)) {
      return c;
    }
  }
  return undefined;
}

// -------------------------------------------------------------
// 2. EXCEL & CSV IMPORT ENGINE
// -------------------------------------------------------------

export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer | string,
  targetType: 'PLAN' | 'ACTUAL' | 'BOTH'
): ImportPreviewItem[] {
  const workbook =
    typeof buffer === 'string'
      ? XLSX.read(buffer, { type: 'string' })
      : XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays to auto-detect header row
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length === 0) return [];

  // Find header row (skip top titles / empty metadata rows)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row) || row.length === 0) continue;
    const rowStr = row.map((c) => String(c).toLowerCase().trim()).join(' ');
    const hasDept =
      rowStr.includes('dept') ||
      rowStr.includes('departemen') ||
      rowStr.includes('kode') ||
      rowStr.includes('unit') ||
      rowStr.includes('department') ||
      rowStr.includes('seksi') ||
      rowStr.includes('section');
    const hasMetrics =
      rowStr.includes('rw') ||
      rowStr.includes('os') ||
      rowStr.includes('plan') ||
      rowStr.includes('actual') ||
      rowStr.includes('realisasi') ||
      rowStr.includes('aktual') ||
      rowStr.includes('bulan') ||
      rowStr.includes('month') ||
      rowStr.includes('regular') ||
      rowStr.includes('reguler') ||
      rowStr.includes('outsource') ||
      rowStr.includes('tenaga kerja') ||
      rowStr.includes('karyawan');

    if (hasDept || hasMetrics) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rawRows[headerRowIndex] || [];
  const nextRow = rawRows[headerRowIndex + 1] || [];

  // Detect 2-tier merged headers (e.g. Row 1: Plan / Actual, Row 2: RW / OS)
  const isMultiTierHeader =
    Array.isArray(nextRow) &&
    nextRow.some((c) => {
      const s = String(c).toLowerCase().trim();
      return s === 'rw' || s === 'os' || s === 'regular' || s === 'reguler' || s === 'outsource' || s === 'tetap' || s === 'kontrak';
    });

  let effectiveHeaderRowIndex = headerRowIndex;
  const headerKeys: string[] = [];

  if (isMultiTierHeader) {
    effectiveHeaderRowIndex = headerRowIndex + 1;
    let currentCategory = '';
    for (let c = 0; c < Math.max(rawHeaders.length, nextRow.length); c++) {
      const topCell = String(rawHeaders[c] || '').trim();
      const subCell = String(nextRow[c] || '').trim();
      if (topCell) currentCategory = topCell;
      const combined = `${currentCategory} ${subCell}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      headerKeys.push(combined || String(subCell || topCell).trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  } else {
    rawHeaders.forEach((h: any) => {
      headerKeys.push(String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    });
  }

  const dataRows = rawRows.slice(effectiveHeaderRowIndex + 1);
  const previewItems: ImportPreviewItem[] = [];

  dataRows.forEach((row, index) => {
    if (!Array.isArray(row) || row.every((c) => c === '' || c === undefined || c === null)) {
      return; // Skip empty row
    }

    const normalizedRow: Record<string, any> = {};
    headerKeys.forEach((key, colIdx) => {
      if (key) {
        normalizedRow[key] = row[colIdx];
      }
    });

    // 1. Extract Department
    let rawDept = pickFirstFilled(
      normalizedRow['departemen'],
      normalizedRow['dept'],
      normalizedRow['deptid'],
      normalizedRow['department'],
      normalizedRow['kode'],
      normalizedRow['kodedepartemen'],
      normalizedRow['kodedept'],
      normalizedRow['kodeunit'],
      normalizedRow['unit'],
      normalizedRow['unitkerja'],
      normalizedRow['namadepartemen'],
      normalizedRow['namadept'],
      normalizedRow['section'],
      normalizedRow['seksi'],
      normalizedRow['id'],
      normalizedRow['bagian'],
      normalizedRow['divisi']
    );

    // Fallback: check row columns 0, 1, 2 for recognized department name/code
    if (!rawDept) {
      for (let c = 0; c < Math.min(row.length, 3); c++) {
        const testVal = String(row[c] || '').trim();
        if (testVal && normalizeDeptId(testVal).isValid) {
          rawDept = testVal;
          break;
        }
      }
      if (!rawDept) rawDept = row[0];
    }

    // 2. Extract Bulan & Tahun
    let rawBulan = pickFirstFilled(
      normalizedRow['bulan'],
      normalizedRow['month'],
      normalizedRow['bln'],
      normalizedRow['period'],
      normalizedRow['periode'],
      normalizedRow['bulanfiskal'],
      normalizedRow['fiscalmonth'],
      normalizedRow['fm'],
      normalizedRow['tanggal'],
      normalizedRow['tgl'],
      normalizedRow['date'],
      normalizedRow['waktu']
    );

    let rawTahun = pickFirstFilled(
      normalizedRow['tahun'],
      normalizedRow['year'],
      normalizedRow['thn'],
      normalizedRow['yr'],
      normalizedRow['fy'],
      normalizedRow['tahunfiskal'],
      normalizedRow['fiscalyear'],
      normalizedRow['periode'],
      normalizedRow['tanggal'],
      normalizedRow['date']
    );

    // 3. Extract Specific Actual / Realisasi Columns (Full Indonesian & English variants)
    const rawActualRW = pickFirstFilled(
      normalizedRow['actualrw'],
      normalizedRow['realisasirw'],
      normalizedRow['aktualrw'],
      normalizedRow['rwactual'],
      normalizedRow['rwrealisasi'],
      normalizedRow['rwaktual'],
      normalizedRow['actrw'],
      normalizedRow['rwact'],
      normalizedRow['realrw'],
      normalizedRow['rwreal'],
      normalizedRow['actualregular'],
      normalizedRow['actualreguler'],
      normalizedRow['realisasireguler'],
      normalizedRow['realisasiregular'],
      normalizedRow['aktualreguler'],
      normalizedRow['aktualregular'],
      normalizedRow['actualregularworker'],
      normalizedRow['realisasiregularworker'],
      normalizedRow['aktualregularworker'],
      normalizedRow['realisasitenagakerjareguler'],
      normalizedRow['tenagakerjarealisasireguler'],
      normalizedRow['actualrworg'],
      normalizedRow['actualrworang'],
      normalizedRow['realisasirworg'],
      normalizedRow['realisasirworang'],
      normalizedRow['actualtetap'],
      normalizedRow['realisasitetap'],
      normalizedRow['aktualtetap'],
      normalizedRow['realisasirwpersonil'],
      normalizedRow['actualrwpersonil'],
      normalizedRow['realisasimanpower'],
      normalizedRow['actualmanpower'],
      normalizedRow['realisasiheadcount'],
      normalizedRow['actualheadcount'],
      normalizedRow['realisasi'],
      normalizedRow['actual'],
      normalizedRow['aktual']
    );

    const rawActualOS = pickFirstFilled(
      normalizedRow['actualos'],
      normalizedRow['realisasios'],
      normalizedRow['realisaios'],
      normalizedRow['aktualos'],
      normalizedRow['osactual'],
      normalizedRow['osrealisasi'],
      normalizedRow['osaktual'],
      normalizedRow['actos'],
      normalizedRow['osact'],
      normalizedRow['realos'],
      normalizedRow['osreal'],
      normalizedRow['actualoutsource'],
      normalizedRow['actualoutsourcing'],
      normalizedRow['realisasioutsource'],
      normalizedRow['realisasioutsourcing'],
      normalizedRow['aktualoutsource'],
      normalizedRow['aktualoutsourcing'],
      normalizedRow['actualoutsourceworker'],
      normalizedRow['realisasioutsourceworker'],
      normalizedRow['aktualoutsourceworker'],
      normalizedRow['realisasitenagakerjaoutsource'],
      normalizedRow['tenagakerjarealisasioutsource'],
      normalizedRow['actualosorg'],
      normalizedRow['actualosorang'],
      normalizedRow['realisasiosorg'],
      normalizedRow['realisasiosorang'],
      normalizedRow['actualkontrak'],
      normalizedRow['realisasikontrak'],
      normalizedRow['aktualkontrak'],
      normalizedRow['realisasiospersonil'],
      normalizedRow['actualospersonil']
    );

    // 4. Extract Specific Plan Columns
    const rawPlanRW = pickFirstFilled(
      normalizedRow['planrw'],
      normalizedRow['rwplan'],
      normalizedRow['budgetrw'],
      normalizedRow['rwbudget'],
      normalizedRow['targetrw'],
      normalizedRow['anggaranrw'],
      normalizedRow['planregularworker'],
      normalizedRow['budgetregularworker'],
      normalizedRow['regularworkerplan'],
      normalizedRow['planreguler'],
      normalizedRow['planregular'],
      normalizedRow['budgetreguler'],
      normalizedRow['targetreguler'],
      normalizedRow['anggaranreguler'],
      normalizedRow['planrworg'],
      normalizedRow['planrworang'],
      normalizedRow['plantetap'],
      normalizedRow['budgettetap'],
      normalizedRow['planmanpower'],
      normalizedRow['budgetmanpower'],
      normalizedRow['plan'],
      normalizedRow['budget'],
      normalizedRow['anggaran']
    );

    const rawPlanOS = pickFirstFilled(
      normalizedRow['planos'],
      normalizedRow['osplan'],
      normalizedRow['budgetos'],
      normalizedRow['osbudget'],
      normalizedRow['targetos'],
      normalizedRow['anggaranos'],
      normalizedRow['planoutsource'],
      normalizedRow['planoutsourcing'],
      normalizedRow['budgetoutsource'],
      normalizedRow['budgetoutsourcing'],
      normalizedRow['targetoutsource'],
      normalizedRow['anggaranoutsource'],
      normalizedRow['outsourceplan'],
      normalizedRow['planosorg'],
      normalizedRow['planosorang'],
      normalizedRow['plankontrak'],
      normalizedRow['budgetkontrak']
    );

    // 5. Extract Generic Columns (e.g. "RW", "OS", "Regular Worker", "Outsource")
    const rawGenericRW = pickFirstFilled(
      normalizedRow['rw'],
      normalizedRow['regularworkerrw'],
      normalizedRow['regularworker'],
      normalizedRow['regular'],
      normalizedRow['reguler'],
      normalizedRow['tenagareguler'],
      normalizedRow['tenagakerjareguler'],
      normalizedRow['karyawantetap'],
      normalizedRow['tetap'],
      normalizedRow['rworg'],
      normalizedRow['rworang'],
      normalizedRow['jmlrw'],
      normalizedRow['jumlahrw'],
      normalizedRow['totalrw'],
      normalizedRow['rwpersonil']
    );

    const rawGenericOS = pickFirstFilled(
      normalizedRow['os'],
      normalizedRow['outsourceos'],
      normalizedRow['outsource'],
      normalizedRow['outsourcing'],
      normalizedRow['outsourceworker'],
      normalizedRow['tenagaoutsource'],
      normalizedRow['tenagakerjaoutsource'],
      normalizedRow['karyawankontrak'],
      normalizedRow['kontrak'],
      normalizedRow['osorg'],
      normalizedRow['osorang'],
      normalizedRow['jmlos'],
      normalizedRow['jumlahos'],
      normalizedRow['totalos'],
      normalizedRow['ospersonil']
    );

    // 6. Extract Remarks
    const rawRemarks = pickFirstFilled(
      normalizedRow['remarks'],
      normalizedRow['catatan'],
      normalizedRow['keterangan'],
      normalizedRow['note'],
      normalizedRow['notes'],
      normalizedRow['alasan'],
      normalizedRow['deskripsi'],
      normalizedRow['description'],
      normalizedRow['remark'],
      ''
    );

    const errors: string[] = [];

    // Department Validation
    const { deptId, deptName, isValid: isDeptValid } = normalizeDeptId(rawDept);
    if (!deptId) {
      errors.push('Departemen kosong');
    } else if (!isDeptValid) {
      errors.push(`Dept '${deptId}' tidak terdaftar di master pabrik`);
    }

    // Bulan Validation
    const bulanNum = parseMonthValue(rawBulan);
    if (bulanNum < 1 || bulanNum > 12) {
      errors.push(`Bulan tidak valid (${rawBulan || 'kosong'}, harus 1-12)`);
    }

    // Tahun Validation
    const tahunNum = parseYearValue(rawTahun, 2026);

    // Positional fallback for numeric columns if RW/OS are not detected via header keys
    const remainingNumbers: number[] = [];
    row.forEach((cellVal, colIdx) => {
      const headerKey = headerKeys[colIdx] || '';
      // Skip if column is dept, bulan, tahun, or remarks
      if (
        headerKey.includes('dept') ||
        headerKey.includes('nama') ||
        headerKey.includes('kode') ||
        headerKey.includes('unit') ||
        headerKey.includes('bulan') ||
        headerKey.includes('month') ||
        headerKey.includes('tahun') ||
        headerKey.includes('year') ||
        headerKey.includes('catatan') ||
        headerKey.includes('remark') ||
        headerKey.includes('note')
      ) {
        return;
      }
      if (hasValidCell(cellVal)) {
        const parsed = parseCleanNumber(cellVal);
        if (!isNaN(parsed)) {
          remainingNumbers.push(parsed);
        }
      }
    });

    const parsedSpecificActRW = hasValidCell(rawActualRW) ? parseCleanNumber(rawActualRW) : undefined;
    const parsedSpecificActOS = hasValidCell(rawActualOS) ? parseCleanNumber(rawActualOS) : undefined;
    const parsedSpecificPlanRW = hasValidCell(rawPlanRW) ? parseCleanNumber(rawPlanRW) : undefined;
    const parsedSpecificPlanOS = hasValidCell(rawPlanOS) ? parseCleanNumber(rawPlanOS) : undefined;
    const parsedGenericRW = hasValidCell(rawGenericRW) ? parseCleanNumber(rawGenericRW) : undefined;
    const parsedGenericOS = hasValidCell(rawGenericOS) ? parseCleanNumber(rawGenericOS) : undefined;

    let finalPlanRW = 0;
    let finalPlanOS = 0;
    let finalActualRW = 0;
    let finalActualOS = 0;

    if (targetType === 'ACTUAL') {
      // Prioritize Actual columns, then Generic columns, then Plan columns, then positional numbers
      finalActualRW =
        parsedSpecificActRW ??
        parsedGenericRW ??
        parsedSpecificPlanRW ??
        (remainingNumbers.length > 0 ? remainingNumbers[0] : 0);

      finalActualOS =
        parsedSpecificActOS ??
        parsedGenericOS ??
        parsedSpecificPlanOS ??
        (remainingNumbers.length > 1 ? remainingNumbers[1] : 0);

      finalPlanRW = parsedSpecificPlanRW ?? 0;
      finalPlanOS = parsedSpecificPlanOS ?? 0;
    } else if (targetType === 'PLAN') {
      // Prioritize Plan columns, then Generic columns, then Actual columns, then positional numbers
      finalPlanRW =
        parsedSpecificPlanRW ??
        parsedGenericRW ??
        parsedSpecificActRW ??
        (remainingNumbers.length > 0 ? remainingNumbers[0] : 0);

      finalPlanOS =
        parsedSpecificPlanOS ??
        parsedGenericOS ??
        parsedSpecificActOS ??
        (remainingNumbers.length > 1 ? remainingNumbers[1] : 0);

      finalActualRW = parsedSpecificActRW ?? 0;
      finalActualOS = parsedSpecificActOS ?? 0;
    } else {
      // BOTH
      finalPlanRW = parsedSpecificPlanRW ?? parsedGenericRW ?? (remainingNumbers.length > 0 ? remainingNumbers[0] : 0);
      finalPlanOS = parsedSpecificPlanOS ?? parsedGenericOS ?? (remainingNumbers.length > 1 ? remainingNumbers[1] : 0);
      finalActualRW = parsedSpecificActRW ?? (parsedSpecificPlanRW !== undefined ? 0 : parsedGenericRW) ?? finalPlanRW;
      finalActualOS = parsedSpecificActOS ?? (parsedSpecificPlanOS !== undefined ? 0 : parsedGenericOS) ?? finalPlanOS;
    }

    previewItems.push({
      id: `imp_${index}_${Date.now()}`,
      deptId: deptId || 'UNKNOWN',
      deptName: deptName || deptId,
      bulan: bulanNum,
      tahun: tahunNum,
      planRW: finalPlanRW,
      planOS: finalPlanOS,
      actualRW: finalActualRW,
      actualOS: finalActualOS,
      remarks: String(rawRemarks || '').trim(),
      isValid: errors.length === 0,
      errors,
    });
  });

  return previewItems;
}

export function commitImportedData(
  items: ImportPreviewItem[],
  targetType: 'PLAN' | 'ACTUAL' | 'BOTH',
  actor: string
): ImportResult {
  const currentPlans = getStoredPlans();
  const currentActuals = getStoredActuals();

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const details: string[] = [];

  const updatedPlans = [...currentPlans];
  const updatedActuals = [...currentActuals];

  items.forEach((item) => {
    if (!item.isValid) {
      errorCount++;
      details.push(`Gagal: ${item.deptId} (Bulan ${item.bulan}/${item.tahun}) - ${item.errors.join(', ')}`);
      return;
    }

    // Save Plan
    if (targetType === 'PLAN' || targetType === 'BOTH') {
      const planRW = item.planRW ?? (targetType === 'PLAN' ? item.actualRW : 0) ?? 0;
      const planOS = item.planOS ?? (targetType === 'PLAN' ? item.actualOS : 0) ?? 0;
      const existingPlanIndex = updatedPlans.findIndex(
        (p) => p.deptId === item.deptId && Number(p.bulan) === Number(item.bulan) && Number(p.tahun) === Number(item.tahun)
      );

      if (existingPlanIndex >= 0) {
        updatedPlans[existingPlanIndex] = {
          ...updatedPlans[existingPlanIndex],
          planRW,
          planOS,
          remarks: item.remarks || updatedPlans[existingPlanIndex].remarks || '',
        };
      } else {
        updatedPlans.push({
          id: `plan_${item.deptId}_${item.tahun}_${item.bulan}_${Date.now()}`,
          deptId: item.deptId,
          bulan: item.bulan,
          tahun: item.tahun,
          planRW,
          planOS,
          remarks: item.remarks || '',
        });
      }
    }

    // Save Actual
    if (targetType === 'ACTUAL' || targetType === 'BOTH') {
      let actualRW = item.actualRW ?? 0;
      let actualOS = item.actualOS ?? 0;
      if (targetType === 'ACTUAL' && actualRW === 0 && actualOS === 0) {
        if ((item.planRW ?? 0) > 0 || (item.planOS ?? 0) > 0) {
          actualRW = item.planRW ?? 0;
          actualOS = item.planOS ?? 0;
        }
      }

      const existingActualIndex = updatedActuals.findIndex(
        (a) => a.deptId === item.deptId && Number(a.bulan) === Number(item.bulan) && Number(a.tahun) === Number(item.tahun)
      );

      if (existingActualIndex >= 0) {
        updatedActuals[existingActualIndex] = {
          ...updatedActuals[existingActualIndex],
          actualRW,
          actualOS,
          remarks: item.remarks || updatedActuals[existingActualIndex].remarks || '',
        };
      } else {
        updatedActuals.push({
          id: `act_${item.deptId}_${item.tahun}_${item.bulan}_${Date.now()}`,
          deptId: item.deptId,
          bulan: item.bulan,
          tahun: item.tahun,
          actualRW,
          actualOS,
          remarks: item.remarks || '',
        });
      }
    }

    successCount++;
  });

  if (targetType === 'PLAN' || targetType === 'BOTH') {
    saveStoredPlans(updatedPlans);
  }
  if (targetType === 'ACTUAL' || targetType === 'BOTH') {
    saveStoredActuals(updatedActuals);
  }

  addAuditLog(
    'IMPORT_DATA',
    `Import ${targetType} berhasil: ${successCount} baris data diproses (${errorCount} gagal/invalid)`,
    'ALL',
    actor
  );

  addNotification({
    title: 'Import Data Selesai',
    message: `Berhasil mengimpor ${successCount} data manpower (${targetType}) ke dalam sistem.`,
    type: 'success',
  });

  return {
    successCount,
    errorCount,
    skippedCount,
    details,
  };
}

export function downloadImportTemplate(type: 'PLAN' | 'ACTUAL' | 'BOTH'): void {
  let templateData: any[] = [];

  if (type === 'PLAN') {
    templateData = DEPARTMENTS.slice(0, 5).map((d, i) => ({
      'Kode Departemen': d.id,
      'Nama Departemen': d.name,
      Bulan: 4, // April (Fiscal Month 1)
      Tahun: new Date().getFullYear(),
      'Plan RW': 20 + i * 5,
      'Plan OS': 10 + i * 2,
      'Catatan / Remarks': 'Budget disetujui FY' + new Date().getFullYear(),
    }));
  } else if (type === 'ACTUAL') {
    templateData = DEPARTMENTS.slice(0, 5).map((d, i) => ({
      'Kode Departemen': d.id,
      'Nama Departemen': d.name,
      Bulan: 4,
      Tahun: new Date().getFullYear(),
      'Actual RW': 19 + i * 5,
      'Actual OS': 11 + i * 2,
      'Catatan / Remarks': 'Realisasi aktual akhir bulan',
    }));
  } else {
    templateData = DEPARTMENTS.slice(0, 5).map((d, i) => ({
      'Kode Departemen': d.id,
      'Nama Departemen': d.name,
      Bulan: 4,
      Tahun: new Date().getFullYear(),
      'Plan RW': 20 + i * 5,
      'Plan OS': 10 + i * 2,
      'Actual RW': 20 + i * 5,
      'Actual OS': 10 + i * 2,
      'Catatan / Remarks': 'Data gabungan Plan & Realisasi',
    }));
  }

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  XLSX.writeFile(wb, `Template_Import_${type}_MPCS.xlsx`);
}

// -------------------------------------------------------------
// 3. GOOGLE SHEETS LIVE SYNC ENGINE
// -------------------------------------------------------------

export function getStoredGoogleSheetsConfig(): GoogleSheetsConfig {
  const raw = localStorage.getItem(STORAGE_KEYS.GSHEETS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    sheetUrl: '',
    autoSync: false,
    targetType: 'ACTUAL',
  };
}

export function saveStoredGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(STORAGE_KEYS.GSHEETS, JSON.stringify(config));
}

export function convertGoogleSheetsUrlToCsvExport(rawUrl: string): { primaryUrl: string; fallbackUrl?: string } | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const url = rawUrl.trim();

  // Pattern A: Published web format (/d/e/2PACX-...)
  if (url.includes('/spreadsheets/d/e/')) {
    if (url.includes('output=csv') || url.includes('format=csv')) {
      return { primaryUrl: url };
    }
    const base = url.split('/pub')[0];
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return { primaryUrl: `${base}/pub?output=csv${gidParam}` };
  }

  // Pattern B: Standard Google Sheets link: /spreadsheets/d/{ID}/...
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    if (url.includes('format=csv') || url.endsWith('.csv') || url.includes('output=csv')) {
      return { primaryUrl: url };
    }
    return null;
  }

  const spreadsheetId = match[1];
  let gid = '0';
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = gidMatch[1];
  }

  return {
    primaryUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    fallbackUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
  };
}

export async function fetchGoogleSheetsData(
  sheetUrl: string,
  targetType: 'PLAN' | 'ACTUAL' | 'BOTH'
): Promise<{ items: ImportPreviewItem[]; rawRowCount: number }> {
  const urlObj = convertGoogleSheetsUrlToCsvExport(sheetUrl);
  if (!urlObj) {
    throw new Error('URL Google Sheets tidak valid. Pastikan format tautan berasal dari Google Sheets.');
  }

  let csvText = '';
  let lastError = '';

  // Try primary URL first (gviz/tq?tqx=out:csv or pub)
  try {
    const response = await fetch(urlObj.primaryUrl);
    if (response.ok) {
      const text = await response.text();
      // Verify text is not an HTML redirect/login page
      if (text && !text.trim().startsWith('<!DOCTYPE html') && !text.trim().startsWith('<html')) {
        csvText = text;
      }
    }
  } catch (err: any) {
    lastError = err.message || '';
  }

  // If primary didn't get CSV and fallbackUrl exists, try fallback
  if (!csvText && urlObj.fallbackUrl) {
    try {
      const response = await fetch(urlObj.fallbackUrl);
      if (response.ok) {
        const text = await response.text();
        if (text && !text.trim().startsWith('<!DOCTYPE html') && !text.trim().startsWith('<html')) {
          csvText = text;
        }
      }
    } catch (err: any) {
      lastError = err.message || '';
    }
  }

  if (!csvText || csvText.trim().length === 0) {
    throw new Error(
      `Gagal mengunduh data Google Sheet. Pastikan izin akses link diatur ke: "Anyone with the link can view" (Siapa saja yang memiliki link sebagai Viewer) dan sheet memiliki baris data.`
    );
  }

  const items = parseSpreadsheetBuffer(csvText, targetType);

  return {
    items,
    rawRowCount: items.length,
  };
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 4. SUPABASE DATABASE SYNC ENGINE
// -------------------------------------------------------------

export function getStoredSupabaseConfig(): SupabaseConfig {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const envUrl = (metaEnv?.VITE_SUPABASE_URL ? String(metaEnv.VITE_SUPABASE_URL) : '').trim();
  const envKey = (metaEnv?.VITE_SUPABASE_ANON_KEY ? String(metaEnv.VITE_SUPABASE_ANON_KEY) : '').trim();

  const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE) : null;
  if (raw) {
    try {
      const parsed: SupabaseConfig = JSON.parse(raw);
      const effectiveUrl = parsed.url || envUrl;
      const effectiveKey = parsed.anonKey || envKey;
      return {
        url: effectiveUrl,
        anonKey: effectiveKey,
        autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true,
        lastSynced: parsed.lastSynced,
        status: parsed.status || (effectiveUrl && effectiveKey ? 'CONNECTED' : 'DISCONNECTED'),
      };
    } catch {
      // fallback
    }
  }

  return {
    url: envUrl,
    anonKey: envKey,
    autoSync: !!(envUrl && envKey),
    status: envUrl && envKey ? 'CONNECTED' : 'DISCONNECTED',
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SUPABASE, JSON.stringify(config));
  }
}

let supabaseClientCache: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const effectiveUrl = (url || getStoredSupabaseConfig().url || '').trim();
  const effectiveKey = (anonKey || getStoredSupabaseConfig().anonKey || '').trim();

  if (!effectiveUrl || !effectiveKey) return null;
  const keyHash = `${effectiveUrl}_${effectiveKey}`;
  if (supabaseClientCache && cachedKey === keyHash) {
    return supabaseClientCache;
  }
  try {
    const client = createClient(effectiveUrl, effectiveKey, {
      auth: { persistSession: false },
    });
    supabaseClientCache = client;
    cachedKey = keyHash;
    return client;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Real-time Background Mutation Sync Helpers (Write-Through)
// -------------------------------------------------------------

export async function syncSinglePlanToSupabase(plan: PlanRecord): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('mpcs_plans').upsert(
      {
        id: plan.id,
        dept_id: plan.deptId,
        bulan: plan.bulan,
        tahun: plan.tahun,
        plan_rw: plan.planRW,
        plan_os: plan.planOS,
        remarks: plan.remarks || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Background sync plan error:', err);
  }
}

export async function syncSingleActualToSupabase(actual: ActualRecord): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('mpcs_actuals').upsert(
      {
        id: actual.id,
        dept_id: actual.deptId,
        bulan: actual.bulan,
        tahun: actual.tahun,
        actual_rw: actual.actualRW,
        actual_os: actual.actualOS,
        remarks: actual.remarks || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Background sync actual error:', err);
  }
}

export async function syncSingleApprovalToSupabase(app: PendingApproval): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('mpcs_approvals').upsert(
      {
        id: app.id,
        dept_id: app.deptId,
        dept_name: app.deptName,
        bulan: app.bulan,
        tahun: app.tahun,
        actual_rw: app.actualRW,
        actual_os: app.actualOS,
        remarks: app.remarks || '',
        requested_by: app.requestedBy,
        requested_at: app.requestedAt,
        status: app.status,
        reviewed_by: app.reviewedBy || null,
        reviewed_at: app.reviewedAt || null,
        reject_reason: app.rejectReason || null,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Background sync approval error:', err);
  }
}

export async function syncSingleUserToSupabase(user: User): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client || !user) return;

    await client.from('mpcs_users').upsert(
      {
        user_id: user.userId,
        email: user.email || user.userId,
        nama: user.nama,
        role: user.role,
        dept_id: user.deptId,
        dept_name: user.deptName || '',
        password: user.password || '',
        pin: user.pin || '',
        phone: user.phone || '',
        title: user.title || '',
        avatar_color: user.avatarColor || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.warn('Background sync single user error:', err);
  }
}

export async function syncUsersToSupabase(users: User[]): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client || !users || users.length === 0) return;

    const formatted = users.map((u) => ({
      user_id: u.userId,
      email: u.email || u.userId,
      nama: u.nama,
      role: u.role,
      dept_id: u.deptId,
      dept_name: u.deptName || '',
      password: u.password || '',
      pin: u.pin || '',
      phone: u.phone || '',
      title: u.title || '',
      avatar_color: u.avatarColor || '',
      updated_at: new Date().toISOString(),
    }));

    await client.from('mpcs_users').upsert(formatted, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Background sync users error:', err);
  }
}

export async function deletePlanFromSupabase(id: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('mpcs_plans').delete().eq('id', id);
  } catch (err) {
    console.warn('Background delete plan error:', err);
  }
}

export async function deleteActualFromSupabase(id: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('mpcs_actuals').delete().eq('id', id);
  } catch (err) {
    console.warn('Background delete actual error:', err);
  }
}

// -------------------------------------------------------------
// Auto Sync on System Startup (Bootstrapping Engine)
// -------------------------------------------------------------

export async function autoSyncFromSupabase(
  actor: string = 'AUTO_LOAD'
): Promise<{
  success: boolean;
  pulledPlans: number;
  pulledActuals: number;
  pulledUsers: number;
  pulledApprovals: number;
  message: string;
}> {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return {
      success: false,
      pulledPlans: 0,
      pulledActuals: 0,
      pulledUsers: 0,
      pulledApprovals: 0,
      message: 'Supabase URL/Anon Key belum dikonfigurasi.',
    };
  }

  try {
    const client = getSupabaseClient(config.url, config.anonKey);
    if (!client) {
      return {
        success: false,
        pulledPlans: 0,
        pulledActuals: 0,
        pulledUsers: 0,
        pulledApprovals: 0,
        message: 'Inisialisasi klien Supabase gagal.',
      };
    }

    // 1. Fetch Plans
    const { data: plansData, error: plansError } = await client.from('mpcs_plans').select('*');
    // 2. Fetch Actuals
    const { data: actualsData, error: actualsError } = await client.from('mpcs_actuals').select('*');
    // 3. Fetch Users
    const { data: usersData, error: usersError } = await client.from('mpcs_users').select('*');
    // 4. Fetch Approvals
    const { data: approvalsData, error: appError } = await client.from('mpcs_approvals').select('*');
    // 5. Fetch Logs
    const { data: logsData, error: logError } = await client
      .from('mpcs_audit_logs')
      .select('*')
      .order('time', { ascending: false })
      .limit(300);

    const hasRemoteData =
      (plansData && plansData.length > 0) ||
      (actualsData && actualsData.length > 0) ||
      (usersData && usersData.length > 0);

    if (hasRemoteData) {
      if (plansData && Array.isArray(plansData) && plansData.length > 0) {
        const convertedPlans: PlanRecord[] = plansData.map((p) => ({
          id: p.id || `plan_${p.dept_id}_${p.tahun}_${p.bulan}`,
          deptId: p.dept_id,
          bulan: Number(p.bulan),
          tahun: Number(p.tahun),
          planRW: Number(p.plan_rw ?? p.planRW ?? 0),
          planOS: Number(p.plan_os ?? p.planOS ?? 0),
          remarks: p.remarks || '',
        }));
        saveStoredPlans(convertedPlans);
      }

      if (actualsData && Array.isArray(actualsData) && actualsData.length > 0) {
        const convertedActuals: ActualRecord[] = actualsData.map((a) => ({
          id: a.id || `act_${a.dept_id}_${a.tahun}_${a.bulan}`,
          deptId: a.dept_id,
          bulan: Number(a.bulan),
          tahun: Number(a.tahun),
          actualRW: Number(a.actual_rw ?? a.actualRW ?? 0),
          actualOS: Number(a.actual_os ?? a.actualOS ?? 0),
          remarks: a.remarks || '',
        }));
        saveStoredActuals(convertedActuals);
      }

      if (usersData && Array.isArray(usersData) && usersData.length > 0) {
        const convertedUsers: User[] = usersData.map((u) => ({
          userId: u.user_id || u.userId,
          email: u.email || u.user_id,
          nama: u.nama,
          role: u.role,
          deptId: u.dept_id || u.deptId,
          deptName: u.dept_name || u.deptName,
          password: u.password,
          pin: u.pin,
          phone: u.phone,
          title: u.title,
          avatarColor: u.avatar_color || u.avatarColor,
        }));
        
        // Merge with initial defaults if any missing
        const remoteIds = new Set(convertedUsers.map((u) => u.userId.toLowerCase()));
        INITIAL_USERS.forEach((initU) => {
          if (!remoteIds.has(initU.userId.toLowerCase())) {
            convertedUsers.push(initU);
          }
        });

        localStorage.setItem('mpcs_users_v2', JSON.stringify(convertedUsers));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mpcs_data_synced'));
        }
      }

      if (approvalsData && Array.isArray(approvalsData) && approvalsData.length > 0) {
        const convertedApprovals: PendingApproval[] = approvalsData.map((app) => ({
          id: app.id,
          deptId: app.dept_id || app.deptId,
          deptName: app.dept_name || app.deptName,
          bulan: Number(app.bulan),
          tahun: Number(app.tahun),
          actualRW: Number(app.actual_rw ?? app.actualRW ?? 0),
          actualOS: Number(app.actual_os ?? app.actualOS ?? 0),
          remarks: app.remarks || '',
          requestedBy: app.requested_by || app.requestedBy,
          requestedAt: app.requested_at || app.requestedAt,
          status: app.status,
          reviewedBy: app.reviewed_by || app.reviewedBy,
          reviewedAt: app.reviewed_at || app.reviewedAt,
          rejectReason: app.reject_reason || app.rejectReason,
        }));
        saveStoredApprovals(convertedApprovals);
      }

      if (logsData && Array.isArray(logsData) && logsData.length > 0) {
        const convertedLogs: AuditLog[] = logsData.map((l) => ({
          id: l.id,
          time: l.time,
          user: l.user_email || l.user,
          action: l.action,
          dept: l.dept,
          detail: l.detail,
        }));
        saveStoredAuditLogs(convertedLogs);
      }
    } else {
      // Remote Supabase is fresh/empty -> auto seed current dataset to Supabase!
      await pushAllDataToSupabase(config.url, config.anonKey, 'AUTO_INITIAL_SEED');
    }

    const updatedConfig: SupabaseConfig = {
      ...config,
      status: 'CONNECTED',
      lastSynced: new Date().toISOString(),
    };
    saveStoredSupabaseConfig(updatedConfig);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mpcs_data_synced'));
    }

    return {
      success: true,
      pulledPlans: plansData?.length || 0,
      pulledActuals: actualsData?.length || 0,
      pulledUsers: usersData?.length || 0,
      pulledApprovals: approvalsData?.length || 0,
      message: 'Data berhasil disinkronkan otomatis dengan database Supabase!',
    };
  } catch (err: any) {
    console.warn('Auto sync from Supabase notice:', err);
    return {
      success: false,
      pulledPlans: 0,
      pulledActuals: 0,
      pulledUsers: 0,
      pulledApprovals: 0,
      message: err.message || 'Gagal memuat otomatis dari Supabase',
    };
  }
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tablesExist: boolean }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL dan Anon Key Supabase wajib diisi.', tablesExist: false };
  }

  try {
    const client = getSupabaseClient(url, anonKey);
    if (!client) {
      return { success: false, message: 'Inisialisasi klien Supabase gagal.', tablesExist: false };
    }

    // Attempt a light ping by querying table or health
    const { error } = await client.from('mpcs_plans').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Tersambung ke Supabase! (Tabel `mpcs_plans` belum dibuat. Anda dapat menjalankan SQL Schema di bawah).',
          tablesExist: false,
        };
      }
      if (error.message.includes('Invalid API key') || error.code === '401' || error.code === 'PGRST301') {
        return {
          success: false,
          message: 'Autentikasi gagal: Anon Key atau URL Supabase salah.',
          tablesExist: false,
        };
      }
      return {
        success: true,
        message: `Tersambung ke Supabase (${error.message})`,
        tablesExist: false,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke database Supabase aktif & tabel siap disinkronkan!',
      tablesExist: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal tersambung ke server Supabase.',
      tablesExist: false,
    };
  }
}

export async function pushAllDataToSupabase(
  url: string,
  anonKey: string,
  actor: string
): Promise<{
  success: boolean;
  pushedPlans: number;
  pushedActuals: number;
  pushedUsers: number;
  pushedApprovals: number;
  pushedLogs: number;
  message: string;
}> {
  const client = getSupabaseClient(url, anonKey);
  if (!client) {
    throw new Error('Supabase client belum terkonfigurasi.');
  }

  const plans = getStoredPlans();
  const actuals = getStoredActuals();
  const users = getStoredUsers();
  const approvals = getStoredApprovals();
  const logs = getStoredAuditLogs();

  try {
    // 1. Upsert Plans
    if (plans.length > 0) {
      const formattedPlans = plans.map((p) => ({
        id: p.id,
        dept_id: p.deptId,
        bulan: p.bulan,
        tahun: p.tahun,
        plan_rw: p.planRW,
        plan_os: p.planOS,
        remarks: p.remarks || '',
        updated_at: new Date().toISOString(),
      }));

      const { error: planError } = await client
        .from('mpcs_plans')
        .upsert(formattedPlans, { onConflict: 'id' });

      if (planError) {
        throw new Error(`Gagal menyimpan data Plan ke Supabase: ${planError.message}`);
      }
    }

    // 2. Upsert Actuals
    if (actuals.length > 0) {
      const formattedActuals = actuals.map((a) => ({
        id: a.id,
        dept_id: a.deptId,
        bulan: a.bulan,
        tahun: a.tahun,
        actual_rw: a.actualRW,
        actual_os: a.actualOS,
        remarks: a.remarks || '',
        updated_at: new Date().toISOString(),
      }));

      const { error: actError } = await client
        .from('mpcs_actuals')
        .upsert(formattedActuals, { onConflict: 'id' });

      if (actError) {
        throw new Error(`Gagal menyimpan data Actual ke Supabase: ${actError.message}`);
      }
    }

    // 3. Upsert Users (Kredensial, Hak Akses, PIC)
    if (users.length > 0) {
      const formattedUsers = users.map((u) => ({
        user_id: u.userId,
        email: u.email || u.userId,
        nama: u.nama,
        role: u.role,
        dept_id: u.deptId,
        dept_name: u.deptName || '',
        password: u.password || '',
        pin: u.pin || '',
        phone: u.phone || '',
        title: u.title || '',
        avatar_color: u.avatarColor || '',
        updated_at: new Date().toISOString(),
      }));

      const { error: userError } = await client
        .from('mpcs_users')
        .upsert(formattedUsers, { onConflict: 'user_id' });

      if (userError) {
        console.warn('Notice on mpcs_users sync:', userError.message);
      }
    }

    // 4. Upsert Pending Approvals
    if (approvals.length > 0) {
      const formattedApprovals = approvals.map((app) => ({
        id: app.id,
        dept_id: app.deptId,
        dept_name: app.deptName,
        bulan: app.bulan,
        tahun: app.tahun,
        actual_rw: app.actualRW,
        actual_os: app.actualOS,
        remarks: app.remarks || '',
        requested_by: app.requestedBy,
        requested_at: app.requestedAt,
        status: app.status,
        reviewed_by: app.reviewedBy || null,
        reviewed_at: app.reviewedAt || null,
        reject_reason: app.rejectReason || null,
      }));

      const { error: appError } = await client
        .from('mpcs_approvals')
        .upsert(formattedApprovals, { onConflict: 'id' });

      if (appError) {
        console.warn('Notice on mpcs_approvals sync:', appError.message);
      }
    }

    // 5. Upsert Audit Logs
    if (logs.length > 0) {
      const formattedLogs = logs.slice(0, 200).map((l) => ({
        id: l.id,
        time: l.time,
        user_email: l.user,
        action: l.action,
        dept: l.dept,
        detail: l.detail,
      }));

      const { error: logError } = await client
        .from('mpcs_audit_logs')
        .upsert(formattedLogs, { onConflict: 'id' });

      if (logError) {
        console.warn('Notice on mpcs_audit_logs sync:', logError.message);
      }
    }

    addAuditLog(
      'SUPABASE_PUSH',
      `Berhasil upload seluruh data ke Supabase (${plans.length} plan, ${actuals.length} actual, ${users.length} user, ${approvals.length} approval)`,
      'ALL',
      actor
    );

    return {
      success: true,
      pushedPlans: plans.length,
      pushedActuals: actuals.length,
      pushedUsers: users.length,
      pushedApprovals: approvals.length,
      pushedLogs: logs.length,
      message: `Berhasil mengunggah ${plans.length} Plan, ${actuals.length} Realisasi Actual, ${users.length} Akun Pengguna, dan ${approvals.length} Approval ke Database Supabase.`,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Gagal mengirim data ke Supabase.');
  }
}

export async function pullAllDataFromSupabase(
  url: string,
  anonKey: string,
  actor: string
): Promise<{
  success: boolean;
  pulledPlans: number;
  pulledActuals: number;
  pulledUsers: number;
  pulledApprovals: number;
  pulledLogs: number;
}> {
  const client = getSupabaseClient(url, anonKey);
  if (!client) {
    throw new Error('Supabase client belum terkonfigurasi.');
  }

  try {
    let pulledPlansCount = 0;
    let pulledActualsCount = 0;
    let pulledUsersCount = 0;
    let pulledApprovalsCount = 0;
    let pulledLogsCount = 0;

    // 1. Fetch Plans
    const { data: plansData, error: plansError } = await client
      .from('mpcs_plans')
      .select('*');

    if (plansError) {
      throw new Error(`Gagal mengambil data Plan dari Supabase: ${plansError.message}`);
    }

    if (plansData && Array.isArray(plansData) && plansData.length > 0) {
      const convertedPlans: PlanRecord[] = plansData.map((p) => ({
        id: p.id || `plan_${p.dept_id}_${p.tahun}_${p.bulan}`,
        deptId: p.dept_id || p.deptId,
        bulan: Number(p.bulan),
        tahun: Number(p.tahun),
        planRW: Number(p.plan_rw ?? p.planRW ?? 0),
        planOS: Number(p.plan_os ?? p.planOS ?? 0),
        remarks: p.remarks || '',
      }));
      saveStoredPlans(convertedPlans);
      pulledPlansCount = convertedPlans.length;
    }

    // 2. Fetch Actuals
    const { data: actualsData, error: actualsError } = await client
      .from('mpcs_actuals')
      .select('*');

    if (actualsError) {
      throw new Error(`Gagal mengambil data Actual dari Supabase: ${actualsError.message}`);
    }

    if (actualsData && Array.isArray(actualsData) && actualsData.length > 0) {
      const convertedActuals: ActualRecord[] = actualsData.map((a) => ({
        id: a.id || `act_${a.dept_id}_${a.tahun}_${a.bulan}`,
        deptId: a.dept_id || a.deptId,
        bulan: Number(a.bulan),
        tahun: Number(a.tahun),
        actualRW: Number(a.actual_rw ?? a.actualRW ?? 0),
        actualOS: Number(a.actual_os ?? a.actualOS ?? 0),
        remarks: a.remarks || '',
      }));
      saveStoredActuals(convertedActuals);
      pulledActualsCount = convertedActuals.length;
    }

    // 3. Fetch Users
    const { data: usersData, error: usersError } = await client
      .from('mpcs_users')
      .select('*');

    if (!usersError && usersData && Array.isArray(usersData) && usersData.length > 0) {
      const convertedUsers: User[] = usersData.map((u) => ({
        userId: u.user_id || u.userId,
        email: u.email || u.user_id,
        nama: u.nama,
        role: u.role,
        deptId: u.dept_id || u.deptId,
        deptName: u.dept_name || u.deptName,
        password: u.password,
        pin: u.pin,
        phone: u.phone,
        title: u.title,
        avatarColor: u.avatar_color || u.avatarColor,
      }));
      saveStoredUsers(convertedUsers);
      pulledUsersCount = convertedUsers.length;
    }

    // 4. Fetch Approvals
    const { data: approvalsData, error: appError } = await client
      .from('mpcs_approvals')
      .select('*');

    if (!appError && approvalsData && Array.isArray(approvalsData) && approvalsData.length > 0) {
      const convertedApprovals: PendingApproval[] = approvalsData.map((app) => ({
        id: app.id,
        deptId: app.dept_id || app.deptId,
        deptName: app.dept_name || app.deptName,
        bulan: Number(app.bulan),
        tahun: Number(app.tahun),
        actualRW: Number(app.actual_rw ?? app.actualRW ?? 0),
        actualOS: Number(app.actual_os ?? app.actualOS ?? 0),
        remarks: app.remarks || '',
        requestedBy: app.requested_by || app.requestedBy,
        requestedAt: app.requested_at || app.requestedAt,
        status: app.status,
        reviewedBy: app.reviewed_by || app.reviewedBy,
        reviewedAt: app.reviewed_at || app.reviewedAt,
        rejectReason: app.reject_reason || app.rejectReason,
      }));
      saveStoredApprovals(convertedApprovals);
      pulledApprovalsCount = convertedApprovals.length;
    }

    // 5. Fetch Audit Logs
    const { data: logsData, error: logError } = await client
      .from('mpcs_audit_logs')
      .select('*')
      .order('time', { ascending: false })
      .limit(300);

    if (!logError && logsData && Array.isArray(logsData) && logsData.length > 0) {
      const convertedLogs: AuditLog[] = logsData.map((l) => ({
        id: l.id,
        time: l.time,
        user: l.user_email || l.user,
        action: l.action,
        dept: l.dept,
        detail: l.detail,
      }));
      saveStoredAuditLogs(convertedLogs);
      pulledLogsCount = convertedLogs.length;
    }

    addAuditLog(
      'SUPABASE_PULL',
      `Sinkronisasi dari Supabase: ${pulledPlansCount} plan, ${pulledActualsCount} actual, ${pulledUsersCount} user, ${pulledApprovalsCount} approval berhasil ditarik`,
      'ALL',
      actor
    );

    return {
      success: true,
      pulledPlans: pulledPlansCount,
      pulledActuals: pulledActualsCount,
      pulledUsers: pulledUsersCount,
      pulledApprovals: pulledApprovalsCount,
      pulledLogs: pulledLogsCount,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Gagal menarik data dari Supabase.');
  }
}

export function getSupabaseSQLSchema(): string {
  return `-- ============================================================
-- SQL SCHEMA FOR MPCS PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL, MOJOKERTO FACTORY (SUPABASE POSTGRESQL)
-- Salin dan jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.
-- ============================================================

-- 1. Tabel Master Budget Manpower (mpcs_plans)
CREATE TABLE IF NOT EXISTS public.mpcs_plans (
    id TEXT PRIMARY KEY,
    dept_id TEXT NOT NULL,
    bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
    tahun INTEGER NOT NULL,
    plan_rw INTEGER NOT NULL DEFAULT 0,
    plan_os INTEGER NOT NULL DEFAULT 0,
    remarks TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_plan_per_dept_period UNIQUE (dept_id, bulan, tahun)
);

-- 2. Tabel Realisasi Manpower (mpcs_actuals)
CREATE TABLE IF NOT EXISTS public.mpcs_actuals (
    id TEXT PRIMARY KEY,
    dept_id TEXT NOT NULL,
    bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
    tahun INTEGER NOT NULL,
    actual_rw INTEGER NOT NULL DEFAULT 0,
    actual_os INTEGER NOT NULL DEFAULT 0,
    remarks TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_actual_per_dept_period UNIQUE (dept_id, bulan, tahun)
);

-- 3. Tabel Akun & Hak Akses Pengguna (mpcs_users)
CREATE TABLE IF NOT EXISTS public.mpcs_users (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    nama TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'HR1', 'USER')),
    dept_id TEXT NOT NULL,
    dept_name TEXT,
    password TEXT,
    pin TEXT,
    phone TEXT,
    title TEXT,
    avatar_color TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Permohonan Approval Perubahan Realisasi (mpcs_approvals)
CREATE TABLE IF NOT EXISTS public.mpcs_approvals (
    id TEXT PRIMARY KEY,
    dept_id TEXT NOT NULL,
    dept_name TEXT NOT NULL,
    bulan INTEGER NOT NULL,
    tahun INTEGER NOT NULL,
    actual_rw INTEGER NOT NULL DEFAULT 0,
    actual_os INTEGER NOT NULL DEFAULT 0,
    remarks TEXT DEFAULT '',
    requested_by TEXT NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    reject_reason TEXT
);

-- 5. Tabel Catatan Audit Aktivitas Sistem (mpcs_audit_logs)
CREATE TABLE IF NOT EXISTS public.mpcs_audit_logs (
    id TEXT PRIMARY KEY,
    time TIMESTAMPTZ DEFAULT NOW(),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    dept TEXT DEFAULT '-',
    detail TEXT NOT NULL
);

-- 6. Enable Row Level Security (RLS) & Public Policies (Idempotent Safe)
ALTER TABLE public.mpcs_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpcs_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpcs_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpcs_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpcs_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if already created
DROP POLICY IF EXISTS "Allow public all for mpcs_plans" ON public.mpcs_plans;
DROP POLICY IF EXISTS "Allow public read-write for mpcs_plans" ON public.mpcs_plans;
CREATE POLICY "Allow public all for mpcs_plans" 
ON public.mpcs_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for mpcs_actuals" ON public.mpcs_actuals;
DROP POLICY IF EXISTS "Allow public read-write for mpcs_actuals" ON public.mpcs_actuals;
CREATE POLICY "Allow public all for mpcs_actuals" 
ON public.mpcs_actuals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for mpcs_users" ON public.mpcs_users;
CREATE POLICY "Allow public all for mpcs_users" 
ON public.mpcs_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for mpcs_approvals" ON public.mpcs_approvals;
DROP POLICY IF EXISTS "Allow public read-write for mpcs_approvals" ON public.mpcs_approvals;
CREATE POLICY "Allow public all for mpcs_approvals" 
ON public.mpcs_approvals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for mpcs_audit_logs" ON public.mpcs_audit_logs;
CREATE POLICY "Allow public all for mpcs_audit_logs" 
ON public.mpcs_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Indexing for high-speed reporting & analytics queries
CREATE INDEX IF NOT EXISTS idx_mpcs_plans_period ON public.mpcs_plans(dept_id, tahun, bulan);
CREATE INDEX IF NOT EXISTS idx_mpcs_actuals_period ON public.mpcs_actuals(dept_id, tahun, bulan);
CREATE INDEX IF NOT EXISTS idx_mpcs_users_role ON public.mpcs_users(role, dept_id);
CREATE INDEX IF NOT EXISTS idx_mpcs_approvals_status ON public.mpcs_approvals(status);
CREATE INDEX IF NOT EXISTS idx_mpcs_audit_logs_time ON public.mpcs_audit_logs(time DESC);
`;
}
