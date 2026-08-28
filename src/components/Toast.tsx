import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const config = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-500/40 dark:border-emerald-500/50',
      bg: 'bg-white dark:bg-[#0c1424]',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      bar: 'bg-emerald-500',
    },
    error: {
      icon: AlertCircle,
      border: 'border-rose-500/40 dark:border-rose-500/50',
      bg: 'bg-white dark:bg-[#0c1424]',
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      bar: 'bg-rose-500',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/40 dark:border-amber-500/50',
      bg: 'bg-white dark:bg-[#0c1424]',
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      bar: 'bg-amber-500',
    },
    info: {
      icon: Info,
      border: 'border-blue-500/40 dark:border-blue-500/50',
      bg: 'bg-white dark:bg-[#0c1424]',
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      bar: 'bg-blue-500',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border ${config.border} ${config.bg} backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in relative overflow-hidden`}
    >
      <div className={`p-2 rounded-xl ${config.iconBg} ${config.iconColor} flex-shrink-0 mt-0.5`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress Bar Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${config.bar}`}
          style={{
            animation: `toastProgress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};
