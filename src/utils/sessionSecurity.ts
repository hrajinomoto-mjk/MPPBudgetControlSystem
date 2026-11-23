import { User } from '../types';

export interface SessionSecurityConfig {
  idleTimeoutMinutes: number;
  logoutOnTabClose: boolean;
}

export type SessionExitReason = 'IDLE_TIMEOUT' | 'TAB_CLOSED';

export interface SessionExitNotice {
  reason: SessionExitReason;
  timeoutMinutes?: number;
  timestamp: number;
}

export const SESSION_STORAGE_KEYS = {
  ACTIVE_SESSION: 'mpcs_active_session',
  LAST_ACTIVITY: 'mpcs_session_last_activity',
  UNLOADED_AT: 'mpcs_session_unloaded_at',
  TAB_ID: 'mpcs_session_tab_id',
} as const;

export const LOCAL_SECURITY_KEYS = {
  CONFIG: 'mpcs_session_security_config_v1',
  EXIT_NOTICE: 'mpcs_session_exit_notice_v1',
  LEGACY_USER: 'mpcs_current_user',
} as const;

export const DEFAULT_SESSION_SECURITY_CONFIG: SessionSecurityConfig = {
  idleTimeoutMinutes: 15,
  logoutOnTabClose: true,
};

export const IDLE_TIMEOUT_OPTIONS = [1, 5, 10, 15, 30, 60] as const;

// Maximum gap (ms) allowed to treat a navigation with type === 'reload' as an intentional F5 refresh
const MAX_RELOAD_WINDOW_MS = 15_000;
// Maximum age (ms) for showing a "session ended on tab close" notice when reopening the app
const EXIT_NOTICE_TTL_MS = 24 * 60 * 60 * 1000;

export function getSessionSecurityConfig(): SessionSecurityConfig {
  if (typeof window === 'undefined') return DEFAULT_SESSION_SECURITY_CONFIG;
  try {
    const raw = localStorage.getItem(LOCAL_SECURITY_KEYS.CONFIG);
    if (!raw) return DEFAULT_SESSION_SECURITY_CONFIG;
    const parsed = JSON.parse(raw);
    const minutes = Number(parsed?.idleTimeoutMinutes);
    const validMinutes =
      Number.isFinite(minutes) && minutes >= 1 && minutes <= 240
        ? Math.round(minutes)
        : DEFAULT_SESSION_SECURITY_CONFIG.idleTimeoutMinutes;
    const logoutOnTabClose =
      typeof parsed?.logoutOnTabClose === 'boolean'
        ? parsed.logoutOnTabClose
        : DEFAULT_SESSION_SECURITY_CONFIG.logoutOnTabClose;
    return {
      idleTimeoutMinutes: validMinutes,
      logoutOnTabClose,
    };
  } catch {
    return DEFAULT_SESSION_SECURITY_CONFIG;
  }
}

export function saveSessionSecurityConfig(config: SessionSecurityConfig): SessionSecurityConfig {
  const sanitized: SessionSecurityConfig = {
    idleTimeoutMinutes:
      Number.isFinite(config.idleTimeoutMinutes) &&
      config.idleTimeoutMinutes >= 1 &&
      config.idleTimeoutMinutes <= 240
        ? Math.round(config.idleTimeoutMinutes)
        : DEFAULT_SESSION_SECURITY_CONFIG.idleTimeoutMinutes,
    logoutOnTabClose: Boolean(config.logoutOnTabClose),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_SECURITY_KEYS.CONFIG, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent('mpcs_session_config_changed', { detail: sanitized }));
  }
  return sanitized;
}

export function getNavigationType(): string {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return 'navigate';
  try {
    const entries = performance.getEntriesByType?.('navigation');
    if (entries && entries.length > 0) {
      const navEntry = entries[0] as PerformanceNavigationTiming;
      if (navEntry && typeof navEntry.type === 'string') {
        return navEntry.type;
      }
    }
  } catch {
    // ignore fallback
  }
  return 'navigate';
}

export function ensureTabId(): string {
  if (typeof window === 'undefined') return 'server';
  let tabId = sessionStorage.getItem(SESSION_STORAGE_KEYS.TAB_ID);
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEYS.TAB_ID, tabId);
  }
  return tabId;
}

export function touchSessionActivity(timestamp: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY, String(timestamp));
  } catch {
    // ignore storage quota errors
  }
}

export function getSessionLastActivity(): number {
  if (typeof window === 'undefined') return Date.now();
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

export function clearActiveSessionStorage(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.ACTIVE_SESSION);
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY);
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.UNLOADED_AT);
  localStorage.removeItem(LOCAL_SECURITY_KEYS.LEGACY_USER);
}

export function persistActiveSession(user: User): void {
  if (typeof window === 'undefined') return;
  ensureTabId();
  sessionStorage.setItem(SESSION_STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(user));
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.UNLOADED_AT);
  touchSessionActivity(Date.now());
  localStorage.removeItem(LOCAL_SECURITY_KEYS.LEGACY_USER);
  clearSessionExitNotice();
}

export function writeSessionExitNotice(notice: SessionExitNotice): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SECURITY_KEYS.EXIT_NOTICE, JSON.stringify(notice));
  } catch {
    // ignore
  }
}

export function clearSessionExitNotice(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_SECURITY_KEYS.EXIT_NOTICE);
}

export function consumeSessionExitNotice(): SessionExitNotice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_SECURITY_KEYS.EXIT_NOTICE);
    if (!raw) return null;
    localStorage.removeItem(LOCAL_SECURITY_KEYS.EXIT_NOTICE);
    const parsed = JSON.parse(raw) as SessionExitNotice;
    if (!parsed || (parsed.reason !== 'IDLE_TIMEOUT' && parsed.reason !== 'TAB_CLOSED')) {
      return null;
    }
    if (Date.now() - (parsed.timestamp || 0) > EXIT_NOTICE_TTL_MS) {
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(LOCAL_SECURITY_KEYS.EXIT_NOTICE);
    return null;
  }
}

export function markSessionTabUnload(isAuthenticated: boolean): void {
  if (typeof window === 'undefined' || !isAuthenticated) return;
  const config = getSessionSecurityConfig();
  const now = Date.now();
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.UNLOADED_AT, String(now));
    if (config.logoutOnTabClose) {
      writeSessionExitNotice({
        reason: 'TAB_CLOSED',
        timestamp: now,
      });
    }
  } catch {
    // ignore
  }
}

export interface InitialSessionResolution {
  user: User | null;
  initialPublicPage: 'landing' | 'login';
  exitNotice: SessionExitNotice | null;
}

/**
 * Resolves whether an active tab session is still valid on mount.
 * - Rejects legacy localStorage sessions.
 * - Detects browser tab close + reopen (including Ctrl+Shift+T / "Continue where you left off").
 * - Enforces idle timeout if the tab was inactive/asleep beyond the configured limit.
 * - Routes directly to the Login view with a notice if a previous session ended via timeout or tab close.
 */
export function resolveInitialSession(): InitialSessionResolution {
  if (typeof window === 'undefined') {
    return { user: null, initialPublicPage: 'landing', exitNotice: null };
  }

  localStorage.removeItem(LOCAL_SECURITY_KEYS.LEGACY_USER);
  const config = getSessionSecurityConfig();
  const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEYS.ACTIVE_SESSION);
  const navType = getNavigationType();
  const now = Date.now();

  if (rawSession) {
    try {
      const parsedUser = JSON.parse(rawSession) as User;
      const unloadedAt = Number(sessionStorage.getItem(SESSION_STORAGE_KEYS.UNLOADED_AT) || 0);
      const lastActivity = Number(sessionStorage.getItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY) || 0);
      const timeoutMs = config.idleTimeoutMinutes * 60 * 1000;

      // 1. Check idle timeout expiration first
      if (lastActivity > 0 && now - lastActivity >= timeoutMs) {
        clearActiveSessionStorage();
        clearSessionExitNotice();
        return {
          user: null,
          initialPublicPage: 'login',
          exitNotice: {
            reason: 'IDLE_TIMEOUT',
            timeoutMinutes: config.idleTimeoutMinutes,
            timestamp: now,
          },
        };
      }

      // 2. Check tab close & browser restore (Ctrl+Shift+T or "Continue where you left off")
      if (config.logoutOnTabClose && unloadedAt > 0) {
        const isQuickReload = navType === 'reload' && now - unloadedAt <= MAX_RELOAD_WINDOW_MS;
        if (!isQuickReload) {
          clearActiveSessionStorage();
          clearSessionExitNotice();
          return {
            user: null,
            initialPublicPage: 'login',
            exitNotice: {
              reason: 'TAB_CLOSED',
              timestamp: now,
            },
          };
        }
      }

      // Valid active session (e.g., quick F5 reload within timeout): keep session & clear unload marker
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.UNLOADED_AT);
      clearSessionExitNotice();
      ensureTabId();
      touchSessionActivity(now);

      return {
        user: parsedUser,
        initialPublicPage: 'landing',
        exitNotice: null,
      };
    } catch {
      clearActiveSessionStorage();
    }
  }

  // No sessionStorage session exists (fresh tab opened after closing a previously logged-in tab)
  const pendingNotice = consumeSessionExitNotice();
  if (pendingNotice && config.logoutOnTabClose) {
    return {
      user: null,
      initialPublicPage: 'login',
      exitNotice: pendingNotice,
    };
  }

  return {
    user: null,
    initialPublicPage: 'landing',
    exitNotice: null,
  };
}
