import React, { useState } from 'react';
import { Copy, Calendar, Building2, ArrowRight, X } from 'lucide-react';
import { DEPARTMENTS } from '../data/initialData';
import { CALENDAR_MONTH_NAMES } from '../utils/fiscal';

interface DuplicateDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (type: 'PLAN' | 'ACTUAL', deptId: string, bulan: number, tahun: number) => void;
  currentBulan: number;
  currentTahun: number;
  userDept?: string;
}

export const DuplicateDataModal: React.FC<DuplicateDataModalProps> = ({
  isOpen,
  onClose,
  onDuplicate,
  currentBulan,
  currentTahun,
  userDept,
}) => {
  const [type, setType] = useState<'PLAN' | 'ACTUAL'>('PLAN');
  const [deptId, setDeptId] = useState(userDept || 'ALL');
  const [sourceBulan, setSourceBulan] = useState(currentBulan);
  const [sourceTahun, setSourceTahun] = useState(currentTahun);

  React.useEffect(() => {
    if (userDept) {
      setDeptId(userDept);
    }
  }, [userDept, isOpen]);

  if (!isOpen) return null;

  let targetBulan = sourceBulan + 1;
  let targetTahun = sourceTahun;
  if (targetBulan > 12) {
    targetBulan = 1;
    targetTahun = sourceTahun + 1;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDept = userDept || deptId;
    onDuplicate(type, effectiveDept, sourceBulan, sourceTahun);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Duplikasi Data Manpower</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Salin data ke bulan berikutnya secara otomatis</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Type */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Data</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('PLAN')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                  type === 'PLAN'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                BUDGET (PLAN)
              </button>
              <button
                type="button"
                onClick={() => setType('ACTUAL')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                  type === 'ACTUAL'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                REALISASI (ACTUAL)
              </button>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Departemen {userDept && <span className="text-[10px] text-red-500 font-normal">(Terkunci Sesuai Akun)</span>}
            </label>
            {userDept ? (
              <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-between">
                <span>{DEPARTMENTS.find((d) => d.id === userDept)?.name || userDept}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
                  {userDept}
                </span>
              </div>
            ) : (
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Semua Departemen (All Factory)</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Source Period */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bulan Sumber</label>
              <select
                value={sourceBulan}
                onChange={(e) => setSourceBulan(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {CALENDAR_MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tahun Sumber</label>
              <select
                value={sourceTahun}
                onChange={(e) => setSourceTahun(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Notification Info */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <ArrowRight className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold">Periode Tujuan:</div>
              <div className="text-[11px] opacity-90">
                {CALENDAR_MONTH_NAMES[targetBulan - 1]} {targetTahun} (Data yang sudah ada tidak akan ditimpa)
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Duplikasi Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
