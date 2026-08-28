import React from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, X, ExternalLink } from 'lucide-react';
import { PushNotification, ActivePage } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: PushNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (page: any) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const safeNotifs = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifs.filter((n) => n && !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] bg-white dark:bg-[#0f172a] border-l sm:border border-slate-200 dark:border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifikasi Push & Update</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} pembaruan belum dibaca` : 'Semua notifikasi telah dibaca'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Tandai semua dibaca"
                className="p-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {safeNotifs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">Belum ada notifikasi baru.</div>
          ) : (
            safeNotifs.map((n) => {
              let Icon = Info;
              let colorClass = 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/40';

              if (n.type === 'urgent') {
                Icon = AlertTriangle;
                colorClass = 'text-red-500 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/40';
              } else if (n.type === 'warning') {
                Icon = AlertTriangle;
                colorClass = 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/40';
              } else if (n.type === 'success') {
                Icon = CheckCircle;
                colorClass = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/40';
              }

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) onMarkAsRead(n.id);
                    if (n.linkAction) {
                      onNavigate(n.linkAction as ActivePage);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-70 hover:opacity-100'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-red-300 dark:hover:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl border ${colorClass} flex-shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                      {n.linkAction && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <span>Buka Menu</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-400">Notifikasi push real-time otomatis tersinkron</span>
        </div>
      </div>
    </div>
  );
};
