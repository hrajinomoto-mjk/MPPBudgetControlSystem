import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Link,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  FileUp,
  Table,
  Info,
  Server,
  Cloud,
} from 'lucide-react';
import {
  ImportPreviewItem,
  GoogleSheetsConfig,
  SupabaseConfig,
  User,
} from '../types';
import {
  parseSpreadsheetBuffer,
  commitImportedData,
  downloadImportTemplate,
  getStoredGoogleSheetsConfig,
  saveStoredGoogleSheetsConfig,
  fetchGoogleSheetsData,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
  pushAllDataToSupabase,
  pullAllDataFromSupabase,
  getSupabaseSQLSchema,
} from '../utils/integrations';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  defaultTargetType?: 'PLAN' | 'ACTUAL' | 'BOTH';
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  defaultTargetType = 'PLAN',
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'GSHEETS' | 'SUPABASE'>('FILE');
  const [targetType, setTargetType] = useState<'PLAN' | 'ACTUAL' | 'BOTH'>(defaultTargetType);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [importResultSummary, setImportResultSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Sheets State
  const [gsheetsConfig, setGsheetsConfig] = useState<GoogleSheetsConfig>(() => getStoredGoogleSheetsConfig());
  const [gsheetsLoading, setGsheetsLoading] = useState(false);
  const [gsheetsError, setGsheetsError] = useState<string | null>(null);
  const [gsheetsSuccess, setGsheetsSuccess] = useState<string | null>(null);

  // Supabase State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const actor = user?.email || user?.userId || 'Admin';

  // -----------------------------------------------------------------
  // FILE HANDLERS
  // -----------------------------------------------------------------
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileLoading(true);
    setImportResultSummary(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const items = parseSpreadsheetBuffer(buffer, targetType);
      setPreviewItems(items);
    } catch (err: any) {
      console.error('File parse error:', err);
      setPreviewItems([]);
      setImportResultSummary('Gagal membaca file Excel/CSV. Pastikan format tabel sesuai.');
    } finally {
      setFileLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCommitFileImport = () => {
    if (previewItems.length === 0) return;
    const res = commitImportedData(previewItems, targetType, actor);
    setImportResultSummary(
      `Sukses: ${res.successCount} data berhasil diimpor ke sistem (${res.errorCount} data tidak valid).`
    );
    onSuccess();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // -----------------------------------------------------------------
  // GOOGLE SHEETS HANDLERS
  // -----------------------------------------------------------------
  const handleFetchGoogleSheets = async () => {
    if (!gsheetsConfig.sheetUrl.trim()) {
      setGsheetsError('Masukkan URL Google Sheets terlebih dahulu.');
      return;
    }

    setGsheetsLoading(true);
    setGsheetsError(null);
    setGsheetsSuccess(null);

    try {
      saveStoredGoogleSheetsConfig(gsheetsConfig);
      const res = await fetchGoogleSheetsData(gsheetsConfig.sheetUrl, gsheetsConfig.targetType);
      setPreviewItems(res.items);
      setGsheetsSuccess(
        `Berhasil menarik ${res.rawRowCount} baris dari Google Sheets. Silakan periksa preview di bawah lalu klik "Simpan ke Database".`
      );
    } catch (err: any) {
      setGsheetsError(err.message || 'Gagal tersambung ke Google Sheets.');
    } finally {
      setGsheetsLoading(false);
    }
  };

  const handleCommitGoogleSheetsImport = () => {
    if (previewItems.length === 0) return;
    const res = commitImportedData(previewItems, gsheetsConfig.targetType, actor);
    const updated = {
      ...gsheetsConfig,
      lastSynced: new Date().toISOString(),
    };
    setGsheetsConfig(updated);
    saveStoredGoogleSheetsConfig(updated);
    setGsheetsSuccess(`Berhasil mengimpor ${res.successCount} baris dari Google Sheets ke database lokal!`);
    onSuccess();
  };

  // -----------------------------------------------------------------
  // SUPABASE HANDLERS
  // -----------------------------------------------------------------
  const handleTestSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseStatusMsg(null);

    try {
      saveStoredSupabaseConfig(supabaseConfig);
      const res = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anonKey);
      if (res.success) {
        setSupabaseConfig((prev) => ({ ...prev, status: 'CONNECTED' }));
        setSupabaseStatusMsg({ text: res.message, isError: false });
      } else {
        setSupabaseConfig((prev) => ({ ...prev, status: 'ERROR', errorMessage: res.message }));
        setSupabaseStatusMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setSupabaseStatusMsg({ text: err.message || 'Gagal koneksi.', isError: true });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handlePushSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseStatusMsg(null);
    try {
      saveStoredSupabaseConfig(supabaseConfig);
      const res = await pushAllDataToSupabase(supabaseConfig.url, supabaseConfig.anonKey, actor);
      const updated = {
        ...supabaseConfig,
        lastSynced: new Date().toISOString(),
        status: 'CONNECTED' as const,
      };
      setSupabaseConfig(updated);
      saveStoredSupabaseConfig(updated);
      setSupabaseStatusMsg({ text: res.message, isError: false });
      onSuccess();
    } catch (err: any) {
      setSupabaseStatusMsg({ text: err.message || 'Gagal mengirim data ke Supabase.', isError: true });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handlePullSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseStatusMsg(null);
    try {
      saveStoredSupabaseConfig(supabaseConfig);
      const res = await pullAllDataFromSupabase(supabaseConfig.url, supabaseConfig.anonKey, actor);
      const updated = {
        ...supabaseConfig,
        lastSynced: new Date().toISOString(),
        status: 'CONNECTED' as const,
      };
      setSupabaseConfig(updated);
      saveStoredSupabaseConfig(updated);
      setSupabaseStatusMsg({
        text: `Berhasil menarik ${res.pulledPlans} Plan, ${res.pulledActuals} Actual, ${res.pulledUsers} Akun Pengguna, dan ${res.pulledApprovals} Approval dari Supabase!`,
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      setSupabaseStatusMsg({ text: err.message || 'Gagal menarik data dari Supabase.', isError: true });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleCopySql = () => {
    const sql = getSupabaseSQLSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const validCount = previewItems.filter((i) => i.isValid).length;
  const invalidCount = previewItems.length - validCount;
  const effectiveTargetType = activeTab === 'GSHEETS' ? gsheetsConfig.targetType : targetType;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-md">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Import & Integrasi Database Terpadu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sinkronisasi data melalui File Excel/CSV, Google Sheets, atau Supabase Database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-1.5 gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('FILE');
              setPreviewItems([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'FILE'
                ? 'bg-white dark:bg-[#0c1220] text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('GSHEETS');
              setPreviewItems([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'GSHEETS'
                ? 'bg-white dark:bg-[#0c1220] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Google Sheets Live</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('SUPABASE');
              setPreviewItems([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SUPABASE'
                ? 'bg-white dark:bg-[#0c1220] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Cloud DB</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: FILE UPLOAD (EXCEL/CSV) */}
          {activeTab === 'FILE' && (
            <div className="space-y-4">
              {/* Target Type Selector & Download Template */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-1">
                    Tujuan Alokasi Data:
                  </label>
                  <div className="flex items-center gap-2">
                    {(['PLAN', 'ACTUAL', 'BOTH'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTargetType(t);
                          if (file) handleFileChange(file);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          targetType === t
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {t === 'PLAN' ? 'Budget (Plan)' : t === 'ACTUAL' ? 'Realisasi (Actual)' : 'Keduanya (Plan & Actual)'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadImportTemplate(targetType)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-red-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {file ? file.name : 'Pilih atau Tarik File Excel / CSV ke sini'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mendukung format .xlsx, .xls, dan .csv
                  </p>
                </div>
                {file && (
                  <span className="px-2.5 py-1 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-mono text-[10px] rounded-lg">
                    Ukuran: {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>

              {importResultSummary && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{importResultSummary}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS LIVE SYNC */}
          {activeTab === 'GSHEETS' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Info className="w-4 h-4" />
                  <span>Petunjuk Integrasi Google Sheets:</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  1. Buka spreadsheet Anda di Google Drive, klik tombol <strong>Bagikan (Share)</strong>.<br />
                  2. Ubah akses menjadi <strong>&quot;Siapa saja yang memiliki link dapat melihat&quot; (Anyone with the link can view)</strong>.<br />
                  3. Format kolom yang didukung untuk <strong>Realisasi (Actual)</strong>: <code>Departemen / Dept / Kode</code>, <code>Bulan</code>, <code>Tahun</code>, <code>Actual RW / RW</code>, <code>Actual OS / OS</code>, <code>Remarks / Catatan</code>.<br />
                  4. Salin tautan spreadsheet dan tempelkan pada kolom URL di bawah, lalu klik <strong>Tarik Data</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Google Sheets Share URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={gsheetsConfig.sheetUrl}
                      onChange={(e) =>
                        setGsheetsConfig((prev) => ({ ...prev, sheetUrl: e.target.value }))
                      }
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={gsheetsLoading || !gsheetsConfig.sheetUrl.trim()}
                      onClick={handleFetchGoogleSheets}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {gsheetsLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>Tarik Data</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tipe Data:
                    </span>
                    <select
                      value={gsheetsConfig.targetType}
                      onChange={(e) => {
                        const nextType = e.target.value as any;
                        setGsheetsConfig((prev) => ({
                          ...prev,
                          targetType: nextType,
                        }));
                      }}
                      className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-slate-100"
                    >
                      <option value="ACTUAL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Realisasi Manpower (Actual)</option>
                      <option value="PLAN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Budget Manpower (Plan)</option>
                      <option value="BOTH" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Gabungan (Plan & Actual)</option>
                    </select>
                  </div>

                  {gsheetsConfig.lastSynced && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Terakhir sinkron: {new Date(gsheetsConfig.lastSynced).toLocaleTimeString('id-ID')}
                    </span>
                  )}
                </div>

                {gsheetsError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{gsheetsError}</span>
                  </div>
                )}

                {gsheetsSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{gsheetsSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SUPABASE POSTGRESQL CLOUD DATABASE */}
          {activeTab === 'SUPABASE' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs">
                    <Server className="w-4 h-4" />
                    <span>Koneksi Supabase PostgreSQL Database</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSqlSchema((prev) => !prev)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showSqlSchema ? 'Tutup Script SQL' : 'Lihat Script SQL Schema'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400">
                  Integrasikan sistem MPCS dengan database cloud Supabase untuk penyimpanan multi-user terpusat.
                </p>
              </div>

              {showSqlSchema && (
                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      PostgreSQL DDL (Tabel mpcs_plans, mpcs_actuals, mpcs_approvals)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-lg text-emerald-400">
                    {getSupabaseSQLSchema()}
                  </pre>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="url"
                    value={supabaseConfig.url}
                    onChange={(e) =>
                      setSupabaseConfig((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://xyzabcdefg.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Supabase Anon / Service Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseConfig.anonKey}
                    onChange={(e) =>
                      setSupabaseConfig((prev) => ({ ...prev, anonKey: e.target.value }))
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {supabaseStatusMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      supabaseStatusMsg.isError
                        ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {supabaseStatusMsg.isError ? (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{supabaseStatusMsg.text}</span>
                  </div>
                )}

                {/* Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={supabaseLoading || !supabaseConfig.url || !supabaseConfig.anonKey}
                    onClick={handleTestSupabase}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {supabaseLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                    <span>Test Koneksi</span>
                  </button>

                  <button
                    type="button"
                    disabled={supabaseLoading || !supabaseConfig.url || !supabaseConfig.anonKey}
                    onClick={handlePushSupabase}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload ke Supabase</span>
                  </button>

                  <button
                    type="button"
                    disabled={supabaseLoading || !supabaseConfig.url || !supabaseConfig.anonKey}
                    onClick={handlePullSupabase}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tarik dari Supabase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW TABLE (Shown when rows are parsed/fetched) */}
          {previewItems.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden space-y-2 p-3.5 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Preview Data ({previewItems.length} Baris Terbaca &bull; Target: {effectiveTargetType})
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    ✓ {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
                      ⚠ {invalidCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0c1220]">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 text-left">Status</th>
                      <th className="p-2.5 text-left">Dept Code</th>
                      <th className="p-2.5 text-left">Dept Name</th>
                      <th className="p-2.5 text-center">Bulan</th>
                      <th className="p-2.5 text-center">Tahun</th>
                      {effectiveTargetType === 'ACTUAL' ? (
                        <>
                          <th className="p-2.5 text-center text-blue-600 dark:text-blue-400">Actual RW</th>
                          <th className="p-2.5 text-center text-amber-600 dark:text-amber-400">Actual OS</th>
                          <th className="p-2.5 text-center text-slate-900 dark:text-slate-100">Total Actual</th>
                        </>
                      ) : effectiveTargetType === 'PLAN' ? (
                        <>
                          <th className="p-2.5 text-center text-blue-600 dark:text-blue-400">Plan RW</th>
                          <th className="p-2.5 text-center text-amber-600 dark:text-amber-400">Plan OS</th>
                          <th className="p-2.5 text-center text-slate-900 dark:text-slate-100">Total Plan</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2.5 text-center">Plan (RW/OS)</th>
                          <th className="p-2.5 text-center">Actual (RW/OS)</th>
                          <th className="p-2.5 text-center">Total</th>
                        </>
                      )}
                      <th className="p-2.5 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewItems.slice(0, 50).map((row, idx) => {
                      const isAct = effectiveTargetType === 'ACTUAL';
                      const isPlan = effectiveTargetType === 'PLAN';
                      const rwVal = isAct ? (row.actualRW ?? 0) : (row.planRW ?? 0);
                      const osVal = isAct ? (row.actualOS ?? 0) : (row.planOS ?? 0);
                      const totalVal = rwVal + osVal;

                      return (
                        <tr
                          key={row.id || idx}
                          className={!row.isValid ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'}
                        >
                          <td className="p-2.5">
                            {row.isValid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                            ) : (
                              <span
                                className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1"
                                title={row.errors.join(', ')}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 inline flex-shrink-0" />
                                {row.errors[0]}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold">{row.deptId}</td>
                          <td className="p-2.5 truncate max-w-[140px] font-medium">{row.deptName}</td>
                          <td className="p-2.5 text-center font-mono">{row.bulan}</td>
                          <td className="p-2.5 text-center font-mono">{row.tahun}</td>
                          {isAct || isPlan ? (
                            <>
                              <td className="p-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                {rwVal}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                                {osVal}
                              </td>
                              <td className="p-2.5 text-center font-mono font-extrabold text-slate-900 dark:text-slate-100">
                                {totalVal}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2.5 text-center font-mono">
                                {row.planRW ?? 0} / {row.planOS ?? 0}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                {row.actualRW ?? 0} / {row.actualOS ?? 0}
                              </td>
                              <td className="p-2.5 text-center font-mono font-extrabold">
                                {(row.actualRW ?? 0) + (row.actualOS ?? 0)}
                              </td>
                            </>
                          )}
                          <td className="p-2.5 text-slate-500 dark:text-slate-400 italic truncate max-w-[150px]">
                            {row.remarks || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {validCount} data valid siap disimpan ke database sistem sebagai <strong className="text-slate-800 dark:text-slate-200">{effectiveTargetType}</strong>.
                </span>
                <button
                  type="button"
                  disabled={validCount === 0}
                  onClick={activeTab === 'GSHEETS' ? handleCommitGoogleSheetsImport : handleCommitFileImport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan {validCount} Data ({effectiveTargetType}) ke Database</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Validasi otomatis terhadap seluruh master departemen PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
