import React, { useState } from 'react';
import { Calendar, Mail, Clock, Check, X, FileText, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { AutomatedReportConfig } from '../types';
import { getStoredReportConfig, saveStoredReportConfig } from '../utils/storage';

interface AutomatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedReportModal: React.FC<AutomatedReportModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AutomatedReportConfig>(getStoredReportConfig());
  const [newEmail, setNewEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const currentRecipients = Array.isArray(config?.recipients) ? config.recipients : [];
    if (newEmail && !currentRecipients.includes(newEmail)) {
      const updated = { ...config, recipients: [...currentRecipients, newEmail] };
      setConfig(updated);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    const currentRecipients = Array.isArray(config?.recipients) ? config.recipients : [];
    setConfig({ ...config, recipients: currentRecipients.filter((r) => r !== email) });
  };

  const handleSave = () => {
    saveStoredReportConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Jadwal Ekspor Laporan Otomatis</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Otomasi PDF & Excel setiap akhir bulan ke email pimpinan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Toggle Active */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Status Otomasi Laporan</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {config.enabled ? 'Aktif — Sistem akan mengirim otomatis' : 'Nonaktif'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 accent-red-600 rounded cursor-pointer"
            />
          </div>

          {/* Schedule Frequency & Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Frekuensi Jadwal
              </label>
              <select
                value={config.frequency}
                onChange={(e) => setConfig({ ...config, frequency: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="end_of_month">Setiap Akhir Bulan (Rutin)</option>
                <option value="weekly">Setiap Akhir Pekan (Jumat)</option>
                <option value="biweekly">Setiap 2 Pekan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Format Berkas
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="both">PDF Executive + Excel Database</option>
                <option value="pdf">Hanya PDF Executive</option>
                <option value="excel">Hanya Excel Database (.xlsx)</option>
              </select>
            </div>
          </div>

          {/* Recipients List */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Daftar Email Penerima Laporan
            </label>
            <form onSubmit={handleAddEmail} className="flex gap-2 mb-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Tambah email (contoh: director@ajinomoto.co.id)"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {config.recipients.map((rec) => (
                <div
                  key={rec}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rec}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(rec)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : null}
            <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
