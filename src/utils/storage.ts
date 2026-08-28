import {
  Department,
  User,
  PlanRecord,
  ActualRecord,
  PendingApproval,
  AuditLog,
  PushNotification,
  DashboardItem,
  CloudSyncState,
  AutomatedReportConfig,
} from '../types';
import {
  DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_PLANS,
  INITIAL_ACTUALS,
  INITIAL_PENDING_APPROVALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import { getFiscalYear, getFiscalMonth } from './fiscal';
import {
  syncSinglePlanToSupabase,
  syncSingleActualToSupabase,
  syncSingleApprovalToSupabase,
  syncSingleUserToSupabase,
  syncUsersToSupabase,
  deletePlanFromSupabase,
  deleteActualFromSupabase,
} from './integrations';

const STORAGE_KEYS = {
  USERS: 'mpcs_users_v2',
  SESSION: 'mpcs_session_v2',
  PLANS: 'mpcs_plans_v2',
  ACTUALS: 'mpcs_actuals_v2',
  APPROVALS: 'mpcs_approvals_v2',
  LOGS: 'mpcs_logs_v2',
  NOTIFS: 'mpcs_notifs_v2',
  THEME: 'mpcs_theme_v2',
  SYNC: 'mpcs_sync_v2',
  REPORT_CONFIG: 'mpcs_report_config_v2',
  ENCRYPTION_KEY: 'mpcs_e2e_key_v2',
};

// Simple cryptographic integrity hash simulation
export function calculateIntegrityHash(dataString: string): string {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'SHA256-' + Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

export function getStoredTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'light';
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

// User & Session
export function getStoredUsers(): User[] {
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed: User[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map((u) => u.userId.toLowerCase()));
    let hasNew = false;
    INITIAL_USERS.forEach((u) => {
      if (!existingIds.has(u.userId.toLowerCase())) {
        parsed.push(u);
        hasNew = true;
      }
    });
    if (hasNew) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  // Background write-through to Supabase
  syncUsersToSupabase(users);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mpcs_data_synced'));
  }
}

export function updateUserProfile(updatedUser: User): User[] {
  const currentUsers = getStoredUsers();
  const index = currentUsers.findIndex(
    (u) =>
      u.userId.toLowerCase() === updatedUser.userId.toLowerCase() ||
      (u.email && updatedUser.email && u.email.toLowerCase() === updatedUser.email.toLowerCase()) ||
      (u.role === updatedUser.role && u.deptId === updatedUser.deptId && u.deptId !== 'ALL')
  );

  let updatedUsers: User[];
  if (index >= 0) {
    updatedUsers = [...currentUsers];
    updatedUsers[index] = { ...updatedUsers[index], ...updatedUser };
  } else {
    updatedUsers = [...currentUsers, updatedUser];
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
  setCurrentSession(updatedUser);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('mpcs_active_session', JSON.stringify(updatedUser));
  }

  // Real-time write-through to Supabase cloud
  syncSingleUserToSupabase(updatedUser);
  syncUsersToSupabase(updatedUsers);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mpcs_data_synced'));
    window.dispatchEvent(new CustomEvent('mpcs_user_updated', { detail: updatedUser }));
  }

  return updatedUsers;
}

export function getCurrentSession(): User | null {
  const raw = sessionStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentSession(user: User | null): void {
  if (user) {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// Plans & Actuals
export function getStoredPlans(): PlanRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    return INITIAL_PLANS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_PLANS;
  }
}

export function saveStoredPlans(plans: PlanRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
}

export function getStoredActuals(): ActualRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.ACTUALS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.ACTUALS, JSON.stringify(INITIAL_ACTUALS));
    return INITIAL_ACTUALS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_ACTUALS;
  }
}

export function saveStoredActuals(actuals: ActualRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.ACTUALS, JSON.stringify(actuals));
}

// Approvals
export function getStoredApprovals(): PendingApproval[] {
  const raw = localStorage.getItem(STORAGE_KEYS.APPROVALS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(INITIAL_PENDING_APPROVALS));
    return INITIAL_PENDING_APPROVALS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_PENDING_APPROVALS;
  }
}

export function saveStoredApprovals(approvals: PendingApproval[]): void {
  localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(approvals));
}

// Audit Logs
export function getStoredAuditLogs(): AuditLog[] {
  const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveStoredAuditLogs(logs: AuditLog[]): void {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function addAuditLog(action: string, detail: string, dept: string = '-', userEmail: string = 'SYSTEM'): void {
  const logs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: 'LOG-' + Date.now(),
    time: new Date().toISOString(),
    user: userEmail,
    action,
    dept,
    detail,
  };
  const updated = [newLog, ...logs].slice(0, 500); // keep 500 most recent
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
}

// Notifications
export function getStoredNotifications(): PushNotification[] {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTIFS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function addNotification(notif: Omit<PushNotification, 'id' | 'timestamp' | 'read'>): void {
  const notifs = getStoredNotifications();
  const item: PushNotification = {
    ...notif,
    id: 'NOTIF-' + Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  const updated = [item, ...notifs].slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(updated));

  // Trigger web notification API if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(notif.title, {
        body: notif.message,
        icon: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png',
      });
    } catch {
      // Ignored if blocked in iframe
    }
  }
}

export function markNotificationAsRead(id: string): void {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(updated));
}

export function markAllNotificationsAsRead(): void {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(updated));
}

// Cloud Sync State
export function getStoredSyncState(): CloudSyncState {
  const raw = localStorage.getItem(STORAGE_KEYS.SYNC);
  if (!raw) {
    const initial: CloudSyncState = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSynced: new Date().toISOString(),
      syncInProgress: false,
      pendingSyncCount: 0,
      autoSync: true,
      encryptionActive: true,
    };
    localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      isOnline: true,
      lastSynced: new Date().toISOString(),
      syncInProgress: false,
      pendingSyncCount: 0,
      autoSync: true,
      encryptionActive: true,
    };
  }
}

export function saveStoredSyncState(state: Partial<CloudSyncState>): CloudSyncState {
  const current = getStoredSyncState();
  const updated = { ...current, ...state };
  localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(updated));
  return updated;
}

// Automated Report Config
export function getStoredReportConfig(): AutomatedReportConfig {
  const raw = localStorage.getItem(STORAGE_KEYS.REPORT_CONFIG);
  if (!raw) {
    const initial: AutomatedReportConfig = {
      enabled: true,
      frequency: 'end_of_month',
      format: 'both',
      recipients: ['pimpinan.factory@ajinomoto.co.id', 'hr.director@ajinomoto.co.id'],
      lastDispatched: new Date(Date.now() - 86400000 * 15).toISOString(),
      nextScheduled: new Date(Date.now() + 86400000 * 5).toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.REPORT_CONFIG, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      enabled: true,
      frequency: 'end_of_month',
      format: 'both',
      recipients: ['pimpinan.factory@ajinomoto.co.id'],
    };
  }
}

export function saveStoredReportConfig(config: AutomatedReportConfig): void {
  localStorage.setItem(STORAGE_KEYS.REPORT_CONFIG, JSON.stringify(config));
}

// -------------------------------------------------------------
// CORE BUSINESS LOGIC COMPUTATIONS (Matches GAS functions)
// -------------------------------------------------------------

export function getDeptMap(): Record<string, string> {
  const map: Record<string, string> = {};
  DEPARTMENTS.forEach((d) => {
    map[d.id] = d.name;
  });
  return map;
}

export function getDashboardData(
  userDept: string = 'ALL',
  bulan?: number | string | null,
  tahun?: number | string | null,
  fiscalYear?: number | string | null
): DashboardItem[] {
  const plans = getStoredPlans();
  const actuals = getStoredActuals();
  const deptMap = getDeptMap();

  // Aggregate actuals by `${deptId}_${Number(bulan)}_${Number(tahun)}`
  const actualMap: Record<string, { rw: number; os: number; total: number; remarks: string; deptId: string; bulan: number; tahun: number }> = {};

  actuals.forEach((a) => {
    if (!a.deptId) return;
    const b = Number(a.bulan);
    const t = Number(a.tahun);
    const key = `${a.deptId}_${b}_${t}`;
    const rw = Number(a.actualRW) || 0;
    const os = Number(a.actualOS) || 0;
    if (!actualMap[key]) {
      actualMap[key] = { rw: 0, os: 0, total: 0, remarks: '', deptId: a.deptId, bulan: b, tahun: t };
    }
    actualMap[key].rw += rw;
    actualMap[key].os += os;
    actualMap[key].total += rw + os;
    if (a.remarks) actualMap[key].remarks = a.remarks;
  });

  const results: DashboardItem[] = [];
  const processedKeys = new Set<string>();

  // 1. Process all plan items and join with actuals
  plans.forEach((p) => {
    const deptId = p.deptId;
    if (!deptId) return;

    if (userDept !== 'ALL' && deptId !== userDept) return;

    const b = Number(p.bulan);
    const t = Number(p.tahun);

    // Apply filters
    if (bulan && bulan !== 'ALL' && Number(bulan) !== b) return;
    if (tahun && tahun !== 'ALL' && Number(tahun) !== t) return;
    if (fiscalYear && fiscalYear !== 'ALL' && getFiscalYear(b, t) !== Number(fiscalYear)) return;

    const key = `${deptId}_${b}_${t}`;
    processedKeys.add(key);

    const planRW = Number(p.planRW) || 0;
    const planOS = Number(p.planOS) || 0;
    const totalPlan = planRW + planOS;

    const act = actualMap[key] || { rw: 0, os: 0, total: 0, remarks: '' };
    const totalActual = act.total;
    const gap = totalActual - totalPlan;
    const achievement = totalPlan > 0 ? Number(((totalActual / totalPlan) * 100).toFixed(1)) : (totalActual > 0 ? 100 : 0);

    let status: 'OVER' | 'OPTIMAL' | 'UNDER' = 'OPTIMAL';
    if (achievement > 100) status = 'OVER';
    else if (achievement < 90) status = 'UNDER';

    results.push({
      deptId,
      deptName: deptMap[deptId] || deptId,
      bulan: b,
      tahun: t,
      plan: totalPlan,
      planRW,
      planOS,
      actual: totalActual,
      actualRW: act.rw,
      actualOS: act.os,
      gap,
      achievement,
      status,
      remarks: act.remarks || p.remarks || '',
    });
  });

  // 2. Include any actuals that do not have a matching plan record
  Object.values(actualMap).forEach((act) => {
    const key = `${act.deptId}_${act.bulan}_${act.tahun}`;
    if (processedKeys.has(key)) return;

    if (userDept !== 'ALL' && act.deptId !== userDept) return;

    const b = act.bulan;
    const t = act.tahun;

    // Apply filters
    if (bulan && bulan !== 'ALL' && Number(bulan) !== b) return;
    if (tahun && tahun !== 'ALL' && Number(tahun) !== t) return;
    if (fiscalYear && fiscalYear !== 'ALL' && getFiscalYear(b, t) !== Number(fiscalYear)) return;

    results.push({
      deptId: act.deptId,
      deptName: deptMap[act.deptId] || act.deptId,
      bulan: b,
      tahun: t,
      plan: 0,
      planRW: 0,
      planOS: 0,
      actual: act.total,
      actualRW: act.rw,
      actualOS: act.os,
      gap: act.total,
      achievement: 100,
      status: 'OVER',
      remarks: act.remarks || '',
    });
  });

  return results;
}

export function getMonthlyTrendDataByFY(
  deptId: string = 'ALL',
  fiscalYear: number
): { fiscalMonth: number; plan: number; actual: number; remarks: string }[] {
  const plans = getStoredPlans();
  const actuals = getStoredActuals();

  const resultMap: Record<number, { fiscalMonth: number; plan: number; actual: number; remarks: string }> = {};

  for (let fm = 1; fm <= 12; fm++) {
    resultMap[fm] = { fiscalMonth: fm, plan: 0, actual: 0, remarks: '' };
  }

  plans.forEach((p) => {
    if (deptId !== 'ALL' && p.deptId !== deptId) return;
    if (getFiscalYear(p.bulan, p.tahun) !== fiscalYear) return;
    const fm = getFiscalMonth(p.bulan);
    resultMap[fm].plan += (Number(p.planRW) || 0) + (Number(p.planOS) || 0);
  });

  actuals.forEach((a) => {
    if (deptId !== 'ALL' && a.deptId !== deptId) return;
    if (getFiscalYear(a.bulan, a.tahun) !== fiscalYear) return;
    const fm = getFiscalMonth(a.bulan);
    resultMap[fm].actual += (Number(a.actualRW) || 0) + (Number(a.actualOS) || 0);
    if (a.remarks) resultMap[fm].remarks = a.remarks;
  });

  return Object.values(resultMap);
}

// -------------------------------------------------------------
// CRUD Operations
// -------------------------------------------------------------

export function addPlanData(
  deptId: string,
  bulan: number,
  tahun: number,
  planRW: number,
  planOS: number,
  remarks: string = '',
  userEmail: string
): boolean {
  const plans = getStoredPlans();
  const id = `MP${String(plans.length + 1).padStart(3, '0')}`;
  const newPlan: PlanRecord = {
    id,
    deptId,
    bulan,
    tahun,
    planRW,
    planOS,
    remarks,
  };
  saveStoredPlans([...plans, newPlan]);
  syncSinglePlanToSupabase(newPlan);
  addAuditLog('ADD PLAN', `Tambah budget RW:${planRW} OS:${planOS}`, deptId, userEmail);
  return true;
}

export function addActualData(
  deptId: string,
  bulan: number,
  tahun: number,
  actualRW: number,
  actualOS: number,
  remarks: string = '',
  userEmail: string
): boolean {
  const actuals = getStoredActuals();
  const id = `MR${String(actuals.length + 1).padStart(3, '0')}`;
  const newActual: ActualRecord = {
    id,
    deptId,
    bulan,
    tahun,
    actualRW,
    actualOS,
    remarks,
  };
  saveStoredActuals([...actuals, newActual]);
  syncSingleActualToSupabase(newActual);
  addAuditLog('ADD ACTUAL', `Tambah realisasi RW:${actualRW} OS:${actualOS}`, deptId, userEmail);
  return true;
}

export function updateRowData(
  type: 'PLAN' | 'ACTUAL',
  id: string,
  rw: number,
  os: number,
  remarks: string,
  userEmail: string
): boolean {
  if (type === 'PLAN') {
    const plans = getStoredPlans();
    let updatedRecord: PlanRecord | null = null;
    const updated = plans.map((p) => {
      if (p.id === id) {
        updatedRecord = { ...p, planRW: rw, planOS: os, remarks };
        return updatedRecord;
      }
      return p;
    });
    saveStoredPlans(updated);
    if (updatedRecord) syncSinglePlanToSupabase(updatedRecord);
    addAuditLog('UPDATE PLAN', `Edit ID ${id} RW:${rw} OS:${os}`, '-', userEmail);
  } else {
    const actuals = getStoredActuals();
    let updatedRecord: ActualRecord | null = null;
    const updated = actuals.map((a) => {
      if (a.id === id) {
        updatedRecord = { ...a, actualRW: rw, actualOS: os, remarks };
        return updatedRecord;
      }
      return a;
    });
    saveStoredActuals(updated);
    if (updatedRecord) syncSingleActualToSupabase(updatedRecord);
    addAuditLog('UPDATE ACTUAL', `Edit ID ${id} RW:${rw} OS:${os}`, '-', userEmail);
  }
  return true;
}

export function deleteRowData(type: 'PLAN' | 'ACTUAL', id: string, userEmail: string): boolean {
  if (type === 'PLAN') {
    const plans = getStoredPlans();
    saveStoredPlans(plans.filter((p) => p.id !== id));
    deletePlanFromSupabase(id);
    addAuditLog('DELETE PLAN', `Hapus plan ID ${id}`, '-', userEmail);
  } else {
    const actuals = getStoredActuals();
    saveStoredActuals(actuals.filter((a) => a.id !== id));
    deleteActualFromSupabase(id);
    addAuditLog('DELETE ACTUAL', `Hapus actual ID ${id}`, '-', userEmail);
  }
  return true;
}

export function duplicateDataToNextMonth(
  type: 'PLAN' | 'ACTUAL',
  deptId: string,
  bulan: number,
  tahun: number,
  userEmail: string
): { success: boolean; copied: number; skipped: number; targetBulan: number; targetTahun: number } {
  let targetBulan = bulan + 1;
  let targetTahun = tahun;
  if (targetBulan > 12) {
    targetBulan = 1;
    targetTahun = tahun + 1;
  }

  if (type === 'PLAN') {
    const plans = getStoredPlans();
    const existingKeys = new Set(plans.map((p) => `${p.deptId}_${p.bulan}_${p.tahun}`));
    const sourceRows = plans.filter((p) => {
      if (p.bulan !== bulan || p.tahun !== tahun) return false;
      if (deptId && deptId !== 'ALL' && p.deptId !== deptId) return false;
      return true;
    });

    let copied = 0;
    let skipped = 0;
    const newRecords: PlanRecord[] = [];

    sourceRows.forEach((r, idx) => {
      const targetKey = `${r.deptId}_${targetBulan}_${targetTahun}`;
      if (existingKeys.has(targetKey)) {
        skipped++;
        return;
      }
      const newId = `MP${String(plans.length + idx + 1).padStart(3, '0')}`;
      newRecords.push({
        id: newId,
        deptId: r.deptId,
        bulan: targetBulan,
        tahun: targetTahun,
        planRW: r.planRW,
        planOS: r.planOS,
        remarks: r.remarks,
      });
      existingKeys.add(targetKey);
      copied++;
    });

    if (newRecords.length > 0) {
      saveStoredPlans([...plans, ...newRecords]);
      newRecords.forEach((rec) => syncSinglePlanToSupabase(rec));
      addAuditLog(
        'DUPLICATE DATA',
        `Duplicate PLAN ${bulan}/${tahun} → ${targetBulan}/${targetTahun} (copied:${copied}, skipped:${skipped})`,
        deptId,
        userEmail
      );
    }

    return { success: true, copied, skipped, targetBulan, targetTahun };
  } else {
    const actuals = getStoredActuals();
    const existingKeys = new Set(actuals.map((a) => `${a.deptId}_${a.bulan}_${a.tahun}`));
    const sourceRows = actuals.filter((a) => {
      if (a.bulan !== bulan || a.tahun !== tahun) return false;
      if (deptId && deptId !== 'ALL' && a.deptId !== deptId) return false;
      return true;
    });

    let copied = 0;
    let skipped = 0;
    const newRecords: ActualRecord[] = [];

    sourceRows.forEach((r, idx) => {
      const targetKey = `${r.deptId}_${targetBulan}_${targetTahun}`;
      if (existingKeys.has(targetKey)) {
        skipped++;
        return;
      }
      const newId = `MR${String(actuals.length + idx + 1).padStart(3, '0')}`;
      newRecords.push({
        id: newId,
        deptId: r.deptId,
        bulan: targetBulan,
        tahun: targetTahun,
        actualRW: r.actualRW,
        actualOS: r.actualOS,
        remarks: r.remarks,
      });
      existingKeys.add(targetKey);
      copied++;
    });

    if (newRecords.length > 0) {
      saveStoredActuals([...actuals, ...newRecords]);
      newRecords.forEach((rec) => syncSingleActualToSupabase(rec));
      addAuditLog(
        'DUPLICATE DATA',
        `Duplicate ACTUAL ${bulan}/${tahun} → ${targetBulan}/${targetTahun} (copied:${copied}, skipped:${skipped})`,
        deptId,
        userEmail
      );
    }

    return { success: true, copied, skipped, targetBulan, targetTahun };
  }
}

// -------------------------------------------------------------
// APPROVAL WORKFLOW
// -------------------------------------------------------------

export function requestUpdateRWOS(
  deptId: string,
  bulan: number,
  tahun: number,
  actualRW: number,
  actualOS: number,
  remarks: string,
  requestedBy: string
): { success: boolean; id: string } {
  const deptMap = getDeptMap();
  const approvals = getStoredApprovals();
  const id = 'REQ' + Date.now();
  const item: PendingApproval = {
    id,
    deptId,
    deptName: deptMap[deptId] || deptId,
    bulan,
    tahun,
    actualRW,
    actualOS,
    remarks,
    requestedBy,
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  saveStoredApprovals([item, ...approvals]);
  syncSingleApprovalToSupabase(item);
  addAuditLog('REQUEST UPDATE ACTUAL', `Menunggu approval — RW:${actualRW} OS:${actualOS}`, deptId, requestedBy);

  addNotification({
    title: '⚠️ Permintaan Approval Baru',
    message: `${deptMap[deptId] || deptId} mengajukan perubahan Actual RW:${actualRW} OS:${actualOS}.`,
    type: 'urgent',
    deptId,
    linkAction: 'APPROVALS',
  });

  return { success: true, id };
}

export function approveUpdateRequest(requestId: string, adminEmail: string): { success: boolean; message?: string } {
  const approvals = getStoredApprovals();
  const target = approvals.find((a) => a.id === requestId);
  if (!target) return { success: false, message: 'Request tidak ditemukan' };
  if (target.status !== 'PENDING') return { success: false, message: 'Request sudah diproses' };

  // Apply to actuals
  const actuals = getStoredActuals();
  let found = false;
  let savedActual: ActualRecord | null = null;
  const updatedActuals = actuals.map((a) => {
    if (a.deptId === target.deptId && a.bulan === target.bulan && a.tahun === target.tahun) {
      found = true;
      savedActual = { ...a, actualRW: target.actualRW, actualOS: target.actualOS, remarks: target.remarks };
      return savedActual;
    }
    return a;
  });

  if (!found) {
    const newId = `MR${String(actuals.length + 1).padStart(3, '0')}`;
    savedActual = {
      id: newId,
      deptId: target.deptId,
      bulan: target.bulan,
      tahun: target.tahun,
      actualRW: target.actualRW,
      actualOS: target.actualOS,
      remarks: target.remarks,
    };
    updatedActuals.push(savedActual);
  }
  saveStoredActuals(updatedActuals);
  if (savedActual) {
    syncSingleActualToSupabase(savedActual);
  }

  // Update approval record
  let updatedAppRecord: PendingApproval | null = null;
  const updatedApprovals = approvals.map((a) => {
    if (a.id === requestId) {
      updatedAppRecord = {
        ...a,
        status: 'APPROVED' as const,
        reviewedBy: adminEmail,
        reviewedAt: new Date().toISOString(),
      };
      return updatedAppRecord;
    }
    return a;
  });
  saveStoredApprovals(updatedApprovals);
  if (updatedAppRecord) {
    syncSingleApprovalToSupabase(updatedAppRecord);
  }

  addAuditLog('APPROVE UPDATE ACTUAL', `Request ${requestId} disetujui`, target.deptId, adminEmail);
  addNotification({
    title: '✅ Perubahan Realisasi Disetujui',
    message: `Permintaan ${target.deptName} periode ${target.bulan}/${target.tahun} telah disetujui oleh ${adminEmail}.`,
    type: 'success',
    deptId: target.deptId,
  });

  return { success: true };
}

export function rejectUpdateRequest(
  requestId: string,
  adminEmail: string,
  reason: string = ''
): { success: boolean; message?: string } {
  const approvals = getStoredApprovals();
  const target = approvals.find((a) => a.id === requestId);
  if (!target) return { success: false, message: 'Request tidak ditemukan' };

  let updatedAppRecord: PendingApproval | null = null;
  const updatedApprovals = approvals.map((a) => {
    if (a.id === requestId) {
      updatedAppRecord = {
        ...a,
        status: 'REJECTED' as const,
        reviewedBy: adminEmail,
        reviewedAt: new Date().toISOString(),
        rejectReason: reason,
      };
      return updatedAppRecord;
    }
    return a;
  });
  saveStoredApprovals(updatedApprovals);
  if (updatedAppRecord) {
    syncSingleApprovalToSupabase(updatedAppRecord);
  }

  addAuditLog('REJECT UPDATE ACTUAL', `Request ${requestId} ditolak: ${reason || '-'}`, target.deptId, adminEmail);
  addNotification({
    title: '❌ Perubahan Realisasi Ditolak',
    message: `Permintaan ${target.deptName} ditolak. Alasan: ${reason || 'Tidak ada alasan khusus.'}`,
    type: 'warning',
    deptId: target.deptId,
  });

  return { success: true };
}

// -------------------------------------------------------------
// CONVENIENCE WRAPPERS & EXPORT ALIASES
// -------------------------------------------------------------

export function initializeStorage(): void {
  getStoredUsers();
  getStoredPlans();
  getStoredActuals();
  getStoredApprovals();
  getStoredAuditLogs();
  getStoredNotifications();
  getStoredSyncState();
  getStoredReportConfig();
}

export function getStoredLogs(): AuditLog[] {
  return getStoredAuditLogs();
}

export function savePlanRecord(
  record: { deptId: string; bulan: number; tahun: number; planRW: number; planOS: number; remarks?: string },
  userEmail: string = 'admin'
): boolean {
  const plans = getStoredPlans();
  const existingIndex = plans.findIndex(
    (p) => p.deptId === record.deptId && Number(p.bulan) === Number(record.bulan) && Number(p.tahun) === Number(record.tahun)
  );

  if (existingIndex >= 0) {
    const updated = [...plans];
    const item: PlanRecord = {
      ...updated[existingIndex],
      planRW: record.planRW,
      planOS: record.planOS,
      remarks: record.remarks || '',
    };
    updated[existingIndex] = item;
    saveStoredPlans(updated);
    syncSinglePlanToSupabase(item);
    addAuditLog('UPDATE PLAN', `Update Plan ${record.deptId} B:${record.bulan} T:${record.tahun}`, record.deptId, userEmail);
    return true;
  } else {
    return addPlanData(
      record.deptId,
      record.bulan,
      record.tahun,
      record.planRW,
      record.planOS,
      record.remarks || '',
      userEmail
    );
  }
}

export function saveActualRecord(
  record: { deptId: string; bulan: number; tahun: number; actualRW: number; actualOS: number; remarks?: string },
  userEmail: string = 'admin'
): boolean {
  const actuals = getStoredActuals();
  const existingIndex = actuals.findIndex(
    (a) => a.deptId === record.deptId && Number(a.bulan) === Number(record.bulan) && Number(a.tahun) === Number(record.tahun)
  );

  if (existingIndex >= 0) {
    const updated = [...actuals];
    const item: ActualRecord = {
      ...updated[existingIndex],
      actualRW: record.actualRW,
      actualOS: record.actualOS,
      remarks: record.remarks || '',
    };
    updated[existingIndex] = item;
    saveStoredActuals(updated);
    syncSingleActualToSupabase(item);
    addAuditLog('UPDATE ACTUAL', `Update Actual ${record.deptId} B:${record.bulan} T:${record.tahun}`, record.deptId, userEmail);
    return true;
  } else {
    return addActualData(
      record.deptId,
      record.bulan,
      record.tahun,
      record.actualRW,
      record.actualOS,
      record.remarks || '',
      userEmail
    );
  }
}

export function submitUpdateRequest(
  deptId: string,
  bulan: number,
  tahun: number,
  actualRW: number,
  actualOS: number,
  remarks: string,
  requestedBy: string
): { success: boolean; id: string } {
  return requestUpdateRWOS(deptId, bulan, tahun, actualRW, actualOS, remarks, requestedBy);
}

export function requestActualApproval(data: {
  deptId: string;
  deptName: string;
  bulan: number;
  tahun: number;
  actualRW: number;
  actualOS: number;
  remarks: string;
  requestedBy: string;
}): { success: boolean; id?: string } {
  return requestUpdateRWOS(
    data.deptId,
    data.bulan,
    data.tahun,
    data.actualRW,
    data.actualOS,
    data.remarks,
    data.requestedBy
  );
}

export function approvePendingRequest(id: string, adminEmail: string): boolean {
  const res = approveUpdateRequest(id, adminEmail);
  return res.success;
}

export function rejectPendingRequest(id: string, adminEmail: string, reason: string = ''): boolean {
  const res = rejectUpdateRequest(id, adminEmail, reason);
  return res.success;
}

export function deleteRecord(type: 'PLAN' | 'ACTUAL', id: string, userEmail: string = 'admin'): boolean {
  return deleteRowData(type, id, userEmail);
}

export function clearAllNotifications(): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify([]));
}

export function resetAllDataToDefault(): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
  localStorage.setItem(STORAGE_KEYS.ACTUALS, JSON.stringify(INITIAL_ACTUALS));
  localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(INITIAL_PENDING_APPROVALS));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
}

