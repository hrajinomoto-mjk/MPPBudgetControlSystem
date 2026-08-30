import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDashboardData } from './storage';
import { getFiscalMonth, FISCAL_MONTH_LABELS, formatFiscalYearLabel } from './fiscal';

export interface ExecutiveReportPdfOptions {
  includeCover?: boolean;
  customSignee?: string;
  customSignTitle?: string;
  customNote?: string;
  docTrackingNo?: string;
}

export function buildExecutiveReportPDFDoc(
  bulan: number,
  tahun: number,
  options: ExecutiveReportPdfOptions = { includeCover: true }
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const data = getDashboardData('ALL', bulan, tahun);

  const fiscalMonth = getFiscalMonth(bulan);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(bulan);
  const fiscalYear = bulan >= 4 ? tahun : tahun - 1;
  const now = new Date();
  const docNo =
    options.docTrackingNo ||
    `HR/MPR/${tahun}/${String(bulan).padStart(2, '0')}/${Date.now()}`;

  let totalPlan = 0;
  let totalActual = 0;
  data.forEach((d) => {
    totalPlan += Number(d.plan) || 0;
    totalActual += Number(d.actual) || 0;
  });

  const gap = totalActual - totalPlan;
  const pct = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;
  const status = pct > 100 ? 'OVER CAPACITY' : pct < 90 ? 'UNDER CAPACITY' : 'KONDISI OPTIMAL';
  const statusColor: [number, number, number] =
    pct > 100 ? [225, 6, 0] : pct < 90 ? [245, 165, 36] : [15, 169, 104];

  const optimalCount = data.filter((d) => d.status === 'OPTIMAL').length;
  const overCount = data.filter((d) => d.status === 'OVER').length;
  const underCount = data.filter((d) => d.status === 'UNDER').length;

  // ==========================================
  // PAGE 1: EXCLUSIVE EXECUTIVE COVER PAGE
  // ==========================================
  if (options.includeCover) {
    // Background Frame & Geometric Accents
    doc.setFillColor(250, 251, 253);
    doc.rect(0, 0, 210, 297, 'F');

    // Left Border Luxury Accent
    doc.setFillColor(225, 6, 0); // Ajinomoto Red
    doc.rect(0, 0, 8, 297, 'F');

    doc.setFillColor(15, 23, 42); // Midnight Slate
    doc.rect(8, 0, 3, 297, 'F');

    // Top Header Banner
    doc.setFillColor(225, 6, 0);
    doc.rect(11, 0, 199, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL', 24, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Mojokerto Factory — HR Development Section • Workforce Analytics', 24, 19);

    doc.setFontSize(8);
    doc.text('OFFICIAL MANAGEMENT REPORT', 196, 12, { align: 'right' });
    doc.text(docNo, 196, 19, { align: 'right' });

    // Classification Badge
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(24, 46, 110, 8, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(225, 6, 0);
    doc.text('CONFIDENTIAL • EXECUTIVE BOARD & MANAGEMENT AUDIT', 28, 51.5);

    // Document Main Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('MANPOWER', 24, 68);
    doc.setTextColor(225, 6, 0);
    doc.text('EXECUTIVE REPORT', 24, 78);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Factory Labor Budget & Realization Comprehensive Analytics', 24, 86);

    // Period & Fiscal Badge Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(24, 96, 168, 20, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('PERIODE EVALUASI', 32, 104);
    doc.text('TAHUN FISKAL (FY)', 110, 104);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${monthLabel} ${tahun}`, 32, 112);
    doc.text(formatFiscalYearLabel(fiscalYear), 110, 112);

    // Scorecard Overview Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(24, 124, 168, 64, 4, 4, 'FD');

    doc.setFillColor(248, 250, 252);
    doc.rect(24.5, 124.5, 167, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('RINGKASAN EKSEKUTIF MANPOWER PABRIK', 32, 131);

    // 4 KPI Mini Boxes inside Cover
    const coverKpis = [
      { label: 'TOTAL BUDGET', val: totalPlan.toLocaleString() + ' MP' },
      { label: 'TOTAL ACTUAL', val: totalActual.toLocaleString() + ' MP' },
      { label: 'VARIANCE (GAP)', val: (gap > 0 ? '+' : '') + gap.toLocaleString() + ' MP', color: gap > 0 ? [225, 6, 0] : [15, 169, 104] },
      { label: 'ACHIEVEMENT', val: pct.toFixed(1) + '%', color: [15, 23, 42] },
    ];

    coverKpis.forEach((k, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const kx = 32 + col * 80;
      const ky = 140 + row * 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(k.label, kx, ky);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      if (k.color) {
        doc.setTextColor(k.color[0], k.color[1], k.color[2]);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(k.val, kx, ky + 7);
    });

    // Health Distribution Bar inside Cover
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(24, 194, 168, 12, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`STATUS: ${status} (${pct.toFixed(1)}% terhadap total budget)`, 108, 201.5, { align: 'center' });

    // Breakdown Stats
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Distribusi Departemen: ${optimalCount} Optimal  •  ${overCount} Over Capacity  •  ${underCount} Under Capacity  (Total ${data.length} Dept)`,
      108,
      213,
      { align: 'center' }
    );

    // Sign-Off & Verification Matrix Table
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(24, 222, 168, 48, 3, 3, 'FD');

    // Matrix Headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PREPARED BY', 32, 230);
    doc.text('REVIEWED BY', 88, 230);
    doc.text('APPROVED BY', 144, 230);

    // Matrix Names
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(options.customSignee || 'HR Development Team', 32, 250);
    doc.text('Operational Excellence', 88, 250);
    doc.text('Factory Management', 144, 250);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Section PIC / HR Lead', 32, 254);
    doc.text('Section Manager', 88, 254);
    doc.text('Director & Management', 144, 254);

    // Digital Seal text
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('VERIFIED DIGITAL E-SIGN', 32, 263);
    doc.text('VERIFIED DIGITAL E-SIGN', 88, 263);
    doc.text('VERIFIED DIGITAL E-SIGN', 144, 263);

    // Cover Page Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Manpower Control System (MPCS) — Integrated Cloud Edition', 24, 285);
    doc.text(`Mojokerto, ${now.toLocaleDateString('id-ID')}`, 192, 285, { align: 'right' });

    // Add New Page for the Actual Report
    doc.addPage();
  }

  // ==========================================
  // REPORT BODY: EXACT STRUCTURE AS USER PDF
  // ==========================================

  // Header Banner
  doc.setFillColor(225, 6, 0); // Ajinomoto Red
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Mojokerto Factory — HR Development Section • Workforce Analytics', 14, 17);

  doc.setFontSize(8);
  doc.text(docNo, 196, 11, { align: 'right' });
  doc.text(now.toLocaleString('id-ID'), 196, 18, { align: 'right' });

  // Title
  doc.setTextColor(16, 21, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MANPOWER EXECUTIVE REPORT', 105, 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(91, 100, 114);
  doc.text(
    `Periode: ${monthLabel} ${tahun} (${formatFiscalYearLabel(fiscalYear)}) • Total Dept: ${data.length}`,
    105,
    42,
    { align: 'center' }
  );

  // KPI Summary Boxes
  const boxY = 48;
  const boxW = 43;
  const boxH = 20;

  const kpiData = [
    { label: 'TOTAL BUDGET', val: totalPlan.toLocaleString() },
    { label: 'TOTAL ACTUAL', val: totalActual.toLocaleString() },
    {
      label: 'VARIANCE (GAP)',
      val: (gap > 0 ? '+' : '') + gap.toLocaleString(),
      highlight: true,
    },
    { label: 'ACHIEVEMENT', val: pct.toFixed(1) + '%' },
  ];

  kpiData.forEach((kpi, idx) => {
    const x = 14 + idx * (boxW + 3);
    doc.setFillColor(248, 249, 251);
    doc.setDrawColor(227, 231, 237);
    doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 160, 178);
    doc.text(kpi.label, x + boxW / 2, boxY + 6, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    if (kpi.highlight) {
      doc.setTextColor(gap > 0 ? 225 : 15, gap > 0 ? 6 : 169, gap > 0 ? 0 : 104);
    } else {
      doc.setTextColor(16, 21, 31);
    }
    doc.text(kpi.val, x + boxW / 2, boxY + 15, { align: 'center' });
  });

  // Status Banner
  const ribbonY = 72;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(14, ribbonY, 182, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `STATUS: ${status} (${pct.toFixed(1)}% terhadap total budget manpower)`,
    105,
    ribbonY + 6.5,
    { align: 'center' }
  );

  // Executive Summary Narrative
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 6, 0);
  doc.text('EXECUTIVE SUMMARY & INSIGHT', 14, 89);

  const narrativeText =
    options.customNote ||
    (pct > 100
      ? `Tingkat realisasi tenaga kerja tercatat sebesar ${pct.toFixed(
          1
        )}% terhadap rencana anggaran. Direkomendasikan kajian berkala bersama Kepala Departemen terkait untuk meninjau dinamika volume produksi dan kebutuhan jam lembur.`
      : pct < 90
      ? `Tingkat pemenuhan tenaga kerja tercatat sebesar ${pct.toFixed(
          1
        )}% terhadap rencana. Proses koordinasi pemenuhan alokasi mitra kerja terus dioptimalkan agar kapasitas operasional tetap prima.`
      : `Kondisi alokasi tenaga kerja berada dalam rentang ideal (${pct.toFixed(
          1
        )}% terhadap rencana), menunjukkan keselarasan yang baik antara perencanaan dan kebutuhan operasional pabrik.`);

  doc.setFillColor(248, 249, 251);
  doc.roundedRect(14, 92, 182, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(58, 66, 80);
  doc.text(doc.splitTextToSize(narrativeText, 174), 18, 97);

  // Table Details
  const tableRows = data.map((d) => [
    d.deptName,
    String(d.plan),
    String(d.actual),
    (d.gap > 0 ? '+' : '') + String(d.gap),
    d.achievement.toFixed(1) + '%',
    d.status,
    d.remarks || '-',
  ]);

  autoTable(doc, {
    startY: 111,
    head: [['Departemen', 'Budget', 'Actual', 'Selisih', 'Achv %', 'Status', 'Catatan / Remarks']],
    body: tableRows,
    theme: 'grid',
    showHead: 'everyPage',
    margin: { top: 28, left: 14, right: 14, bottom: 20 },
    headStyles: {
      fillColor: [225, 6, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 42 },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'left', cellWidth: 'auto', fontSize: 7 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },
    didDrawPage: (dataHook) => {
      // Header for continuation pages
      if (dataHook.pageNumber > (options.includeCover ? 2 : 1)) {
        doc.setFillColor(225, 6, 0);
        doc.rect(0, 0, 210, 16, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('PT AJINOMOTO INDONESIA - MANPOWER EXECUTIVE REPORT', 14, 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`Periode: ${monthLabel} ${tahun} • Halaman ${dataHook.pageNumber}`, 196, 10, { align: 'right' });
      }
    },
  });

  // Footer & Signature on Final Page
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 250;

  // If table ended near bottom, add a clean section or place neatly
  const renderY = finalY > 260 ? 255 : finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 160, 178);
  doc.text('Generated automatically by Manpower Control System (MPCS)', 14, renderY + 8);
  doc.text('Verified Digital Report — E-Signed', 14, renderY + 13);

  doc.setTextColor(16, 21, 31);
  doc.text(`Mojokerto, ${now.toLocaleDateString('id-ID')}`, 196, renderY + 4, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(options.customSignee || 'HR Development Team', 196, renderY + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory', 196, renderY + 14, {
    align: 'right',
  });

  return doc;
}

export function generateExecutiveReportPDF(
  bulan: number,
  tahun: number,
  options: ExecutiveReportPdfOptions = { includeCover: true }
): void {
  const doc = buildExecutiveReportPDFDoc(bulan, tahun, options);
  doc.save(`Manpower_Executive_Report_${bulan}_${tahun}.pdf`);
}

export function getExecutiveReportPDFBase64(
  bulan: number,
  tahun: number,
  options: ExecutiveReportPdfOptions = { includeCover: true }
): string {
  const doc = buildExecutiveReportPDFDoc(bulan, tahun, options);
  const dataUri = doc.output('datauristring');
  // Strip 'data:application/pdf;filename=generated.pdf;base64,' prefix
  return dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
}

export function buildUserDepartmentReportPDFDoc(
  deptId: string,
  bulan: number,
  tahun: number,
  onError?: (msg: string) => void
): jsPDF | null {
  const doc = new jsPDF('p', 'mm', 'a4');
  const data = getDashboardData(deptId, bulan, tahun);

  if (data.length === 0) {
    if (onError) {
      onError('Tidak ada data untuk periode departemen ini.');
    }
    return null;
  }

  const d = data[0];
  const fiscalMonth = getFiscalMonth(bulan);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(bulan);
  const fiscalYear = bulan >= 4 ? tahun : tahun - 1;

  // Header
  doc.setFillColor(225, 6, 0);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PT AJINOMOTO INDONESIA - PT AJINEX INTERNATIONAL', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Mojokerto Factory — Departemen ${d.deptName}`, 14, 17);

  const now = new Date();
  const docNo = `HR/UMR/${tahun}/${String(bulan).padStart(2, '0')}/${Date.now()}`;
  doc.setFontSize(8);
  doc.text(docNo, 196, 11, { align: 'right' });
  doc.text(now.toLocaleString('id-ID'), 196, 18, { align: 'right' });

  // Title
  doc.setTextColor(16, 21, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MANPOWER DEPARTMENT REPORT', 105, 38, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(91, 100, 114);
  doc.text(`${monthLabel} ${tahun} • Fiscal Year ${fiscalYear} • ${d.deptName} (${d.deptId})`, 105, 45, {
    align: 'center',
  });

  // KPI boxes
  const boxY = 52;
  const boxW = 43;
  const boxH = 20;

  const kpiData = [
    { label: 'BUDGET PLAN', val: d.plan.toLocaleString() },
    { label: 'ACTUAL REALISASI', val: d.actual.toLocaleString() },
    { label: 'SELISIH (GAP)', val: (d.gap > 0 ? '+' : '') + d.gap.toLocaleString(), highlight: true },
    { label: 'ACHIEVEMENT', val: d.achievement.toFixed(1) + '%' },
  ];

  kpiData.forEach((kpi, idx) => {
    const x = 14 + idx * (boxW + 3);
    doc.setFillColor(248, 249, 251);
    doc.setDrawColor(227, 231, 237);
    doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 160, 178);
    doc.text(kpi.label, x + boxW / 2, boxY + 6, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    if (kpi.highlight) {
      doc.setTextColor(d.gap > 0 ? 225 : 15, d.gap > 0 ? 6 : 169, d.gap > 0 ? 0 : 104);
    } else {
      doc.setTextColor(16, 21, 31);
    }
    doc.text(kpi.val, x + boxW / 2, boxY + 15, { align: 'center' });
  });

  // Breakdown Table
  const rwDiff = d.actualRW - d.planRW;
  const osDiff = d.actualOS - d.planOS;

  autoTable(doc, {
    startY: 78,
    head: [['Kategori Tenaga Kerja', 'Budget Plan', 'Realisasi Actual', 'Selisih Variance']],
    body: [
      ['Regular Worker (RW)', String(d.planRW), String(d.actualRW), (rwDiff > 0 ? '+' : '') + String(rwDiff)],
      ['Outsource (OS)', String(d.planOS), String(d.actualOS), (osDiff > 0 ? '+' : '') + String(osDiff)],
      ['TOTAL MANPOWER', String(d.plan), String(d.actual), (d.gap > 0 ? '+' : '') + String(d.gap)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [225, 6, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
    },
  });

  // Remarks Section
  const tableEnd = (doc as any).lastAutoTable?.finalY || 130;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 6, 0);
  doc.text('CATATAN & JUSTIFIKASI REALISASI', 14, tableEnd + 12);

  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(227, 231, 237);
  doc.roundedRect(14, tableEnd + 15, 182, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(58, 66, 80);
  const remarkText = d.remarks || 'Tidak ada catatan khusus pada periode ini.';
  doc.text(doc.splitTextToSize(remarkText, 174), 18, tableEnd + 23);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 160, 178);
  doc.text('Generated by Manpower Control System (MPCS)', 14, tableEnd + 55);
  doc.text(`Mojokerto, ${now.toLocaleDateString('id-ID')}`, 196, tableEnd + 55, { align: 'right' });

  return doc;
}

export function generateUserDepartmentReportPDF(
  deptId: string,
  bulan: number,
  tahun: number,
  onError?: (msg: string) => void
): boolean {
  const doc = buildUserDepartmentReportPDFDoc(deptId, bulan, tahun, onError);
  if (!doc) return false;
  doc.save(`Manpower_Report_${deptId}_${bulan}_${tahun}.pdf`);
  return true;
}

export function getUserDepartmentReportPDFBase64(
  deptId: string,
  bulan: number,
  tahun: number,
  onError?: (msg: string) => void
): string | null {
  const doc = buildUserDepartmentReportPDFDoc(deptId, bulan, tahun, onError);
  if (!doc) return null;
  const dataUri = doc.output('datauristring');
  return dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
}

