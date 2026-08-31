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
  userRole?: 'ADMIN' | 'HR' | 'USER';
}

export const UserDepartmentReportModal: React.FC<UserDepartmentReportModalProps> = ({
  isOpen,
  onClose,
  deptId,
  bulan,
  tahun,
  userRole,
}) => {
  const isUserRole = userRole === 'USER';
  const [emailTo, setEmailTo] = useState('paajinomoto@gmail.com');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
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
  const directPdfDownloadUrl = `${portalBaseUrl}/?action=download-pdf&report=dept&dept=${deptId}&month=${bulan}&year=${tahun}`;
  const directReportLink = `${portalBaseUrl}/?dept=${deptId}&month=${bulan}&year=${tahun}`;
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

==================================================
📥 TAUTAN UNDUH DOKUMEN PDF RESMI (KLIK UNTUK UNDUH)
==================================================
Penerima laporan dapat langsung mengunduh berkas PDF resmi melalui tautan sistem:
👉 Unduh PDF Laporan  : ${directPdfDownloadUrl}
👉 Akses Portal MPCS   : ${directReportLink}

Nama Berkas: ${deptPdfFileName}

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

  const compiledDeptHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
    <div style="background: #d32f2f; color: #fff; padding: 18px 20px;">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #ffcdd2;">PT Ajinomoto Indonesia — Pabrik Mojokerto</div>
      <div style="font-size: 17px; font-weight: bold; margin-top: 4px;">LAPORAN REALISASI MANPOWER: ${d.deptName.toUpperCase()}</div>
      <div style="font-size: 12px; margin-top: 4px; color: #ffebee;">Periode: <b>${monthLabel} ${tahun}</b> (${formatFiscalYearLabel(fiscalYear)})</div>
    </div>
    <div style="padding: 20px;">
      <p style="font-size: 13px; margin-top: 0;">Kepada Yth. Pimpinan & Section Head,</p>
      <p style="font-size: 13px; line-height: 1.5; color: #334155;">Berikut disampaikan ringkasan realisasi manpower Departemen <b>${d.deptName}</b> periode ${monthLabel} ${tahun}:</p>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #0f172a; color: #fff;">
            <th style="padding: 8px 10px; text-align: left;">Kategori</th>
            <th style="padding: 8px 10px; text-align: right;">Target Plan</th>
            <th style="padding: 8px 10px; text-align: right;">Realisasi</th>
            <th style="padding: 8px 10px; text-align: right;">Variance</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px;">Regular Worker (RW)</td>
            <td style="padding: 8px 10px; text-align: right;">${d.planRW} MP</td>
            <td style="padding: 8px 10px; text-align: right;">${d.actualRW} MP</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: bold;">${(rwDiff > 0 ? '+' : '')}${rwDiff} MP</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px;">Outsourcing (OS)</td>
            <td style="padding: 8px 10px; text-align: right;">${d.planOS} MP</td>
            <td style="padding: 8px 10px; text-align: right;">${d.actualOS} MP</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: bold;">${(osDiff > 0 ? '+' : '')}${osDiff} MP</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td style="padding: 10px;">TOTAL MANPOWER</td>
            <td style="padding: 10px; text-align: right;">${d.plan} MP</td>
            <td style="padding: 10px; text-align: right; color: #0f172a;">${d.actual} MP</td>
            <td style="padding: 10px; text-align: right; color: ${d.gap > 0 ? '#dc2626' : d.gap < 0 ? '#d97706' : '#16a34a'};">${(d.gap > 0 ? '+' : '')}${d.gap} MP</td>
          </tr>
        </tbody>
      </table>

      <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; margin-bottom: 16px;">
        <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">Catatan & Justifikasi:</div>
        <div style="color: #475569;">${d.remarks || 'Tidak ada catatan khusus pada periode ini.'}</div>
      </div>

      <!-- Direct PDF Download for Recipient -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px;">
        <div style="font-weight: bold; color: #b91c1c; margin-bottom: 6px;">📥 Unduh Berkas PDF Laporan Resmi:</div>
        <div style="color: #475569; margin-bottom: 10px;">Penerima laporan dapat mengunduh berkas PDF resmi bertanda tangan digital melalui tombol di bawah:</div>
        <div style="margin-bottom: 8px;">
          <a href="${directPdfDownloadUrl}" target="_blank" style="background-color: #d32f2f; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 12px; display: inline-block;">
            📥 Unduh PDF (${deptPdfFileName})
          </a>
        </div>
        <div style="font-size: 11px; color: #64748b;">
          🌐 Akses Portal: <a href="${directReportLink}" target="_blank" style="color: #d32f2f; text-decoration: underline;">Buka Dashboard MPCS</a>
        </div>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Laporan dihasilkan melalui sistem MPCS Ajinomoto Mojokerto Factory.</p>
    </div>
  </div>`;

  const handleOpenGmail = async () => {
    if (autoDownload) {
      handleDownloadFiles();
    }
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const textBlob = new Blob([`Subjek: ${emailSubject}\n\n` + emailBody], { type: 'text/plain' });
        const htmlBlob = new Blob([compiledDeptHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/plain': textBlob, 'text/html': htmlBlob }),
        ]);
      } else {
        await navigator.clipboard.writeText(`Subjek: ${emailSubject}\n\n` + emailBody);
      }
    } catch (e) {
      console.warn('Clipboard write fallback', e);
    }

    setDownloadToast('Gmail dibuka! Format HTML & Tautan Unduh PDF telah disalin (Tekan Ctrl+V di Gmail).');
    setTimeout(() => setDownloadToast(null), 5000);

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
      <div className="w-full max-w-xl max-h-[92vh] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.18),0_10px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(220,38,38,0.08)] ring-1 ring-slate-900/5 dark:ring-white/10 flex flex-col overflow-hidden">
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

          {/* User Role: Clean Download Panel Only (No Dispatch to Management) */}
          {isUserRole ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Download className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Unduh Dokumen Laporan Departemen</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                  Format Standar Resmi
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Silakan unduh dokumen laporan resmi bertanda tangan digital atau basis data spreadsheet untuk keperluan arsip dan dokumentasi internal departemen Anda:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={() => {
                    generateUserDepartmentReportPDF(deptId, bulan, tahun);
                    setDownloadToast('Dokumen PDF Laporan Departemen berhasil diunduh.');
                    setTimeout(() => setDownloadToast(null), 3500);
                  }}
                  className="p-3 bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-900 rounded-xl flex items-center gap-3 text-left transition-all duration-150 group cursor-pointer shadow-2xs"
                >
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 flex items-center justify-between">
                      <span>Unduh PDF Resmi</span>
                      <Download className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{deptPdfFileName}</div>
                  </div>
                </button>

                {/* Download Excel Button */}
                <button
                  type="button"
                  onClick={() => {
                    exportFullManpowerExcel(deptId, bulan, tahun);
                    setDownloadToast('File Spreadsheet Excel Departemen berhasil diunduh.');
                    setTimeout(() => setDownloadToast(null), 3500);
                  }}
                  className="p-3 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-900 rounded-xl flex items-center gap-3 text-left transition-all duration-150 group cursor-pointer shadow-2xs"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-between">
                      <span>Unduh Excel Data</span>
                      <Download className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{deptExcelFileName}</div>
                  </div>
                </button>
              </div>

              {/* Quick Download All package */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-slate-400" />
                  Unduh kedua berkas sekaligus:
                </span>
                <button
                  type="button"
                  onClick={handleDownloadFiles}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Unduh Paket (.PDF + .XLSX)</span>
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Admin & HR: Email Dispatcher with Gmail as Default & Attached Files */
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
          )}
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
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => exportFullManpowerExcel(deptId, bulan, tahun)}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Dept</span>
            </button>
            <button
              type="button"
              onClick={() => generateUserDepartmentReportPDF(deptId, bulan, tahun)}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
