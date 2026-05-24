import { CompanySettings, Estimate, Invoice } from '../types';

export interface FullBackup {
  version: 1;
  type: 'full';
  exportedAt: string;
  company: CompanySettings;
  estimates: Estimate[];
  invoices: Invoice[];
}

export interface CompanyBackup {
  version: 1;
  type: 'company';
  exportedAt: string;
  company: CompanySettings;
}

export interface EstimateBackup {
  version: 1;
  type: 'estimate';
  exportedAt: string;
  estimate: Estimate;
}

export type AnyBackup = FullBackup | CompanyBackup | EstimateBackup | InvoiceBackup;

export interface InvoiceBackup {
  version: 1;
  type: 'invoice';
  exportedAt: string;
  invoice: Invoice;
}

// ── Download helpers ─────────────────────────────────────────────────────────

function downloadJson(data: AnyBackup, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugDate() {
  return new Date().toISOString().slice(0, 10);
}

export function exportFullBackup(company: CompanySettings, estimates: Estimate[], invoices: Invoice[]) {
  downloadJson(
    { version: 1, type: 'full', exportedAt: new Date().toISOString(), company, estimates, invoices },
    `piano-estimates-backup-${slugDate()}.json`,
  );
  localStorage.setItem('piano-estimate:lastBackupAt', new Date().toISOString());
}

export function exportCompanyBackup(company: CompanySettings) {
  downloadJson(
    { version: 1, type: 'company', exportedAt: new Date().toISOString(), company },
    `piano-company-settings-${slugDate()}.json`,
  );
}

export function exportEstimateBackup(estimate: Estimate) {
  const slug = estimate.clientName.replace(/\s+/g, '_') || estimate.id.slice(0, 8);
  downloadJson(
    { version: 1, type: 'estimate', exportedAt: new Date().toISOString(), estimate },
    `estimate-${slug}-${estimate.date}.json`,
  );
}

export function exportInvoiceBackup(invoice: Invoice) {
  const slug = invoice.clientName.replace(/\s+/g, '_') || invoice.id.slice(0, 8);
  downloadJson(
    { version: 1, type: 'invoice', exportedAt: new Date().toISOString(), invoice },
    `invoice-${slug}-${invoice.date}.json`,
  );
}

// ── Import helpers ───────────────────────────────────────────────────────────

export function parseBackupFile(file: File): Promise<AnyBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as AnyBackup;
        if (!data.version || !data.type) {
          reject(new Error('This file does not appear to be a valid backup.'));
        } else {
          resolve(data);
        }
      } catch {
        reject(new Error('Could not parse file. Make sure it is a valid JSON backup.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

export function daysSinceLastBackup(): number | null {
  const raw = localStorage.getItem('piano-estimate:lastBackupAt');
  if (!raw) return null;
  const ms = Date.now() - new Date(raw).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
