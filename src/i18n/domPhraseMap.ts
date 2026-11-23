import { Language } from './translations';

/**
 * Full-Enterprise Phrase & Segment Localization Registry
 * Complements React-native `t()` hooks so every deep modal, chart heading,
 * executive narrative, FAQ, audit log label, and table header across all 36+ components
 * translates seamlessly between Indonesian and English while preserving exact original
 * Indonesian strings in a WeakMap for lossless restoration.
 */

const EXACT_PHRASE_MAP: Record<string, string> = {
  // Common UI controls & buttons
  'Tutup': 'Close',
  'Batal': 'Cancel',
  'Simpan': 'Save',
  'Simpan Perubahan': 'Save Changes',
  'Simpan Data': 'Save Data',
  'Tambah Data': 'Add Data',
  'Tambah Data Baru': 'Add New Data',
  'Edit Data': 'Edit Data',
  'Hapus': 'Delete',
  'Hapus Data': 'Delete Data',
  'Duplikasi': 'Duplicate',
  'Duplikasi Data': 'Duplicate Data',
  'Duplikasi ke Bulan Berikutnya': 'Duplicate to Next Month',
  'Ekspor Excel': 'Export Excel',
  'Ekspor CSV': 'Export CSV',
  'Unduh Database': 'Download Database',
  'Unduh PDF': 'Download PDF',
  'Cetak PDF': 'Print PDF',
  'Reset Filter': 'Reset Filter',
  'Terapkan': 'Apply',
  'Konfirmasi': 'Confirm',
  'Kembali': 'Back',
  'Lanjutkan': 'Continue',
  'Berikutnya': 'Next',
  'Sebelumnya': 'Previous',
  'Semua': 'All',
  'Semua Departemen': 'All Departments',
  'Semua Perusahaan': 'All Companies',
  'Semua Status': 'All Statuses',
  'Semua Kategori': 'All Categories',
  'Semua Aksi': 'All Actions',
  'Semua Waktu': 'All Time',
  'Hari Ini': 'Today',
  '7 Hari Terakhir': 'Last 7 Days',
  '30 Hari Terakhir': 'Last 30 Days',
  'Baru saja': 'Just now',
  'Kemarin': 'Yesterday',
  'Tersalin': 'Copied',
  'Salin': 'Copy',
  'Salin Ringkasan': 'Copy Summary',
  'Lihat Detail': 'View Details',
  'Aksi': 'Actions',
  'Catatan': 'Remarks',
  'Keterangan': 'Remarks',
  'Keterangan / Remarks': 'Remarks / Notes',
  'Departemen': 'Department',
  'Perusahaan': 'Company',
  'Bulan': 'Month',
  'Tahun': 'Year',
  'Periode': 'Period',
  'Status': 'Status',
  'Total': 'Total',
  'Selisih': 'Variance',
  'Pencapaian': 'Achievement',
  'Pemenuhan': 'Fulfillment',

  // Dashboard KPIs & Charts
  'Total Kebutuhan (Plan)': 'Total Requirement (Plan)',
  'Total Realisasi (Actual)': 'Total Realization (Actual)',
  'Selisih / Gap': 'Variance / Gap',
  'Tingkat Pemenuhan': 'Fulfillment Rate',
  'Rasio RW vs OS': 'RW vs OS Ratio',
  'Perbandingan Plan vs Actual per Departemen': 'Plan vs Actual Comparison by Department',
  'Tren Bulanan Tahun Fiskal': 'Fiscal Year Monthly Trend',
  'Komposisi Tenaga Kerja (RW vs OS)': 'Workforce Composition (RW vs OS)',
  'Ringkasan Per Departemen': 'Department Breakdown Summary',
  'Daftar Departemen': 'Department Directory',
  'Peta Panas Harian & Matriks Departemen': 'Daily Heatmap & Department Matrix',
  'Peringkat Departemen Surplus / Overstaffed': 'Top Overstaffed / Surplus Departments',
  'Departemen Surplus Tertinggi': 'Highest Surplus Departments',
  'Analisis Variansi Manpower': 'Manpower Variance Analysis',
  'Tampilan Tabel': 'Table View',
  'Tampilan Kartu': 'Card View',
  'Tampilan Peta Panas': 'Heatmap View',
  'Cari departemen atau kode...': 'Search department or code...',
  'Cari departemen...': 'Search department...',
  'Data tidak ditemukan': 'No data found',
  'Tidak ada data untuk filter ini': 'No records match the current filter',
  'Tidak ada data': 'No data available',
  'Menampilkan': 'Showing',
  'dari': 'of',
  'data': 'records',
  'Halaman': 'Page',
  'Baris per halaman': 'Rows per page',

  // Executive Dossier & Presentation
  'Rangkuman Strategis untuk Direksi & General Management': 'Strategic Summary for Board of Directors & General Management',
  'Sintesis eksekutif operasional pabrik berdasarkan verifikasi dan monitoring budget vs actual 23 departemen oleh HR Dept.':
    'Executive plant operations synthesis based on HR Dept budget-vs-actual verification across 23 departments.',
  'Keputusan & Tindak Lanjut Direksi': 'Board Decisions & Action Items',
  'Daftar Arahan & Keputusan Manajemen': 'Management Directives & Decision Log',
  'Matriks Alokasi Manpower Seluruh Departemen': 'Plant-Wide Department Manpower Allocation Matrix',
  'Analisis Komposisi Tenaga Kerja (RW vs OS)': 'Workforce Composition Analysis (RW vs OS)',
  'Kepatuhan Kuota Budget': 'Budget Quota Compliance',
  'Mode Presentasi Direksi': 'Board Presentation Mode',
  'Cetak Dossier PDF': 'Print PDF Dossier',
  'DISETUJUI': 'APPROVED',
  'REKOMENDASI': 'RECOMMENDED',
  'SELESAI': 'COMPLETED',
  'DALAM MONITORING': 'UNDER MONITORING',
  'DALAM_MONITORING': 'UNDER MONITORING',
  'SEIMBANG': 'BALANCED',
  'DEFISIT': 'DEFICIT',
  'WASPADA': 'CAUTION',

  // Audit Log
  'Jejak Audit & Keamanan Sistem': 'System Audit Trail & Security Log',
  'Catatan aktivitas real-time seluruh operasi data, login, persetujuan, dan sinkronisasi':
    'Real-time activity trail for all data modifications, authentication, approvals, and synchronizations',
  'LOGIN BERHASIL': 'LOGIN SUCCESS',
  'AKTIVITAS SISTEM': 'SYSTEM ACTIVITY',
  'Ekspor Log CSV': 'Export Audit CSV',
  'Total Aktivitas': 'Total Events',
  'Detail Aktivitas Audit': 'Audit Event Details',

  // User Management
  'Manajemen User & Kredensial Departemen': 'Department User & Credential Management',
  'Kelola akun, kata sandi, dan hak akses PIC untuk seluruh 23 departemen pabrik':
    'Manage accounts, passwords, and PIC access permissions across all 23 factory departments',
  'Tambah User Baru': 'Add New User',
  'Reset Semua Password': 'Reset All Passwords',
  'Ekspor Kredensial': 'Export Credentials',
  'Kata Sandi': 'Password',
  'Hak Akses': 'Role / Access',

  // Modals (Notifications, Command Palette, Shortcuts, Profile, Share, CloudSync)
  'Notifikasi Sistem': 'System Notifications',
  'Tandai Semua Dibaca': 'Mark All as Read',
  'Bersihkan Semua': 'Clear All',
  'Tidak ada notifikasi': 'No notifications',
  'Pintasan Keyboard': 'Keyboard Shortcuts',
  'Navigasi Cepat': 'Quick Navigation',
  'Profil & Akun Pengguna': 'User Profile & Account',
  'Bagikan & Akses Multi-Perangkat': 'Share & Multi-Device Access',
  'Sinkronisasi Cloud & Database': 'Cloud & Database Synchronization',
  'Jadwal Laporan Otomatis': 'Automated Report Scheduling',
  'Unduh Database Excel': 'Download Excel Database',
  'Impor Data & Integrasi': 'Import Data & Integration',
  'Laporan Eksekutif PDF': 'Executive PDF Report',
  'Laporan Departemen PDF': 'Department PDF Report',

  // Landing Page Headings & Sections
  'Fitur Utama': 'Core Features',
  'Pilar Operasional': 'Operational Pillars',
  'Alur SOP': 'SOP Workflow',
  'Standar ASV': 'ASV Standards',
  'Masuk Portal': 'Enter Portal',
  'Semua Terkendali': 'All Controlled',
  '23 Unit Terpantau': '23 Units Monitored',
  'Keseimbangan Ideal': 'Ideal Balance',
  'Divisi Produksi Pangan & Fermentasi': 'Food Production & Fermentation Division',
  'Divisi Rekayasa, Utilitas & Proyek': 'Engineering, Utilities & Projects Division',
  'Divisi Jaminan Mutu, Halal & K3 (HSE)': 'Quality Assurance, Halal & HSE Division',
  'Divisi Rantai Pasok, HR & General Affairs': 'Supply Chain, HR & General Affairs Division',
  'Lini Utama Produk Ajinomoto Group': 'Core Ajinomoto Group Production Lines',
  'Keandalan Operasional & Efisiensi Energi': 'Operational Reliability & Energy Efficiency',
  'Standar Kualitas & Keselamatan Kerja': 'Quality & Workplace Safety Standards',
  'Kelancaran Distribusi & Tata Kelola SDM': 'Distribution Continuity & HR Governance',
  'Pertanyaan yang Sering Diajukan (FAQ)': 'Frequently Asked Questions (FAQ)',
  'Bagaimana siklus perhitungan Tahun Fiskal (FY) pada sistem MPCS?':
    'How does the Fiscal Year (FY) cycle work in the MPCS system?',
  'Bagaimana pembagian kategori tenaga kerja Regular Worker (RW) vs Outsource (OS)?':
    'How are Regular Worker (RW) vs Outsource (OS) workforce categories classified?',
  'Bagaimana alur persetujuan (Approval Workflow) jika ada deviasi tenaga kerja?':
    'How does the Approval Workflow handle manpower allocation deviations?',
  'Apakah data dapat diekspor ke dalam bentuk laporan resmi?':
    'Can data be exported into official corporate reports?',
};

// Ordered regex/substring replacements for dynamic/parameterized Indonesian phrases
const PATTERN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bSemua Bulan \(FY\)/g, 'All Months (FY)'],
  [/\bSemua Perusahaan\b/g, 'All Companies'],
  [/\bSemua Departemen\b/g, 'All Departments'],
  [/\bPabrik Mojokerto\b/g, 'Mojokerto Factory'],
  [/\bTahun Fiskal\b/g, 'Fiscal Year'],
  [/\bBulan Fiskal\b/g, 'Fiscal Month'],
  [/\bBulan Evaluasi\b/g, 'Evaluation Month'],
  [/\bBulan (\d{1,2})\b/g, 'Month $1'],
  [/\bTahun (\d{4})\b/g, 'Year $1'],
  [/\b(\d+)\s+Departemen\b/g, '$1 Departments'],
  [/\b(\d+)\s+Dept Optimal\b/g, '$1 Optimal Depts'],
  [/\b(\d+)\s+Defisit\b/g, '$1 Deficit'],
  [/\b(\d+)\s+Surplus\b/g, '$1 Surplus'],
  [/\b(\d+)\s+orang\b/gi, '$1 HC'],
  [/\b(\d+)\s+mnt lalu\b/g, '$1m ago'],
  [/\b(\d+)m lalu\b/g, '$1m ago'],
  [/\b(\d+)\s+jam lalu\b/g, '$1h ago'],
  [/\b(\d+)\s+hari lalu\b/g, '$1d ago'],
  [/\bbertugas aktif\b/g, 'active on duty'],
  [/\bBudget alokasi tenaga kerja\b/g, 'Workforce allocation budget for'],
  [/\bdepartemen pabrik\b/g, 'factory departments'],
  [/\bStatus alokasi:/g, 'Allocation status:'],
  [/\bPeriode:/g, 'Period:'],
  [/\bReferensi:/g, 'Reference:'],
  [/\bTotal Rencana Kuota/g, 'Total Planned Quota'],
  [/\bTotal Realisasi Aktif/g, 'Total Active Realization'],
  [/\bTingkat Pemenuhan/g, 'Fulfillment Rate'],
  [/\bVariansi Bersih/g, 'Net Variance'],
  [/\bMenunggu Persetujuan\b/g, 'Awaiting Approval'],
  [/\bSedang menyinkronkan\b/g, 'Synchronizing'],
  [/\bTerakhir:/g, 'Last:'],
  [/\bKlik untuk\b/g, 'Click to'],
  [/\bCari menu, departemen, atau aksi\.\.\./g, 'Search menus, departments, or actions...'],
  [/\bMasukkan\b/g, 'Enter'],
  [/\bPilih Departemen\b/g, 'Select Department'],
  [/\bPilih Perusahaan\b/g, 'Select Company'],
  [/\bPilih Bulan\b/g, 'Select Month'],
  [/\bPilih Tahun\b/g, 'Select Year'],
  [/\bFY Penuh \(Apr-Mar\)/g, 'Full FY (Apr-Mar)'],
  [/\(Mei\)/g, '(May)'],
  [/\(Agu\)/g, '(Aug)'],
  [/\(Okt\)/g, '(Oct)'],
  [/\(Des\)/g, '(Dec)'],
];

// WeakMaps store exact original Indonesian strings so switching back to 'id' is 100% lossless
const originalTextMap = new WeakMap<Text, string>();
const originalAttrMap = new WeakMap<Element, Map<string, string>>();

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG']);

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest('[data-no-translate="true"]')) return true;
  return false;
}

export function translatePhraseToEnglish(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // 1. Exact phrase match (preserving leading/trailing whitespace)
  const exact = EXACT_PHRASE_MAP[trimmed];
  if (exact) {
    return raw.replace(trimmed, exact);
  }

  // 2. Pattern-based enterprise replacements
  let result = raw;
  for (const [regex, replacement] of PATTERN_REPLACEMENTS) {
    if (regex.test(result)) {
      result = result.replace(regex, replacement);
    }
  }
  return result;
}

export function syncDomTranslations(root: Node, lang: Language): void {
  if (typeof document === 'undefined' || !root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    if (lang === 'en') {
      const currentVal = textNode.nodeValue || '';
      const storedOriginal = originalTextMap.get(textNode);
      const sourceText = storedOriginal !== undefined ? storedOriginal : currentVal;
      const translated = translatePhraseToEnglish(sourceText);

      if (translated !== sourceText) {
        if (storedOriginal === undefined) {
          originalTextMap.set(textNode, sourceText);
        }
        if (textNode.nodeValue !== translated) {
          textNode.nodeValue = translated;
        }
      }
    } else {
      const orig = originalTextMap.get(textNode);
      if (orig !== undefined && textNode.nodeValue !== orig) {
        textNode.nodeValue = orig;
      }
    }
  }

  // Sync interactive attributes (placeholder & title)
  if (root instanceof Element || root instanceof Document) {
    const container = root instanceof Document ? root.body : root;
    if (!container) return;
    const elements = container.querySelectorAll('[placeholder], [title]');
    elements.forEach((el) => {
      if (shouldSkipElement(el)) return;
      (['placeholder', 'title'] as const).forEach((attr) => {
        const val = el.getAttribute(attr);
        if (!val) return;
        let map = originalAttrMap.get(el);
        if (lang === 'en') {
          const orig = map?.get(attr) ?? val;
          const translated = translatePhraseToEnglish(orig);
          if (translated !== orig) {
            if (!map) {
              map = new Map();
              originalAttrMap.set(el, map);
            }
            if (!map.has(attr)) {
              map.set(attr, orig);
            }
            if (el.getAttribute(attr) !== translated) {
              el.setAttribute(attr, translated);
            }
          }
        } else if (map?.has(attr)) {
          const orig = map.get(attr)!;
          if (el.getAttribute(attr) !== orig) {
            el.setAttribute(attr, orig);
          }
        }
      });
    });
  }
}
