import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDashboardData } from './storage';
import { getFiscalMonth, FISCAL_MONTH_LABELS, formatFiscalYearLabel } from './fiscal';

export function generateExecutiveReportPDF(bulan: number, tahun: number): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const data = getDashboardData('ALL', bulan, tahun);

  const fiscalMonth = getFiscalMonth(bulan);
  const monthLabel = FISCAL_MONTH_LABELS[fiscalMonth] || String(bulan);
  const fiscalYear = bulan >= 4 ? tahun : tahun - 1;

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

  const now = new Date();
  const docNo = `HR/MPR/${tahun}/${String(bulan).padStart(2, '0')}/${Date.now()}`;
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
  doc.text(`Periode: ${monthLabel} ${tahun} (${formatFiscalYearLabel(fiscalYear)}) • Total Dept: ${data.length}`, 105, 42, { align: 'center' });

  // KPI Summary Boxes
  const boxY = 48;
  const boxW = 43;
  const boxH = 20;

  const kpiData = [
    { label: 'TOTAL BUDGET', val: totalPlan.toLocaleString() },
    { label: 'TOTAL ACTUAL', val: totalActual.toLocaleString() },
    { label: 'VARIANCE (GAP)', val: (gap > 0 ? '+' : '') + gap.toLocaleString(), highlight: true },
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
  doc.text(`STATUS: ${status} (${pct.toFixed(1)}% terhadap total budget manpower)`, 105, ribbonY + 6.5, { align: 'center' });

  // Executive Summary Narrative
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 6, 0);
  doc.text('EXECUTIVE SUMMARY & INSIGHT', 14, 89);

  const narrativeText =
    pct > 100
      ? `Secara keseluruhan tercatat kelebihan manpower (over capacity) dengan pencapaian ${pct.toFixed(
          1
        )}% dari budget yang direncanakan. Diperlukan evaluasi alokasi tenaga kerja Outsource pada departemen produksi terkait.`
      : pct < 90
      ? `Secara keseluruhan manpower berada di bawah budget dengan pencapaian ${pct.toFixed(
          1
        )}%. Kondisi ini berpotensi menimbulkan beban kerja berlebih (overload) dan perlu dipantau oleh tim HR.`
      : `Secara keseluruhan kondisi manpower berada dalam rentang optimal dengan pencapaian ${pct.toFixed(
          1
        )}% terhadap budget, menunjukkan perencanaan dan realisasi tenaga kerja berjalan sesuai target pabrik.`;

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
    headStyles: {
      fillColor: [225, 6, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'left', cellWidth: 'auto', fontSize: 7 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },
  });

  // Footer & Signature
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 250;

  if (finalY < 265) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 160, 178);
    doc.text('Generated automatically by Manpower Control System (MPCS)', 14, finalY + 8);
    doc.text('Verified Digital Report — E-Signed', 14, finalY + 13);

    doc.setTextColor(16, 21, 31);
    doc.text(`Mojokerto, ${now.toLocaleDateString('id-ID')}`, 196, finalY + 4, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('HR Development Team', 196, finalY + 9, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('PT Ajinomoto Indonesia - PT Ajinex International, Mojokerto Factory', 196, finalY + 14, { align: 'right' });
  }

  doc.save(`Manpower_Executive_Report_${bulan}_${tahun}.pdf`);
}

export function generateUserDepartmentReportPDF(
  deptId: string,
  bulan: number,
  tahun: number,
  onError?: (msg: string) => void
): boolean {
  const doc = new jsPDF('p', 'mm', 'a4');
  const data = getDashboardData(deptId, bulan, tahun);

  if (data.length === 0) {
    if (onError) {
      onError('Tidak ada data untuk periode departemen ini.');
    }
    return false;
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

  doc.save(`Manpower_Report_${deptId}_${bulan}_${tahun}.pdf`);
  return true;
}
