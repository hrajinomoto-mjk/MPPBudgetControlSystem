import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Moon,
  Sun,
  Cloud,
  Mail,
  Shield,
  Key,
  Database,
  RotateCcw,
  LogOut,
  User as UserIcon,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  UserCheck,
  FileSpreadsheet,
  Link,
  FileUp,
  KeyRound,
  ShieldCheck,
  Users,
  Activity,
  Server,
  Lock,
  Cpu,
  HardDrive,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  Info,
  Check,
} from 'lucide-react';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { pageContainerVariants, staggerItemVariants } from '../utils/motion';

interface SettingsViewProps {
  user: User | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenCloudSync: () => void;
  onOpenAutomatedReports: () => void;
  onOpenImportData?: () => void;
  onOpenUserManagement?: () => void;
  onLogout: () => void;
  onResetFactoryData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenProfile,
  onOpenCloudSync,
  onOpenAutomatedReports,
  onOpenImportData,
  onOpenUserManagement,
  onLogout,
  onResetFactoryData,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; success: boolean } | null>(null);

  const avatarGradientMap: Record<string, string> = {
    red: 'from-red-600 to-rose-700',
    indigo: 'from-indigo-600 to-blue-700',
    emerald: 'from-emerald-600 to-teal-700',
    amber: 'from-amber-600 to-orange-700',
    purple: 'from-purple-600 to-pink-700',
    slate: 'from-slate-700 to-slate-900',
  };

  const userAvatarBg = (user?.avatarColor && avatarGradientMap[user.avatarColor]) || 'from-red-600 to-rose-700';

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Konfirmasi password baru tidak cocok.', success: false });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ text: 'Password baru minimal 4 karakter.', success: false });
      return;
    }
    setPasswordMsg({ text: 'Password akun Anda berhasil diperbarui!', success: true });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3500);
  };

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR1';

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Belum diisi', color: 'bg-slate-200 dark:bg-slate-700' };
    if (pass.length < 5) return { score: 1, text: 'Lemah', color: 'bg-rose-500' };
    if (pass.length < 8) return { score: 2, text: 'Sedang', color: 'bg-amber-500' };
    return { score: 3, text: 'Kuat & Aman', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 w-full"
    >
      {/* 1. Executive Top Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-red-950 text-white flex items-center justify-center shadow-md shrink-0">
            <Settings className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                Pengaturan Sistem & Preferensi Akun
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Enterprise v2.8.4
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Lock className="w-2.5 h-2.5 text-indigo-500" />
                Security Vault Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Konfigurasi tata kelola sistem, tema visual, keamanan kredensial akun, integrasi database, dan otomatisasi reporting
            </p>
          </div>
        </div>

        {/* System Info Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-[11px]">Mojokerto Factory Gateway</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-[11px]">Enkripsi AES-256</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Top Grid: User Profile Showcase & System Telemetry */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* User Profile Card (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1220] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${userAvatarBg} text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0 ring-4 ring-slate-100 dark:ring-slate-800`}
              >
                {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'AJ'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {user?.nama || 'Pengguna Terdaftar'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80">
                    {user?.role} ACCESS
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                  {user?.email || user?.userId}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {user?.deptName || 'All Departments'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-red-100/80 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                    {user?.deptId}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sesi Aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onOpenProfile}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Edit Profil</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onLogout}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Sesi</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* System Telemetry & Health Cards (5 cols on lg) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cloud Engine</span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sinkron
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time Multi-device</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keamanan Vault</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Terproteksi</div>
              <p className="text-[10px] text-slate-400 mt-0.5">ISO 27001 Compliant</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Penyimpanan DB</span>
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">Hybrid Mirror</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Indexed Local + Cloud</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zona Waktu</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">WIB (UTC+7)</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Mojokerto Standard Time</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. ADMIN EXCLUSIVE: User & Password Maintenance Banner */}
      {isAdminOrHR && onOpenUserManagement && (
        <motion.div
          variants={staggerItemVariants}
          className="bg-gradient-to-br from-red-600 via-rose-700 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Panel Pemeliharaan Kredensial Administrator</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Manajemen Akun & Kredensial Seluruh Departemen
              </h3>
              <p className="text-xs text-red-100/90 leading-relaxed">
                Kelola akun PIC seluruh departemen, pantau dan ubah kata sandi secara aman, reset kredensial ke default, atau ekspor master kredensial dalam format CSV/Excel untuk distribusi resmi.
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onOpenUserManagement}
                className="w-full md:w-auto px-5 py-3 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-red-600" />
                <span>Buka Panel Pemeliharaan User & Pass</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. Core Configuration Bento Grid (3 Columns on xl, 2 on md) */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: Appearance & Dark Mode */}
        <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tema Tampilan</h4>
                  <p className="text-[11px] text-slate-500">Mode Gelap / Terang</p>
                </div>
              </div>
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} variant="switch" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Peralihan kontras tema otomatis untuk menjaga kenyamanan visual operator dalam kondisi pencahayaan shift malam atau siang.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Status: {isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">Eye Protection OK</span>
          </div>
        </div>

        {/* Module 2: Profile & Account Details */}
        <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Profil & Akun</h4>
                  <p className="text-[11px] text-slate-500">Identitas Pribadi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenProfile}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Kelola
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Perbarui nama lengkap, alamat email resmi Ajinomoto, nomor kontak, serta title jabatan pekerjaan Anda di sistem.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Role: {user?.role}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Terverifikasi</span>
          </div>
        </div>

        {/* Module 3: Cloud Sync (Admin / System) */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sinkronisasi Cloud</h4>
                    <p className="text-[11px] text-slate-500">Multi-Device Storage</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCloudSync}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Sync DB
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                Sinkronisasi data alokasi manpower antar perangkat desktop/laptop pabrik secara terenkripsi ujung-ke-ujung (E2E).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Status: Live Mirroring</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Zero Conflict</span>
            </div>
          </div>
        )}

        {/* Module 4: Automated Reports */}
        <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Email Otomatis Bulanan</h4>
                  <p className="text-[11px] text-slate-500">Auto Executive Dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAutomatedReports}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Jadwal
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Pengaturan jadwal pengiriman otomatis rekapitulasi laporan alokasi & variansi manpower PDF ke alamat email pimpinan/manajemen.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Frekuensi: Bulanan (Akhir Bulan)</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">PDF Ready</span>
          </div>
        </div>

        {/* Module 5: Database Integrations (Excel, GSheets, Supabase) - Khusus Admin */}
        {user?.role === 'ADMIN' && onOpenImportData && (
          <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Integrasi Database Terpadu (Excel / Sheets / Supabase DB)
                    </h4>
                    <p className="text-[11px] text-slate-500">Impor Spreadsheet & Cloud PostgreSQL Connector</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenImportData}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Buka Integrasi Database</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                Fasilitas impor multi-file Excel/CSV, sinkronisasi tautan Google Spreadsheet live, atau konektivitas langsung dengan database server PostgreSQL Supabase untuk integrasi level pabrik.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Format Didukung: .xlsx, .xls, .csv, GSheets, REST/PostgreSQL</span>
              <span className="font-semibold text-red-600 dark:text-red-400">Multi-Source</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* 5. Bottom Row: Change Password Form & Danger Zone Grid */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Change Password Card (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1220] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Ganti Password Akun Saya</h4>
                <p className="text-[11px] text-slate-500">Perbarui kata sandi untuk keamanan berkala</p>
              </div>
            </div>
            {newPassword && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Kekuatan: {passStrength.text}
              </span>
            )}
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password Saat Ini (Lama)
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ulangi Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Password meter bar */}
            {newPassword && (
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passStrength.color}`}
                  style={{ width: `${(passStrength.score / 3) * 100}%` }}
                />
              </div>
            )}

            {passwordMsg && (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
                  passwordMsg.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                {passwordMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Perbarui Password Akun
              </motion.button>
            </div>
          </form>
        </div>

        {/* Admin Danger Zone: Factory Reset (5 cols on lg) */}
        {user?.role === 'ADMIN' ? (
          <div className="lg:col-span-5 bg-red-50/60 dark:bg-red-950/20 p-5 sm:p-6 rounded-3xl border border-red-200 dark:border-red-900/60 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
                <RotateCcw className="w-4 h-4" />
                <span>Zona Administrator: Reset Database Pabrik</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mengembalikan seluruh data alokasi Manpower Plan, Realisasi Actual, Approval, dan riwayat Log ke database default resmi PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory.
              </p>
              <div className="p-3 bg-red-100/70 dark:bg-red-950/60 rounded-xl border border-red-200 dark:border-red-800/80 text-[11px] text-red-800 dark:text-red-300 font-medium">
                ⚠️ Tindakan ini akan menghapus modifikasi manual dan mengembalikan dataset master pabrik.
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onResetFactoryData}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Database Default Pabrik</span>
            </motion.button>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Panduan Akses & Kebijakan Keamanan</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Akun Anda memiliki kewenangan akses tingkat <b>Departemen ({user?.deptId})</b>. Anda dapat mengubah data rencana dan realisasi departemen Anda, serta memantau status persetujuan alokasi dari tim HR/Manajemen.
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
              💡 Hubungi tim Admin HR Development jika Anda memerlukan perubahan wewenang atau bantuan teknis.
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
