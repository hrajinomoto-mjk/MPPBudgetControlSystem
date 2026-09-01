import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
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
  ShieldCheck,
  Sparkles,
  ArrowDownToLine,
  Layers,
  Clock,
  Printer,
  FileCheck2,
  Lock,
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
  const [copied, setCopied] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  if (!isOpen) return null;

  const data = getDashboardData(deptId, bulan, tahun);

  if (data.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Data Periode Tidak Tersedia</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tidak ada data untuk periode departemen ini.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
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

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      generateUserDepartmentReportPDF(deptId, bulan, tahun);
      setDownloadToast('Dokumen PDF resmi berhasil dibuat & diunduh.');
    } finally {
      setTimeout(() => {
        setIsDownloadingPdf(false);
      }, 800);
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  const handleDownloadExcel = () => {
    setIsDownloadingExcel(true);
    try {
      exportFullManpowerExcel(deptId, bulan, tahun);
      setDownloadToast('Spreadsheet Excel Departemen berhasil diekspor & diunduh.');
    } finally {
      setTimeout(() => {
        setIsDownloadingExcel(false);
      }, 800);
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  const handleDownloadFiles = () => {
    setIsDownloadingAll(true);
    generateUserDepartmentReportPDF(deptId, bulan, tahun);
    setTimeout(() => {
      exportFullManpowerExcel(deptId, bulan, tahun);
      setIsDownloadingAll(false);
      setDownloadToast('Paket Lengkap (.PDF + .XLSX) berhasil diunduh secara serentak!');
      setTimeout(() => setDownloadToast(null), 4500);
    }, 450);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.2),0_10px_25px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(220,38,38,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10 flex flex-col overflow-hidden"
      >
        {/* Top Header Banner with Ajinomoto Red Accent Line */}
        <div className="relative border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-red-50/30 dark:from-[#0d1527] dark:via-[#0c1220] dark:to-red-950/20 p-5 sm:p-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-500" />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-xs">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 font-mono">
                    {deptId}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-red-500" />
                    Pabrik Mojokerto
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
                  Manpower Department Report
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Department Name & Period Hero Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white dark:from-slate-900 dark:to-slate-950 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                DOKUMEN RESMI DEPARTEMEN
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {d.deptName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                <span>Periode: <strong className="text-white">{monthLabel} {tahun}</strong></span>
                <span>•</span>
                <span className="text-slate-400 font-mono">{formatFiscalYearLabel(fiscalYear)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
                <div className="text-[9px] uppercase font-bold text-slate-300">Status Capaian</div>
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{d.achievement.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Compact Stat Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plan Budget</span>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {d.plan} <span className="text-[10px] font-normal text-slate-400">MP</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Actual Realisasi</span>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {d.actual} <span className="text-[10px] font-normal text-slate-400">MP</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Variance (Gap)</span>
              <div
                className={`text-lg font-mono font-extrabold mt-0.5 ${
                  d.gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {d.gap > 0 ? '+' : ''}{d.gap} <span className="text-[10px] font-normal text-slate-400">MP</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status MPCS</span>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 truncate px-1">
                {d.status}
              </div>
            </div>
          </div>

          {/* Regular Worker vs Outsource Breakdown Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-left">Komponen Tenaga Kerja</th>
                  <th className="p-3 text-center">Target Budget</th>
                  <th className="p-3 text-center">Realisasi Actual</th>
                  <th className="p-3 text-center">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Regular Worker (RW)
                  </td>
                  <td className="p-3 text-center font-mono">{d.planRW}</td>
                  <td className="p-3 text-center font-mono font-bold">{d.actualRW}</td>
                  <td className={`p-3 text-center font-mono font-bold ${rwDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {rwDiff > 0 ? '+' : ''}{rwDiff}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Outsourcing (OS)
                  </td>
                  <td className="p-3 text-center font-mono">{d.planOS}</td>
                  <td className="p-3 text-center font-mono font-bold">{d.actualOS}</td>
                  <td className={`p-3 text-center font-mono font-bold ${osDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {osDiff > 0 ? '+' : ''}{osDiff}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border-l-4 border-red-600 dark:border-red-500 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-red-500" />
              <span>Catatan & Justifikasi Realisasi:</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "{d.remarks || 'Tidak ada catatan realisasi khusus pada periode ini.'}"
            </p>
          </div>

          {/* ============================================================ */}
          {/* EXCLUSIVE USER DOWNLOAD STUDIO (BEAUTIFUL & ELEGANT) */}
          {/* ============================================================ */}
          {isUserRole ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Executive Document Center
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pusat unduhan arsip resmi manpower departemen Anda
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Akses Terisolasi: {deptId}
                </span>
              </div>

              {/* Two Premium Feature Download Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. PDF Premium Card */}
                <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-b from-white to-red-50/40 dark:from-[#11192e] dark:to-red-950/20 border border-red-200/80 dark:border-red-900/40 hover:border-red-400 dark:hover:border-red-700 p-4 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all" />
                  
                  <div className="space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                        PDF RESMI
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        Laporan Resmi Departemen (PDF)
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                        Dokumen siap cetak berkop resmi pabrik dengan tanda tangan digital & format baku.
                      </p>
                    </div>

                    <div className="pt-1 text-[10px] text-slate-400 font-mono truncate">
                      {deptPdfFileName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="mt-3.5 w-full py-2.5 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75"
                  >
                    <ArrowDownToLine className={`w-4 h-4 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                    <span>{isDownloadingPdf ? 'Mengunduh PDF...' : 'Unduh Dokumen PDF'}</span>
                  </button>
                </div>

                {/* 2. Excel Premium Card */}
                <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-b from-white to-emerald-50/40 dark:from-[#11192e] dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-700 p-4 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />

                  <div className="space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                        EXCEL DATASET
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Spreadsheet Database (XLSX)
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                        Basis data tabular lengkap dengan formula audit, rincian RW/OS, dan rekapitulasi.
                      </p>
                    </div>

                    <div className="pt-1 text-[10px] text-slate-400 font-mono truncate">
                      {deptExcelFileName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={isDownloadingExcel}
                    className="mt-3.5 w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75"
                  >
                    <ArrowDownToLine className={`w-4 h-4 ${isDownloadingExcel ? 'animate-bounce' : ''}`} />
                    <span>{isDownloadingExcel ? 'Mengekspor Excel...' : 'Unduh Berkas Excel'}</span>
                  </button>
                </div>
              </div>

              {/* Master Dual-Download Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                    <Paperclip className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Unduh Paket Lengkap (.PDF + .XLSX)</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-red-500 text-white rounded">
                        1-KLIK
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Mengunduh berkas laporan PDF dan spreadsheet Excel sekaligus ke perangkat Anda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadFiles}
                  disabled={isDownloadingAll}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-75"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloadingAll ? 'animate-spin' : ''}`} />
                  <span>{isDownloadingAll ? 'Mengunduh...' : 'Unduh Semua Berkas'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* ADMIN / HR DISPATCHER (EMAIL KE PIMPINAN) */
            /* ============================================================ */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
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
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks Redaksional'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenOutlook}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka via Outlook Web</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="min-h-[20px]">
            <AnimatePresence>
              {downloadToast && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{downloadToast}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Dept</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Dept</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
