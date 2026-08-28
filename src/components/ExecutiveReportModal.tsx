import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Download,
  Send,
  Building2,
  Calendar,
  Brain,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Sparkles,
  UserCheck,
  Phone,
  ShieldCheck,
  Layers,
  ChevronRight,
  Eye,
  FileCheck,
  RefreshCw,
  Code,
  Globe,
  Settings,
  ChevronDown,
  Paperclip,
  FileSpreadsheet,
} from 'lucide-react';
import { getDashboardData, addAuditLog, getCurrentSession } from '../utils/storage';
import { generateExecutiveReportPDF, getExecutiveReportPDFBase64 } from '../utils/exportPdf';
import { exportFullManpowerExcel, getManpowerCsvString } from '../utils/exportExcel';
import { getFiscalMonth, FISCAL_MONTH_LABELS, formatFiscalYearLabel } from '../utils/fiscal';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulan: number;
  tahun: number;
}

type TemplateType = 'EXECUTIVE_DIRECTOR' | 'OPERATIONAL_MANAGERS' | 'MONTHLY_ROUTINE' | 'CUSTOM';
type EmailClientProvider = 'GMAIL' | 'OUTLOOK_WEB' | 'OUTLOOK_DESKTOP' | 'GAS_WEBHOOK';

const DEFAULT_GAS_CODE = `/**
 * Google Apps Script (GAS) Web App for Manpower Control System (MPCS)
 * Otomatis mengirim email lengkap dengan Lampiran PDF & Data Excel (.csv)
 * Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to || "paajinomoto@gmail.com";
    var cc = data.cc || "";
    var subject = data.subject || "[MPCS] Laporan Eksekutif Manpower";
    var body = data.body || "";
    var attachments = [];

    // 1. Lampirkan berkas PDF Laporan Eksekutif jika tersedia
    if (data.pdfBase64 && data.pdfFileName) {
      var pdfBytes = Utilities.base64Decode(data.pdfBase64);
      var pdfBlob = Utilities.newBlob(pdfBytes, "application/pdf", data.pdfFileName);
      attachments.push(pdfBlob);
    }

    // 2. Lampirkan berkas Data Excel/CSV jika tersedia
    if (data.excelCsvData && data.excelFileName) {
      var csvBlob = Utilities.newBlob(data.excelCsvData, "text/csv", data.excelFileName);
      attachments.push(csvBlob);
    }

    MailApp.sendEmail({
      to: to,
      cc: cc,
      subject: subject,
      body: body,
      attachments: attachments
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Email dan " + attachments.length + " berkas lampiran (PDF/Excel) berhasil dikirim!",
      attachedFiles: attachments.map(function(a) { return a.getName(); })
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  bulan,
  tahun,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'email_editor'>('preview');

  // PDF Export Settings
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [customSignee, setCustomSignee] = useState<string>('HR Development Team');
  const [customExecutiveNote, setCustomExecutiveNote] = useState<string>('');

  // Auto Attachment & Download Settings
  const [autoDownloadAttachments, setAutoDownloadAttachments] = useState<boolean>(true);
  const [includeDownloadLinksInBody, setIncludeDownloadLinksInBody] = useState<boolean>(true);
  const [attachmentToast, setAttachmentToast] = useState<string | null>(null);

  // Email Editorial States
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('EXECUTIVE_DIRECTOR');
  const [selectedProvider, setSelectedProvider] = useState<EmailClientProvider>('GMAIL');
  const [emailTo, setEmailTo] = useState<string>('paajinomoto@gmail.com, management@ajinomoto.co.id');
  const [emailCc, setEmailCc] = useState<string>('hr.development@ajinomoto.co.id, factory.director@ajinomoto.co.id');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [salutation, setSalutation] = useState<string>('Kepada Yth. Bapak/Ibu Jajaran Direksi & Manajemen Pabrik,');
  const [openingText, setOpeningText] = useState<string>('');
  const [executiveNarrative, setExecutiveNarrative] = useState<string>('');
  const [includeKpiTable, setIncludeKpiTable] = useState<boolean>(true);
  const [includeDeptHighlights, setIncludeDeptHighlights] = useState<boolean>(true);
  const [actionRecommendations, setActionRecommendations] = useState<string>('');
  const [closingText, setClosingText] = useState<string>('Demikian laporan ini kami sampaikan sebagai bahan evaluasi dan pengambilan keputusan strategis.');
  const [senderName, setSenderName] = useState<string>('HR Development Specialist');
  const [senderTitle, setSenderTitle] = useState<string>('Workforce Planning & Labor Analytics');
  const [senderContact, setSenderContact] = useState<string>('Ext. 4022 • hr.workforce@ajinomoto.co.id');

  // Google Apps Script (GAS) Webhook Config
  const [gasWebhookUrl, setGasWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('mpcs_gas_webhook_url') || '';
  });
  const [showGasHelper, setShowGasHelper] = useState<boolean>(false);
  const [gasCodeCopied, setGasCodeCopied] = useState<boolean>(false);

  // Action status
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);

  const currentUser = getCurrentSession();

  const data = useMemo(() => {
    if (!isOpen) return [];
    return getDashboardData('ALL', bulan, tahun);
  }, [isOpen, bulan, tahun]);

  const fiscalMonth = getFiscalMonth(bulan);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(bulan);
  const fiscalYear = bulan >= 4 ? tahun : tahun - 1;
  const fyLabel = formatFiscalYearLabel(fiscalYear);

  // Calculate Metrics
  const { totalPlan, totalActual, gap, pct, status, optimalDepts, overDepts, underDepts } =
    useMemo(() => {
      let p = 0;
      let a = 0;
      const opt: typeof data = [];
      const ov: typeof data = [];
      const un: typeof data = [];

      data.forEach((d) => {
        p += Number(d.plan) || 0;
        a += Number(d.actual) || 0;
        if (d.status === 'OPTIMAL') opt.push(d);
        else if (d.status === 'OVER') ov.push(d);
        else if (d.status === 'UNDER') un.push(d);
      });

      const g = a - p;
      const percentage = p > 0 ? (a / p) * 100 : 0;
      const st = percentage > 100 ? 'OVER CAPACITY' : percentage < 90 ? 'UNDER CAPACITY' : 'KONDISI OPTIMAL';

      return {
        totalPlan: p,
        totalActual: a,
        gap: g,
        pct: percentage,
        status: st,
        optimalDepts: opt,
        overDepts: ov,
        underDepts: un,
      };
    }, [data]);

  // Initialize draft when modal opens or period changes
  useEffect(() => {
    if (currentUser?.nama) {
      setSenderName(currentUser.nama);
    }
    if (currentUser?.title) {
      setSenderTitle(currentUser.title);
    }

    const defaultSubject = `[OFFICIAL REPORT] Laporan Eksekutif Manpower - Periode ${monthLabel} ${tahun} (${fyLabel}) | PT Ajinomoto Indonesia`;
    setEmailSubject(defaultSubject);

    const defaultOpening = `Bersama ini kami sampaikan Laporan Eksekutif Pengendalian Manpower (Manpower Control System - MPCS) PT Ajinomoto Indonesia - PT Ajinex International, Pabrik Mojokerto untuk periode evaluasi ${monthLabel} ${tahun} (${fyLabel}).`;
    setOpeningText(defaultOpening);

    let defaultNarrative = '';
    if (pct > 100) {
      defaultNarrative = `Secara keseluruhan realisasi tenaga kerja pabrik tercatat melebihi anggaran (+${pct.toFixed(
        1
      )}% terhadap budget, selisih +${gap.toLocaleString()} MP). Terdapat ${overDepts.length} departemen dengan status Over Capacity yang memerlukan tindak lanjut efisiensi alokasi Outsource.`;
    } else if (pct < 90) {
      defaultNarrative = `Secara keseluruhan realisasi tenaga kerja berada di bawah anggaran (${pct.toFixed(
        1
      )}% terhadap budget, selisih ${gap.toLocaleString()} MP). Kondisi ini berpotensi menimbulkan beban kerja berlebih (overload) di ${underDepts.length} departemen dan memerlukan percepatan proses rekrutmen.`;
    } else {
      defaultNarrative = `Secara keseluruhan kondisi manpower pabrik berada dalam rentang OPTIMAL (${pct.toFixed(
        1
      )}% terhadap budget) dengan total realisasi ${totalActual.toLocaleString()} MP dari target ${totalPlan.toLocaleString()} MP (selisih ${gap.toLocaleString()} MP). Perencanaan dan realisasi tenaga kerja berjalan sesuai target operasional pabrik.`;
    }
    setExecutiveNarrative(defaultNarrative);
    setCustomExecutiveNote(defaultNarrative);

    let defaultActions = '';
    if (overDepts.length > 0) {
      const topOver = overDepts.slice(0, 3).map((d) => `${d.deptName} (+${d.gap} MP)`).join(', ');
      defaultActions += `1. Evaluasi dan penyesuaian jam kerja/alokasi Outsource pada departemen: ${topOver}.\n`;
    }
    if (underDepts.length > 0) {
      const topUnder = underDepts.slice(0, 3).map((d) => `${d.deptName} (${d.gap} MP)`).join(', ');
      defaultActions += `2. Koordinasi percepatan onboarding rekrutmen baru untuk departemen: ${topUnder}.\n`;
    }
    defaultActions += `3. Pengawasan rutin realisasi manpower bulanan via dashboard terintegrasi MPCS.`;
    setActionRecommendations(defaultActions);
  }, [isOpen, bulan, tahun, monthLabel, fyLabel, pct, gap, totalPlan, totalActual, overDepts, underDepts, currentUser]);

  // Save GAS webhook
  const handleSaveGasUrl = (url: string) => {
    setGasWebhookUrl(url);
    localStorage.setItem('mpcs_gas_webhook_url', url);
  };

  // Template switch handler
  const handleSelectTemplate = (type: TemplateType) => {
    setSelectedTemplate(type);
    if (type === 'EXECUTIVE_DIRECTOR') {
      setSalutation('Kepada Yth. Bapak/Ibu Jajaran Direksi & Manajemen Pabrik,');
      setOpeningText(
        `Bersama ini kami sampaikan Laporan Eksekutif Pengendalian Manpower (Manpower Control System - MPCS) PT Ajinomoto Indonesia - PT Ajinex International, Pabrik Mojokerto untuk periode ${monthLabel} ${tahun} (${fyLabel}).`
      );
      setIncludeKpiTable(true);
      setIncludeDeptHighlights(true);
    } else if (type === 'OPERATIONAL_MANAGERS') {
      setSalutation('Kepada Yth. Bapak/Ibu Factory Manager & Para Section Head,');
      setOpeningText(
        `Berikut disampaikan ringkasan realisasi manpower pabrik periode ${monthLabel} ${tahun} sebagai acuan evaluasi produktivitas dan alokasi tenaga kerja di masing-masing area kerja.`
      );
      setIncludeKpiTable(true);
      setIncludeDeptHighlights(true);
    } else if (type === 'MONTHLY_ROUTINE') {
      setSalutation('Yth. Rekan-rekan Manajemen & PIC Terkait,');
      setOpeningText(
        `Berikut terlampir Laporan Bulanan Manpower Control System (MPCS) periode ${monthLabel} ${tahun}. Data lengkap dan dokumen PDF dapat diakses melalui berkas terlampir.`
      );
      setIncludeKpiTable(true);
      setIncludeDeptHighlights(false);
    }
  };

  const portalBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const directReportLink = `${portalBaseUrl}/?view=executive&month=${bulan}&year=${tahun}`;
  const pdfFileName = `Manpower_Executive_Report_${bulan}_${tahun}.pdf`;
  const excelFileName = `Database_Manpower_ALL_${bulan}_${tahun}.xlsx`;

  // Compile Plain Text for Clipboard / Mailto / Gmail / GAS
  const compiledEmailBody = useMemo(() => {
    let body = `${salutation}\n\n`;
    body += `${openingText}\n\n`;

    body += `==================================================\n`;
    body += `📊 RINGKASAN EKSEKUTIF MANPOWER\n`;
    body += `==================================================\n`;
    body += `${executiveNarrative}\n\n`;

    if (includeKpiTable) {
      body += `RINGKASAN ANGKA UTAMA:\n`;
      body += `• Total Budget Plan     : ${totalPlan.toLocaleString()} MP\n`;
      body += `• Total Realisasi Actual: ${totalActual.toLocaleString()} MP\n`;
      body += `• Variance / Gap        : ${(gap > 0 ? '+' : '')}${gap.toLocaleString()} MP\n`;
      body += `• Achievement Rate      : ${pct.toFixed(1)}%\n`;
      body += `• Status Kondisi        : ${status}\n\n`;
    }

    if (includeDeptHighlights) {
      body += `DISTRIBUSI DEPARTEMEN (${data.length} Departemen):\n`;
      body += `• Departemen Optimal    : ${optimalDepts.length} Dept\n`;
      if (overDepts.length > 0) {
        body += `• Departemen Over Cap   : ${overDepts.length} Dept (${overDepts.map((d) => `${d.deptName}: +${d.gap}`).join(', ')})\n`;
      }
      if (underDepts.length > 0) {
        body += `• Departemen Under Cap  : ${underDepts.length} Dept (${underDepts.map((d) => `${d.deptName}: ${d.gap}`).join(', ')})\n`;
      }
      body += `\n`;
    }

    if (actionRecommendations) {
      body += `POIN REKOMENDASI & TINDAK LANJUT:\n`;
      body += `${actionRecommendations}\n\n`;
    }

    if (includeDownloadLinksInBody) {
      body += `==================================================\n`;
      body += `📎 BERKAS LAMPIRAN & TAUTAN UNDUH LAPORAN\n`;
      body += `==================================================\n`;
      body += `Dokumen laporan manpower resmi telah disiapkan dan dapat diunduh langsung:\n`;
      body += `1. Berkas PDF Laporan Resmi : ${pdfFileName} (Terlampir)\n`;
      body += `2. Berkas Rekap Data Excel   : ${excelFileName} (Terlampir)\n`;
      body += `3. Tautan Portal Real-Time  : ${directReportLink}\n\n`;
      body += `Catatan: Dokumen digital ini telah diverifikasi dan ditandatangani secara elektronik melalui sistem MPCS Ajinomoto Mojokerto Factory.\n\n`;
    }

    body += `${closingText}\n\n`;
    body += `Hormat kami,\n`;
    body += `${senderName}\n`;
    body += `${senderTitle}\n`;
    body += `HR Development Section — Workforce Analytics\n`;
    body += `PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory\n`;
    body += `${senderContact}\n`;
    body += `\n(Laporan ini dihasilkan secara resmi melalui sistem MPCS)`;

    return body;
  }, [
    salutation,
    openingText,
    executiveNarrative,
    includeKpiTable,
    includeDeptHighlights,
    includeDownloadLinksInBody,
    totalPlan,
    totalActual,
    gap,
    pct,
    status,
    data.length,
    optimalDepts.length,
    overDepts,
    underDepts,
    actionRecommendations,
    pdfFileName,
    excelFileName,
    directReportLink,
    closingText,
    senderName,
    senderTitle,
    senderContact,
  ]);

  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(`Subjek: ${emailSubject}\n\n` + compiledEmailBody);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Download both attachments for easy drag-and-drop / attachment
  const handleDownloadAllAttachments = () => {
    generateExecutiveReportPDF(bulan, tahun, {
      includeCover,
      customSignee,
      customNote: customExecutiveNote || executiveNarrative,
    });
    setTimeout(() => {
      exportFullManpowerExcel('ALL', bulan, tahun);
    }, 400);

    setAttachmentToast('Berkas Laporan PDF & Excel telah diunduh ke folder komputer Anda!');
    setTimeout(() => setAttachmentToast(null), 4000);

    addAuditLog(
      currentUser?.email || currentUser?.userId || 'SYSTEM',
      'EXPORT_REPORT',
      'Laporan Eksekutif',
      `Unduh Paket Lampiran Laporan (PDF + Excel) ${monthLabel} ${tahun}`
    );
  };

  // Primary Action: Open in Gmail Webmail (Default & most reliable)
  const handleOpenGmail = () => {
    if (autoDownloadAttachments) {
      handleDownloadAllAttachments();
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      emailTo
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(compiledEmailBody)}&cc=${encodeURIComponent(
      emailCc
    )}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    addAuditLog(
      currentUser?.email || currentUser?.userId || 'SYSTEM',
      'EXPORT_REPORT',
      'Laporan Eksekutif',
      `Buka draft laporan di Gmail Web (${emailTo})`
    );
  };

  // Secondary Action: Open in Outlook Web (O365)
  const handleOpenOutlookWeb = () => {
    if (autoDownloadAttachments) {
      handleDownloadAllAttachments();
    }

    const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
      emailTo
    )}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
      compiledEmailBody
    )}&cc=${encodeURIComponent(emailCc)}`;
    window.open(outlookWebUrl, '_blank', 'noopener,noreferrer');
    addAuditLog(
      currentUser?.email || currentUser?.userId || 'SYSTEM',
      'EXPORT_REPORT',
      'Laporan Eksekutif',
      `Buka draft laporan di Outlook Web (${emailTo})`
    );
  };

  // Tertiary Action: Open Default Desktop Mail Client (mailto:)
  const handleOpenMailClient = () => {
    if (autoDownloadAttachments) {
      handleDownloadAllAttachments();
    }

    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?cc=${encodeURIComponent(
      emailCc
    )}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(compiledEmailBody)}`;
    window.open(mailtoUrl, '_blank');
    addAuditLog(
      currentUser?.email || currentUser?.userId || 'SYSTEM',
      'EXPORT_REPORT',
      'Laporan Eksekutif',
      `Buka email di aplikasi default client (${emailTo})`
    );
  };

  // Google Apps Script (GAS) Direct Webhook Dispatch with Base64 Attachments
  const handleSendViaGasWebhook = async () => {
    if (!emailTo) return;
    setSendingEmail(true);

    let pdfBase64 = '';
    let excelCsvData = '';

    try {
      pdfBase64 = getExecutiveReportPDFBase64(bulan, tahun, {
        includeCover,
        customSignee,
        customNote: customExecutiveNote || executiveNarrative,
      });
      excelCsvData = getManpowerCsvString('ALL', bulan, tahun);
    } catch (e) {
      console.warn('Error generating binary attachment payload:', e);
    }

    const payload = {
      to: emailTo,
      cc: emailCc,
      subject: emailSubject,
      body: compiledEmailBody,
      month: monthLabel,
      year: tahun,
      fiscalYear: fyLabel,
      pdfBase64: pdfBase64 || undefined,
      pdfFileName: pdfFileName,
      excelCsvData: excelCsvData || undefined,
      excelFileName: `Database_Manpower_ALL_${bulan}_${tahun}.csv`,
      kpis: {
        plan: totalPlan,
        actual: totalActual,
        gap: gap,
        achievement: pct,
        status: status,
      },
      sentAt: new Date().toISOString(),
      sender: {
        name: senderName,
        title: senderTitle,
        contact: senderContact,
      },
    };

    if (gasWebhookUrl && gasWebhookUrl.startsWith('http')) {
      try {
        await fetch(gasWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('GAS fetch sent with standard no-cors handling');
      }
    }

    setTimeout(() => {
      setSendingEmail(false);
      setEmailSentSuccess(true);
      addAuditLog(
        currentUser?.email || currentUser?.userId || 'SYSTEM',
        'EXPORT_REPORT',
        'Laporan Eksekutif',
        `Kirim email & lampiran via Google Apps Script (GAS) ke ${emailTo}`
      );
      setTimeout(() => setEmailSentSuccess(false), 4000);
    }, 1200);
  };

  const handleDownloadPDF = () => {
    generateExecutiveReportPDF(bulan, tahun, {
      includeCover,
      customSignee,
      customNote: customExecutiveNote || executiveNarrative,
    });
    addAuditLog(
      currentUser?.email || currentUser?.userId || 'SYSTEM',
      'EXPORT_REPORT',
      'Laporan Eksekutif',
      `Unduh PDF Executive Report ${monthLabel} ${tahun} (Cover: ${includeCover ? 'Ya' : 'Tidak'})`
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
              alt="Ajinomoto Logo"
              className="w-9 h-7 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Manpower Executive Report & Email Dispatcher
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-full">
                  Gmail & GAS Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory • Periode: {monthLabel} {tahun} ({fyLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs Switcher */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Pratinjau & PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email_editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'email_editor'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Edit Redaksional & Gmail</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Preview & PDF Settings */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Header Banner info */}
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                EXECUTIVE WORKFORCE REPORT
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                Laporan Manpower Budget vs Actual
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Periode: <b className="text-slate-800 dark:text-slate-200">{monthLabel} {tahun}</b> • {fyLabel} • Total Departemen:{' '}
                <b className="text-slate-800 dark:text-slate-200">{data.length}</b>
              </p>
            </div>

            {/* Status Ribbon & KPI Cards */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <div
                className={`p-2.5 rounded-xl text-center font-bold text-xs sm:text-sm text-white shadow-xs ${
                  pct > 100 ? 'bg-red-600' : pct < 90 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
              >
                STATUS: {status} ({pct.toFixed(1)}% terhadap total budget manpower)
              </div>

              {/* 4 Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Budget</span>
                  <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                    {totalPlan.toLocaleString()} <span className="text-xs font-normal text-slate-400">MP</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Actual</span>
                  <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                    {totalActual.toLocaleString()} <span className="text-xs font-normal text-slate-400">MP</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Variance (Gap)</span>
                  <div
                    className={`text-lg font-mono font-extrabold mt-0.5 ${
                      gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {gap > 0 ? '+' : ''}{gap.toLocaleString()} <span className="text-xs font-normal">MP</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Achievement</span>
                  <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Insight Narrative Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  Executive Summary & Insight Analisis
                </span>
                <span className="text-[11px] text-slate-400">Dapat disesuaikan sebelum ekspor</span>
              </div>
              <textarea
                value={customExecutiveNote}
                onChange={(e) => setCustomExecutiveNote(e.target.value)}
                rows={2}
                placeholder="Tulis catatan eksekutif khusus..."
                className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Department Breakdown Mini Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Rincian 23 Departemen (Tampilan Persis PDF Export)
                </h4>
                <span className="text-[11px] text-slate-400">
                  {optimalDepts.length} Optimal • {overDepts.length} Over • {underDepts.length} Under
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-red-600 text-white font-bold sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Departemen</th>
                      <th className="p-2 text-center">Budget</th>
                      <th className="p-2 text-center">Actual</th>
                      <th className="p-2 text-center">Selisih</th>
                      <th className="p-2 text-center">Achv %</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-left">Catatan / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {data.map((d) => (
                      <tr key={d.deptId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{d.deptName}</td>
                        <td className="p-2 text-center font-mono">{d.plan}</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-900 dark:text-slate-100">{d.actual}</td>
                        <td
                          className={`p-2 text-center font-mono font-bold ${
                            d.gap > 0 ? 'text-red-500' : 'text-emerald-500'
                          }`}
                        >
                          {d.gap > 0 ? '+' : ''}{d.gap}
                        </td>
                        <td className="p-2 text-center font-mono">{d.achievement.toFixed(1)}%</td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                              d.status === 'OVER'
                                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                                : d.status === 'UNDER'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-xs">
                          {d.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PDF Export Options Box */}
            <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Opsi Format Dokumen PDF
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Pilih apakah ingin menyertakan <b>Cover Eksklusif Eksekutif</b> pada halaman pertama dokumen.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Sertakan Cover Eksklusif (Halaman 1)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Email Editorial Composer with Gmail Default & GAS Integration */}
        {activeTab === 'email_editor' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Delivery Method Selector (Gmail Default Highlight) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50/70 to-slate-50 dark:from-red-950/30 dark:via-slate-900 dark:to-slate-900 border border-red-200/80 dark:border-red-900/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      Metode Pengiriman Email Laporan (Default: Google Gmail)
                    </h4>
                    <span className="px-2 py-0.5 text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                      Bebas Hambatan Outlook
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Solusi praktis untuk keterbatasan akses sistem Outlook perusahaan dengan pengiriman otomatis via Webmail Gmail & Google Apps Script (GAS).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGasHelper(!showGasHelper)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1 shadow-2xs self-start sm:self-auto"
                >
                  <Code className="w-3 h-3 text-red-600" />
                  <span>{showGasHelper ? 'Sembunyikan Script GAS' : 'Lihat Script GAS'}</span>
                </button>
              </div>

              {/* Provider Options Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('GMAIL')}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    selectedProvider === 'GMAIL'
                      ? 'bg-white dark:bg-slate-800 border-red-500 shadow-xs ring-2 ring-red-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      Google Gmail
                    </span>
                    <span className="text-[9px] font-bold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.2 rounded">
                      Default
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Buka langsung di Webmail Gmail tanpa perlu izin sistem client.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('GAS_WEBHOOK')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedProvider === 'GAS_WEBHOOK'
                      ? 'bg-white dark:bg-slate-800 border-red-500 shadow-xs ring-2 ring-red-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-amber-500" />
                      Google Apps Script
                    </span>
                    <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded">
                      GAS
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Kirim otomatis via Apps Script MailApp / Webhook API.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('OUTLOOK_WEB')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedProvider === 'OUTLOOK_WEB'
                      ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      Outlook Web (O365)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Buka di browser Microsoft 365 Webmail perusahaan.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('OUTLOOK_DESKTOP')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedProvider === 'OUTLOOK_DESKTOP'
                      ? 'bg-white dark:bg-slate-800 border-slate-700 shadow-xs ring-2 ring-slate-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      Outlook App / Mailto
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Aplikasi Desktop Outlook atau mail client bawaan OS.
                  </p>
                </button>
              </div>

              {/* GAS Helper Code & Webhook URL (Collapsible) */}
              {showGasHelper && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-2.5 border border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                      <Code className="w-3.5 h-3.5" />
                      Template Script Google Apps Script (Code.gs)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(DEFAULT_GAS_CODE);
                        setGasCodeCopied(true);
                        setTimeout(() => setGasCodeCopied(false), 2000);
                      }}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1"
                    >
                      {gasCodeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{gasCodeCopied ? 'Tersalin!' : 'Salin Kode GAS'}</span>
                    </button>
                  </div>

                  <p className="text-[10.5px] text-slate-400">
                    Buka <b>script.google.com</b>, tempel kode di bawah, lalu Deploy sebagai <i>Web App (Access: Anyone)</i>. Masukkan URL Web App pada kolom di bawah.
                  </p>

                  <pre className="p-2 rounded bg-black/60 font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-32">
                    {DEFAULT_GAS_CODE}
                  </pre>

                  <div className="pt-1">
                    <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                      GAS Web App URL (Opsional untuk Trigger Otomatis):
                    </label>
                    <input
                      type="url"
                      value={gasWebhookUrl}
                      onChange={(e) => handleSaveGasUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Top Presets Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-600" />
                  Pilih Preset Redaksional Laporan
                </h4>
                <p className="text-[11px] text-slate-500">
                  Gunakan struktur format redaksional yang disesuaikan dengan sasaran penerima
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('EXECUTIVE_DIRECTOR')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedTemplate === 'EXECUTIVE_DIRECTOR'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Direksi & Manajemen
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('OPERATIONAL_MANAGERS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedTemplate === 'OPERATIONAL_MANAGERS'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Factory Manager & Section Heads
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('MONTHLY_ROUTINE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedTemplate === 'MONTHLY_ROUTINE'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Rutin Bulanan
                </button>
              </div>
            </div>

            {/* Email Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 space-y-4">
                {/* Recipients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Penerima Utama (To)
                    </label>
                    <input
                      type="text"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="email1@ajinomoto.co.id, paajinomoto@gmail.com..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tembusan (CC)
                    </label>
                    <input
                      type="text"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="hr@ajinomoto.co.id, lead@..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subjek Email
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Salutation & Opening */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Salam Pembuka (Salutation)
                  </label>
                  <input
                    type="text"
                    value={salutation}
                    onChange={(e) => setSalutation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paragraf Pembuka (Introduction)
                  </label>
                  <textarea
                    rows={2}
                    value={openingText}
                    onChange={(e) => setOpeningText(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Executive Body Narrative */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Narasi & Analisis Eksekutif
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        let text = '';
                        if (pct > 100) {
                          text = `Secara keseluruhan realisasi tenaga kerja pabrik tercatat melebihi anggaran (+${pct.toFixed(
                            1
                          )}% terhadap budget, selisih +${gap.toLocaleString()} MP). Terdapat ${overDepts.length} departemen dengan status Over Capacity.`;
                        } else if (pct < 90) {
                          text = `Secara keseluruhan realisasi tenaga kerja berada di bawah anggaran (${pct.toFixed(
                            1
                          )}% terhadap budget, selisih ${gap.toLocaleString()} MP).`;
                        } else {
                          text = `Secara keseluruhan kondisi manpower pabrik berada dalam rentang OPTIMAL (${pct.toFixed(
                            1
                          )}% terhadap budget) dengan total realisasi ${totalActual.toLocaleString()} MP dari target ${totalPlan.toLocaleString()} MP.`;
                        }
                        setExecutiveNarrative(text);
                      }}
                      className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset ke Analisis Sistem
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={executiveNarrative}
                    onChange={(e) => setExecutiveNarrative(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-800 dark:text-slate-200 leading-relaxed"
                  />
                </div>

                {/* Switches */}
                <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-0.5">
                    Pengaturan Konten & Lampiran
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeKpiTable}
                        onChange={(e) => setIncludeKpiTable(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                      />
                      <span>Ringkasan KPI Utama</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDeptHighlights}
                        onChange={(e) => setIncludeDeptHighlights(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                      />
                      <span>Sorotan Dept Over/Under</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDownloadLinksInBody}
                        onChange={(e) => setIncludeDownloadLinksInBody(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                      />
                      <span>Sertakan Tautan & Rincian Unduh Berkas</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDownloadAttachments}
                        onChange={(e) => setAutoDownloadAttachments(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                      />
                      <span>Otomatis Unduh Berkas Saat Buka Email</span>
                    </label>
                  </div>

                  {/* Attached Files List & Quick Download */}
                  <div className="mt-2 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Paperclip className="w-3.5 h-3.5 text-red-500" />
                        Lampiran Siap:
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-medium border border-red-200 dark:border-red-800/60">
                        <FileText className="w-3 h-3" />
                        {pdfFileName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/60">
                        <FileSpreadsheet className="w-3 h-3" />
                        {excelFileName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadAllAttachments}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                      title="Unduh berkas PDF dan Excel sekaligus"
                    >
                      <Download className="w-3 h-3 text-red-500" />
                      <span>Unduh Paket Lampiran</span>
                    </button>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Poin Rekomendasi & Tindak Lanjut HR
                  </label>
                  <textarea
                    rows={3}
                    value={actionRecommendations}
                    onChange={(e) => setActionRecommendations(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-800 dark:text-slate-200 font-mono text-[11px]"
                  />
                </div>

                {/* PIC Signee Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nama PIC Pengirim</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Jabatan / Section</label>
                    <input
                      type="text"
                      value={senderTitle}
                      onChange={(e) => setSenderTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kontak / Ekstensi</label>
                    <input
                      type="text"
                      value={senderContact}
                      onChange={(e) => setSenderContact(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live Email HTML Preview */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-red-600" />
                    Live Email Preview (Tampilan Format Penerima)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Format Siap Kirim
                  </span>
                </div>

                <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0c1220] p-4 text-xs overflow-y-auto max-h-[580px] shadow-inner font-sans space-y-3.5">
                  {/* Email Header Simulation */}
                  <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Kepada:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{emailTo || '(Belum diisi)'}</span>
                    </div>
                    {emailCc && (
                      <div>
                        <span className="text-slate-400">Tembusan:</span>{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{emailCc}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Subjek:</span>{' '}
                      <span className="font-bold text-red-600 dark:text-red-400">{emailSubject}</span>
                    </div>
                  </div>

                  {/* Body Content Simulation */}
                  <div className="text-slate-800 dark:text-slate-200 space-y-3 leading-relaxed">
                    <p>{salutation}</p>
                    <p>{openingText}</p>

                    {/* Highlight Box inside Preview */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="font-bold text-red-600 dark:text-red-400 text-[11px] uppercase flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Ringkasan Eksekutif
                      </div>
                      <p className="text-[11.5px] leading-relaxed">{executiveNarrative}</p>

                      {includeKpiTable && (
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10.5px]">
                          <div>
                            Budget: <b>{totalPlan.toLocaleString()} MP</b>
                          </div>
                          <div>
                            Actual: <b>{totalActual.toLocaleString()} MP</b>
                          </div>
                          <div>
                            Selisih:{' '}
                            <b className={gap > 0 ? 'text-red-500' : 'text-emerald-500'}>
                              {(gap > 0 ? '+' : '')}{gap.toLocaleString()} MP
                            </b>
                          </div>
                          <div>
                            Pencapaian: <b>{pct.toFixed(1)}%</b>
                          </div>
                        </div>
                      )}
                    </div>

                    {includeDeptHighlights && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
                        <div className="font-bold text-slate-700 dark:text-slate-300">Status Departemen:</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          • {optimalDepts.length} Departemen Optimal
                        </div>
                        {overDepts.length > 0 && (
                          <div className="text-red-600 dark:text-red-400">
                            • {overDepts.length} Dept Over Capacity ({overDepts.slice(0, 2).map((d) => d.deptName).join(', ')}...)
                          </div>
                        )}
                        {underDepts.length > 0 && (
                          <div className="text-amber-600 dark:text-amber-400">
                            • {underDepts.length} Dept Under Capacity ({underDepts.slice(0, 2).map((d) => d.deptName).join(', ')}...)
                          </div>
                        )}
                      </div>
                    )}

                    {actionRecommendations && (
                      <div className="space-y-1 text-[11px]">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          Poin Rekomendasi & Tindak Lanjut:
                        </div>
                        <div className="whitespace-pre-line text-slate-600 dark:text-slate-400 pl-1 font-mono text-[10.5px]">
                          {actionRecommendations}
                        </div>
                      </div>
                    )}

                    <p>{closingText}</p>

                    {/* Email Signature */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{senderName}</div>
                      <div className="text-slate-600 dark:text-slate-400">{senderTitle}</div>
                      <div className="text-slate-500 font-medium">HR Development Section • Workforce Analytics</div>
                      <div className="text-red-600 dark:text-red-400 font-semibold">
                        PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory
                      </div>
                      <div className="text-slate-400 text-[10px]">{senderContact}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {attachmentToast && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                <Paperclip className="w-4 h-4 text-blue-500" />
                {attachmentToast}
              </span>
            )}
            {emailSentSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Laporan & berkas lampiran berhasil dikirim via Google Apps Script (GAS) ke {emailTo}!
              </span>
            )}
            {copiedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                Seluruh teks redaksional berhasil disalin ke clipboard!
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyEmailText}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Salin isi email beserta subjek ke clipboard"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin Teks</span>
            </button>

            {/* Download Attachments Package Button */}
            <button
              type="button"
              onClick={handleDownloadAllAttachments}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Unduh berkas PDF Executive (+Cover) & Database Excel sekaligus"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Lampiran (.PDF + .XLSX)</span>
            </button>

            {/* PRIMARY BUTTON: Send/Open via Gmail (DEFAULT) */}
            <button
              type="button"
              onClick={handleOpenGmail}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all flex items-center gap-1.5 shadow-md ring-2 ring-red-500/20 cursor-pointer"
              title="Buka langsung di Webmail Gmail dengan teks laporan terisi lengkap & berkas otomatis diunduh (Rekomendasi Utama)"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Buka di Gmail (Default)</span>
            </button>

            {/* Other Delivery Provider Dropdown / Split Action */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>Opsi Email Lain</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilihan Email Platform
                  </div>

                  {/* Gmail Web */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      handleOpenGmail();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <div>
                      <div>Google Gmail Web (Default)</div>
                      <div className="text-[10px] font-normal text-slate-500">Tanpa kendala akses client</div>
                    </div>
                  </button>

                  {/* Google Apps Script (GAS) Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      handleSendViaGasWebhook();
                    }}
                    disabled={sendingEmail}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <div>
                      <div>Kirim via Apps Script (GAS)</div>
                      <div className="text-[10px] font-normal text-slate-500">Automated MailApp sender + Lampiran</div>
                    </div>
                  </button>

                  {/* Outlook Web */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      handleOpenOutlookWeb();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <div>
                      <div>Microsoft Outlook Web</div>
                      <div className="text-[10px] font-normal text-slate-500">Office 365 Webmail</div>
                    </div>
                  </button>

                  {/* Outlook Desktop / Mailto */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      handleOpenMailClient();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <div>
                      <div>Desktop Mail / Mailto:</div>
                      <div className="text-[10px] font-normal text-slate-500">Aplikasi Outlook Desktop</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF {includeCover ? '(+Cover)' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
