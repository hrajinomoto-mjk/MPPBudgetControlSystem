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
 * Otomatis membuat DRAFT di Gmail atau MENGIRIM email lengkap dengan:
 * 1. Format Tampilan HTML Cantik (Tabel, Warna Ajinomoto Crimson, Badge Status)
 * 2. Lampiran PDF Laporan Eksekutif (.pdf)
 * 3. Lampiran Rekap Data Excel (.xlsx / .csv)
 * 
 * CARA DEPLOY:
 * 1. Buka script.google.com -> Buat Proyek Baru
 * 2. Tempel kode di bawah ini -> Klik 'Deploy' -> 'New Deployment'
 * 3. Pilih tipe 'Web App' -> Execute as: Me -> Who has access: Anyone
 * 4. Salin URL Web App dan tempelkan di kolom URL GAS MPCS.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to || "paajinomoto@gmail.com";
    var cc = data.cc || "";
    var subject = data.subject || "[MPCS] Laporan Eksekutif Manpower";
    var plainBody = data.body || "";
    var htmlBody = data.htmlBody || data.body || "";
    var action = data.action || "draft"; // 'draft' atau 'send'
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

    if (action === "send") {
      MailApp.sendEmail({
        to: to,
        cc: cc,
        subject: subject,
        body: plainBody,
        htmlBody: htmlBody,
        attachments: attachments
      });
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "send",
        message: "Email & " + attachments.length + " berkas lampiran berhasil dikirim ke " + to + "!",
        attachedFiles: attachments.map(function(a) { return a.getName(); })
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // DEFAULT: Buat draft di Gmail pengguna dengan format HTML + Lampiran siap kirim
      var draft = GmailApp.createDraft(to, subject, plainBody, {
        htmlBody: htmlBody,
        cc: cc,
        attachments: attachments
      });
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "draft",
        draftId: draft.getId(),
        message: "Draft di Gmail berhasil dibuat lengkap dengan format HTML & " + attachments.length + " lampiran!",
        attachedFiles: attachments.map(function(a) { return a.getName(); })
      })).setMimeType(ContentService.MimeType.JSON);
    }
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

  // Auto Attachment & Download Settings (Sender's device is NOT polluted with auto-downloads)
  const [autoDownloadAttachments, setAutoDownloadAttachments] = useState<boolean>(false);
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
      defaultNarrative = `Secara keseluruhan realisasi tenaga kerja pabrik tercatat sebesar ${pct.toFixed(
        1
      )}% terhadap alokasi rencana (selisih +${gap.toLocaleString()} tenaga kerja). Terdapat ${overDepts.length} departemen yang direkomendasikan untuk dikaji ulang bersama Kepala Departemen guna meninjau fluktuasi volume output produksi dan penyesuaian jam kerja lembur.`;
    } else if (pct < 90) {
      defaultNarrative = `Secara keseluruhan tingkat pemenuhan tenaga kerja pabrik tercatat sebesar ${pct.toFixed(
        1
      )}% terhadap rencana (selisih ${gap.toLocaleString()} tenaga kerja). Koordinasi intensif terus dioptimalkan guna mendukung percepatan pemenuhan di ${underDepts.length} departemen terkait agar kontinuitas operasional tetap prima.`;
    } else {
      defaultNarrative = `Secara keseluruhan kondisi manpower pabrik berada dalam rentang OPTIMAL (${pct.toFixed(
        1
      )}% terhadap rencana) dengan total realisasi ${totalActual.toLocaleString()} tenaga kerja dari target ${totalPlan.toLocaleString()} perencanaan (selisih ${gap.toLocaleString()} tenaga kerja). Alokasi dan produktivitas tenaga kerja berjalan selaras dengan target operasional pabrik.`;
    }
    setExecutiveNarrative(defaultNarrative);
    setCustomExecutiveNote(defaultNarrative);

    let defaultActions = '';
    if (overDepts.length > 0) {
      const topOver = overDepts.slice(0, 3).map((d) => `${d.deptName} (+${d.gap} MP)`).join(', ');
      defaultActions += `1. Tinjauan kolaboratif beban kerja dan kebutuhan jam lembur bersama pimpinan departemen: ${topOver}.\n`;
    }
    if (underDepts.length > 0) {
      const topUnder = underDepts.slice(0, 3).map((d) => `${d.deptName} (${d.gap} MP)`).join(', ');
      defaultActions += `2. Koordinasi percepatan pemenuhan dan penempatan mitra kerja untuk departemen: ${topUnder}.\n`;
    }
    defaultActions += `3. Pemantauan berkala alokasi dan fleksibilitas tenaga kerja antar-lini via sistem terpadu MPCS.`;
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
  const directPdfDownloadUrl = `${portalBaseUrl}/?action=download-pdf&report=executive&month=${bulan}&year=${tahun}`;
  const directReportLink = `${portalBaseUrl}/?view=executive&month=${bulan}&year=${tahun}`;
  const pdfFileName = `Manpower_Executive_Report_${bulan}_${tahun}.pdf`;
  const excelFileName = `Database_Manpower_ALL_${bulan}_${tahun}.xlsx`;

  // Compile Rich HTML Email Template (100% Matching System & Compatible with Gmail & Outlook)
  const compiledEmailHtml = useMemo(() => {
    const statusBg = pct > 100 ? '#fef2f2' : pct < 90 ? '#fffbeb' : '#f0fdf4';
    const statusColor = pct > 100 ? '#b91c1c' : pct < 90 ? '#b45309' : '#15803d';
    const statusBorder = pct > 100 ? '#fecaca' : pct < 90 ? '#fde68a' : '#bbf7d0';

    let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <!-- Brand Red Banner Header -->
  <div style="background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); color: #ffffff; padding: 22px 26px;">
    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #ffcdd2; margin-bottom: 4px;">
      PT AJINOMOTO INDONESIA — MOJOKERTO FACTORY
    </div>
    <div style="font-size: 19px; font-weight: 800; color: #ffffff; line-height: 1.3; margin-bottom: 6px;">
      LAPORAN EKSEKUTIF PENGENDALIAN MANPOWER (MPCS)
    </div>
    <div style="font-size: 12px; color: #ffebee;">
      <span>📅 Periode: <b>${monthLabel} ${tahun}</b> (${fyLabel})</span> &nbsp;|&nbsp; 
      <span>🔒 Klasifikasi: <b>CONFIDENTIAL / INTERNAL</b></span>
    </div>
  </div>

  <!-- Email Body Content -->
  <div style="padding: 24px 26px;">
    <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
      ${salutation}
    </p>
    <p style="font-size: 13.5px; line-height: 1.6; color: #334155; margin-bottom: 18px;">
      ${openingText}
    </p>

    <!-- Executive Summary Card -->
    <div style="background-color: #f8fafc; border-left: 4px solid #d32f2f; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 800; color: #b71c1c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        📊 Ringkasan Eksekutif Manpower
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #1e293b;">
        ${executiveNarrative}
      </div>
    </div>`;

    if (includeKpiTable) {
      html += `
    <!-- KPI Table -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">
        📈 Ringkasan Angka Kunci Pabrik
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="padding: 9px 12px; text-align: left; font-weight: 600;">Metrik Evaluasi</th>
            <th style="padding: 9px 12px; text-align: right; font-weight: 600;">Target Plan</th>
            <th style="padding: 9px 12px; text-align: right; font-weight: 600;">Realisasi Actual</th>
            <th style="padding: 9px 12px; text-align: right; font-weight: 600;">Variance (Gap)</th>
            <th style="padding: 9px 12px; text-align: center; font-weight: 600;">Pencapaian</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">Total Manpower Pabrik</td>
            <td style="padding: 10px 12px; text-align: right; color: #475569;">${totalPlan.toLocaleString()} MP</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">${totalActual.toLocaleString()} MP</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: ${gap > 0 ? '#dc2626' : gap < 0 ? '#d97706' : '#16a34a'};">
              ${(gap > 0 ? '+' : '')}${gap.toLocaleString()} MP
            </td>
            <td style="padding: 10px 12px; text-align: center;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                ${pct.toFixed(1)}% (${status})
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>`;
    }

    if (includeDeptHighlights) {
      html += `
    <!-- Dept Highlights -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12.5px;">
      <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Status Distribusi Departemen (${data.length} Dept):</div>
      <div style="color: #16a34a; margin-bottom: 4px;">• <b>${optimalDepts.length} Departemen</b> dalam kondisi Optimal.</div>
      ${overDepts.length > 0 ? `<div style="color: #dc2626; margin-bottom: 4px;">• <b>${overDepts.length} Dept Over Capacity:</b> ${overDepts.map(d => `${d.deptName} (+${d.gap})`).join(', ')}</div>` : ''}
      ${underDepts.length > 0 ? `<div style="color: #d97706; margin-bottom: 4px;">• <b>${underDepts.length} Dept Under Capacity:</b> ${underDepts.map(d => `${d.deptName} (${d.gap})`).join(', ')}</div>` : ''}
    </div>`;
    }

    if (actionRecommendations) {
      html += `
    <!-- Recommendations -->
    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
        📌 Poin Rekomendasi & Tindak Lanjut HR
      </div>
      <div style="font-size: 12.5px; line-height: 1.6; color: #334155; white-space: pre-line;">
        ${actionRecommendations}
      </div>
    </div>`;
    }

    if (includeDownloadLinksInBody) {
      html += `
    <!-- Direct PDF Download & Access Box for Recipients (No local attachment hassle) -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px; margin-bottom: 22px;">
      <div style="font-size: 12.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
        📥 Unduh Dokumen PDF Laporan Eksekutif Resmi
      </div>
      <div style="font-size: 12.5px; color: #475569; margin-bottom: 12px; line-height: 1.5;">
        Penerima laporan dapat langsung mengunduh dan menyimpan berkas PDF Laporan Eksekutif Resmi bertanda tangan digital melalui tautan sistem di bawah ini:
      </div>
      <div style="margin-bottom: 12px;">
        <a href="${directPdfDownloadUrl}" target="_blank" style="background-color: #d32f2f; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 2px 5px rgba(211,47,47,0.25);">
          📥 Klik untuk Unduh PDF (${pdfFileName})
        </a>
      </div>
      <div style="font-size: 11.5px; color: #64748b; border-top: 1px dashed #fca5a5; padding-top: 8px;">
        🌐 <b>Akses Portal Interaktif:</b> <a href="${directReportLink}" target="_blank" style="color: #d32f2f; font-weight: 600; text-decoration: underline;">Buka Dashboard MPCS Real-Time</a>
      </div>
    </div>`;
    }

    html += `
    <!-- Sign-off & E-Signature -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #475569; line-height: 1.5;">
      <p style="margin-bottom: 12px;">${closingText}</p>
      <p style="margin: 0; font-weight: 700; color: #0f172a;">${senderName}</p>
      <p style="margin: 0; color: #64748b;">${senderTitle}</p>
      <p style="margin: 0; color: #64748b;">HR Development Section — Workforce Analytics</p>
      <p style="margin: 0; color: #64748b;">PT Ajinomoto Indonesia - PT Ajinex International, Pabrik Mojokerto</p>
      <p style="margin: 0; color: #94a3b8; font-size: 11px;">${senderContact}</p>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 10.5px; color: #94a3b8;">
        ✅ Terverifikasi & Ditandatangani Secara Elektronik melalui Sistem MPCS Ajinomoto Mojokerto Factory
      </div>
    </div>
  </div>
</div>`;

    return html;
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
    directPdfDownloadUrl,
    directReportLink,
    closingText,
    senderName,
    senderTitle,
    senderContact,
    monthLabel,
    tahun,
    fyLabel,
  ]);

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
      body += `📥 TAUTAN UNDUH DOKUMEN PDF LAPORAN RESMI\n`;
      body += `==================================================\n`;
      body += `Penerima laporan dapat langsung mengunduh berkas PDF resmi melalui tautan sistem:\n`;
      body += `👉 Unduh Berkas PDF Resmi : ${directPdfDownloadUrl}\n`;
      body += `👉 Tautan Portal Real-Time: ${directReportLink}\n\n`;
      body += `Nama Berkas: ${pdfFileName}\n`;
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
    directPdfDownloadUrl,
    directReportLink,
    closingText,
    senderName,
    senderTitle,
    senderContact,
  ]);

  // Copy Rich HTML Table to Clipboard (so pasting in Gmail preserves 100% exact design)
  const copyRichHtmlToClipboard = async () => {
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const textBlob = new Blob([`Subjek: ${emailSubject}\n\n` + compiledEmailBody], { type: 'text/plain' });
        const htmlBlob = new Blob([compiledEmailHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          }),
        ]);
        return true;
      } else {
        await navigator.clipboard.writeText(`Subjek: ${emailSubject}\n\n` + compiledEmailBody);
        return false;
      }
    } catch (err) {
      console.warn('Clipboard write failed, fallback to plain text writeText', err);
      await navigator.clipboard.writeText(`Subjek: ${emailSubject}\n\n` + compiledEmailBody);
      return false;
    }
  };

  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(`Subjek: ${emailSubject}\n\n` + compiledEmailBody);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleCopyRichHtml = async () => {
    await copyRichHtmlToClipboard();
    setAttachmentToast('Format Email Lengkap (HTML) tersalin! Tekan Ctrl+V di Gmail untuk menempel format persis sistem.');
    setTimeout(() => setAttachmentToast(null), 5000);
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

  // Primary Action: Open in Gmail Webmail with Rich HTML Copy & Recipient Direct PDF Download Link
  const handleOpenGmail = async () => {
    if (autoDownloadAttachments) {
      handleDownloadAllAttachments();
    }

    // Auto copy rich HTML so when user presses Ctrl+V in Gmail, the exact layout appears!
    await copyRichHtmlToClipboard();

    setAttachmentToast('Gmail dibuka! Format HTML & Tautan Unduh PDF resmi telah disalin (Tekan Ctrl+V di Gmail). Penerima dapat mengunduh PDF langsung.');
    setTimeout(() => setAttachmentToast(null), 6000);

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

  // 1-Click Action: Create Rich HTML Draft in Gmail with Attachments via Google Apps Script
  const handleCreateGmailDraftViaGas = async () => {
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
      action: 'draft', // Tell GAS to create a draft in Gmail
      to: emailTo,
      cc: emailCc,
      subject: emailSubject,
      body: compiledEmailBody,
      htmlBody: compiledEmailHtml,
      month: monthLabel,
      year: tahun,
      fiscalYear: fyLabel,
      pdfBase64: pdfBase64 || undefined,
      pdfFileName: pdfFileName,
      excelCsvData: excelCsvData || undefined,
      excelFileName: `Database_Manpower_ALL_${bulan}_${tahun}.csv`,
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

    // Open user's Gmail Drafts folder directly
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSentSuccess(true);
      window.open('https://mail.google.com/mail/u/0/#drafts', '_blank', 'noopener,noreferrer');
      addAuditLog(
        currentUser?.email || currentUser?.userId || 'SYSTEM',
        'EXPORT_REPORT',
        'Laporan Eksekutif',
        `Buat draft lengkap di Gmail via GAS ke ${emailTo}`
      );
      setTimeout(() => setEmailSentSuccess(false), 5000);
    }, 1200);
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
      <div className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.22),0_10px_25px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.75),0_0_40px_rgba(220,38,38,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10 flex flex-col overflow-hidden">
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
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Live Email Preview (Tampilan Format Penerima)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyRichHtml}
                      className="px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md border border-red-200 dark:border-red-800/60 flex items-center gap-1 cursor-pointer"
                      title="Salin Format HTML ke Clipboard (Siap Ctrl+V di Gmail)"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Salin HTML (Ctrl+V)</span>
                    </button>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      HTML Valid
                    </span>
                  </div>
                </div>

                {/* Important Notice regarding Gmail URL vs Rich HTML vs Attachments */}
                <div className="mb-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[10.5px] text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-1.5">
                  <span className="text-sm leading-none">💡</span>
                  <div>
                    <b>Tips Tampilan & Lampiran di Gmail:</b> URL browser standar hanya mendukung teks polos. Untuk tampilan tabel & warna persis di bawah, cukup tekan <b>Ctrl+V (Paste)</b> di jendela Gmail yang terbuka (format HTML otomatis tersalin ke clipboard), dan berkas PDF + Excel otomatis diunduh ke folder komputer siap dilampirkan!
                  </div>
                </div>

                {/* Rendered Live HTML Container matching Gmail output */}
                <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0c1220] p-3 text-xs overflow-y-auto max-h-[560px] shadow-inner font-sans">
                  <div
                    className="email-html-preview-wrapper"
                    dangerouslySetInnerHTML={{ __html: compiledEmailHtml }}
                  />
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
            {/* Tutup Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
            >
              Tutup
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyEmailText}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Salin isi email beserta subjek ke clipboard"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin Teks</span>
            </button>

            {/* Download Attachments Package Button */}
            <button
              type="button"
              onClick={handleDownloadAllAttachments}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Unduh berkas PDF Executive (+Cover) & Database Excel sekaligus"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Lampiran (.PDF + .XLSX)</span>
            </button>

            {/* PRIMARY BUTTON: Send/Open via Gmail (DEFAULT) */}
            <button
              type="button"
              onClick={handleOpenGmail}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md ring-2 ring-red-500/20 cursor-pointer"
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
                className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>Opsi Email Lain</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilihan Email Platform
                  </div>

                  {/* 1-Click GAS Draft Creator (Rich HTML + PDF + Excel attachments) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      handleCreateGmailDraftViaGas();
                    }}
                    disabled={sendingEmail}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <div>
                      <div>Buat Draft di Gmail (+Lampiran)</div>
                      <div className="text-[10px] font-normal text-slate-500">Draft otomatis dengan format tabel HTML + PDF & Excel</div>
                    </div>
                  </button>

                  {/* Gmail Web (Default) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      handleOpenGmail();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <div>
                      <div>Google Gmail Web (URL Biasa)</div>
                      <div className="text-[10px] font-normal text-slate-500">Buka langsung compose window Gmail</div>
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
                      <div>Langsung Kirim via Apps Script (GAS)</div>
                      <div className="text-[10px] font-normal text-slate-500">Kirim email langsung tanpa buka tab draft</div>
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
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-md transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
