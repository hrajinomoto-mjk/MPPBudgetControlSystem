import React, { useState } from 'react';
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
} from 'lucide-react';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';

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
    setPasswordMsg({ text: 'Password akun berhasil diperbarui!', success: true });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3000);
  };

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR1';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Pengaturan Sistem & Akun</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi tema, profil pengguna/admin, sinkronisasi cloud, pemeliharaan akun departemen, dan otomatisasi laporan
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-[#0c1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${userAvatarBg} text-white flex items-center justify-center font-extrabold text-lg shadow-md`}>
              {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'AJ'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{user?.nama}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80">
                  {user?.role} ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {user?.email || user?.userId}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {user?.deptName || 'All Departments'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100/80 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  {user?.deptId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Edit Profil</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN EXCLUSIVE: User & Password Maintenance Banner */}
      {isAdminOrHR && onOpenUserManagement && (
        <div className="bg-gradient-to-br from-red-600 via-rose-700 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Panel Pemeliharaan Kredensial Administrator</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Manajemen Akun & Kredensial Seluruh Departemen
              </h3>
              <p className="text-xs text-red-100/90 leading-relaxed">
                Kelola akun PIC seluruh departemen, pantau dan ubah kata sandi secara aman, reset kredensial ke default, atau ekspor master kredensial dalam format CSV/Excel untuk distribusi resmi.
              </p>
            </div>

            <div className="relative z-10 flex-shrink-0">
              <button
                type="button"
                onClick={onOpenUserManagement}
                className="w-full md:w-auto px-5 py-3 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-red-600" />
                <span>Buka Panel Pemeliharaan User & Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Appearance */}
        <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Tema Tampilan (Dark Mode)</h4>
                <p className="text-[11px] text-slate-500">Mode gelap untuk kenyamanan malam hari</p>
              </div>
            </div>

            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} variant="switch" />
          </div>
        </div>

        {/* Module 2: Profile & Account Management */}
        <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Profil & Informasi Akun</h4>
                <p className="text-[11px] text-slate-500">Nama, email, telepon, dan title pekerjaan</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenProfile}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Kelola
            </button>
          </div>
        </div>

        {/* Module 3: Cloud Sync - Khusus Kewenangan Admin Master */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Sinkronisasi Cloud Data</h4>
                  <p className="text-[11px] text-slate-500">Multi-perangkat dengan enkripsi E2E</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenCloudSync}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Sync
              </button>
            </div>
          </div>
        )}

        {/* Module 4: Automated Reports */}
        <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Email Otomatis Bulanan</h4>
                <p className="text-[11px] text-slate-500">Jadwal pengiriman laporan eksekutif PDF</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAutomatedReports}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Jadwal
            </button>
          </div>
        </div>

        {/* Module 5: Database Integrations (Excel, GSheets, Supabase) - Khusus Kewenangan Admin Master */}
        {user?.role === 'ADMIN' && onOpenImportData && (
          <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Integrasi Database Terpadu (Excel / Google Sheets / Supabase Cloud DB)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Impor file spreadsheet, sinkronisasi live Google Sheets, atau sambungkan langsung ke database PostgreSQL Supabase
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenImportData}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileUp className="w-4 h-4" />
                <span>Buka Integrasi Database</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Form */}
      <div className="bg-white dark:bg-[#0c1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Key className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>Ganti Password Akun Saya</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Password Lama</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Password Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {passwordMsg && (
            <p
              className={`text-[11px] font-bold flex items-center gap-1 ${
                passwordMsg.success ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {passwordMsg.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {passwordMsg.text}
            </p>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Perbarui Password
          </button>
        </form>
      </div>

      {/* Admin Danger Zone: Factory Reset */}
      {user?.role === 'ADMIN' && (
        <div className="bg-red-50/50 dark:bg-red-950/20 p-6 rounded-3xl border border-red-200 dark:border-red-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
            <RotateCcw className="w-4 h-4" />
            <span>Zona Administrator: Reset Database Pabrik</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Mengembalikan seluruh data alokasi Manpower Plan, Realisasi Actual, Approval, dan riwayat Log ke database
            default resmi PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory.
          </p>
          <button
            type="button"
            onClick={onResetFactoryData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Database Default Pabrik</span>
          </button>
        </div>
      )}
    </div>
  );
};
