import * as XLSX from 'xlsx';
import { getDashboardData } from './storage';
import { getFiscalYear, CALENDAR_MONTH_SHORT } from './fiscal';

export function buildManpowerWorkbook(
  dept: string = 'ALL',
  bulan: number | string = 'ALL',
  tahun: number | string = 'ALL'
): { workbook: XLSX.WorkBook | null; rows: any[]; filename: string } {
  const allData = getDashboardData(
    dept,
    bulan === 'ALL' ? undefined : Number(bulan),
    tahun === 'ALL' ? undefined : Number(tahun)
  );

  if (allData.length === 0) {
    return { workbook: null, rows: [], filename: '' };
  }

  const rows = allData.map((d, index) => {
    const monthName = CALENDAR_MONTH_SHORT[d.bulan - 1] || String(d.bulan);
    const fy = getFiscalYear(d.bulan, d.tahun);
    return {
      'No': index + 1,
      'Dept ID': d.deptId,
      'Departemen': d.deptName,
      'Bulan': monthName,
      'Tahun': d.tahun,
      'Fiscal Year': `FY ${fy}`,
      'Plan RW': d.planRW,
      'Plan OS': d.planOS,
      'Total Plan': d.plan,
      'Actual RW': d.actualRW,
      'Actual OS': d.actualOS,
      'Total Actual': d.actual,
      'Gap (Variance)': d.gap,
      'Achievement (%)': d.achievement + '%',
      'Status': d.status,
      'Remarks': d.remarks || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 10 }, // Dept ID
    { wch: 30 }, // Departemen
    { wch: 8 },  // Bulan
    { wch: 8 },  // Tahun
    { wch: 12 }, // FY
    { wch: 10 }, // Plan RW
    { wch: 10 }, // Plan OS
    { wch: 12 }, // Total Plan
    { wch: 10 }, // Actual RW
    { wch: 10 }, // Actual OS
    { wch: 12 }, // Total Actual
    { wch: 14 }, // Gap
    { wch: 16 }, // Achievement
    { wch: 12 }, // Status
    { wch: 40 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Database Manpower');
  const filename = `Database_Manpower_${dept}_${bulan}_${tahun}.xlsx`;

  return { workbook, rows, filename };
}

export function getManpowerCsvString(
  dept: string = 'ALL',
  bulan: number | string = 'ALL',
  tahun: number | string = 'ALL'
): string {
  const { workbook } = buildManpowerWorkbook(dept, bulan, tahun);
  if (!workbook) return '';
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_csv(sheet);
}

export function getManpowerExcelBase64(
  dept: string = 'ALL',
  bulan: number | string = 'ALL',
  tahun: number | string = 'ALL'
): string {
  const { workbook } = buildManpowerWorkbook(dept, bulan, tahun);
  if (!workbook) return '';
  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}

export function exportFullManpowerExcel(
  dept: string = 'ALL',
  bulan: number | string = 'ALL',
  tahun: number | string = 'ALL'
): { success: boolean; filename: string; totalRows: number } {
  const { workbook, rows, filename } = buildManpowerWorkbook(dept, bulan, tahun);
  if (!workbook || rows.length === 0) {
    return { success: false, filename: '', totalRows: 0 };
  }

  XLSX.writeFile(workbook, filename);
  return { success: true, filename, totalRows: rows.length };
}

export function exportUserDepartmentExcel(
  deptId: string,
  bulan: number | string = 'ALL',
  tahun: number | string = 'ALL'
): { success: boolean; filename: string; totalRows: number } {
  const data = getDashboardData(
    deptId,
    bulan === 'ALL' ? undefined : Number(bulan),
    tahun === 'ALL' ? undefined : Number(tahun)
  );

  if (data.length === 0) {
    return { success: false, filename: '', totalRows: 0 };
  }

  const rows = data.map((d, index) => {
    const monthName = CALENDAR_MONTH_SHORT[d.bulan - 1] || String(d.bulan);
    const fy = getFiscalYear(d.bulan, d.tahun);
    return {
      'No': index + 1,
      'Bulan': monthName,
      'Tahun': d.tahun,
      'Fiscal Year': `FY ${fy}`,
      'Plan RW': d.planRW,
      'Plan OS': d.planOS,
      'Total Plan': d.plan,
      'Actual RW': d.actualRW,
      'Actual OS': d.actualOS,
      'Total Actual': d.actual,
      'Gap (Variance)': d.gap,
      'Achievement (%)': d.achievement + '%',
      'Status': d.status,
      'Remarks': d.remarks || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 45 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Manpower_${deptId}`);

  const filename = `Database_Manpower_${deptId}_${bulan}_${tahun}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return { success: true, filename, totalRows: rows.length };
}

export function getUserDepartmentCsvString(
  deptId: string,
  bulan: number | string = 'ALL',
  tahun: number | string = 'ALL'
): string {
  const data = getDashboardData(
    deptId,
    bulan === 'ALL' ? undefined : Number(bulan),
    tahun === 'ALL' ? undefined : Number(tahun)
  );

  if (data.length === 0) return '';
  const rows = data.map((d, index) => ({
    'No': index + 1,
    'Bulan': CALENDAR_MONTH_SHORT[d.bulan - 1] || String(d.bulan),
    'Tahun': d.tahun,
    'Fiscal Year': `FY ${getFiscalYear(d.bulan, d.tahun)}`,
    'Plan RW': d.planRW,
    'Plan OS': d.planOS,
    'Total Plan': d.plan,
    'Actual RW': d.actualRW,
    'Actual OS': d.actualOS,
    'Total Actual': d.actual,
    'Gap (Variance)': d.gap,
    'Achievement (%)': d.achievement + '%',
    'Status': d.status,
    'Remarks': d.remarks || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Manpower_${deptId}`);
  return XLSX.utils.sheet_to_csv(worksheet);
}

export function exportAuditLogsCSV(deptId: string = 'ALL', onError?: (msg: string) => void): boolean {
  const rawLogs = localStorage.getItem('mpcs_logs_v2');
  let logs: any[] = [];
  try {
    logs = rawLogs ? JSON.parse(rawLogs) : [];
  } catch {
    logs = [];
  }

  if (deptId !== 'ALL') {
    logs = logs.filter((l) => l.dept === deptId || l.dept === 'ALL' || l.dept === '-');
  }

  if (logs.length === 0) {
    if (onError) {
      onError('Tidak ada log aktivitas untuk diunduh.');
    }
    return false;
  }

  const rows = logs.map((l) => ({
    'Waktu': new Date(l.time).toLocaleString('id-ID'),
    'User': l.user,
    'Aksi': l.action,
    'Departemen': l.dept,
    'Detail': l.detail,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

  XLSX.writeFile(workbook, `Activity_Log_${deptId}_${Date.now()}.csv`, { bookType: 'csv' });
  return true;
}
