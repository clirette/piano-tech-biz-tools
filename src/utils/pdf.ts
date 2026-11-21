import jsPDF from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';
import {
  Estimate,
  Invoice,
  CompanySettings,
  LineItem,
  OnlinePaymentMethod,
  PaymentSettings,
} from '../types';
import { formatCurrency } from './currency';
import { lineItemTotal, estimateTotal } from './calculations';
import { expirationDate, validityStatement } from './expiration';
import { qrMatrix } from './qr';
import {
  acceptedPaymentLabels,
  invoiceOnlineMethods,
  methodShowsQr,
  payLinkLabel,
} from './payment';
import { clientDetailLines } from './client';

const LINE_ITEM_FONT_SIZE = 10;
const LINE_ITEM_CELL_PADDING = 6;
/** Fixed widths for every column after Description, which takes the remainder */
const LINE_ITEM_FIXED_WIDTHS = { type: 55, qty: 35, hours: 45, unitPrice: 75, total: 75 };
/** Printed edge length of the scan-to-pay QR, in points. */
const PAYMENT_QR_SIZE = 72;
/** Scan-to-pay QRs per row before wrapping, and the space between them. */
const PAYMENT_QR_MAX_COLS = 3;
const PAYMENT_QR_GAP = 12;
/** Modules of white margin the QR spec requires around the symbol. */
const QR_QUIET_ZONE = 4;

export function generateEstimatePdf(estimate: Estimate, company: CompanySettings): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // ── Company header ──────────────────────────────────────────────────────────
  if (company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', margin, y, 80, 80);
      y += 8;
      addCompanyText(doc, company, margin + 92, y, pageWidth, margin);
    } catch {
      addCompanyText(doc, company, margin, y, pageWidth, margin);
    }
    y += 72;
  } else {
    addCompanyText(doc, company, margin, y, pageWidth, margin);
    y += 56;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // ── Estimate title + meta ───────────────────────────────────────────────────
  doc.setFontSize(20).setFont('helvetica', 'bold').setTextColor(20, 60, 160);
  doc.text('ESTIMATE', margin, y);
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(80, 80, 80);
  const estimateNum = estimate.estimateNumber || estimate.id.slice(0, 8).toUpperCase();
  doc.text(`#${estimateNum}`, margin, y + 16);
  doc.text(`Date: ${formatDate(estimate.date)}`, margin, y + 30);
  const expiresOn = expirationDate(estimate.date, estimate.validDays);
  if (expiresOn) {
    doc.text(`Valid Until: ${formatDate(expiresOn)}`, margin, y + 44);
  }
  y += expiresOn ? 64 : 50;

  // ── Client + piano info ─────────────────────────────────────────────────────
  doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(30, 30, 30);
  const pianoX = pageWidth / 2;
  doc.text('Piano', pianoX, y);
  y += 4;
  doc.setDrawColor(100, 120, 200);
  doc.line(pianoX, y, pianoX + 130, y);
  y += 14;

  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(50, 50, 50);
  const clientLines = [estimate.clientName, ...clientDetailLines(estimate)].filter(Boolean);
  clientLines.forEach(line => { doc.text(line, margin, y); y += 14; });

  let pianoY = y - clientLines.length * 14;
  const pianoLines = [
    estimate.pianoMake && estimate.pianoModel
      ? `${estimate.pianoMake} ${estimate.pianoModel}`.trim()
      : estimate.pianoMake || estimate.pianoModel,
    estimate.pianoSerial ? `S/N: ${estimate.pianoSerial}` : '',
    estimate.pianoLocation,
  ].filter(Boolean);
  pianoLines.forEach(line => { doc.text(line, pianoX, pianoY); pianoY += 14; });

  y = Math.max(y, pianoY) + 16;

  // ── Line items table ────────────────────────────────────────────────────────
  const descWidth = descriptionColumnWidth(pageWidth, margin);
  const { rows, boldLineCounts } = buildLineItemRows(doc, estimate.lineItems, descWidth);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Type', 'Qty', 'Hours', 'Unit Price', 'Total']],
    body: rows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [20, 60, 160], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: descWidth },
      1: { cellWidth: LINE_ITEM_FIXED_WIDTHS.type, halign: 'center' },
      2: { cellWidth: LINE_ITEM_FIXED_WIDTHS.qty, halign: 'center' },
      3: { cellWidth: LINE_ITEM_FIXED_WIDTHS.hours, halign: 'center' },
      4: { cellWidth: LINE_ITEM_FIXED_WIDTHS.unitPrice, halign: 'right' },
      5: { cellWidth: LINE_ITEM_FIXED_WIDTHS.total, halign: 'right' },
    },
    styles: { fontSize: LINE_ITEM_FONT_SIZE, cellPadding: LINE_ITEM_CELL_PADDING },
    ...descriptionCellHooks(doc, boldLineCounts),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Total ───────────────────────────────────────────────────────────────────
  const total = formatCurrency(estimateTotal(estimate));
  doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(20, 60, 160);
  doc.text(`Total: ${total}`, pageWidth - margin, y, { align: 'right' });
  y += 24;

  // ── Notes ───────────────────────────────────────────────────────────────────
  if (estimate.notes) {
    doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(30, 30, 30);
    doc.text('Notes', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal').setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(estimate.notes, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 16;
  }

  // ── Validity ────────────────────────────────────────────────────────────────
  if (expiresOn && estimate.validDays != null) {
    doc.setFontSize(10).setFont('helvetica', 'italic').setTextColor(110, 110, 110);
    const lines = doc.splitTextToSize(
      validityStatement(estimate.validDays, formatDate(expiresOn)),
      pageWidth - margin * 2,
    );
    doc.text(lines, margin, y);
    doc.setFont('helvetica', 'normal');
    y += lines.length * 14 + 10;
  }

  // ── Google review prompt ────────────────────────────────────────────────────
  if (company.googleReviewUrl && company.showGoogleReviewOnEstimates) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(80, 80, 80);
    const prefix = "We'd love your feedback — ";
    const linkText = 'Click Here to Leave a Google Review';
    const prefixWidth = doc.getTextWidth(prefix);
    const startX = (pageWidth - doc.getTextWidth(prefix + linkText)) / 2;
    doc.text(prefix, startX, y);
    doc.setFont('helvetica', 'bold').setTextColor(66, 133, 244);
    doc.textWithLink(linkText, startX + prefixWidth, y, { url: company.googleReviewUrl });
  }

  const clientSlug = estimate.clientName.replace(/\s+/g, '_') || 'estimate';
  doc.save(`estimate_${clientSlug}_${estimate.date}.pdf`);
}

export function generateInvoicePdf(invoice: Invoice, company: CompanySettings): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  if (company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', margin, y, 80, 80);
      y += 8;
      addCompanyText(doc, company, margin + 92, y, pageWidth, margin);
    } catch {
      addCompanyText(doc, company, margin, y, pageWidth, margin);
    }
    y += 72;
  } else {
    addCompanyText(doc, company, margin, y, pageWidth, margin);
    y += 56;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Invoice title + meta
  doc.setFontSize(20).setFont('helvetica', 'bold').setTextColor(20, 60, 160);
  doc.text('INVOICE', margin, y);
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(80, 80, 80);
  const invoiceNum = invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase();
  doc.text(`#${invoiceNum}`, margin, y + 16);
  doc.text(`Date: ${formatDate(invoice.date)}`, margin, y + 30);
  if (invoice.dueDate) {
    doc.text(`Due: ${formatDate(invoice.dueDate)}`, margin, y + 44);
  }
  y += invoice.dueDate ? 64 : 50;

  // Client + piano info
  doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(30, 30, 30);
  doc.text('Bill To', margin, y);
  const pianoX = pageWidth / 2;
  doc.text('Piano', pianoX, y);
  y += 4;
  doc.setDrawColor(100, 120, 200);
  doc.line(margin, y, margin + 130, y);
  doc.line(pianoX, y, pianoX + 130, y);
  y += 14;

  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(50, 50, 50);
  const clientLines = [invoice.clientName, ...clientDetailLines(invoice)].filter(Boolean);
  clientLines.forEach(line => { doc.text(line, margin, y); y += 14; });

  let pianoY = y - clientLines.length * 14;
  const pianoLines = [
    invoice.pianoMake && invoice.pianoModel
      ? `${invoice.pianoMake} ${invoice.pianoModel}`.trim()
      : invoice.pianoMake || invoice.pianoModel,
    invoice.pianoSerial ? `S/N: ${invoice.pianoSerial}` : '',
    invoice.pianoLocation,
  ].filter(Boolean);
  pianoLines.forEach(line => { doc.text(line, pianoX, pianoY); pianoY += 14; });

  y = Math.max(y, pianoY) + 16;

  // Line items table
  const descWidth = descriptionColumnWidth(pageWidth, margin);
  const { rows, boldLineCounts } = buildLineItemRows(doc, invoice.lineItems, descWidth);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Type', 'Qty', 'Hours', 'Unit Price', 'Total']],
    body: rows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [20, 60, 160], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: descWidth },
      1: { cellWidth: LINE_ITEM_FIXED_WIDTHS.type, halign: 'center' },
      2: { cellWidth: LINE_ITEM_FIXED_WIDTHS.qty, halign: 'center' },
      3: { cellWidth: LINE_ITEM_FIXED_WIDTHS.hours, halign: 'center' },
      4: { cellWidth: LINE_ITEM_FIXED_WIDTHS.unitPrice, halign: 'right' },
      5: { cellWidth: LINE_ITEM_FIXED_WIDTHS.total, halign: 'right' },
    },
    styles: { fontSize: LINE_ITEM_FONT_SIZE, cellPadding: LINE_ITEM_CELL_PADDING },
    ...descriptionCellHooks(doc, boldLineCounts),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  const total = formatCurrency(estimateTotal(invoice));
  doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(20, 60, 160);
  doc.text(`Total: ${total}`, pageWidth - margin, y, { align: 'right' });
  y += 24;

  if (invoice.notes) {
    doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(30, 30, 30);
    doc.text('Notes', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal').setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 16;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  y = drawPaymentBlock(doc, company.payment, y, pageWidth, pageHeight, margin);

  if (company.googleReviewUrl && company.showGoogleReviewOnInvoices) {
    if (y + 20 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(80, 80, 80);
    const prefix = "We'd love your feedback — ";
    const linkText = 'Click Here to Leave a Google Review';
    const prefixWidth = doc.getTextWidth(prefix);
    const startX = (pageWidth - doc.getTextWidth(prefix + linkText)) / 2;
    doc.text(prefix, startX, y);
    doc.setFont('helvetica', 'bold').setTextColor(66, 133, 244);
    doc.textWithLink(linkText, startX + prefixWidth, y, { url: company.googleReviewUrl });
  }

  const clientSlug = invoice.clientName.replace(/\s+/g, '_') || 'invoice';
  doc.save(`invoice_${clientSlug}_${invoice.date}.pdf`);
}

type PaymentLine =
  | { kind: 'text'; text: string; bold?: boolean; gapBefore?: number }
  | { kind: 'link'; text: string; url: string; gapBefore?: number };

/**
 * Draws the invoice's Payment section and returns the new `y`. The on-screen
 * twin is the Payment block in `InvoicePreviewPage.tsx`; both read the same
 * helpers from `utils/payment.ts`.
 *
 * Text runs down the left; scan-to-pay QRs sit in a grid on the right, aligned
 * with the top of the block, so a QR usually costs no extra height. The block
 * is measured before drawing and moved to a fresh page if it would run off the
 * bottom — with several methods and wrapped instructions it can get tall.
 */
function drawPaymentBlock(
  doc: jsPDF,
  payment: PaymentSettings | undefined,
  y: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
): number {
  const accepted = acceptedPaymentLabels(payment);
  if (!payment || accepted.length === 0) return y;

  const methods = invoiceOnlineMethods(payment);
  const qrs = methods
    .filter(methodShowsQr)
    .map(m => ({ method: m, matrix: qrMatrix(m.url!) }))
    .filter((q): q is { method: OnlinePaymentMethod; matrix: boolean[][] } => q.matrix !== null);

  const cols = Math.min(qrs.length, PAYMENT_QR_MAX_COLS);
  const rows = cols ? Math.ceil(qrs.length / cols) : 0;
  const qrCellHeight = PAYMENT_QR_SIZE + 14; // symbol + caption
  const qrGridWidth = cols ? cols * PAYMENT_QR_SIZE + (cols - 1) * PAYMENT_QR_GAP : 0;
  const qrGridHeight = rows ? rows * qrCellHeight + (rows - 1) * PAYMENT_QR_GAP : 0;
  const textWidth = pageWidth - margin * 2 - (cols ? qrGridWidth + 16 : 0);

  // Pre-wrap every line in the font it will be drawn in, so the height is
  // known before anything is drawn.
  const lines: PaymentLine[] = [];
  const wrap = (text: string, bold: boolean): string[] => {
    doc.setFontSize(10).setFont('helvetica', bold ? 'bold' : 'normal');
    return doc.splitTextToSize(text, textWidth);
  };
  wrap(`Accepted: ${accepted.join(', ')}`, false).forEach(t => lines.push({ kind: 'text', text: t }));
  if (payment.acceptCheck && payment.checkPayableTo) {
    wrap(`Make check payable to: ${payment.checkPayableTo}`, false).forEach(t =>
      lines.push({ kind: 'text', text: t }),
    );
  }
  for (const m of methods) {
    const head: PaymentLine[] = m.url
      ? wrap(payLinkLabel(m), true).map(t => ({ kind: 'link' as const, text: t, url: m.url! }))
      : wrap(m.name, true).map(t => ({ kind: 'text' as const, text: t, bold: true }));
    head[0].gapBefore = 4;
    lines.push(...head);
    if (m.instructions) {
      wrap(m.instructions, false).forEach(t => lines.push({ kind: 'text', text: t }));
    }
  }
  const textHeight = lines.reduce((h, l) => h + 14 + (l.gapBefore ?? 0), 0);

  // separator (14) + heading (14) + body + trailing space (6)
  const blockHeight = 14 + 14 + Math.max(textHeight, qrGridHeight) + 6;
  if (y + blockHeight > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  const blockTop = y;

  doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(30, 30, 30);
  doc.text('Payment', margin, y);
  y += 14;

  for (const line of lines) {
    y += line.gapBefore ?? 0;
    if (line.kind === 'link') {
      doc.setFont('helvetica', 'bold').setTextColor(66, 133, 244);
      doc.textWithLink(line.text, margin, y, { url: line.url });
    } else if (line.bold) {
      doc.setFont('helvetica', 'bold').setTextColor(30, 30, 30);
      doc.text(line.text, margin, y);
    } else {
      doc.setFont('helvetica', 'normal').setTextColor(60, 60, 60);
      doc.text(line.text, margin, y);
    }
    y += 14;
  }

  if (cols) {
    const gridLeft = pageWidth - margin - qrGridWidth;
    qrs.forEach(({ method, matrix }, i) => {
      const qrX = gridLeft + (i % cols) * (PAYMENT_QR_SIZE + PAYMENT_QR_GAP);
      const qrY = blockTop + Math.floor(i / cols) * (qrCellHeight + PAYMENT_QR_GAP);
      drawQrMatrix(doc, matrix, qrX, qrY, PAYMENT_QR_SIZE);
      doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(140, 140, 140);
      const caption = qrs.length === 1 ? 'Scan to pay' : method.name;
      const fitted: string = doc.splitTextToSize(caption, PAYMENT_QR_SIZE)[0] ?? '';
      doc.text(fitted, qrX + PAYMENT_QR_SIZE / 2, qrY + PAYMENT_QR_SIZE + 9, { align: 'center' });
    });
    doc.setFontSize(10);
    y = Math.max(y, blockTop + qrGridHeight);
  }

  return y + 6;
}

/**
 * Paints a QR module matrix as filled rects, merging each row's consecutive dark
 * modules into a single rect. Mirrors `components/QrCode.tsx` so the PDF and the
 * on-screen preview draw the same symbol from the same `qrMatrix` output.
 */
function drawQrMatrix(
  doc: jsPDF,
  matrix: boolean[][],
  x: number,
  y: number,
  size: number,
): void {
  const count = matrix.length;
  const extent = count + QR_QUIET_ZONE * 2;
  const module = size / extent;

  // White ground, so the quiet zone reads as quiet even over a tinted page.
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');

  doc.setFillColor(0, 0, 0);
  matrix.forEach((row, r) => {
    let runStart = -1;
    for (let c = 0; c <= count; c++) {
      const dark = c < count && row[c];
      if (dark && runStart === -1) runStart = c;
      if (!dark && runStart !== -1) {
        doc.rect(
          x + (runStart + QR_QUIET_ZONE) * module,
          y + (r + QR_QUIET_ZONE) * module,
          (c - runStart) * module,
          module,
          'F',
        );
        runStart = -1;
      }
    }
  });
}

function descriptionColumnWidth(pageWidth: number, margin: number): number {
  const fixed = Object.values(LINE_ITEM_FIXED_WIDTHS).reduce((sum, w) => sum + w, 0);
  return pageWidth - margin * 2 - fixed;
}

/**
 * Builds the line item rows, pre-wrapping the description column so the item
 * description can be drawn bold while its line notes stay in the regular weight.
 * Also returns how many wrapped lines of each cell belong to the description.
 */
function buildLineItemRows(doc: jsPDF, items: LineItem[], descWidth: number) {
  const textWidth = descWidth - LINE_ITEM_CELL_PADDING * 2;
  const boldLineCounts: number[] = [];
  doc.setFontSize(LINE_ITEM_FONT_SIZE);

  const rows = items.map(item => {
    // Wrap each part in the font it will actually be drawn in, so autoTable has
    // no wrapping left to do and the wider bold lines cannot overflow the cell.
    doc.setFont('helvetica', 'bold');
    const descLines: string[] = doc.splitTextToSize(item.description, textWidth);
    doc.setFont('helvetica', 'normal');
    const noteLines: string[] = item.lineNotes
      ? doc.splitTextToSize(item.lineNotes, textWidth)
      : [];
    boldLineCounts.push(descLines.length);

    return [
      [...descLines, ...noteLines].join('\n'),
      item.type === 'labor' ? 'Labor' : 'Parts',
      item.quantity.toString(),
      item.hours != null ? item.hours.toString() : '—',
      formatCurrency(item.unitPriceCents),
      formatCurrency(lineItemTotal(item)),
    ];
  });

  return { rows, boldLineCounts };
}

/**
 * autoTable applies a single font style per cell, so the description cell is
 * drawn by hand: blanked before the default render, then re-drawn line by line
 * with the description bold and the line notes in the regular weight.
 */
function descriptionCellHooks(doc: jsPDF, boldLineCounts: number[]) {
  let lines: string[] = [];

  return {
    willDrawCell: (data: CellHookData) => {
      if (data.section !== 'body' || data.column.index !== 0) return;
      lines = data.cell.text;
      data.cell.text = [];
    },
    didDrawCell: (data: CellHookData) => {
      if (data.section !== 'body' || data.column.index !== 0) return;
      const boldCount = boldLineCounts[data.row.index] ?? lines.length;
      const fontSize = data.cell.styles.fontSize;
      const x = data.cell.x + data.cell.padding('left');
      // Mirrors autoTable's own top-aligned baseline placement
      let lineY = data.cell.y + data.cell.padding('top') + fontSize * 0.85;
      lines.forEach((line, i) => {
        doc.setFont('helvetica', i < boldCount ? 'bold' : 'normal');
        doc.text(line, x, lineY);
        lineY += fontSize * doc.getLineHeightFactor();
      });
      doc.setFont('helvetica', 'normal');
    },
  };
}

function addCompanyText(  doc: jsPDF,
  company: CompanySettings,
  x: number,
  y: number,
  pageWidth: number,
  margin: number,
) {
  if (company.name) {
    doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(20, 60, 160);
    doc.text(company.name, x, y + 14);
  }
  if (company.slogan) {
    doc.setFontSize(10).setFont('helvetica', 'italic').setTextColor(120, 120, 120);
    doc.text(company.slogan, x, y + 28);
  }
  const detailStartY = company.slogan ? y + 28 : y + 14;
  const details = [company.address, company.phone, company.email, company.website].filter(Boolean);
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(80, 80, 80);
  details.forEach((line, i) => doc.text(line, pageWidth - margin, detailStartY + i * 13, { align: 'right' }));
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${month}/${day}/${year}`;
}
