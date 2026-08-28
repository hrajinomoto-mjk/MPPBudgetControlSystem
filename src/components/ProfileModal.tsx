import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  KeyRound,
  Shield,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Palette,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { DEPARTMENTS } from '../data/initialData';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaveProfile: (updatedUser: User) => void;
}

const AVATAR_COLORS = [
  { id: 'red', name: 'Ajinomoto Red', bg: 'bg-red-600', gradient: 'from-red-600 to-rose-700' },
  { id: 'indigo', name: 'Indigo Deep', bg: 'bg-indigo-600', gradient: 'from-indigo-600 to-blue-700' },
  { id: 'emerald', name: 'Emerald Forest', bg: 'bg-emerald-600', gradient: 'from-emerald-600 to-teal-700' },
  { id: 'amber', name: 'Amber Gold', bg: 'bg-amber-600', gradient: 'from-amber-600 to-orange-700' },
  { id: 'purple', name: 'Purple Royal', bg: 'bg-purple-600', gradient: 'from-purple-600 to-pink-700' },
  { id: 'slate', name: 'Slate Steel', bg: 'bg-slate-800', gradient: 'from-slate-800 to-slate-950' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState('');
  const [title, setTitle] = useState('');
  const [avatarColor, setAvatarColor] = useState('red');

  // Password Change
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setEmail(user.email || '');
      setPhone(user.phone || '0812-3456-7890');
      setDeptId(user.deptId || 'ALL');
      setTitle(
        user.title ||
          (user.role === 'ADMIN'
            ? 'Super Administrator & HR Strategic'
            : user.role === 'HR1'
            ? 'HR Analyst & Budget Specialist'
            : 'Department Manpower Representative')
      );
      setAvatarColor(user.avatarColor || 'red');
      setChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const activeColorObj = AVATAR_COLORS.find((c) => c.id === avatarColor) || AVATAR_COLORS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Alamat email perusahaan harus valid.');
      return;
    }

    let updatedPassword = user.password;

    if (changePassword) {
      if (!currentPassword) {
        setErrorMsg('Harap masukkan kata sandi saat ini untuk verifikasi.');
        return;
      }
      if (currentPassword !== user.password && user.password) {
        setErrorMsg('Kata sandi saat ini tidak sesuai.');
        return;
      }
      if (newPassword.length < 4) {
        setErrorMsg('Kata sandi baru minimal harus 4 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
      updatedPassword = newPassword;
    }

    const selectedDeptObj = DEPARTMENTS.find((d) => d.id === deptId);
    const updatedDeptName = deptId === 'ALL' ? 'All Departments' : selectedDeptObj?.name || user.deptName;

    const updatedUser: User = {
      ...user,
      nama: nama.trim(),
      email: email.trim(),
      phone: phone.trim(),
      deptId,
      deptName: updatedDeptName,
      title: title.trim(),
      avatarColor,
      password: updatedPassword,
    };

    onSaveProfile(updatedUser);
    onClose();
  };

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-8">
        {/* Header Visual Bar */}
        <div className={`bg-gradient-to-r ${activeColorObj.gradient} p-6 text-white relative overflow-hidden`}>
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl font-black shadow-md">
                {nama ? nama[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Edit Profil & Akun Pengguna</h3>
                <p className="text-xs text-white/80 mt-0.5 flex items-center gap-2">
                  <span>{user.userId}</span>
                  <span>•</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">
                    {user.role} ACCESS
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Color Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-red-500" />
              Tema Avatar & Aksen Profil
            </label>
            <div className="flex items-center gap-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAvatarColor(c.id)}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all flex items-center justify-center text-white shadow-xs cursor-pointer ${
                    avatarColor === c.id ? 'ring-3 ring-offset-2 ring-red-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {avatarColor === c.id && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                placeholder="cth. Mahmud Nurdiansyah"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-hidden"
              />
            </div>

            {/* Email Perusahaan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Perusahaan
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@ajinomoto.co.id"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-hidden"
              />
            </div>

            {/* Telepon / Kontak */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Nomor Kontak / WhatsApp Internal
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-hidden"
              />
            </div>

            {/* Departemen */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Departemen Penugasan
              </label>
              {isAdmin ? (
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-hidden"
                >
                  <option value="ALL">ALL - Seluruh Pabrik Mojokerto</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center justify-between">
                  <span>{user.deptName || user.deptId} ({user.deptId})</span>
                  <span className="text-[10px] font-mono text-slate-400">Terkunci (HR/Admin)</span>
                </div>
              )}
            </div>

            {/* Jabatan / Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Jabatan / Peran Fungsional
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Section Head Production Planning"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-hidden"
              />
            </div>
          </div>

          {/* Security / Password Toggle Accordion */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Keamanan & Ubah Kata Sandi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChangePassword(!changePassword)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  changePassword
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {changePassword ? 'Batal Ubah' : 'Ganti Password'}
              </button>
            </div>

            {changePassword && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 4 karakter"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-red-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
