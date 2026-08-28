import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { label: 'Buka Command Palette', keys: ['Ctrl', 'K'] },
    { label: 'Navigasi: Dashboard MP', keys: ['g', 'd'] },
    { label: 'Navigasi: Manpower Budget', keys: ['g', 'b'] },
    { label: 'Navigasi: Realisasi MP', keys: ['g', 'r'] },
    { label: 'Navigasi: Approval Actual', keys: ['g', 'a'] },
    { label: 'Navigasi: Audit Log', keys: ['g', 'l'] },
    { label: 'Navigasi: Settings', keys: ['g', 's'] },
    { label: 'Input data manpower baru', keys: ['n'] },
    { label: 'Refresh data real-time', keys: ['r'] },
    { label: 'Generate PDF Executive Report', keys: ['g', 'p'] },
    { label: 'Persempit / Perluas Sidebar', keys: ['['] },
    { label: 'Toggle Dark / Light Mode', keys: ['Ctrl', '/'] },
    { label: 'Tutup dialog / modal apapun', keys: ['Esc'] },
    { label: 'Buka panduan shortcut ini', keys: ['?'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Keyboard className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{sc.label}</span>
              <div className="flex items-center gap-1">
                {sc.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
