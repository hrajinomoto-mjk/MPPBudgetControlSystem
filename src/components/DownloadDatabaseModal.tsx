import React, { useState } from 'react';
import { FileSpreadsheet, Download, Building2, Calendar, CheckCircle2, X } from 'lucide-react';
import { DEPARTMENTS } from '../data/initialData';
import { CALENDAR_MONTH_SHORT } from '../utils/fiscal';
import { getDashboardData } from '../utils/storage';
import { exportFullManpowerExcel, exportUserDepartmentExcel } from '../utils/exportExcel';

interface DownloadDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDept: string;
  isUser: boolean;
}

export const DownloadDatabaseModal: React.FC<DownloadDatabaseModalProps> = ({
  isOpen,
  onClose,
  userDept,
  isUser,
}) => {
  const [dept, setDept] = useState(isUser ? userDept : 'ALL');
  const [bulan, setBulan] = useState<string>('ALL');
  const [tahun, setTahun] = useState<string>('ALL');
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const targetDept = isUser ? userDept : dept;
  const filteredData = getDashboardData(
    targetDept,
    bulan === 'ALL' ? undefined : Number(bulan),
    tahun === 'ALL' ? undefined : Number(tahun)
  );

  let totalPlan = 0;
  let totalActual = 0;
  filteredData.forEach((d) => {
    totalPlan += Number(d.plan) || 0;
    totalActual += Number(d.actual) || 0;
  });
  const pct = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      if (isUser) {
        exportUserDepartmentExcel(userDept, bulan, tahun);
      } else {
        exportFullManpowerExcel(dept, bulan, tahun);
      }
      setDownloading(false);
      setSuccessMsg(`File Excel berhasil diunduh (${filteredData.length} baris)`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Download Database Manpower</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Export data lengkap Budget vs Realisasi ke Excel (.xlsx)
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

        {/* Filters */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {!isUser && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departemen</label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">Semua Departemen</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bulan</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">Semua Bulan</option>
                {CALENDAR_MONTH_SHORT.map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    Bulan {i + 1} ({name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tahun</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">Semua Tahun</option>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Stats */}
          <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Baris</span>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{filteredData.length}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{totalPlan}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Actual</span>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{totalActual}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Achv %</span>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{pct.toFixed(1)}%</div>
            </div>
          </div>

          {/* Includes description */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-l-4 border-emerald-500 text-slate-600 dark:text-slate-400 space-y-1 text-[11px] leading-relaxed">
            <b>File Excel akan berisi:</b>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Header branding PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory</li>
              <li>Breakdown RW & OS lengkap untuk Plan & Actual</li>
              <li>Kalkulasi Gap (Variance), Achievement %, dan Status (OVER/OPTIMAL/UNDER)</li>
              <li>Catatan / remarks operasional lengkap</li>
            </ul>
          </div>

          {successMsg && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || filteredData.length === 0}
              className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Memproses...' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
