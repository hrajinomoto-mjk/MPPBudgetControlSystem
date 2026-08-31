import React, { useState } from 'react';
import { Keyboard, X, Search, Navigation, Database, FileSpreadsheet, Sliders, Shield } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  label: string;
  keys: string[];
  description?: string;
  category: 'Navigasi Halaman' | 'Aksi Data & Integrasi' | 'Ekspor & Laporan' | 'Sistem & Tampilan';
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    // 1. Navigasi
    { category: 'Navigasi Halaman', label: 'Buka Dashboard Manpower (Executive View)', keys: ['g', 'd'] },
    { category: 'Navigasi Halaman', label: 'Buka Manpower Budget Planning', keys: ['g', 'b'] },
    { category: 'Navigasi Halaman', label: 'Buka Realisasi Manpower (Actual)', keys: ['g', 'r'] },
    { category: 'Navigasi Halaman', label: 'Buka Approval Actual Changes (Admin/HR)', keys: ['g', 'a'] },
    { category: 'Navigasi Halaman', label: 'Buka Kelola Akun & Kredensial Seluruh Dept', keys: ['g', 'u'] },
    { category: 'Navigasi Halaman', label: 'Buka Audit Log System', keys: ['g', 'l'] },
    { category: 'Navigasi Halaman', label: 'Buka Pengaturan Sistem & Preferensi', keys: ['g', 's'] },

    // 2. Aksi Data & Integrasi
    { category: 'Aksi Data & Integrasi', label: 'Input Data Manpower Baru (Plan/Actual)', keys: ['n'] },
    { category: 'Aksi Data & Integrasi', label: 'Duplikasi Budget ke Bulan Berikutnya', keys: ['d'] },
    { category: 'Aksi Data & Integrasi', label: 'Import Data Spreadsheet (Excel, CSV, Supabase)', keys: ['i'] },
    { category: 'Aksi Data & Integrasi', label: 'Sinkronisasi Live Google Sheets Manpower', keys: ['g', 'g'] },
    { category: 'Aksi Data & Integrasi', label: 'Koneksi Supabase Cloud Database', keys: ['g', 'c'] },

    // 3. Ekspor & Laporan
    { category: 'Ekspor & Laporan', label: 'Generate PDF Executive Report', keys: ['g', 'p'] },
    { category: 'Ekspor & Laporan', label: 'Generate Laporan Departemen User PDF', keys: ['g', 'm'] },
    { category: 'Ekspor & Laporan', label: 'Download Master Database Excel (.xlsx)', keys: ['g', 'x'] },
    { category: 'Ekspor & Laporan', label: 'Konfigurasi Email Otomatis Bulanan', keys: ['g', 'e'] },

    // 4. Sistem & Tampilan
    { category: 'Sistem & Tampilan', label: 'Buka Command Palette (Pencarian Cepat)', keys: ['Ctrl', 'K'] },
    { category: 'Sistem & Tampilan', label: 'Refresh Data & Sinkronisasi Real-Time', keys: ['r'] },
    { category: 'Sistem & Tampilan', label: 'Status Cloud Sync & Multi-Device Storage', keys: ['c'] },
    { category: 'Sistem & Tampilan', label: 'Buka Profil & Preferensi Akun Pengguna', keys: ['p'] },
    { category: 'Sistem & Tampilan', label: 'Bagikan Tautan Web & QR Code Device Lain', keys: ['h'] },
    { category: 'Sistem & Tampilan', label: 'Persempit / Perluas Bilah Menu Sidebar', keys: ['['] },
    { category: 'Sistem & Tampilan', label: 'Toggle Dark / Light Mode', keys: ['Ctrl', '/'] },
    { category: 'Sistem & Tampilan', label: 'Buka Panduan Keyboard Shortcuts Ini', keys: ['?'] },
    { category: 'Sistem & Tampilan', label: 'Keluar dari Sesi Sistem (Logout)', keys: ['q'] },
    { category: 'Sistem & Tampilan', label: 'Tutup Dialog / Modal / Command Palette', keys: ['Esc'] },
  ];

  const filtered = shortcuts.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  const categories: Array<ShortcutItem['category']> = [
    'Navigasi Halaman',
    'Aksi Data & Integrasi',
    'Ekspor & Laporan',
    'Sistem & Tampilan',
  ];

  const getCategoryIcon = (cat: ShortcutItem['category']) => {
    switch (cat) {
      case 'Navigasi Halaman':
        return <Navigation className="w-3.5 h-3.5 text-blue-500" />;
      case 'Aksi Data & Integrasi':
        return <Database className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Ekspor & Laporan':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />;
      case 'Sistem & Tampilan':
        return <Sliders className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Pintasan Keyboard (Keyboard Shortcuts)
              </h3>
              <p className="text-[11px] text-slate-500">
                Navigasi cepat dan pemicu aksi instan di seluruh sistem MPCS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pintasan keyboard (contoh: navigasi, excel, report, profil)..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {categories.map((cat) => {
            const catItems = filtered.filter((s) => s.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 px-1">
                  {getCategoryIcon(cat)}
                  <span>{cat}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({catItems.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catItems.map((sc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                    >
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate pr-2">
                        {sc.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, j) => (
                          <React.Fragment key={j}>
                            <kbd className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md shadow-2xs">
                              {k}
                            </kbd>
                            {j < sc.keys.length - 1 && sc.keys.length === 2 && sc.keys[0] !== 'Ctrl' && (
                              <span className="text-[10px] text-slate-400 font-mono">then</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada pintasan keyboard yang cocok dengan kata kunci pencarian.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pintasan dua kunci (misal: <b>g</b> lalu <b>d</b>) bekerja secara berurutan dalam 1 detik.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

