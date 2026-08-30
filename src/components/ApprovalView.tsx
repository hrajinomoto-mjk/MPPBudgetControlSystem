import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Check, X, Building2, User, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import { PendingApproval, User as UserType } from '../types';
import { pageContainerVariants, staggerItemVariants, staggerSubGridVariants, staggerSubCardVariants } from '../utils/motion';

interface ApprovalViewProps {
  approvals?: PendingApproval[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  user: UserType | null;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  approvals = [],
  onApprove,
  onReject,
  user,
}) => {
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const pendingList = safeApprovals.filter((a) => a && a.status === 'PENDING');
  const historyList = safeApprovals.filter((a) => a && a.status !== 'PENDING');

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId) return;
    onReject(rejectModalId, rejectReason);
    setRejectModalId(null);
    setRejectReason('');
  };

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Approval Perubahan Realisasi Manpower
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verifikasi & validasi permohonan pembaruan data RW/OS dari Department Users
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
            {pendingList.length} Menunggu Persetujuan
          </span>
        </div>
      </motion.div>

      {/* Pending Requests Queue */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Antrean Permintaan Pending ({pendingList.length})</span>
        </h3>

        {pendingList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">Semua permohonan telah diproses.</p>
            <p className="text-[11px]">Tidak ada permintaan perubahan actual yang menunggu approval saat ini.</p>
          </div>
        ) : (
          <motion.div variants={staggerSubGridVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingList.map((req) => (
              <motion.div
                variants={staggerSubCardVariants}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                key={req.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md space-y-3 transition-shadow"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{req.deptName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {req.id} • Periode: Bulan {req.bulan}/{req.tahun}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full">
                    PENDING
                  </span>
                </div>

                {/* Requested Data */}
                <div className="grid grid-cols-2 gap-2 text-xs text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Usulan Regular Worker</span>
                    <span className="font-bold text-base text-blue-600 dark:text-blue-400">{req.actualRW} orang</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Usulan Outsource</span>
                    <span className="font-bold text-base text-red-600 dark:text-red-400">{req.actualOS} orang</span>
                  </div>
                </div>

                {/* Remarks & Requester */}
                <div className="text-xs space-y-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 text-[10px]">Justifikasi / Alasan:</div>
                  <p className="text-slate-700 dark:text-slate-300 italic">{req.remarks || 'Tidak ada catatan.'}</p>
                  <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Oleh: {req.requestedBy}</span>
                    <span>{new Date(req.requestedAt).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => onApprove(req.id)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve (Setujui)</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => setRejectModalId(req.id)}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Tolak</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* History Log Table */}
      {historyList.length > 0 && (
        <motion.div
          variants={staggerItemVariants}
          className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Riwayat Permintaan yang Telah Diproses ({historyList.length})
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-2.5 text-left">Departemen</th>
                  <th className="p-2.5 text-center">Periode</th>
                  <th className="p-2.5 text-center">Actual RW</th>
                  <th className="p-2.5 text-center">Actual OS</th>
                  <th className="p-2.5 text-left">Justifikasi</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-left">Ditinjau Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historyList.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-semibold">{h.deptName}</td>
                    <td className="p-2.5 text-center">{h.bulan}/{h.tahun}</td>
                    <td className="p-2.5 text-center font-mono">{h.actualRW}</td>
                    <td className="p-2.5 text-center font-mono">{h.actualOS}</td>
                    <td className="p-2.5 text-slate-500 max-w-xs truncate">{h.remarks || '-'}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.status === 'APPROVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px]">
                      {h.reviewedBy || '-'}
                      {h.rejectReason && <span className="block text-rose-500 text-[10px]">Alasan: {h.rejectReason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Reject Modal dialog */}
      <AnimatePresence>
        {rejectModalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Tolak Permintaan Approval</span>
              </div>
              <form onSubmit={handleConfirmReject} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Penolakan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Masukkan alasan penolakan untuk departemen..."
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => setRejectModalId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                  >
                    Konfirmasi Tolak
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
