import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Users,
  Plus,
  Copy,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  FileUp,
  RotateCw,
} from 'lucide-react';
import { PlanRecord, ActualRecord, User } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { FISCAL_MONTH_LABELS, fiscalToCalendarMonth } from '../utils/fiscal';

interface TableViewProps {
  type: 'PLAN' | 'ACTUAL';
  user: User | null;
  plans: PlanRecord[];
  actuals: ActualRecord[];
  onOpenAddModal: () => void;
  onOpenDuplicateModal: () => void;
  onOpenImportModal?: (type: 'PLAN' | 'ACTUAL') => void;
  onOpenEditModal: (record: { id: string; deptId: string; rw: number; os: number; remarks: string }) => void;
  onDeleteRecord: (type: 'PLAN' | 'ACTUAL', id: string) => void;
  onPreviewRecord: (record: { deptId: string; deptName: string; rw: number; os: number; remarks: string }) => void;
  onRefresh?: () => void;
  selectedFiscalMonth: number | 'ALL';
  selectedYear: number;
  onChangeFiscalMonth: (m: number | 'ALL') => void;
  onChangeYear: (y: number) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  type,
  user,
  plans,
  actuals,
  onOpenAddModal,
  onOpenDuplicateModal,
  onOpenImportModal,
  onOpenEditModal,
  onDeleteRecord,
  onPreviewRecord,
  onRefresh,
  selectedFiscalMonth,
  selectedYear,
  onChangeFiscalMonth,
  onChangeYear,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rowsPerPage = 10;

  const handleRefreshClick = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR1';
  const isDeptUser = user?.role === 'USER';

  const deptMap = useMemo(() => {
    const map: Record<string, string> = {};
    DEPARTMENTS.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, []);

  const rawList = Array.isArray(type === 'PLAN' ? plans : actuals) ? (type === 'PLAN' ? plans : actuals) : [];

  const filtered = useMemo(() => {
    const calMonth = selectedFiscalMonth === 'ALL' ? null : fiscalToCalendarMonth(selectedFiscalMonth);

    return rawList.filter((item) => {
      if (!item) return false;
      if (isDeptUser && user?.deptId && item.deptId !== user.deptId) return false;
      if (calMonth !== null && Number(item.bulan) !== calMonth) return false;
      if (Number(item.tahun) !== Number(selectedYear)) return false;

      const dName = deptMap[item.deptId] || item.deptId || '';
      if (search && !dName.toLowerCase().includes(search.toLowerCase()) && !(item.deptId || '').toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rawList, selectedFiscalMonth, selectedYear, isDeptUser, user, deptMap, search]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const title = type === 'PLAN' ? 'Manpower Planning (Budget)' : 'Manpower Realization (Actual)';
  const subtitle =
    type === 'PLAN'
      ? 'Manage and Monitor Workforce Budget Planning Across Departments'
      : 'Manage and Monitor Workforce Actual Headcount Realization';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-md">
            {type === 'PLAN' ? <ClipboardList className="w-6 h-6" /> : <Users className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Fiscal Month Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedFiscalMonth}
              onChange={(e) => {
                onChangeFiscalMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Bulan {i + 1} ({FISCAL_MONTH_LABELS[i + 1]})
                </option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <select
              value={selectedYear}
              onChange={(e) => {
                onChangeYear(Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-70 shadow-2xs"
              title="Refresh database real-time (Shortcut: R)"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600 dark:text-red-400' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Merefresh...' : 'Refresh'}</span>
            </button>
          )}

          {isAdminOrHR && (
            <>
              {/* Import & Integrasi - Khusus Kewenangan Admin Master */}
              {user?.role === 'ADMIN' && onOpenImportModal && (
                <button
                  type="button"
                  onClick={() => onOpenImportModal(type)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Import data dari Excel, Google Sheets, atau Supabase Database"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Import & Integrasi</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenDuplicateModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                title="Duplikasi data ke bulan berikutnya"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Duplicate</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Data (n)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Data {type === 'PLAN' ? 'Budget Manpower' : 'Realisasi Manpower'}
            </h3>
            <span className="text-xs text-slate-400">Total baris ditemukan: {filtered.length}</span>
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
              placeholder="Cari Departemen..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold">
              <tr>
                <th className="p-3 text-left">Departemen</th>
                <th className="p-3 text-center">Regular Worker (RW)</th>
                <th className="p-3 text-center">Outsource (OS)</th>
                <th className="p-3 text-center">Total Headcount</th>
                <th className="p-3 text-left">Remarks</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginated.map((item: any) => {
                  const rw = type === 'PLAN' ? item.planRW : item.actualRW;
                  const os = type === 'PLAN' ? item.planOS : item.actualOS;
                  const total = rw + os;
                  const deptName = deptMap[item.deptId] || item.deptId;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{deptName}</div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Periode: Bulan {item.bulan} • Tahun {item.tahun}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-medium">{rw}</td>
                      <td className="p-3 text-center font-mono font-medium">{os}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                        {total}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {item.remarks || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewRecord({
                                deptId: item.deptId,
                                deptName,
                                rw,
                                os,
                                remarks: item.remarks || '',
                              })
                            }
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            title="Preview Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {(isAdminOrHR || (isDeptUser && type === 'ACTUAL')) && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenEditModal({
                                  id: item.id,
                                  deptId: item.deptId,
                                  rw,
                                  os,
                                  remarks: item.remarks || '',
                                })
                              }
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                              title={isDeptUser ? 'Ajukan Perubahan Realisasi' : 'Edit Data'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdminOrHR && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus data ${deptName} (${item.id})?`)) {
                                  onDeleteRecord(type, item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
      </div>
    </div>
  );
};
