import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScrollText, Search, Download, Shield, Calendar, User, Clock, Filter } from 'lucide-react';
import { AuditLog, User as UserType } from '../types';
import { exportAuditLogsCSV } from '../utils/exportExcel';
import { pageContainerVariants, staggerItemVariants } from '../utils/motion';

interface AuditLogViewProps {
  logs?: AuditLog[];
  user: UserType | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs = [], user }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const isDeptUser = user?.role === 'USER';
  const safeLogs = Array.isArray(logs) ? logs : [];

  const filtered = useMemo(() => {
    return safeLogs.filter((log) => {
      if (!log) return false;
      if (isDeptUser && user?.deptId && log.dept !== user.deptId && log.dept !== 'ALL' && log.dept !== '-') {
        return false;
      }
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          (log.action || '').toLowerCase().includes(q) ||
          (log.user || '').toLowerCase().includes(q) ||
          (log.dept || '').toLowerCase().includes(q) ||
          (log.detail || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [safeLogs, isDeptUser, user, actionFilter, search]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const actionsList = Array.from(new Set(safeLogs.map((l) => l.action).filter(Boolean)));

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-md">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Audit Log System</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catatan riwayat perubahan data, login, dan aktivitas sistem untuk integritas audit
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => exportAuditLogsCSV(isDeptUser ? user?.deptId : 'ALL')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Log</span>
        </motion.button>
      </motion.div>

      {/* Filter & Search */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Jenis Aksi</option>
                {actionsList.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">({filtered.length} log ditemukan)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari user, aksi, detail..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold">
              <tr>
                <th className="p-3 text-left w-44">Waktu (Timestamp)</th>
                <th className="p-3 text-left w-48">User / Akun</th>
                <th className="p-3 text-left w-44">Aksi / Aktivitas</th>
                <th className="p-3 text-center w-28">Departemen</th>
                <th className="p-3 text-left">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                    Tidak ada log yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(log.time).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.time).toLocaleTimeString('id-ID')} WIB
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-sans truncate max-w-[180px]">
                      {log.user}
                    </td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                      {log.action}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {log.dept}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                      {log.detail}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
