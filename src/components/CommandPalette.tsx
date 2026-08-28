import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  ClipboardList,
  Users,
  CheckCircle2,
  ScrollText,
  Settings,
  PlusCircle,
  FileText,
  Moon,
  Sun,
  RotateCw,
  Share2,
  Cloud,
  FileSpreadsheet,
  X,
  UserCheck,
  LogOut,
  Copy,
  FileUp,
  Database,
  Link,
  KeyRound,
} from 'lucide-react';
import { Role } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onTriggerAction?: (action: string) => void;
  isDark: boolean;
  userRole?: Role;
  onOpenAddData?: () => void;
  onOpenExecutiveReport?: () => void;
  onOpenDownloadExcel?: () => void;
  onOpenImportData?: () => void;
  onToggleTheme?: () => void;
  onRefreshData?: () => void;
  onOpenCloudSync?: () => void;
  onOpenShare?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerAction,
  isDark,
  userRole = 'USER',
  onOpenAddData,
  onOpenExecutiveReport,
  onOpenDownloadExcel,
  onOpenImportData,
  onToggleTheme,
  onRefreshData,
  onOpenCloudSync,
  onOpenShare,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'ADMIN';
  const isAdminOrHR = userRole === 'ADMIN' || userRole === 'HR1';

  const trigger = (action: string, fallback?: () => void) => {
    if (onTriggerAction) {
      onTriggerAction(action);
    } else if (fallback) {
      fallback();
    }
  };

  const actions = [
    {
      id: 'dash',
      label: 'Dashboard MP (Executive View)',
      category: 'Navigasi',
      icon: LayoutDashboard,
      shortcut: 'g d',
      run: () => onNavigate('dashboard'),
    },
    {
      id: 'plan',
      label: 'Manpower Budget Planning',
      category: 'Navigasi',
      icon: ClipboardList,
      shortcut: 'g b',
      run: () => onNavigate('plan'),
    },
    {
      id: 'real',
      label: 'Realisasi Manpower (Actual)',
      category: 'Navigasi',
      icon: Users,
      shortcut: 'g r',
      run: () => onNavigate('actual'),
    },
    ...(isAdminOrHR
      ? [
          {
            id: 'appr',
            label: 'Approval Actual Changes',
            category: 'Navigasi',
            icon: CheckCircle2,
            shortcut: 'g a',
            run: () => onNavigate('approvals'),
          },
        ]
      : []),
    {
      id: 'logs',
      label: 'Audit Log System',
      category: 'Navigasi',
      icon: ScrollText,
      shortcut: 'g l',
      run: () => onNavigate('logs'),
    },
    {
      id: 'settings',
      label: 'System Settings & Preferences',
      category: 'Navigasi',
      icon: Settings,
      shortcut: 'g s',
      run: () => onNavigate('settings'),
    },
    {
      id: 'profile',
      label: 'Edit Profil & Informasi Akun',
      category: 'Akun & Profil',
      icon: UserCheck,
      shortcut: 'p',
      run: () => trigger('edit-profile'),
    },
    ...(isAdminOrHR
      ? [
          {
            id: 'usermanagement',
            label: 'Kelola Akun & Kredensial Seluruh Departemen',
            category: 'Administrasi Akun',
            icon: KeyRound,
            shortcut: 'g u',
            run: () => trigger('user-management'),
          },
        ]
      : []),
    ...(isAdminOrHR
      ? [
          {
            id: 'add',
            label: 'Input Data Manpower Baru',
            category: 'Aksi Data',
            icon: PlusCircle,
            shortcut: 'n',
            run: () => trigger('add-data', onOpenAddData),
          },
          {
            id: 'dup',
            label: 'Duplikasi Budget ke Bulan Depan',
            category: 'Aksi Data',
            icon: Copy,
            run: () => trigger('duplicate-data'),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'import_data',
            label: 'Import Data & Integrasi Database (Excel, GSheets, Supabase)',
            category: 'Integrasi Database',
            icon: FileUp,
            shortcut: 'i',
            run: () => trigger('import-data', onOpenImportData),
          },
          {
            id: 'gsheets_sync',
            label: 'Integrasi Live Google Sheets Manpower',
            category: 'Integrasi Database',
            icon: Link,
            run: () => trigger('import-data', onOpenImportData),
          },
          {
            id: 'supabase_db',
            label: 'Koneksi Supabase PostgreSQL Cloud Database',
            category: 'Integrasi Database',
            icon: Database,
            run: () => trigger('import-data', onOpenImportData),
          },
        ]
      : []),
    {
      id: 'report',
      label: 'Generate PDF Executive Report',
      category: 'Ekspor & Laporan',
      icon: FileText,
      shortcut: 'g p',
      run: () => trigger('executive-report', onOpenExecutiveReport),
    },
    {
      id: 'dept_report',
      label: 'Generate Laporan Departemen User PDF',
      category: 'Ekspor & Laporan',
      icon: FileText,
      run: () => trigger('dept-report'),
    },
    {
      id: 'excel',
      label: 'Download Database Excel (.xlsx)',
      category: 'Ekspor & Laporan',
      icon: FileSpreadsheet,
      run: () => trigger('download-excel', onOpenDownloadExcel),
    },
    {
      id: 'share',
      label: 'Buka di Device Lain / Bagikan Tautan Web & QR Code',
      category: 'Kolaborasi',
      icon: Share2,
      run: () => trigger('share', onOpenShare),
    },
    ...(isAdmin
      ? [
          {
            id: 'sync',
            label: 'Sinkronisasi Cloud & Status Offline',
            category: 'Sistem',
            icon: Cloud,
            run: () => trigger('cloud-sync', onOpenCloudSync),
          },
        ]
      : []),
    {
      id: 'theme',
      label: isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode',
      category: 'Tampilan',
      icon: isDark ? Sun : Moon,
      shortcut: 'Ctrl /',
      run: () => trigger('toggle-theme', onToggleTheme),
    },
    {
      id: 'logout',
      label: 'Keluar dari Sesi Sistem (Logout)',
      category: 'Akun & Profil',
      icon: LogOut,
      run: () => trigger('logout'),
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari menu, laporan, fitur, atau perintah..."
            className="w-full py-4 text-xs font-medium bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Tidak ada aksi atau menu yang cocok.</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="truncate">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.category}</span>
                    </div>
                  </div>
                  {item.shortcut && (
                    <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Gunakan ↑ ↓ untuk memilih, Enter untuk memilih</span>
          <span className="font-mono text-[10px]">ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
};
