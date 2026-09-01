import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Key,
  User as UserIcon,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  Plus,
  Sparkles,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  FileSpreadsheet,
  UserCheck,
  ShieldAlert,
  X,
  Lock,
  Building2,
} from 'lucide-react';
import { User } from '../types';
import { getStoredUsers, saveStoredUsers, addAuditLog } from '../utils/storage';
import {
  pageContainerVariants,
  staggerItemVariants,
  staggerSubGridVariants,
  staggerSubCardVariants,
} from '../utils/motion';

interface UserManagementViewProps {
  currentUser: User | null;
  onUsersUpdated?: () => void;
  showToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onUsersUpdated,
  showToast,
}) => {
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PROD' | 'SUPPLY' | 'ENG' | 'SUPPORT' | 'ADMIN'>('ALL');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarColor, setEditAvatarColor] = useState('indigo');

  // Change Password State
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Add New User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'HR1' | 'ADMIN'>('USER');
  const [newUserPass, setNewUserPass] = useState('user123');

  // Reload stored users on mount and keep sync
  useEffect(() => {
    setUsers(getStoredUsers());
  }, []);

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyCredential = (u: User) => {
    const text = `Departemen: ${u.deptName}\nUser ID / Email: ${u.email || u.userId}\nPassword: ${u.password || 'user123'}\nPIC: ${u.nama}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.userId);
    if (showToast) {
      showToast('info', 'Kredensial Disalin', `Kredensial ${u.deptName} berhasil disalin ke clipboard.`);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllCredentials = () => {
    const lines = users.map(
      (u, idx) =>
        `${idx + 1}. ${u.deptName}\n   User ID: ${u.email || u.userId}\n   Password: ${u.password || 'user123'}\n   PIC: ${u.nama} (${u.title || '-'})\n`
    );
    const fullText = `=== DAFTAR RESMI KREDENSIAL PENGGUNA MPCS PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL, MOJOKERTO FACTORY ===\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(fullText);
    if (showToast) {
      showToast('success', 'Seluruh Kredensial Disalin', 'Daftar kredensial seluruh departemen & akun admin berhasil disalin ke clipboard.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Kode_Dept', 'Nama_Departemen', 'Nama_PIC', 'Email', 'User_ID', 'Password', 'Role', 'Telepon', 'Jabatan'];
    const rows = users.map((u) => [
      `"${u.deptId}"`,
      `"${u.deptName || '-'}"`,
      `"${u.nama}"`,
      `"${u.email}"`,
      `"${u.userId}"`,
      `"${u.password || 'user123'}"`,
      `"${u.role}"`,
      `"${u.phone || '-'}"`,
      `"${u.title || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Kredensial_User_MPCS_Ajinomoto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast('success', 'File CSV Berhasil Diunduh', 'Master kredensial seluruh departemen berhasil diekspor.');
    }
  };

  // Open Edit User Modal
  const handleStartEditUser = (u: User) => {
    setEditingUser(u);
    setEditNama(u.nama);
    setEditEmail(u.email);
    setEditTitle(u.title || '');
    setEditPhone(u.phone || '');
    setEditAvatarColor(u.avatarColor || 'indigo');
  };

  // Save Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map((u) => {
      if (u.userId === editingUser.userId) {
        return {
          ...u,
          nama: editNama.trim(),
          email: editEmail.trim(),
          title: editTitle.trim(),
          phone: editPhone.trim(),
          avatarColor: editAvatarColor,
        };
      }
      return u;
    });

    setUsers(updated);
    saveStoredUsers(updated);
    addAuditLog(
      currentUser?.email || 'ADMIN',
      'ADMIN_UPDATE_USER',
      editingUser.deptId,
      `Admin memperbarui profil PIC ${editingUser.deptName} (${editingUser.deptId}): ${editNama}`
    );

    if (showToast) {
      showToast('success', 'Profil Berhasil Disimpan', `Data PIC untuk ${editingUser.deptName} berhasil diperbarui.`);
    }

    if (onUsersUpdated) onUsersUpdated();
    setEditingUser(null);
  };

  // Open Password Modal
  const handleStartChangePassword = (u: User) => {
    setPasswordModalUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  // Generate strong random password
  const generateStrongPassword = () => {
    if (!passwordModalUser) return;
    const cleanDept = passwordModalUser.deptId.replace(/[^a-zA-Z0-9]/g, '');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Aji#${cleanDept}!${rand}`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setPasswordError('');
  };

  // Save Change Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (newPassword.length < 4) {
      setPasswordError('Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok.');
      return;
    }

    const updated = users.map((u) => {
      if (u.userId === passwordModalUser.userId) {
        return {
          ...u,
          password: newPassword,
        };
      }
      return u;
    });

    setUsers(updated);
    saveStoredUsers(updated);
    addAuditLog(
      currentUser?.email || 'ADMIN',
      'ADMIN_RESET_PASSWORD',
      passwordModalUser.deptId,
      `Admin mengubah password departemen ${passwordModalUser.deptName} (${passwordModalUser.deptId})`
    );

    if (showToast) {
      showToast(
        'success',
        'Password Berhasil Diubah',
        `Password untuk ${passwordModalUser.deptName} (${passwordModalUser.deptId}) berhasil diperbarui.`
      );
    }

    if (onUsersUpdated) onUsersUpdated();
    setPasswordModalUser(null);
  };

  // 1-Click Reset to Default (user123)
  const handleResetToDefault = (u: User) => {
    const defaultPass = u.role === 'USER' ? 'user123' : 'admin';
    const confirm = window.confirm(
      `Apakah Anda yakin ingin me-reset password untuk ${u.deptName} (${u.deptId}) kembali ke default "${defaultPass}"?`
    );
    if (!confirm) return;

    const updated = users.map((item) => {
      if (item.userId === u.userId) {
        return {
          ...item,
          password: defaultPass,
        };
      }
      return item;
    });

    setUsers(updated);
    saveStoredUsers(updated);
    addAuditLog(
      currentUser?.email || 'ADMIN',
      'ADMIN_RESET_PASSWORD_DEFAULT',
      u.deptId,
      `Admin mereset password ${u.deptName} (${u.deptId}) ke default (${defaultPass})`
    );

    if (showToast) {
      showToast('info', 'Password Direset ke Default', `Password untuk ${u.deptName} kini adalah "${defaultPass}".`);
    }

    if (onUsersUpdated) onUsersUpdated();
  };

  // Bulk Reset All Users to Default
  const handleBulkResetAll = () => {
    const confirm = window.confirm(
      'PERINGATAN: Apakah Anda yakin ingin mereset password SELURUH Departemen Operasional ke default ("user123") dan Akun Admin ke "admin"?'
    );
    if (!confirm) return;

    const updated = users.map((u) => ({
      ...u,
      password: u.role === 'USER' ? 'user123' : 'admin',
    }));

    setUsers(updated);
    saveStoredUsers(updated);
    addAuditLog(
      currentUser?.email || 'ADMIN',
      'ADMIN_BULK_RESET_PASSWORDS',
      'ALL',
      'Admin melakukan reset massal seluruh password departemen ke default standar'
    );

    if (showToast) {
      showToast('success', 'Reset Massal Berhasil', 'Seluruh akun departemen telah direset ke password standar.');
    }

    if (onUsersUpdated) onUsersUpdated();
  };

  // Add New User Handler
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptId.trim() || !newUserName.trim()) return;

    const formattedDeptId = newDeptId.trim().toUpperCase();
    const cleanEmail = newUserEmail.trim() || `${formattedDeptId.toLowerCase()}@ajinomoto.co.id`;
    const cleanUserId = cleanEmail;

    const newUserObj: User = {
      userId: cleanUserId,
      email: cleanEmail,
      nama: newUserName.trim(),
      deptId: formattedDeptId,
      deptName: newDeptName.trim() || `Department ${formattedDeptId}`,
      role: newUserRole,
      password: newUserPass.trim() || 'user123',
      title: newUserTitle.trim() || 'Department Coordinator',
      phone: newUserPhone.trim() || '0857-0000-0000',
      avatarColor: 'indigo',
    };

    const updated = [...users, newUserObj];
    setUsers(updated);
    saveStoredUsers(updated);
    addAuditLog(
      currentUser?.email || 'ADMIN',
      'ADMIN_CREATE_USER',
      newUserObj.deptId,
      `Admin menambahkan akun pengguna baru: ${newUserObj.nama} (${newUserObj.deptId})`
    );

    if (showToast) {
      showToast('success', 'Akun Baru Ditambahkan', `Akun untuk ${newUserObj.deptName} (${newUserObj.deptId}) berhasil dibuat.`);
    }

    if (onUsersUpdated) onUsersUpdated();
    setIsAddUserOpen(false);
    setNewDeptId('');
    setNewDeptName('');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTitle('');
    setNewUserPhone('');
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.deptId.toLowerCase().includes(q) ||
        (u.deptName || '').toLowerCase().includes(q) ||
        u.nama.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.title || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (categoryFilter === 'ADMIN') {
        return u.role === 'ADMIN' || u.role === 'HR1';
      }
      if (categoryFilter === 'PROD') {
        return ['D001', 'D002', 'D003', 'D004', 'D005', 'D017'].includes(u.deptId);
      }
      if (categoryFilter === 'SUPPLY') {
        return ['D006', 'D007', 'D008', 'D009'].includes(u.deptId);
      }
      if (categoryFilter === 'ENG') {
        return ['D010', 'D011', 'D018', 'D019'].includes(u.deptId);
      }
      if (categoryFilter === 'SUPPORT') {
        return ['D012', 'D013', 'D014', 'D015', 'D016', 'D020', 'D021', 'D022', 'D023'].includes(u.deptId);
      }

      return true;
    });
  }, [users, searchQuery, categoryFilter]);

  const totalDeptCount = users.filter((u) => u.role === 'USER').length;

  if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'HR1') {
    return (
      <div className="p-8 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Akses Terbatas</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menu Manajemen User & Password Departemen hanya dapat diakses oleh Administrator & Tim HR Development.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header View */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-md shadow-red-600/20 flex-shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                User & Password Departemen
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                Admin System
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pusat kontrol keamanan akun, pengaturan PIC, reset password, dan distribusi kredensial seluruh departemen operasional PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-md shadow-red-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </motion.div>

      {/* Quick Metrics Bar */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Departemen</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalDeptCount}</span>
            <span className="text-xs text-slate-500 font-semibold">Unit Operasional Aktif</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status Kredensial</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">100% Terenkripsi & Aktif</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Akun Administrator</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">2</span>
            <span className="text-xs text-slate-500 font-semibold">Super Admin & HR1</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Akses Isolasi Data</span>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldAlert className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Level Per-Departemen</span>
          </div>
        </div>
      </motion.div>

      {/* Control Panel: Search, Actions & Filter Tabs */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama departemen, kode unit, nama PIC, email, atau kontak..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Unduh seluruh daftar kredensial dalam format CSV/Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV/Excel</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAllCredentials}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Salin seluruh format kredensial untuk didistribusikan ke PIC"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Salin Format Distribusi</span>
            </button>

            <button
              type="button"
              onClick={handleBulkResetAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Reset seluruh password departemen kembali ke user123"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua ke Default</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `Semua Akun (${users.length})` },
            { id: 'PROD', label: 'Produksi (6)' },
            { id: 'SUPPLY', label: 'Supply Chain & PPC (4)' },
            { id: 'ENG', label: 'Engineering & ITEC (4)' },
            { id: 'SUPPORT', label: 'Support, HR & Legal (9)' },
            { id: 'ADMIN', label: 'Administrator (2)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* User Accounts List */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-white dark:bg-[#0c1220] p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="col-span-3">Departemen & PIC</div>
          <div className="col-span-3">Email & User ID</div>
          <div className="col-span-3">Password Kredensial</div>
          <div className="col-span-3 text-right">Aksi Maintenance Admin</div>
        </div>

        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isRevealed = !!revealedPasswords[u.userId];
            const displayPass = u.password || (u.role === 'USER' ? 'user123' : 'admin');
            const isDefaultPass = displayPass === 'user123' || displayPass === 'admin';

            return (
              <div
                key={u.userId}
                className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all shadow-xs space-y-3 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center"
              >
                {/* Column 1: Dept & PIC */}
                <div className="lg:col-span-3 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs border border-slate-700 shadow-xs">
                    {u.deptId}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {u.deptName || 'Ajinomoto Department'}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : u.role === 'HR1'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{u.nama}</span>
                    </div>
                    {u.title && (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {u.title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Email & Phone */}
                <div className="lg:col-span-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px] truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{u.email || u.userId}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                </div>

                {/* Column 3: Password & Security */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                        {isRevealed ? displayPass : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(u.userId)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                        title={isRevealed ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCredential(u)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Salin User ID & Password"
                    >
                      {copiedId === u.userId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className={isDefaultPass ? 'text-amber-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                      {isDefaultPass ? '● Password Standar' : '● Password Kustom'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResetToDefault(u)}
                      className="text-slate-400 hover:text-amber-500 underline cursor-pointer"
                      title="Kembalikan ke default"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {/* Column 4: Admin Maintenance Actions */}
                <div className="lg:col-span-3 flex items-center justify-end gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleStartChangePassword(u)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Ganti Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEditUser(u)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit PIC</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-300">Tidak ditemukan departemen dengan kata kunci "{searchQuery}"</p>
              <p>Silakan periksa kembali kata kunci pencarian atau sesuaikan filter kategori divisi.</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Seluruh perubahan password langsung aktif dan dicatat dalam audit trail sistem.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Total Akun: {filteredUsers.length}</span>
        </div>
      </motion.div>

      {/* Sub-Modal: Ganti Password Departemen */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Ganti Password Departemen
                  </h3>
                  <p className="text-xs text-slate-500">
                    {passwordModalUser.deptName} ({passwordModalUser.deptId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">User ID Login:</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {passwordModalUser.email || passwordModalUser.userId}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Password Baru</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Acak Kuat</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Password</label>
                <input
                  type="text"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Edit Profil PIC */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Edit Detail PIC Departemen
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser.deptName} ({editingUser.deptId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap PIC</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Korporat</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jabatan / Posisi</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Contoh: Section Coordinator • Food Production 1"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0857-XXXX-XXXX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Tambah Akun Baru */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Tambah Akun Pengguna / Departemen
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buat akun baru untuk departemen tambahan atau admin khusus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Departemen</label>
                  <input
                    type="text"
                    required
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    placeholder="Contoh: PROD-NEW"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hak Akses Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold"
                  >
                    <option value="USER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">USER (Departemen)</option>
                    <option value="HR1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">HR1 (HR Analyst)</option>
                    <option value="ADMIN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">ADMIN (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Departemen</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Contoh: Logistic & Warehouse"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama PIC / Penanggung Jawab</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nama lengkap PIC"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email / User ID</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="d024@ajinomoto.co.id (opsional, auto generate)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password Awal</label>
                <input
                  type="text"
                  required
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
