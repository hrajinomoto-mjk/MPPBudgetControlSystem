import React, { useState } from 'react';
import { PlusCircle, Building2, Calendar, Users, MessageSquare, X, Check } from 'lucide-react';
import { Department } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { FISCAL_MONTH_LABELS, fiscalToCalendarMonth } from '../utils/fiscal';

interface AddDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    type: 'PLAN' | 'ACTUAL',
    deptId: string,
    bulan: number,
    tahun: number,
    rw: number,
    os: number,
    remarks: string
  ) => void;
  defaultType?: 'PLAN' | 'ACTUAL';
  defaultBulan: number;
  defaultTahun: number;
}

export const AddDataModal: React.FC<AddDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultType = 'PLAN',
  defaultBulan,
  defaultTahun,
}) => {
  const [type, setType] = useState<'PLAN' | 'ACTUAL'>(defaultType);
  const [deptId, setDeptId] = useState(DEPARTMENTS[0].id);
  const [bulan, setBulan] = useState(defaultBulan);
  const [tahun, setTahun] = useState(defaultTahun);
  const [rw, setRw] = useState<number | ''>('');
  const [os, setOs] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId || !bulan || !tahun) return;
    onSave(type, deptId, Number(bulan), Number(tahun), Number(rw) || 0, Number(os) || 0, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Input Data Manpower</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tambah data Budget atau Realisasi</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Type Selector */}
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departemen</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bulan</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Bulan {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tahun</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RW & OS */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Regular Worker (RW)</label>
              <input
                type="number"
                min={0}
                required
                value={rw}
                onChange={(e) => setRw(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Jumlah RW"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Outsource (OS)</label>
              <input
                type="number"
                min={0}
                required
                value={os}
                onChange={(e) => setOs(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Jumlah OS"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan / Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Tambahkan alasan atau detail alokasi..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

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
              type="submit"
              className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
