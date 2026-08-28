import React, { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  Building2,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  Paperclip,
} from 'lucide-react';
import { getDashboardData } from '../utils/storage';
import { generateUserDepartmentReportPDF } from '../utils/exportPdf';
import { exportFullManpowerExcel } from '../utils/exportExcel';
import { getFiscalMonth, FISCAL_MONTH_LABELS, formatFiscalYearLabel } from '../utils/fiscal';

interface UserDepartmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deptId: string;
  bulan: number;
  tahun: number;
}

export const UserDepartmentReportModal: React.FC<UserDepartmentReportModalProps> = ({
  isOpen,
  onClose,
  deptId,
  bulan,
  tahun,
}) => {
  const [emailTo, setEmailTo] = useState('paajinomoto@gmail.com');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const data = getDashboardData(deptId, bulan, tahun);

  if (data.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold">Data Tidak Tersedia</h3>
          <p className="text-xs text-slate-500">Tidak ada data untuk periode departemen ini.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const d = data[0];
  const fiscalMonth = getFiscalMonth(bulan);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(bulan);
  const fiscalYear = bulan >= 4 ? tahun : tahun - 1;

  const rwDiff = d.actualRW - d.planRW;
  const osDiff = d.actualOS - d.planOS;

  const portalBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const deptPdfFileName = `Manpower_Report_${d.deptName.replace(/\s+/g, '_')}_${monthLabel}_${tahun}.pdf`;
  const deptExcelFileName = `Database_Manpower_${d.deptName.replace(/\s+/g, '_')}_${monthLabel}_${tahun}.xlsx`;

  const emailSubject = `[MPCS REPORT] Realisasi Manpower Departemen ${d.deptName} - Periode ${monthLabel} ${tahun}`;

  const emailBody = `Kepada Yth. Pimpinan & Section Head,

Berikut disampaikan Laporan Realisasi Manpower Departemen ${d.deptName} PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory untuk periode ${monthLabel} ${tahun} (${formatFiscalYearLabel(fiscalYear)}):

📊 RINGKASAN MANPOWER:
• Budget Plan   : ${d.plan} MP (RW: ${d.planRW}, OS: ${d.planOS})
• Realisasi     : ${d.actual} MP (RW: ${d.actualRW}, OS: ${d.actualOS})
• Variance (Gap): ${(d.gap > 0 ? '+' : '')}${d.gap} MP
• Achievement   : ${d.achievement.toFixed(1)}%
• Status        : ${d.status}

📝 CATATAN REALISASI:
${d.remarks || 'Tidak ada catatan realisasi khusus pada periode ini.'}

📎 BERKAS LAMPIRAN & DATA RESMI:
• Dokumen PDF Resmi : ${deptPdfFileName} (Terlampir)
• Rekap Data Excel  : ${deptExcelFileName} (Terlampir)
• Akses Portal MPCS : ${portalBaseUrl}/?dept=${deptId}&month=${bulan}&year=${tahun}

Demikian laporan ini disampaikan untuk diketahui. Terima kasih.
(Dikirim secara resmi melalui Manpower Control System - MPCS)`;

  const handleDownloadFiles = () => {
    generateUserDepartmentReportPDF(deptId, bulan, tahun);
    setTimeout(() => {
      exportFullManpowerExcel(deptId, bulan, tahun);
    }, 400);
    setDownloadToast('Berkas PDF & Excel Departemen telah diunduh ke komputer!');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleOpenGmail = () => {
    if (autoDownload) {
      handleDownloadFiles();
    }
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      emailTo
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenOutlook = () => {
    if (autoDownload) {
      handleDownloadFiles();
    }
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
      emailTo
    )}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`Subjek: ${emailSubject}\n\n` + emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo) return;
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[92vh] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
              alt="Logo"
              className="w-10 h-8 object-contain"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Manpower Department Report</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {d.deptName} • PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              LAPORAN KONTROL DEPARTEMEN
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{d.deptName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Periode: <b className="text-slate-800 dark:text-slate-200">{monthLabel} {tahun}</b> • {formatFiscalYearLabel(fiscalYear)}
            </p>
          </div>

          {/* 4 Stat Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Plan Budget</span>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{d.plan}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Actual Realisasi</span>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{d.actual}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selisih (Gap)</span>
              <div
                className={`text-lg font-mono font-extrabold mt-0.5 ${
                  d.gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {d.gap > 0 ? '+' : ''}{d.gap}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Achievement</span>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {d.achievement.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* RW vs OS Breakdown Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-left">Kategori Tenaga Kerja</th>
                  <th className="p-3 text-center">Budget Plan</th>
                  <th className="p-3 text-center">Realisasi Actual</th>
                  <th className="p-3 text-center">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-semibold">👤 Regular Worker (RW)</td>
                  <td className="p-3 text-center">{d.planRW}</td>
                  <td className="p-3 text-center font-bold">{d.actualRW}</td>
                  <td className={`p-3 text-center font-bold ${rwDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {rwDiff > 0 ? '+' : ''}{rwDiff}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">👥 Outsource (OS)</td>
                  <td className="p-3 text-center">{d.planOS}</td>
                  <td className="p-3 text-center font-bold">{d.actualOS}</td>
                  <td className={`p-3 text-center font-bold ${osDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {osDiff > 0 ? '+' : ''}{osDiff}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-l-4 border-red-600 dark:border-red-500 space-y-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Catatan & Justifikasi Realisasi:</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {d.remarks || 'Tidak ada catatan realisasi khusus pada periode ini.'}
            </p>
          </div>

          {/* Email Dispatcher with Gmail as Default & Attached Files */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Mail className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Kirim Laporan ke Email Atasan / Pimpinan</span>
              </div>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
                Gmail Default
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="Masukkan email tujuan (contoh: paajinomoto@gmail.com)"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
              <button
                type="button"
                onClick={handleOpenGmail}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                title="Buka di Webmail Gmail dengan draft laporan terisi lengkap & berkas otomatis diunduh"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Buka di Gmail</span>
              </button>
            </div>

            {/* Auto-download Attachment Option & File Chips */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={(e) => setAutoDownload(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span>Otomatis unduh berkas (.PDF & .XLSX) saat membuka email</span>
              </label>

              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-red-500" />
                  Lampiran:
                </span>
                <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono text-[10px] border border-red-200 dark:border-red-900/60">
                  {deptPdfFileName}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] border border-emerald-200 dark:border-emerald-900/60">
                  {deptExcelFileName}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
              <button
                type="button"
                onClick={handleCopyText}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks Redaksional'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenOutlook}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Buka via Outlook Web</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {downloadToast && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {downloadToast}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => exportFullManpowerExcel(deptId, bulan, tahun)}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Dept</span>
            </button>
            <button
              type="button"
              onClick={() => generateUserDepartmentReportPDF(deptId, bulan, tahun)}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Dept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
