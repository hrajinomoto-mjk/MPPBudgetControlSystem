export const FISCAL_MONTH_LABELS: Record<number, string> = {
  1: 'Apr',
  2: 'Mei',
  3: 'Jun',
  4: 'Jul',
  5: 'Agu',
  6: 'Sep',
  7: 'Okt',
  8: 'Nov',
  9: 'Des',
  10: 'Jan',
  11: 'Feb',
  12: 'Mar',
};

export const CALENDAR_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const CALENDAR_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Calendar month (1=Jan .. 12=Dec) to Fiscal Month (1=Apr .. 12=Mar)
 */
export function getFiscalMonth(calendarMonth: number): number {
  return calendarMonth >= 4 ? calendarMonth - 3 : calendarMonth + 9;
}

/**
 * Fiscal Month (1=Apr .. 12=Mar) to Calendar Month (1=Jan .. 12=Dec)
 */
export function fiscalToCalendarMonth(fiscalMonth: number): number {
  return fiscalMonth <= 9 ? fiscalMonth + 3 : fiscalMonth - 9;
}

/**
 * Returns fiscal year based on calendar month and year (e.g. Apr 2025 -> FY 2025, Jan 2026 -> FY 2025)
 */
export function getFiscalYear(calendarMonth: number, calendarYear: number): number {
  const m = Number(calendarMonth);
  const y = Number(calendarYear);
  return m >= 4 ? y : y - 1;
}

/**
 * Returns current fiscal month based on today's calendar date
 */
export function getCurrentFiscalMonth(): number {
  const currentCalMonth = new Date().getMonth() + 1; // 1 - 12
  return getFiscalMonth(currentCalMonth);
}

/**
 * Formats FY string, e.g. "FY 2025/2026"
 */
export function formatFiscalYearLabel(fy: number): string {
  return `FY ${fy}/${fy + 1}`;
}
