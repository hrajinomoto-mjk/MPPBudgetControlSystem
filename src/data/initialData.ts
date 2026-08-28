import { Department, User, PlanRecord, ActualRecord, PendingApproval, AuditLog, PushNotification } from '../types';

export const DEPARTMENTS: Department[] = [
  { id: 'D001', name: 'Food Production 1' },
  { id: 'D002', name: 'Food Production 2' },
  { id: 'D003', name: 'Food Ingredients 1' },
  { id: 'D004', name: 'Food Ingredients 2' },
  { id: 'D005', name: 'Film & Lamination' },
  { id: 'D006', name: 'Production Planning & Control' },
  { id: 'D007', name: 'Inventory Control' },
  { id: 'D008', name: 'Procurement & EXIM' },
  { id: 'D009', name: 'Factory Operational Excellence' },
  { id: 'D010', name: 'Engineering & Maintenance' },
  { id: 'D011', name: 'Utility' },
  { id: 'D012', name: 'Human Resource' },
  { id: 'D013', name: 'General Affairs' },
  { id: 'D014', name: 'Agri Development' },
  { id: 'D015', name: 'Health Safety & Environment' },
  { id: 'D016', name: 'Quality Assurance' },
  { id: 'D017', name: 'Production' },
  { id: 'D018', name: 'ITEC Project' },
  { id: 'D019', name: 'ITEC Process' },
  { id: 'D020', name: 'Quality Assurance NEX' },
  { id: 'D021', name: 'Direktur NE' },
  { id: 'D022', name: 'Direktur NEX' },
  { id: 'D023', name: 'Legal' },
];

export const INITIAL_USERS: User[] = [
  {
    userId: 'admin@ajinomoto.co.id',
    email: 'admin@ajinomoto.co.id',
    nama: 'Administrator HR',
    role: 'ADMIN',
    deptId: 'ALL',
    deptName: 'All Departments',
    password: 'admin',
    phone: '0812-9988-7711',
    title: 'Super Administrator & HR Strategic Head',
    avatarColor: 'red',
    pin: '123456',
  },
  {
    userId: 'hr_analyst@ajinomoto.co.id',
    email: 'hr_analyst@ajinomoto.co.id',
    nama: 'Mahmud Nurdiansyah',
    role: 'HR1',
    deptId: 'D012',
    deptName: 'Human Resource',
    password: 'admin',
    phone: '0813-4455-6677',
    title: 'HR Analyst & Budget Specialist',
    avatarColor: 'indigo',
    pin: '123456',
  },
  // 23 Department Users (D001 - D023)
  {
    userId: 'd001@ajinomoto.co.id',
    email: 'd001@ajinomoto.co.id',
    nama: 'Budi Santoso (FP1)',
    role: 'USER',
    deptId: 'D001',
    deptName: 'Food Production 1',
    password: 'user123',
    phone: '0857-1122-3301',
    title: 'Section Coordinator • Food Production 1',
    avatarColor: 'emerald',
    pin: '123456',
  },
  {
    userId: 'd002@ajinomoto.co.id',
    email: 'd002@ajinomoto.co.id',
    nama: 'Rahmat Hidayat (FP2)',
    role: 'USER',
    deptId: 'D002',
    deptName: 'Food Production 2',
    password: 'user123',
    phone: '0857-1122-3302',
    title: 'Section Coordinator • Food Production 2',
    avatarColor: 'emerald',
    pin: '123456',
  },
  {
    userId: 'd003@ajinomoto.co.id',
    email: 'd003@ajinomoto.co.id',
    nama: 'Hendro Prasetyo (FI1)',
    role: 'USER',
    deptId: 'D003',
    deptName: 'Food Ingredients 1',
    password: 'user123',
    phone: '0857-1122-3303',
    title: 'Section Coordinator • Food Ingredients 1',
    avatarColor: 'amber',
    pin: '123456',
  },
  {
    userId: 'd004@ajinomoto.co.id',
    email: 'd004@ajinomoto.co.id',
    nama: 'Dewi Lestari (FI2)',
    role: 'USER',
    deptId: 'D004',
    deptName: 'Food Ingredients 2',
    password: 'user123',
    phone: '0857-1122-3304',
    title: 'Section Coordinator • Food Ingredients 2',
    avatarColor: 'amber',
    pin: '123456',
  },
  {
    userId: 'd005@ajinomoto.co.id',
    email: 'd005@ajinomoto.co.id',
    nama: 'Yusuf Firmansyah (FL)',
    role: 'USER',
    deptId: 'D005',
    deptName: 'Film & Lamination',
    password: 'user123',
    phone: '0857-1122-3305',
    title: 'Section Coordinator • Film & Lamination',
    avatarColor: 'purple',
    pin: '123456',
  },
  {
    userId: 'd006@ajinomoto.co.id',
    email: 'd006@ajinomoto.co.id',
    nama: 'Ari Wibisono (PPC)',
    role: 'USER',
    deptId: 'D006',
    deptName: 'Production Planning & Control',
    password: 'user123',
    phone: '0857-1122-3306',
    title: 'Planning Specialist • PPC',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd007@ajinomoto.co.id',
    email: 'd007@ajinomoto.co.id',
    nama: 'Bambang Sutrisno (IC)',
    role: 'USER',
    deptId: 'D007',
    deptName: 'Inventory Control',
    password: 'user123',
    phone: '0857-1122-3307',
    title: 'Inventory Officer • Inventory Control',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd008@ajinomoto.co.id',
    email: 'd008@ajinomoto.co.id',
    nama: 'Farida Nur Aini (EXIM)',
    role: 'USER',
    deptId: 'D008',
    deptName: 'Procurement & EXIM',
    password: 'user123',
    phone: '0857-1122-3308',
    title: 'Procurement Lead • Procurement & EXIM',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd009@ajinomoto.co.id',
    email: 'd009@ajinomoto.co.id',
    nama: 'Gita Permata (FOE)',
    role: 'USER',
    deptId: 'D009',
    deptName: 'Factory Operational Excellence',
    password: 'user123',
    phone: '0857-1122-3309',
    title: 'Excellence Officer • FOE',
    avatarColor: 'red',
    pin: '123456',
  },
  {
    userId: 'd010@ajinomoto.co.id',
    email: 'd010@ajinomoto.co.id',
    nama: 'Agus Wibowo (EM)',
    role: 'USER',
    deptId: 'D010',
    deptName: 'Engineering & Maintenance',
    password: 'user123',
    phone: '0819-3322-1110',
    title: 'Maintenance Officer • Engineering & Maintenance',
    avatarColor: 'amber',
    pin: '123456',
  },
  {
    userId: 'd011@ajinomoto.co.id',
    email: 'd011@ajinomoto.co.id',
    nama: 'Kurniawan Pratama (UTL)',
    role: 'USER',
    deptId: 'D011',
    deptName: 'Utility',
    password: 'user123',
    phone: '0857-1122-3311',
    title: 'Utility Section Head • Utility',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd012@ajinomoto.co.id',
    email: 'd012@ajinomoto.co.id',
    nama: 'Nurul Hidayati (HR)',
    role: 'USER',
    deptId: 'D012',
    deptName: 'Human Resource',
    password: 'user123',
    phone: '0857-1122-3312',
    title: 'HR Staff • Human Resource',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd013@ajinomoto.co.id',
    email: 'd013@ajinomoto.co.id',
    nama: 'Hadi Prayitno (GA)',
    role: 'USER',
    deptId: 'D013',
    deptName: 'General Affairs',
    password: 'user123',
    phone: '0857-1122-3313',
    title: 'General Affairs Officer • GA',
    avatarColor: 'slate',
    pin: '123456',
  },
  {
    userId: 'd014@ajinomoto.co.id',
    email: 'd014@ajinomoto.co.id',
    nama: 'Dr. Joko Supriyanto (AGRI)',
    role: 'USER',
    deptId: 'D014',
    deptName: 'Agri Development',
    password: 'user123',
    phone: '0857-1122-3314',
    title: 'Agri Specialist • Agri Development',
    avatarColor: 'emerald',
    pin: '123456',
  },
  {
    userId: 'd015@ajinomoto.co.id',
    email: 'd015@ajinomoto.co.id',
    nama: 'Faisal Akbar (HSE)',
    role: 'USER',
    deptId: 'D015',
    deptName: 'Health Safety & Environment',
    password: 'user123',
    phone: '0857-1122-3315',
    title: 'Safety Officer • HSE',
    avatarColor: 'emerald',
    pin: '123456',
  },
  {
    userId: 'd016@ajinomoto.co.id',
    email: 'd016@ajinomoto.co.id',
    nama: 'Siti Rahmawati (QA)',
    role: 'USER',
    deptId: 'D016',
    deptName: 'Quality Assurance',
    password: 'user123',
    phone: '0878-8877-6616',
    title: 'Senior QA Analyst • Quality Assurance',
    avatarColor: 'purple',
    pin: '123456',
  },
  {
    userId: 'd017@ajinomoto.co.id',
    email: 'd017@ajinomoto.co.id',
    nama: 'Wahyu Nugroho (PRD)',
    role: 'USER',
    deptId: 'D017',
    deptName: 'Production',
    password: 'user123',
    phone: '0857-1122-3317',
    title: 'Production Lead • Production',
    avatarColor: 'red',
    pin: '123456',
  },
  {
    userId: 'd018@ajinomoto.co.id',
    email: 'd018@ajinomoto.co.id',
    nama: 'Doni Iskandar (ITEC-PRJ)',
    role: 'USER',
    deptId: 'D018',
    deptName: 'ITEC Project',
    password: 'user123',
    phone: '0857-1122-3318',
    title: 'Project Lead • ITEC Project',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd019@ajinomoto.co.id',
    email: 'd019@ajinomoto.co.id',
    nama: 'Eko Prasetya (ITEC-PRC)',
    role: 'USER',
    deptId: 'D019',
    deptName: 'ITEC Process',
    password: 'user123',
    phone: '0857-1122-3319',
    title: 'Process Engineer • ITEC Process',
    avatarColor: 'indigo',
    pin: '123456',
  },
  {
    userId: 'd020@ajinomoto.co.id',
    email: 'd020@ajinomoto.co.id',
    nama: 'Sri Wahyuni (QA-NEX)',
    role: 'USER',
    deptId: 'D020',
    deptName: 'Quality Assurance NEX',
    password: 'user123',
    phone: '0857-1122-3320',
    title: 'QA Specialist • QA NEX',
    avatarColor: 'purple',
    pin: '123456',
  },
  {
    userId: 'd021@ajinomoto.co.id',
    email: 'd021@ajinomoto.co.id',
    nama: 'Sekretariat Direktur NE',
    role: 'USER',
    deptId: 'D021',
    deptName: 'Direktur NE',
    password: 'user123',
    phone: '0857-1122-3321',
    title: 'Executive Assistant • Direktur NE',
    avatarColor: 'slate',
    pin: '123456',
  },
  {
    userId: 'd022@ajinomoto.co.id',
    email: 'd022@ajinomoto.co.id',
    nama: 'Sekretariat Direktur NEX',
    role: 'USER',
    deptId: 'D022',
    deptName: 'Direktur NEX',
    password: 'user123',
    phone: '0857-1122-3322',
    title: 'Executive Assistant • Direktur NEX',
    avatarColor: 'slate',
    pin: '123456',
  },
  {
    userId: 'd023@ajinomoto.co.id',
    email: 'd023@ajinomoto.co.id',
    nama: 'Rina Kusuma, S.H. (Legal)',
    role: 'USER',
    deptId: 'D023',
    deptName: 'Legal',
    password: 'user123',
    phone: '0857-1122-3323',
    title: 'Legal Counsel • Legal & Compliance',
    avatarColor: 'slate',
    pin: '123456',
  },
];

// Helper to generate seed data for 2025 and 2026
function generateSeedData(): { plans: PlanRecord[]; actuals: ActualRecord[] } {
  const plans: PlanRecord[] = [];
  const actuals: ActualRecord[] = [];

  const baseValues: Record<string, { rw: number; os: number }> = {
    D001: { rw: 75, os: 45 },
    D002: { rw: 60, os: 38 },
    D003: { rw: 40, os: 22 },
    D004: { rw: 35, os: 20 },
    D005: { rw: 28, os: 16 },
    D006: { rw: 15, os: 4 },
    D007: { rw: 20, os: 12 },
    D008: { rw: 18, os: 6 },
    D009: { rw: 14, os: 2 },
    D010: { rw: 42, os: 28 },
    D011: { rw: 24, os: 10 },
    D012: { rw: 16, os: 5 },
    D013: { rw: 18, os: 22 },
    D014: { rw: 22, os: 14 },
    D015: { rw: 12, os: 4 },
    D016: { rw: 32, os: 8 },
    D017: { rw: 50, os: 30 },
    D018: { rw: 10, os: 5 },
    D019: { rw: 12, os: 6 },
    D020: { rw: 14, os: 4 },
    D021: { rw: 4, os: 1 },
    D022: { rw: 4, os: 1 },
    D023: { rw: 6, os: 2 },
  };

  const years = [2025, 2026];
  let pIdx = 1;
  let aIdx = 1;

  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      for (const dept of DEPARTMENTS) {
        const base = baseValues[dept.id] || { rw: 15, os: 5 };
        
        // Plan fluctuation
        const planVarRW = Math.sin((month + dept.id.charCodeAt(2)) * 0.7) * 2;
        const planVarOS = Math.cos((month + dept.id.charCodeAt(3)) * 0.5) * 2;
        const pRW = Math.max(1, Math.round(base.rw + planVarRW));
        const pOS = Math.max(0, Math.round(base.os + planVarOS));

        const pId = `MP${String(pIdx++).padStart(3, '0')}`;
        plans.push({
          id: pId,
          deptId: dept.id,
          bulan: month,
          tahun: year,
          planRW: pRW,
          planOS: pOS,
          remarks: month === 4 ? 'Budget awal tahun fiscal' : '',
        });

        // Actual fluctuation (some over, some optimal, some under)
        const seed = (month * 17 + dept.id.charCodeAt(3) * 11) % 10;
        let actVarRW = 0;
        let actVarOS = 0;
        let remarks = 'Realisasi operasional berjalan stabil.';

        if (seed >= 8) {
          actVarOS = 4;
          actVarRW = 2;
          remarks = 'Overtime & penambahan OS karena peak season produksi.';
        } else if (seed <= 2) {
          actVarOS = -3;
          remarks = 'Kendala pemenuhan tenaga kerja OS dari vendor.';
        } else if (seed === 5) {
          actVarRW = 1;
          remarks = 'Penyesuaian shift produksi reguler.';
        }

        const aRW = Math.max(1, pRW + actVarRW);
        const aOS = Math.max(0, pOS + actVarOS);
        const aId = `MR${String(aIdx++).padStart(3, '0')}`;

        actuals.push({
          id: aId,
          deptId: dept.id,
          bulan: month,
          tahun: year,
          actualRW: aRW,
          actualOS: aOS,
          remarks,
        });
      }
    }
  }

  return { plans, actuals };
}

const seed = generateSeedData();
export const INITIAL_PLANS: PlanRecord[] = seed.plans;
export const INITIAL_ACTUALS: ActualRecord[] = seed.actuals;

export const INITIAL_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'REQ1740001',
    deptId: 'D001',
    deptName: 'Food Production 1',
    bulan: 4,
    tahun: 2026,
    actualRW: 78,
    actualOS: 49,
    remarks: 'Penambahan operator OS 4 orang untuk line packaging darurat shift 3',
    requestedBy: 'fp1_user@ajinomoto.co.id',
    requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'PENDING',
  },
  {
    id: 'REQ1740002',
    deptId: 'D010',
    deptName: 'Engineering & Maintenance',
    bulan: 4,
    tahun: 2026,
    actualRW: 44,
    actualOS: 32,
    remarks: 'Overhaul tahunan boiler dan utility system butuh teknisi spesialis',
    requestedBy: 'maint_user@ajinomoto.co.id',
    requestedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'PENDING',
  },
  {
    id: 'REQ1740003',
    deptId: 'D016',
    deptName: 'Quality Assurance',
    bulan: 4,
    tahun: 2026,
    actualRW: 33,
    actualOS: 8,
    remarks: 'Penyesuaian audit sertifikasi FSSC 22000',
    requestedBy: 'qa_user@ajinomoto.co.id',
    requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'APPROVED',
    reviewedBy: 'admin@ajinomoto.co.id',
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-101',
    time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: 'admin@ajinomoto.co.id',
    action: 'LOGIN',
    dept: 'HR Development',
    detail: 'User login via Web Security Gateway (Biometric Verified)',
  },
  {
    id: 'LOG-102',
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user: 'fp1_user@ajinomoto.co.id',
    action: 'REQUEST UPDATE ACTUAL',
    dept: 'D001',
    detail: 'Menunggu approval — RW:78 OS:49 line packaging shift 3',
  },
  {
    id: 'LOG-103',
    time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    user: 'admin@ajinomoto.co.id',
    action: 'APPROVE UPDATE ACTUAL',
    dept: 'D016',
    detail: 'Request REQ1740003 disetujui untuk audit sertifikasi FSSC 22000',
  },
  {
    id: 'LOG-104',
    time: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    user: 'SYSTEM',
    action: 'AUTO SYNC & BACKUP',
    dept: 'ALL',
    detail: 'Cloud snapshot synchronized with E2E SHA-256 integrity hash verification',
  },
];

export const INITIAL_NOTIFICATIONS: PushNotification[] = [
  {
    id: 'NOTIF-1',
    title: '⚠️ Permintaan Approval Baru',
    message: 'Food Production 1 mengajukan penambahan 4 Outsource untuk shift 3.',
    type: 'urgent',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    read: false,
    deptId: 'D001',
    linkAction: 'APPROVALS',
  },
  {
    id: 'NOTIF-2',
    title: '📊 Peringatan Kapasitas Manpower',
    message: 'Engineering & Maintenance tercatat Over Budget (>108%) pada periode aktif.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
    deptId: 'D010',
    linkAction: 'DASHBOARD',
  },
  {
    id: 'NOTIF-3',
    title: '☁️ Cloud Synchronized',
    message: 'Sinkronisasi cloud otomatis database manpower berhasil tanpa konflik.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    read: true,
  },
];
