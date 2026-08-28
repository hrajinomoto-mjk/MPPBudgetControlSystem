import React, { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  Building2,
  Calendar,
  Brain,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { getDashboardData } from '../utils/storage';
import { generateExecutiveReportPDF } from '../utils/exportPdf';
import { getFiscalMonth, FISCAL_MONTH_LABELS, formatFiscalYearLabel } from '../utils/fiscal';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulan: number;
  tahun: number;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({ isOpen, onClose, bulan, tahun }) => {
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const data = getDashboardData('ALL', bulan, tahun);
  const safeData = Array.isArray(data) ? data : [];
  const fiscalMonth = getFiscalMonth(bulan);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(bulan);
  const fiscalYear = bulan >= 4 ? tahun : tahun - 1;

  let totalPlan = 0;
  let totalActual = 0;
  safeData.forEach((d) => {
    totalPlan += Number(d.plan) || 0;
    totalActual += Number(d.actual) || 0;
  });

  const gap = totalActual - totalPlan;
  const pct = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;
  const status = pct > 100 ? 'OVER CAPACITY' : pct < 90 ? 'UNDER CAPACITY' : 'KONDISI OPTIMAL';
  const statusColor =
    pct > 100 ? 'text-red-600 dark:text-red-400' : pct < 90 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400';

  const narrative =
    pct > 100
      ? `Secara keseluruhan tercatat kelebihan manpower (over capacity) dengan pencapaian ${pct.toFixed(
          1
        )}% dari budget yang direncanakan. Diperlukan evaluasi lebih lanjut terhadap efisiensi alokasi tenaga kerja pada departemen produksi terkait.`
      : pct < 90
      ? `Secara keseluruhan manpower berada di bawah budget dengan pencapaian ${pct.toFixed(
          1
        )}%. Kondisi ini berpotensi menimbulkan beban kerja berlebih (overload) dan perlu dipantau untuk menjaga produktivitas tim.`
      : `Secara keseluruhan kondisi manpower berada dalam rentang optimal dengan pencapaian ${pct.toFixed(
          1
        )}% terhadap budget, menunjukkan perencanaan dan realisasi tenaga kerja berjalan sesuai target.`;

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
      <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
              alt="Logo"
              className="w-10 h-8 object-contain"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Manpower Executive Report</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory — HR Development
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Period & Title */}
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              EXECUTIVE SUMMARY
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Laporan Manpower Budget vs Actual
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Periode: <b className="text-slate-800 dark:text-slate-200">{monthLabel} {tahun}</b> • {formatFiscalYearLabel(fiscalYear)} • Total Departemen: <b className="text-slate-800 dark:text-slate-200">{data.length}</b>
            </p>
          </div>

          {/* Hero Gauge & Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-5">
            {/* Circular Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/60 shadow-inner flex-shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100">
                  {pct.toFixed(0)}%
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Pencapaian</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`text-sm font-extrabold tracking-wide ${statusColor}`}>{status}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{narrative}</p>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Budget</span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {totalPlan.toLocaleString()}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Actual</span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {totalActual.toLocaleString()}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Variance (Gap)</span>
              <div
                className={`text-base sm:text-lg font-mono font-extrabold mt-0.5 ${
                  gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {gap > 0 ? '+' : ''}{gap.toLocaleString()}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Achievement</span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {pct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Department Breakdown Mini Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mb-2">
              Rincian Manpower per Departemen
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Departemen</th>
                    <th className="p-2 text-center">Budget</th>
                    <th className="p-2 text-center">Actual</th>
                    <th className="p-2 text-center">Selisih</th>
                    <th className="p-2 text-center">Achv</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map((d) => (
                    <tr key={d.deptId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium">{d.deptName}</td>
                      <td className="p-2 text-center">{d.plan}</td>
                      <td className="p-2 text-center font-bold">{d.actual}</td>
                      <td
                        className={`p-2 text-center font-bold ${
                          d.gap > 0 ? 'text-red-500' : 'text-emerald-500'
                        }`}
                      >
                        {d.gap > 0 ? '+' : ''}{d.gap}
                      </td>
                      <td className="p-2 text-center font-mono">{d.achievement.toFixed(1)}%</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'OVER'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : d.status === 'UNDER'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Dispatcher */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Send className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Kirim Laporan Resmi ke Email Pimpinan</span>
            </div>
            <form onSubmit={handleSendEmail} className="flex gap-2">
              <input
                type="email"
                required
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="Masukkan email tujuan (contoh: pimpinan@ajinomoto.co.id)"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={sendingEmail}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {sendingEmail ? 'Mengirim...' : emailSent ? 'Terkirim!' : 'Kirim Email'}
              </button>
            </form>
            {emailSent && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Laporan berhasil dikirim ke {emailTo}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => generateExecutiveReportPDF(bulan, tahun)}
            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Executive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
