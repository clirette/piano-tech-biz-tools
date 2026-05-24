import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimate, Invoice, CompanySettings } from '../types';
import { formatCurrency } from './currency';
import { lineItemTotal, estimateTotal } from './calculations';

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
  y += 50;

  // ── Client + piano info ─────────────────────────────────────────────────────
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
  const clientLines = [
    estimate.clientName,
    estimate.clientEmail,
    estimate.clientPhone,
  ].filter(Boolean);
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
  const rows = estimate.lineItems.map(item => [
    item.lineNotes ? `${item.description}\n${item.lineNotes}` : item.description,
    item.type === 'labor' ? 'Labor' : 'Parts',
    item.quantity.toString(),
    item.hours != null ? item.hours.toString() : '—',
    formatCurrency(item.unitPriceCents),
    formatCurrency(lineItemTotal(item)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Type', 'Qty', 'Hours', 'Unit Price', 'Total']],
    body: rows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [20, 60, 160], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 55, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 75, halign: 'right' },
      5: { cellWidth: 75, halign: 'right' },
    },
    styles: { fontSize: 10, cellPadding: 6 },
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
  const clientLines = [invoice.clientName, invoice.clientEmail, invoice.clientPhone].filter(Boolean);
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
  const rows = invoice.lineItems.map(item => [
    item.lineNotes ? `${item.description}\n${item.lineNotes}` : item.description,
    item.type === 'labor' ? 'Labor' : 'Parts',
    item.quantity.toString(),
    item.hours != null ? item.hours.toString() : '—',
    formatCurrency(item.unitPriceCents),
    formatCurrency(lineItemTotal(item)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Type', 'Qty', 'Hours', 'Unit Price', 'Total']],
    body: rows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [20, 60, 160], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 55, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 75, halign: 'right' },
      5: { cellWidth: 75, halign: 'right' },
    },
    styles: { fontSize: 10, cellPadding: 6 },
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

  // Payment methods
  const { payment } = company;
  const paymentMethods: string[] = [];
  if (payment?.acceptCash) paymentMethods.push('Cash');
  if (payment?.acceptCheck) paymentMethods.push('Check');
  if (payment?.acceptOnlineCard) paymentMethods.push('Credit Card');

  if (paymentMethods.length > 0) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
    doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(30, 30, 30);
    doc.text('Payment', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal').setTextColor(60, 60, 60);
    doc.text(`Accepted: ${paymentMethods.join(', ')}`, margin, y);
    y += 14;
    if (payment.acceptCheck && payment.checkPayableTo) {
      doc.text(`Make check payable to: ${payment.checkPayableTo}`, margin, y);
      y += 14;
    }
    if (payment.acceptOnlineCard && payment.onlineCardUrl) {
      const linkLabel = payment.onlineCardName ? `Pay by Credit Card via ${payment.onlineCardName}` : 'Pay by Credit Card';
      doc.setTextColor(66, 133, 244).setFont('helvetica', 'bold');
      doc.textWithLink(linkLabel, margin, y, { url: payment.onlineCardUrl });
      y += 14;
    }
    y += 6;
  }

  if (company.googleReviewUrl && company.showGoogleReviewOnInvoices) {
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
