import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  CheckCheck,
  Search,
  RotateCcw,
  Lock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { DEPARTMENTS } from '../data/initialData';
import { CALENDAR_MONTH_SHORT, CALENDAR_MONTH_NAMES } from '../utils/fiscal';
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
  // All department IDs
  const allDeptIds = useMemo(() => DEPARTMENTS.map((d) => d.id), []);

  // Selection state
  const [selectedDepts, setSelectedDepts] = useState<string[]>(allDeptIds);
  const [searchDept, setSearchDept] = useState('');
  const [bulan, setBulan] = useState<string>('ALL');
  const [tahun, setTahun] = useState<string>('ALL');
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Department user is locked to their specific department
  const activeDepts = isUser ? [userDept] : selectedDepts;
  const isAllSelected = !isUser && selectedDepts.length === DEPARTMENTS.length;
  const isNoneSelected = !isUser && selectedDepts.length === 0;

  // Filtered departments for search in selector
  const filteredDeptList = DEPARTMENTS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchDept.toLowerCase()) ||
      d.id.toLowerCase().includes(searchDept.toLowerCase())
  );

  // Toggle single department
  const handleToggleDept = (id: string) => {
    if (isUser) return;
    if (selectedDepts.includes(id)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== id));
    } else {
      setSelectedDepts([...selectedDepts, id]);
    }
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDepts([]);
    } else {
      setSelectedDepts(allDeptIds);
    }
  };

  // Presets
  const applyPreset = (deptIds: string[]) => {
    setSelectedDepts(deptIds);
  };

  // Calculate live filtered data
  const filteredData = getDashboardData(
    activeDepts.length === 0 ? [] : (isAllSelected ? 'ALL' : activeDepts),
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
  const totalGap = totalActual - totalPlan;

  const handleDownload = () => {
    if (activeDepts.length === 0) return;
    setDownloading(true);
    setTimeout(() => {
      if (isUser) {
        exportUserDepartmentExcel(userDept, bulan, tahun);
      } else {
        const target = isAllSelected ? 'ALL' : selectedDepts;
        exportFullManpowerExcel(target, bulan, tahun);
      }
      setDownloading(false);
      setSuccessMsg(
        `File Excel ${isUser ? 'Departemen' : 'Gabungan'} berhasil diunduh (${filteredData.length} baris data)`
      );
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }, 450);
  };

  const userDeptInfo = DEPARTMENTS.find((d) => d.id === userDept);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Download Database Manpower
                </h3>
                {!isUser && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
                    Akses Gabungan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUser
                  ? 'Unduh database manpower spesifik untuk departemen Anda'
                  : 'Unduh laporan gabungan lintas departemen ke format spreadsheet (.xlsx)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Department Selection Section */}
          {isUser ? (
            /* User with locked Department */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Departemen Anda (Terkunci)</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {userDept} • {userDeptInfo?.name || 'Department Anda'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-[11px] font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Dept Lock</span>
              </div>
            </div>
          ) : (
            /* Special Access Multi-Select Department Control */
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Pilih Departemen:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isAllSelected
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : isNoneSelected
                        ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                    }`}
                  >
                    {isAllSelected
                      ? `Semua Departemen (${selectedDepts.length}/${DEPARTMENTS.length})`
                      : isNoneSelected
                      ? '0 Departemen Terpilih'
                      : `${selectedDepts.length} dari ${DEPARTMENTS.length} Departemen Terpilih`}
                  </span>
                </div>

                {/* Primary Master Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs ${
                      isAllSelected
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-800'
                        : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{isAllSelected ? 'Batalkan Semua' : 'Pilih Semua Departemen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDepts([])}
                    disabled={selectedDepts.length === 0}
                    title="Hapus semua pilihan"
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-40 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Preset Filters */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Preset:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDepts(allDeptIds)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                    isAllSelected
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Seluruh Pabrik (23)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(['D001', 'D002', 'D003', 'D004', 'D005', 'D017'])}
                  className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  Produksi Saja (6)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(['D006', 'D007', 'D008'])}
                  className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  Supply Chain & PPIC (3)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(['D009', 'D010', 'D011', 'D015', 'D016', 'D018', 'D019', 'D020'])}
                  className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  Engineering & QA (8)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(['D012', 'D013', 'D014', 'D021', 'D022', 'D023'])}
                  className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  HR, GA & Legal (6)
                </button>
              </div>

              {/* Multi-Select Box Container */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                {/* Search in multi-select */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchDept}
                    onChange={(e) => setSearchDept(e.target.value)}
                    placeholder="Cari nama atau kode departemen..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  />
                  {searchDept && (
                    <button
                      type="button"
                      onClick={() => setSearchDept('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Department Grid List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredDeptList.map((d) => {
                    const isChecked = selectedDepts.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleDept(d.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-red-50/90 dark:bg-red-950/40 border-red-400 dark:border-red-700/80 text-slate-900 dark:text-slate-100 shadow-2xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`shrink-0 ${
                            isChecked
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                isChecked
                                  ? 'bg-red-200/80 dark:bg-red-900/80 text-red-800 dark:text-red-200'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {d.id}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold truncate leading-tight mt-0.5">
                            {d.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredDeptList.length === 0 && (
                  <p className="text-center py-4 text-slate-400 dark:text-slate-500 font-medium">
                    Tidak ada departemen yang cocok dengan pencarian "{searchDept}".
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Month and Year Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Filter Bulan</span>
              </label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  Semua Bulan (Full Year)
                </option>
                {CALENDAR_MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                    Bulan {i + 1} ({name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Filter Tahun</span>
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                  Semua Tahun
                </option>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold py-1">
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Preview Dynamic Metrics */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/90 dark:to-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Ringkasan Data Siap Ekspor
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {activeDepts.length} Dept Dipilih
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Baris</span>
                <div className="text-base font-mono font-extrabold text-slate-900 dark:text-slate-100">
                  {filteredData.length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Budget (Plan)</span>
                <div className="text-base font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  {totalPlan.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Realisasi (Actual)</span>
                <div className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {totalActual.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Achievement</span>
                <div
                  className={`text-base font-mono font-extrabold ${
                    pct > 100
                      ? 'text-amber-600 dark:text-amber-400'
                      : pct >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {pct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Excel Content Features Description */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300 space-y-1.5 text-[11px] leading-relaxed">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Struktur Laporan Excel (.xlsx) Resmi:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Header identitas PT Ajinomoto Indonesia & PT Ajinex International Mojokerto Factory</li>
              <li>Rincian detail Regular Worker (RW) vs Outsourcing (OS) untuk Plan & Actual</li>
              <li>Perhitungan otomatis Gap (Variance), % Achievement KPI, dan Label Evaluasi Status</li>
              <li>Kompilasi multi-departemen gabungan siap untuk rapat review manajemen</li>
            </ul>
          </div>

          {/* Success Message Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {activeDepts.length === 0 ? (
              <span className="text-rose-500 font-bold">Pilih minimal 1 departemen</span>
            ) : (
              <span>
                Siap ekspor <b className="text-slate-800 dark:text-slate-200">{filteredData.length}</b> baris data
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || activeDepts.length === 0 || filteredData.length === 0}
              className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloading
                  ? 'Menyiapkan File...'
                  : isAllSelected || activeDepts.length > 1
                  ? 'Download Laporan Gabungan (.xlsx)'
                  : 'Download Excel (.xlsx)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
