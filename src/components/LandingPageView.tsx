import React, { useState, useEffect } from 'react';
import {
  Users,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Lock,
  Clock,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Fingerprint,
  ChevronRight,
  Globe2,
  ChevronDown,
  Sun,
  Moon,
  Check,
  Factory,
  Cpu,
  ShieldAlert,
  PackageCheck,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageViewProps {
  onNavigateToLogin: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigateToLogin,
  isDark,
  onToggleTheme,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const operationalPillars = [
    {
      id: 'prod',
      icon: Factory,
      color: 'red',
      title: 'Divisi Produksi Pangan & Fermentasi',
      desc: 'Mencakup lini pengolahan bahan baku, proses fermentasi utama, bumbu masak, kaldu, penyedap rasa (MSG), serta pengemasan otomatis berkecepatan tinggi.',
      sub: 'Lini Utama Produk Ajinomoto Group',
    },
    {
      id: 'tech',
      icon: Cpu,
      color: 'blue',
      title: 'Divisi Rekayasa, Utilitas & Proyek',
      desc: 'Pengoperasian sistem boiler, pembangkit listrik, penyediaan air proses murni, sistem pengolahan limbah (WWT), pemeliharaan mesin, dan otomasi industri.',
      sub: 'Keandalan Operasional & Efisiensi Energi',
    },
    {
      id: 'qa',
      icon: ShieldAlert,
      color: 'emerald',
      title: 'Divisi Jaminan Mutu, Halal & K3 (HSE)',
      desc: 'Pengawasan laboratorium analisis mutu, jaminan kepatuhan Sistem Jaminan Halal (HAS 23000), pengawasan standar K3 (ISO 45001) dan Zero Accident.',
      sub: 'Standar Kualitas & Keselamatan Kerja',
    },
    {
      id: 'supply',
      icon: PackageCheck,
      color: 'purple',
      title: 'Divisi Rantai Pasok, HR & General Affairs',
      desc: 'Manajemen pergudangan bahan baku & produk jadi, perencanaan logistik distribusi, administrasi ketenagakerjaan, serta tata kelola fasilitas umum pabrik.',
      sub: 'Kelancaran Distribusi & Tata Kelola SDM',
    },
  ];

  const faqs = [
    {
      q: 'Bagaimana siklus perhitungan Tahun Fiskal (FY) pada sistem MPCS?',
      a: 'Sistem MPCS mengadopsi kalender fiskal resmi PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory yang dimulai dari Bulan April (Bulan Fiskal 1) dan berakhir pada Bulan Maret tahun berikutnya (Bulan Fiskal 12). Analitik tren dan kumulatif secara otomatis menyesuaikan periode fiskal aktif.',
    },
    {
      q: 'Bagaimana pembagian kategori tenaga kerja Regular Worker (RW) vs Outsource (OS)?',
      a: 'Regular Worker (RW) mencakup karyawan tetap dan kontrak langsung pabrik, sedangkan Outsource (OS) mencakup tenaga alih daya pihak ketiga terverifikasi untuk penunjang produksi, pengemasan, dan utilitas. Setiap kuota divalidasi sesuai pagu anggaran.',
    },
    {
      q: 'Bagaimana alur persetujuan (Approval Workflow) jika ada deviasi tenaga kerja?',
      a: 'Setiap pengajuan penambahan atau perubahan tenaga kerja aktual yang diajukan oleh User Departemen akan masuk ke antrean verifikasi HR Analyst. Setelah diverifikasi, permohonan diteruskan ke Factory HR Manager untuk persetujuan final sebelum data aktual disahkan.',
    },
    {
      q: 'Apakah data dapat diekspor ke dalam bentuk laporan resmi?',
      a: 'Ya, MPCS menyediakan fitur ekspor satu-klik ke format PDF Executive Summary siap cetak berstandar korporat Ajinomoto dan lembar kerja Excel (XLSX) lengkap dengan rincian per departemen serta riwayat audit log.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* 1. Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090e1b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                alt="Ajinomoto Logo"
                className="h-7 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  MPCS
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  Mojokerto Factory
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Manpower Control & Operational Intelligence System
              </p>
            </div>
          </div>

          {/* Quick Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
            <a href="#fitur" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
              Fitur Utama
            </a>
            <a href="#cakupan" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
              Pilar Operasional
            </a>
            <a href="#workflow" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
              Alur SOP
            </a>
            <a href="#asv" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
              Standar ASV
            </a>
            <a href="#faq" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions & Login Button */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 hover:shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-24">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-red-500/10 via-transparent to-transparent pointer-events-none blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/4 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL, MOJOKERTO FACTORY</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Sistem Kontrol & Optimalisasi{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-rose-600">
                  Manpower Terintegrasi
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Platform workforce intelligence mutakhir untuk mengelola alokasi tenaga kerja{' '}
                <strong>Regular Worker (RW)</strong> dan <strong>Outsource (OS)</strong> secara presisi, memantau deviasi
                anggaran fiskal, mempercepat verifikasi multi-tier, serta mewujudkan keunggulan operasional berstandar dunia.
              </p>

              {/* Live Factory Time Bar */}
              <div className="inline-flex items-center gap-4 p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentTime.toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Sistem Real-Time Online (FY 2025/2026)</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Masuk ke Portal MPCS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#workflow"
                  className="px-5 py-3.5 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 shadow-xs"
                >
                  <span>Pelajari Alur Kerja SOP</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Trust & Security note */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>E2E Enterprise Security</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-blue-500" />
                  <span>Biometric Touch ID Ready</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span>ISO 9001:2015 Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Hero Telemetry Widget */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                {/* Header Widget */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                      MPCS Live Telemetry Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    LIVE STATUS: OPTIMAL
                  </span>
                </div>

                {/* KPI Cards Mini Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                      Total Budget (Plan)
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">492</span>
                    <span className="text-[10px] text-slate-500 block">Personil Seluruh Unit</span>
                  </div>

                  <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800/60">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block uppercase">
                      Realisasi (Actual)
                    </span>
                    <span className="text-xl font-extrabold text-red-600 dark:text-red-400">488</span>
                    <span className="text-[10px] text-red-500 block">Efisiensi -4 Orang</span>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                      Rasio Pencapaian
                    </span>
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">99.2%</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                      Status: On-Target
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">
                      Rasio RW vs OS
                    </span>
                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">62% : 38%</span>
                    <span className="text-[10px] text-blue-500 block">Keseimbangan Ideal</span>
                  </div>
                </div>

                {/* Sample Andon Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span>Sampel Andon Status Departemen:</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Semua Terkendali</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Food Production 1</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">98.5% (Optimal)</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Engineering & Maintenance</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">100.0% (Match)</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Quality Assurance</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">97.8% (Optimal)</span>
                    </div>
                  </div>
                </div>

                {/* Open Portal CTA */}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buka Sistem Lengkap</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational Highlights Strip */}
      <section className="bg-white dark:bg-[#0a0f1d] border-y border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-500">23</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Departemen Pabrik Terpadu</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Produksi, QA, Teknik, SC & GA</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">12</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulan Periode Tahun Fiskal</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Siklus April s/d Maret</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Kepatuhan Standar ASV & ISO</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Audit Trail & Histori Lengkap</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">&lt; 1 Detik</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Respon Kalkulasi & Validasi</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Offline-First & Cloud Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="fitur" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
            KAPABILITAS ENTERPRISE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Fitur Komprehensif untuk Efisiensi & Transparansi Manpower
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Didesain khusus untuk memenuhi standar ketat operasional pabrik manufaktur makanan berkelas dunia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Manpower Budget Planning</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Penetapan kuota tenaga kerja Regular Worker (RW) dan Outsource (OS) tahunan dan bulanan dengan validasi
              anggaran terstruktur dan fitur duplikasi data ke bulan berikutnya.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Actual Manpower Tracking</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pencatatan realisasi aktual per shift dan departemen secara presisi, dilengkapi deteksi deviasi otomatis dan
              pencatatan keterangan perubahan (remarks).
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Multi-Tier Approval Workflow</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mekanisme verifikasi berjenjang dari User Departemen ke HR Analyst dan Factory HR Manager dengan catatan
              alasan persetujuan atau penolakan yang transparan.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Andon Status & Visual Warning</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bilah status visual Andon real-time pada bagian atas aplikasi untuk mendeteksi instan departemen yang
              mengalami over-budget (&gt;100%) maupun under-utilized (&lt;90%).
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Executive Summary & Insights</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generasi narasi analitis otomatis untuk ringkasan rapat bulanan direksi dan rekomendasi alokasi tenaga kerja
              pada periode fiskal berikutnya.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Executive Export (PDF & Excel)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ekspor laporan resmi siap cetak format PDF korporat Ajinomoto dan unduh database master format spreadsheet
              Excel dengan histori audit log terenkripsi.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Concise Operational Pillars Section */}
      <section id="cakupan" className="py-16 bg-slate-100 dark:bg-[#0a0f1e] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
              CAKUPAN OPERASIONAL TERPADU
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Pilar Operasional Pabrik Mojokerto
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Pengelolaan menyeluruh seluruh divisi pabrik secara terintegrasi untuk menjaga kontinuitas dan kualitas produksi.
            </p>
          </div>

          {/* 4 Concise Operational Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {operationalPillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{p.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>{p.sub}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse hidden sm:block" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Terhubung dan terkoordinasi secara terpusat mencakup <strong>Seluruh Departemen Operasional Pabrik</strong> di bawah naungan HR Factory PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory.
              </span>
            </div>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-xs flex-shrink-0 cursor-pointer"
            >
              Akses Portal MPCS
            </button>
          </div>
        </div>
      </section>

      {/* 6. Workflow Process Section */}
      <section id="workflow" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
            STANDAR OPERASIONAL PROSEDUR (SOP)
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Alur Kerja Siklus Manpower yang Tertib & Terverifikasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Empat tahapan terstruktur mulai dari perencanaan anggaran kuota hingga pengesahan laporan manajemen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 relative space-y-3 shadow-xs">
            <span className="text-2xl font-black text-red-600/30 dark:text-red-400/30">01</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Input Anggaran (Plan)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Penyusunan alokasi kuota tenaga kerja tahun fiskal per departemen berdasarkan rencana kapasitas produksi.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 relative space-y-3 shadow-xs">
            <span className="text-2xl font-black text-blue-600/30 dark:text-blue-400/30">02</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pencatatan Aktual (Actual)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              PIC Departemen memasukkan absensi dan kehadiran realisasi RW & OS harian/bulanan pada aplikasi.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 relative space-y-3 shadow-xs">
            <span className="text-2xl font-black text-amber-600/30 dark:text-amber-400/30">03</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verifikasi & Approval</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deviasi dan permintaan revisi ditinjau oleh HR Analyst & disahkan oleh Manajemen HR Pabrik.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 relative space-y-3 shadow-xs">
            <span className="text-2xl font-black text-emerald-600/30 dark:text-emerald-400/30">04</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Analisis & Pelaporan</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Keluaran otomatis berupa laporan eksekutif PDF, dashboard grafis, dan email pengiriman periodik.
            </p>
          </div>
        </div>
      </section>

      {/* 7. ASV & Quality Standards Section */}
      <section id="asv" className="py-16 bg-gradient-to-br from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                AJINOMOTO SHARED VALUE (ASV)
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                Mewujudkan Kesejahteraan Tenaga Kerja & Keberlanjutan Produksi
              </h2>
              <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
                Melalui pengelolaan tenaga kerja yang adil, transparan, dan terukur, PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory menegakkan
                komitmen &quot;Eat Well, Live Well.&quot; dengan memperhatikan keselamatan kerja (HSE Zero Accident),
                keseimbangan beban kerja, dan kepatuhan penuh terhadap regulasi ketenagakerjaan Republik Indonesia.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold">
                <span className="px-3 py-1.5 bg-black/20 rounded-xl border border-white/20">ISO 9001:2015</span>
                <span className="px-3 py-1.5 bg-black/20 rounded-xl border border-white/20">ISO 14001:2015</span>
                <span className="px-3 py-1.5 bg-black/20 rounded-xl border border-white/20">ISO 45001:2018</span>
                <span className="px-3 py-1.5 bg-black/20 rounded-xl border border-white/20">FSSC 22000</span>
                <span className="px-3 py-1.5 bg-black/20 rounded-xl border border-white/20">Sistem Jaminan Halal (HAS 23000)</span>
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-center">
              <div className="p-6 bg-white text-slate-900 rounded-3xl shadow-2xl text-center space-y-3 max-w-xs">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                  alt="Ajinomoto Logo"
                  className="h-10 mx-auto object-contain"
                />
                <h4 className="font-extrabold text-sm">Eat Well, Live Well.</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Manpower Control System adalah pilar keunggulan operasional Pabrik Mojokerto.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Buka Portal Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-16 bg-slate-100 dark:bg-[#0a0f1e] border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
              TANYA JAWAB OPERASIONAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-white dark:bg-[#070b14] border-t border-slate-200 dark:border-slate-800 py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg border border-slate-200">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
                  alt="Ajinomoto Logo"
                  className="h-6 object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL
                </span>
                <p className="text-[11px] text-slate-400">
                  Mojokerto Factory: Jl. Raya Mlirip No. 110, Jetis, Mojokerto, Jawa Timur 61352
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Masuk Portal MPCS
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© {new Date().getFullYear()} PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory. All Rights Reserved. Enterprise Workforce Portal.</p>
            <div className="flex items-center gap-4">
              <span>Keamanan SHA-256</span>
              <span>•</span>
              <span>Kepatuhan ISO 27001</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">Status: Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
