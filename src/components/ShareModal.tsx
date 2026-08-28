import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  Smartphone,
  Globe,
  ExternalLink,
  Laptop,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { DashboardItem } from '../types';
import { getDashboardData } from '../utils/storage';
import { fiscalToCalendarMonth } from '../utils/fiscal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: DashboardItem[];
  bulan?: number;
  tahun?: number;
  currentFiscalMonth?: number | 'ALL';
  currentYear?: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  items,
  bulan,
  tahun,
  currentFiscalMonth,
  currentYear,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'summary'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  // Resolve safe bulan & tahun
  const resolvedTahun = tahun || currentYear || new Date().getFullYear();
  let resolvedBulan = bulan;
  if (!resolvedBulan && currentFiscalMonth !== undefined) {
    resolvedBulan = currentFiscalMonth === 'ALL' ? 4 : fiscalToCalendarMonth(currentFiscalMonth);
  }
  if (!resolvedBulan) {
    resolvedBulan = new Date().getMonth() + 1;
  }

  // Safe items retrieval
  const safeItems: DashboardItem[] =
    Array.isArray(items) && items.length > 0
      ? items
      : getDashboardData('ALL', resolvedBulan, resolvedTahun);

  // Determine current Live App URL
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://ais-pre-gir7xbqa4dhalilhlf3kiw-373225211354.asia-east1.run.app';

  // Fallback to shared app URL if in dev sandbox
  const liveUrl =
    currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
      ? 'https://ais-pre-gir7xbqa4dhalilhlf3kiw-373225211354.asia-east1.run.app'
      : currentOrigin;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    liveUrl
  )}&margin=8`;

  let totalPlan = 0;
  let totalActual = 0;
  safeItems.forEach((item) => {
    totalPlan += Number(item.plan) || 0;
    totalActual += Number(item.actual) || 0;
  });

  const gap = totalActual - totalPlan;
  const pct = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : '0';
  const status =
    Number(pct) > 100 ? 'OVER CAPACITY' : Number(pct) < 90 ? 'UNDER CAPACITY' : 'OPTIMAL';

  const shareText = `*MANPOWER EXECUTIVE SUMMARY — PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL, MOJOKERTO FACTORY*
*Mojokerto Factory — HR Development*
Periode: Bulan ${resolvedBulan} / Tahun ${resolvedTahun}

• Total Budget (Plan): ${totalPlan.toLocaleString()} orang
• Total Realisasi (Actual): ${totalActual.toLocaleString()} orang
• Variance (Gap): ${gap > 0 ? '+' : ''}${gap.toLocaleString()} orang
• Achievement: ${pct}% (${status})

Link Aplikasi: ${liveUrl}
Diproses secara real-time melalui Manpower Control System (MPCS).`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = liveUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Akses & Bagikan ke Device Lain
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tautan Online, QR Code, dan Ringkasan Manpower
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Tautan Web & QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Teks Ringkasan Data</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeTab === 'link' ? (
            <div className="space-y-4">
              {/* QR Code & Scan Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 flex-shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Aplikasi"
                    className="w-32 h-32 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Scan via Kamera HP / Tablet</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Buka Langsung di Smartphone atau Device Lain
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Arahkan kamera smartphone ke QR Code di samping untuk membuka seluruh sistem MPCS secara instan tanpa perlu instalasi aplikasi tambahan.
                  </p>
                </div>
              </div>

              {/* URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-red-600" />
                    Tautan Publik Live Web
                  </span>
                  <span className="text-[10px] text-slate-400">Siap Diakses Kapan Saja</span>
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    className="w-full bg-transparent border-none text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin URL'}</span>
                  </button>
                </div>
              </div>

              {/* Multi Device Guide */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Tips Akses Multi-Device & Deploy Vercel:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  • <strong>Akses Device Lain:</strong> Kirimkan tautan di atas melalui WhatsApp/Email ke rekan kerja. Aplikasi responsif untuk layar PC, laptop, iPad, dan smartphone.
                  <br />
                  • <strong>Deploy ke Vercel / GitHub:</strong> Anda dapat mengunduh source code project ini melalui menu <em>Settings → Export ZIP</em> atau menghubungkan ke GitHub untuk auto-deploy di Vercel dengan satu klik.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pratinjau Ringkasan Periode {bulan}/{tahun}
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedText
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700'
                  }`}
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Tersalin ke Clipboard' : 'Salin Semua Teks'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto select-all">
                {shareText}
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Format teks ini siap langsung di-paste ke WhatsApp, Telegram, atau Email resmi laporan manajemen.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
