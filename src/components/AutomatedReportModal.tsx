import React, { useState } from 'react';
import {
  Calendar,
  Mail,
  Clock,
  Check,
  X,
  FileText,
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  Send,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';
import { AutomatedReportConfig } from '../types';
import { getStoredReportConfig, saveStoredReportConfig, getDashboardData } from '../utils/storage';
import { generateExecutiveReportPDF } from '../utils/exportPdf';
import { exportFullManpowerExcel } from '../utils/exportExcel';
import { getFiscalMonth, FISCAL_MONTH_LABELS } from '../utils/fiscal';

interface AutomatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedReportModal: React.FC<AutomatedReportModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AutomatedReportConfig>(getStoredReportConfig());
  const [newEmail, setNewEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fiscalMonth = getFiscalMonth(currentMonth);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(currentMonth);

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

  const handleDownloadAllNow = () => {
    generateExecutiveReportPDF(currentMonth, currentYear, { includeCover: true });
    setTimeout(() => {
      exportFullManpowerExcel('ALL', currentMonth, currentYear);
    }, 400);
    setDownloadToast('Paket Berkas PDF & Excel berhasil diunduh ke komputer Anda!');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleTriggerTestEmail = () => {
    const recipientsList = config.recipients.join(', ') || 'paajinomoto@gmail.com';
    const emailSubject = `[AUTOMATED REPORT] Laporan Berkala Manpower - Periode ${monthLabel} ${currentYear}`;
    const portalBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const directPdfDownloadUrl = `${portalBaseUrl}/?action=download-pdf&report=executive&month=${currentMonth}&year=${currentYear}`;
    const directReportLink = `${portalBaseUrl}/?view=executive&month=${currentMonth}&year=${currentYear}`;
    
    const emailBody = `Kepada Yth. Bapak/Ibu Pimpinan & Tim Manajemen,

Berikut disampaikan Laporan Rutin Otomatis Manpower Control System (MPCS) PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory untuk periode ${monthLabel} ${currentYear}:

📌 STATUS JADWAL: ${config.frequency.toUpperCase()}
📄 FORMAT BERKAS: ${config.format.toUpperCase()}

==================================================
📥 TAUTAN UNDUH DOKUMEN PDF RESMI (KLIK UNTUK UNDUH)
==================================================
Penerima laporan dapat langsung mengunduh berkas PDF resmi melalui tautan sistem:
👉 Unduh Berkas PDF : ${directPdfDownloadUrl}
👉 Akses Portal MPCS: ${directReportLink}

Nama Berkas: Manpower_Executive_Report_${currentMonth}_${currentYear}.pdf

(Dokumen digital ini di-generate secara otomatis oleh modul penjadwalan MPCS)`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipientsList
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="end_of_month" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Setiap Akhir Bulan (Rutin)</option>
                <option value="weekly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Setiap Akhir Pekan (Jumat)</option>
                <option value="biweekly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Setiap 2 Pekan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Format Berkas
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="both" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">PDF Executive + Excel Database</option>
                <option value="pdf" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Hanya PDF Executive</option>
                <option value="excel" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Hanya Excel Database (.xlsx)</option>
              </select>
            </div>
          </div>

          {/* Attached Files Notification Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-red-600" />
                Paket Berkas Otomatis Siap Diunduh & Dilampirkan
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[11px] font-mono border border-red-200 dark:border-red-900/60">
                <FileText className="w-3 h-3" />
                Executive_Report_{monthLabel}.pdf
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono border border-emerald-200 dark:border-emerald-900/60">
                <FileSpreadsheet className="w-3 h-3" />
                Database_Manpower_{monthLabel}.xlsx
              </span>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAllNow}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Paket Berkas Sekarang</span>
              </button>
              <button
                type="button"
                onClick={handleTriggerTestEmail}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tes Kirim Email Sekarang</span>
              </button>
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
                placeholder="Tambah email (contoh: paajinomoto@gmail.com)"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
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
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            {downloadToast && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {downloadToast}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
