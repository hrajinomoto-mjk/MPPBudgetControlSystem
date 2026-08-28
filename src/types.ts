export type Role = 'ADMIN' | 'HR1' | 'USER';

export interface Department {
  id: string; // e.g. "D001"
  name: string; // e.g. "Food Production 1"
}

export interface User {
  userId: string;
  email: string;
  nama: string;
  role: Role;
  deptId: string;
  deptName?: string;
  password?: string;
  pin?: string;
  phone?: string;
  title?: string;
  avatarColor?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface AlertModalOptions {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface PlanRecord {
  id: string;
  deptId: string;
  bulan: number; // 1 - 12
  tahun: number; // e.g. 2025, 2026
  planRW: number;
  planOS: number;
  remarks?: string;
}

export interface ActualRecord {
  id: string;
  deptId: string;
  bulan: number; // 1 - 12
  tahun: number; // e.g. 2025, 2026
  actualRW: number;
  actualOS: number;
  remarks?: string;
}

export interface DashboardItem {
  deptId: string;
  deptName: string;
  bulan: number;
  tahun: number;
  plan: number;
  planRW: number;
  planOS: number;
  actual: number;
  actualRW: number;
  actualOS: number;
  gap: number;
  achievement: number;
  status: 'OVER' | 'OPTIMAL' | 'UNDER';
  remarks: string;
}

export interface PendingApproval {
  id: string;
  deptId: string;
  deptName: string;
  bulan: number;
  tahun: number;
  actualRW: number;
  actualOS: number;
  remarks: string;
  requestedBy: string;
  requestedAt: string; // ISO string
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  dept: string;
  detail: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
  deptId?: string;
  linkAction?: string;
}

export type NotificationItem = PushNotification;

export interface CloudSyncState {
  isOnline: boolean;
  lastSynced: string | null;
  syncInProgress: boolean;
  pendingSyncCount: number;
  autoSync: boolean;
  encryptionActive: boolean;
}

export interface AutomatedReportConfig {
  enabled: boolean;
  frequency: 'end_of_month' | 'weekly' | 'biweekly';
  format: 'pdf' | 'excel' | 'both';
  recipients: string[];
  lastDispatched?: string;
  nextScheduled?: string;
}

export interface GoogleSheetsConfig {
  sheetUrl: string;
  sheetName?: string;
  autoSync: boolean;
  lastSynced?: string;
  targetType: 'PLAN' | 'ACTUAL' | 'BOTH';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
  lastSynced?: string;
  status: 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
  errorMessage?: string;
}

export interface ImportPreviewItem {
  id?: string;
  deptId: string;
  deptName?: string;
  bulan: number;
  tahun: number;
  planRW?: number;
  planOS?: number;
  actualRW?: number;
  actualOS?: number;
  remarks?: string;
  isValid: boolean;
  errors: string[];
}

export interface ImportResult {
  successCount: number;
  errorCount: number;
  skippedCount: number;
  details: string[];
}

export type ActivePage = 'DASHBOARD' | 'PLAN' | 'REAL' | 'APPROVALS' | 'AUDIT_LOG' | 'SETTINGS';
