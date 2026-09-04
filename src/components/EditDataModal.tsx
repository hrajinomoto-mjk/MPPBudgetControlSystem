import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit,
  X,
  Save,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { validateManpowerCapacity } from '../data/departmentCapacity';

interface EditDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rw: number, os: number, remarks: string) => void;
  deptId?: string;
  deptName: string;
  initialRW: number;
  initialOS: number;
  initialRemarks: string;
  isApprovalRequest?: boolean;
}

export const EditDataModal: React.FC<EditDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deptId,
  deptName,
  initialRW,
  initialOS,
  initialRemarks,
  isApprovalRequest = false,
}) => {
  const [rw, setRw] = useState<number>(initialRW);
  const [os, setOs] = useState<number>(initialOS);
  const [remarks, setRemarks] = useState<string>(initialRemarks);

  useEffect(() => {
    setRw(initialRW);
    setOs(initialOS);
    setRemarks(initialRemarks);
  }, [initialRW, initialOS, initialRemarks, isOpen]);

  const validation = useMemo(() => {
    return validateManpowerCapacity(deptId || deptName, rw, os);
  }, [deptId, deptName, rw, os]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rw, os, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isApprovalRequest ? 'Ajukan Perubahan Realisasi' : 'Edit Data Manpower'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {deptName} {deptId ? `(${deptId})` : ''}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Departemen</label>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                Kapasitas Standar: {validation.maxTotal} orang
              </span>
            </div>
            <input
              type="text"
              disabled
              value={`${deptName} ${deptId ? `[${deptId}]` : ''}`}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl cursor-not-allowed"
            />
          </div>

          {/* RW & OS with Real-Time Capacity Validation */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* RW Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Regular Worker (RW)
                </label>
                {validation.isRWExceeded && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    +{validation.excessRW}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  required
                  value={rw}
                  onChange={(e) => setRw(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-sm transition-all focus:outline-none ${
                    validation.isRWExceeded
                      ? validation.severity === 'critical'
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-2 border-red-500 text-red-950 dark:text-red-100 ring-2 ring-red-400/20'
                        : 'bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/20'
                      : rw > 0
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-500/50 dark:border-emerald-500/40 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500'
                  }`}
                />
                {validation.isRWExceeded && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 dark:text-slate-400 font-medium">
                <span>Standar: {validation.standardRW} orang</span>
                {validation.isRWExceeded ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Over Capacity</span>
                ) : rw > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Sesuai
                  </span>
                ) : null}
              </div>
            </div>

            {/* OS Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Outsource (OS)
                </label>
                {validation.isOSExceeded && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    +{validation.excessOS}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  required
                  value={os}
                  onChange={(e) => setOs(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-sm transition-all focus:outline-none ${
                    validation.isOSExceeded
                      ? validation.severity === 'critical'
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-2 border-red-500 text-red-950 dark:text-red-100 ring-2 ring-red-400/20'
                        : 'bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/20'
                      : os > 0
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-500/50 dark:border-emerald-500/40 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500'
                  }`}
                />
                {validation.isOSExceeded && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 dark:text-slate-400 font-medium">
                <span>Standar: {validation.standardOS} orang</span>
                {validation.isOSExceeded ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Over Capacity</span>
                ) : os > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Sesuai
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Real-Time Live Capacity Status Feedback Banner */}
          <div
            className={`p-3 rounded-2xl border transition-all duration-200 shadow-2xs ${
              validation.hasExceeded
                ? validation.severity === 'critical'
                  ? 'bg-red-50/90 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 text-red-900 dark:text-red-200'
                  : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex-shrink-0">
                {validation.hasExceeded ? (
                  validation.severity === 'critical' ? (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-extrabold text-[11px] uppercase tracking-wide">
                    {validation.hasExceeded
                      ? validation.severity === 'critical'
                        ? 'Kapasitas Kritis Terlampaui'
                        : 'Melebihi Kapasitas Standar'
                      : 'Sesuai Kapasitas Standar'}
                  </span>
                  <span className="font-mono text-[11px] font-bold">
                    {validation.currentTotal} / {validation.maxTotal} orang ({validation.percentageTotal}%)
                  </span>
                </div>

                {/* Progress Gauge */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      validation.percentageTotal > 125
                        ? 'bg-red-600'
                        : validation.percentageTotal > 100
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, validation.percentageTotal))}%` }}
                  />
                </div>

                <p className="text-[11px] leading-relaxed opacity-90">
                  {validation.hasExceeded
                    ? validation.warningMessage
                    : `Total alokasi manpower ${validation.currentTotal} orang berada dalam batas aman kapasitas departemen (${validation.maxTotal} orang).`}
                </p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Catatan / Remarks
              </label>
              {validation.hasExceeded && !remarks && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Disarankan beri alasan over-capacity
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                validation.hasExceeded
                  ? 'Tuliskan alasan operasional penambahan manpower melebihi standar kapasitas...'
                  : 'Catatan perubahan atau justifikasi...'
              }
              className={`w-full px-3 py-2 rounded-xl focus:outline-none transition-all ${
                validation.hasExceeded && !remarks
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100'
              }`}
            />
          </div>

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
              className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isApprovalRequest ? 'Ajukan ke Admin' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
