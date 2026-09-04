import { DEPARTMENTS } from './initialData';

export interface DepartmentCapacityInfo {
  deptId: string;
  deptName: string;
  standardRW: number;
  standardOS: number;
  maxTotal: number;
  description?: string;
}

export const DEPARTMENT_CAPACITIES: Record<string, { standardRW: number; standardOS: number; maxTotal: number; description?: string }> = {
  D001: { standardRW: 75, standardOS: 45, maxTotal: 120, description: 'Lini Manufaktur Seasoning & MSG' },
  D002: { standardRW: 60, standardOS: 38, maxTotal: 98, description: 'Lini Packaging & Pengemasan Produk' },
  D003: { standardRW: 40, standardOS: 22, maxTotal: 62, description: 'Proses Bahan Baku Makanan 1' },
  D004: { standardRW: 35, standardOS: 20, maxTotal: 55, description: 'Proses Bahan Baku Makanan 2' },
  D005: { standardRW: 28, standardOS: 16, maxTotal: 44, description: 'Laminasi Film & Pembungkus' },
  D006: { standardRW: 15, standardOS: 4, maxTotal: 19, description: 'Perencanaan & Kontrol Produksi (PPIC)' },
  D007: { standardRW: 20, standardOS: 12, maxTotal: 32, description: 'Gudang & Kontrol Persediaan' },
  D008: { standardRW: 18, standardOS: 6, maxTotal: 24, description: 'Pengadaan & Ekspor Impor' },
  D009: { standardRW: 14, standardOS: 2, maxTotal: 16, description: 'Keunggulan Operasional Pabrik' },
  D010: { standardRW: 42, standardOS: 28, maxTotal: 70, description: 'Teknik, Utilitas Mesin & Perawatan' },
  D011: { standardRW: 24, standardOS: 10, maxTotal: 34, description: 'Penyedia Utilitas & Energi Pabrik' },
  D012: { standardRW: 16, standardOS: 5, maxTotal: 21, description: 'Manajemen Sumber Daya Manusia' },
  D013: { standardRW: 18, standardOS: 22, maxTotal: 40, description: 'Urusan Umum, Fasilitas & Driver' },
  D014: { standardRW: 22, standardOS: 14, maxTotal: 36, description: 'Pengembangan Pertanian & Bahan Alami' },
  D015: { standardRW: 12, standardOS: 4, maxTotal: 16, description: 'Keselamatan, Kesehatan Kerja & Lingkungan' },
  D016: { standardRW: 32, standardOS: 8, maxTotal: 40, description: 'Jaminan Kualitas & Inspeksi Produk' },
  D017: { standardRW: 50, standardOS: 30, maxTotal: 80, description: 'Operasional Pabrik Induk Produksi' },
  D018: { standardRW: 10, standardOS: 5, maxTotal: 15, description: 'Proyek Teknologi Informasi & Otomasi' },
  D019: { standardRW: 12, standardOS: 6, maxTotal: 18, description: 'Proses ITEC & Engineering Digital' },
  D020: { standardRW: 14, standardOS: 4, maxTotal: 18, description: 'Penjaminan Mutu Ekspor Ajinex' },
  D021: { standardRW: 4, standardOS: 1, maxTotal: 5, description: 'Manajemen Direksi NE' },
  D022: { standardRW: 4, standardOS: 1, maxTotal: 5, description: 'Manajemen Direksi NEX' },
  D023: { standardRW: 6, standardOS: 2, maxTotal: 8, description: 'Hukum, Kepatuhan & Regulasi' },
};

export const DEFAULT_DEPARTMENT_CAPACITY = {
  standardRW: 30,
  standardOS: 15,
  maxTotal: 45,
  description: 'Departemen Umum',
};

export function getDepartmentCapacity(deptIdOrName?: string): DepartmentCapacityInfo {
  if (!deptIdOrName) {
    return {
      deptId: 'D001',
      deptName: DEPARTMENTS[0]?.name || 'Food Production 1',
      ...DEPARTMENT_CAPACITIES['D001'],
    };
  }

  // Check direct deptId match
  const byId = DEPARTMENT_CAPACITIES[deptIdOrName];
  if (byId) {
    const deptObj = DEPARTMENTS.find((d) => d.id === deptIdOrName);
    return {
      deptId: deptIdOrName,
      deptName: deptObj?.name || deptIdOrName,
      ...byId,
    };
  }

  // Check by name or clean search
  const foundDept = DEPARTMENTS.find(
    (d) =>
      d.id.toLowerCase() === deptIdOrName.toLowerCase() ||
      d.name.toLowerCase() === deptIdOrName.toLowerCase() ||
      d.name.toLowerCase().includes(deptIdOrName.toLowerCase())
  );

  if (foundDept && DEPARTMENT_CAPACITIES[foundDept.id]) {
    return {
      deptId: foundDept.id,
      deptName: foundDept.name,
      ...DEPARTMENT_CAPACITIES[foundDept.id],
    };
  }

  return {
    deptId: foundDept?.id || deptIdOrName,
    deptName: foundDept?.name || deptIdOrName,
    ...DEFAULT_DEPARTMENT_CAPACITY,
  };
}

export interface CapacityValidationResult {
  deptId: string;
  deptName: string;
  standardRW: number;
  standardOS: number;
  maxTotal: number;
  currentRW: number;
  currentOS: number;
  currentTotal: number;
  isRWExceeded: boolean;
  isOSExceeded: boolean;
  isTotalExceeded: boolean;
  excessRW: number;
  excessOS: number;
  excessTotal: number;
  percentageRW: number;
  percentageOS: number;
  percentageTotal: number;
  hasExceeded: boolean;
  severity: 'normal' | 'warning' | 'critical';
  warningMessage: string | null;
  fieldWarnings: {
    rw: string | null;
    os: string | null;
    total: string | null;
  };
}

export function validateManpowerCapacity(
  deptIdOrName: string | undefined,
  rwInput: number | string,
  osInput: number | string
): CapacityValidationResult {
  const cap = getDepartmentCapacity(deptIdOrName);
  const rw = Number(rwInput) || 0;
  const os = Number(osInput) || 0;
  const currentTotal = rw + os;

  const isRWExceeded = rw > cap.standardRW;
  const isOSExceeded = os > cap.standardOS;
  const isTotalExceeded = currentTotal > cap.maxTotal;

  const excessRW = Math.max(0, rw - cap.standardRW);
  const excessOS = Math.max(0, os - cap.standardOS);
  const excessTotal = Math.max(0, currentTotal - cap.maxTotal);

  const percentageRW = cap.standardRW > 0 ? Math.round((rw / cap.standardRW) * 100) : 0;
  const percentageOS = cap.standardOS > 0 ? Math.round((os / cap.standardOS) * 100) : 0;
  const percentageTotal = cap.maxTotal > 0 ? Math.round((currentTotal / cap.maxTotal) * 100) : 0;

  const hasExceeded = isRWExceeded || isOSExceeded || isTotalExceeded;

  let severity: 'normal' | 'warning' | 'critical' = 'normal';
  if (percentageTotal > 125 || percentageRW > 130 || percentageOS > 140) {
    severity = 'critical';
  } else if (hasExceeded) {
    severity = 'warning';
  }

  let warningMessage: string | null = null;
  if (isTotalExceeded) {
    warningMessage = `Total Manpower (${currentTotal}) melebihi standar kapasitas ${cap.deptName} (${cap.maxTotal} orang) sebesar +${excessTotal} orang (${percentageTotal}%).`;
  } else if (isRWExceeded && isOSExceeded) {
    warningMessage = `Alokasi RW (+${excessRW}) dan OS (+${excessOS}) melebihi batas standar departemen.`;
  } else if (isRWExceeded) {
    warningMessage = `Jumlah Regular Worker (${rw}) melebihi kapasitas standar (${cap.standardRW} orang) sebesar +${excessRW} orang.`;
  } else if (isOSExceeded) {
    warningMessage = `Jumlah Outsource (${os}) melebihi kuota standar (${cap.standardOS} orang) sebesar +${excessOS} orang.`;
  }

  const fieldWarnings = {
    rw: isRWExceeded
      ? `Melebihi standar (${cap.standardRW} orang, +${excessRW})`
      : null,
    os: isOSExceeded
      ? `Melebihi standar (${cap.standardOS} orang, +${excessOS})`
      : null,
    total: isTotalExceeded
      ? `Melebihi kapasitas standar (${cap.maxTotal} orang, +${excessTotal})`
      : null,
  };

  return {
    deptId: cap.deptId,
    deptName: cap.deptName,
    standardRW: cap.standardRW,
    standardOS: cap.standardOS,
    maxTotal: cap.maxTotal,
    currentRW: rw,
    currentOS: os,
    currentTotal,
    isRWExceeded,
    isOSExceeded,
    isTotalExceeded,
    excessRW,
    excessOS,
    excessTotal,
    percentageRW,
    percentageOS,
    percentageTotal,
    hasExceeded,
    severity,
    warningMessage,
    fieldWarnings,
  };
}
