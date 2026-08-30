import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { AlertModalOptions } from '../types';

interface AlertModalProps {
  options: AlertModalOptions | null;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ options, onClose }) => {
  if (!options || !options.isOpen) return null;

  const {
    title,
    message,
    type = 'info',
    confirmText = 'Tutup',
    cancelText,
    onConfirm,
    onCancel,
  } = options;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const styleConfig = {
    info: {
      icon: Info,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-200 dark:border-blue-800/60',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200 dark:border-amber-800/60',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    danger: {
      icon: AlertCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      border: 'border-rose-200 dark:border-rose-800/60',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
  }[type];

  const Icon = styleConfig.icon;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleCancel}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.18),0_10px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(220,38,38,0.08)] ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden z-10 animate-in zoom-in-95 duration-200 p-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl ${styleConfig.bg} ${styleConfig.border} border flex items-center justify-center mb-4 ${styleConfig.color}`}
          >
            <Icon className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            {title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            {cancelText && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold shadow-md transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${styleConfig.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
