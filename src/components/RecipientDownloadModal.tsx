import React from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { FISCAL_MONTH_LABELS, getFiscalMonth, formatFiscalYearLabel } from '../utils/fiscal';
import { generateExecutiveReportPDF, generateUserDepartmentReportPDF } from '../utils/exportPdf';
import { DEPARTMENTS } from '../data/initialData';

export interface RecipientDownloadState {
  reportType: 'executive' | 'dept';
  deptId?: string;
  month: number;
  year: number;
  autoDownloaded?: boolean;
}

interface RecipientDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialState?: RecipientDownloadState | null;
  downloadState?: RecipientDownloadState | null;
  onNavigateToLogin?: () => void;
}

export const RecipientDownloadModal: React.FC<RecipientDownloadModalProps> = ({
  isOpen,
  onClose,
  initialState,
  downloadState,
  onNavigateToLogin,
}) => {
  const activeState = initialState || downloadState;
  if (!isOpen || !activeState) return null;

  const { reportType, deptId, month, year } = activeState;
  const fiscalMonth = getFiscalMonth(month);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || `Bulan ${month}`;
  const fiscalYear = month >= 4 ? year : year - 1;
  const fyLabel = formatFiscalYearLabel(fiscalYear);

  const deptInfo = deptId ? DEPARTMENTS.find((d) => d.id === deptId) : null;
  const title =
    reportType === 'executive'
      ? 'Laporan Eksekutif Manpower Control System (MPCS)'
      : `Laporan Manpower Departemen ${deptInfo?.name || deptId || ''}`;

  const fileName =
    reportType === 'executive'
      ? `Manpower_Executive_Report_${month}_${year}.pdf`
      : `Manpower_Report_${deptId || 'DEPT'}_${month}_${year}.pdf`;

  const handleReDownload = () => {
    if (reportType === 'executive') {
      generateExecutiveReportPDF(month, year, { includeCover: true });
    } else if (deptId) {
      generateUserDepartmentReportPDF(deptId, month, year);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all"
        id="recipient-download-modal"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10.5px] uppercase font-bold tracking-widest text-red-200">
                PT Ajinomoto Indonesia — Mojokerto Factory
              </div>
              <h2 className="text-base font-black tracking-tight text-white">
                Unduh Dokumen Laporan Resmi
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="leading-snug">
              <span className="font-bold block text-[13px]">Unduhan Berkas Dimulai</span>
              <span>
                Dokumen PDF resmi telah diproses dan otomatis terunduh ke perangkat Anda.
              </span>
            </div>
          </div>

          {/* Report Metadata Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Nama Dokumen
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <span className="truncate">{title}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Periode Laporan:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {monthLabel} {year} ({fyLabel})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Berkas:</span>
                <span className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 truncate block">
                  {fileName}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Digital Signature Verified
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Lock className="w-3 h-3 text-red-500" />
                Confidential / Internal
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleReDownload}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-xs shadow-md shadow-red-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Ulang Berkas PDF ({fileName})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateToLogin) {
                  onNavigateToLogin();
                }
              }}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Buka Portal Interaktif MPCS</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 dark:bg-slate-900/90 px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 text-center text-[10.5px] text-slate-400">
          PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory • Workforce Analytics
        </div>
      </div>
    </div>
  );
};
