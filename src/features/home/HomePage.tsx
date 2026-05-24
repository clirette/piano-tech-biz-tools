import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimates } from '../../hooks/useEstimates';
import { useInvoices } from '../../hooks/useInvoices';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Button } from '../../components/Button';
import { ImportButton } from '../../components/ImportButton';
import {
  exportFullBackup,
  daysSinceLastBackup,
  AnyBackup,
  FullBackup,
  EstimateBackup,
  InvoiceBackup,
} from '../../utils/backup';
import { generateId } from '../../utils/generateId';

export function HomePage() {
  const navigate = useNavigate();
  const { estimates, setEstimates } = useEstimates();
  const { invoices, setInvoices } = useInvoices();
  const { settings: company, setSettings: setCompany } = useCompanySettings();
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');
  const [backupDays, setBackupDays] = useState<number | null>(null);

  useEffect(() => {
    setBackupDays(daysSinceLastBackup());
  }, []);

  function handleImport(backup: AnyBackup) {
    setImportError('');
    setImportMsg('');
    if (backup.type === 'full') {
      const b = backup as FullBackup;
      if (!confirm(`This will replace ALL your estimates (${b.estimates.length}), invoices (${b.invoices?.length ?? 0}), and company settings. Are you sure?`)) return;
      setCompany(b.company);
      setEstimates(b.estimates);
      if (b.invoices) setInvoices(b.invoices);
      setImportMsg(`✓ Restored ${b.estimates.length} estimate${b.estimates.length !== 1 ? 's' : ''}, ${b.invoices?.length ?? 0} invoice${(b.invoices?.length ?? 0) !== 1 ? 's' : ''}, and company settings.`);
    } else if (backup.type === 'estimate') {
      const imported = { ...(backup as EstimateBackup).estimate, id: generateId() };
      setEstimates(prev => [imported, ...prev]);
      setImportMsg(`✓ Estimate for "${imported.clientName || 'unknown client'}" added to Estimates.`);
    } else if (backup.type === 'invoice') {
      const imported = { ...(backup as InvoiceBackup).invoice, id: generateId() };
      setInvoices(prev => [imported, ...prev]);
      setImportMsg(`✓ Invoice for "${imported.clientName || 'unknown client'}" added to Invoices.`);
    } else if (backup.type === 'company') {
      if (!confirm('This will replace your current company settings. Continue?')) return;
      setCompany((backup as { company: typeof company }).company);
      setImportMsg('✓ Company settings restored.');
    }
    setTimeout(() => setImportMsg(''), 6000);
  }

  const draftEstimates = estimates.filter(e => e.status === 'draft').length;
  const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
  const draftInvoices = invoices.filter(i => i.status === 'draft').length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-6">
        <p className="text-4xl mb-3">🎹</p>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Piano Tech Biz Tools</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          A simple, offline-friendly toolkit for piano technicians — build estimates, send
          invoices, and keep your business paperwork organized.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Estimates"
          value={estimates.length}
          sub={draftEstimates > 0 ? `${draftEstimates} draft${draftEstimates !== 1 ? 's' : ''}` : undefined}
          onClick={() => navigate('/estimates')}
        />
        <StatCard
          label="Total Invoices"
          value={invoices.length}
          sub={
            unpaidInvoices > 0
              ? `${unpaidInvoices} unpaid`
              : draftInvoices > 0
              ? `${draftInvoices} draft${draftInvoices !== 1 ? 's' : ''}`
              : undefined
          }
          warnSub={unpaidInvoices > 0}
          onClick={() => navigate('/invoices')}
        />
        <StatCard
          label="Last Backup"
          value={backupDays === null ? 'Never' : backupDays === 0 ? 'Today' : `${backupDays}d ago`}
          sub={backupDays === null || backupDays >= 7 ? '⚠️ Overdue' : undefined}
          warnSub={backupDays === null || backupDays >= 7}
        />
        <StatCard
          label="Company"
          value={company.name || 'Not set'}
          onClick={() => navigate('/settings')}
        />
      </div>

      {/* Feature cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <FeatureCard
          emoji="📋"
          title="Estimates"
          description="Build itemized service estimates for clients. Track labor and parts, add notes per line item, and generate a professional PDF or printable preview to share."
          action="Go to Estimates"
          onClick={() => navigate('/estimates')}
        />
        <FeatureCard
          emoji="🧾"
          title="Invoices"
          description="Turn estimates into invoices with one click. Set due dates, track payment status (draft, sent, paid, overdue), and display accepted payment methods on the invoice."
          action="Go to Invoices"
          onClick={() => navigate('/invoices')}
        />
        <FeatureCard
          emoji="⚙️"
          title="Company Settings"
          description="Add your business name, logo, slogan, phone, email, Google review link, and invoice payment methods. These appear automatically on all your documents."
          action="Open Settings"
          onClick={() => navigate('/settings')}
        />
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Backup &amp; Restore</h2>
        <p className="text-sm text-slate-500 mb-4">
          Your data is saved in this browser only — it is never sent to a server. Export a
          backup regularly so you never lose your work. A full backup includes all estimates,
          invoices, and company settings in a single JSON file.
        </p>

        {(backupDays === null || backupDays >= 7) && estimates.length + invoices.length > 0 && (
          <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2">
            {backupDays === null
              ? '⚠️ You have never exported a backup. Export one now to protect your data.'
              : `⚠️ Your last backup was ${backupDays} day${backupDays !== 1 ? 's' : ''} ago. Consider exporting a fresh one.`}
          </div>
        )}

        {importMsg && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            {importMsg}
          </p>
        )}
        {importError && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {importError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { exportFullBackup(company, estimates, invoices); setBackupDays(0); }}>
            ⬇ Export Full Backup
          </Button>
          <ImportButton label="⬆ Import Backup" onImport={handleImport} />
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Import accepts any backup file — full backup, single estimate, single invoice, or company-settings-only export.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  warnSub?: boolean;
  onClick?: () => void;
}

function StatCard({ label, value, sub, warnSub, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800 truncate">{value}</p>
      {sub && (
        <p className={`text-xs mt-0.5 ${warnSub ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>{sub}</p>
      )}
    </div>
  );
}

interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}

function FeatureCard({ emoji, title, description, action, onClick }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 flex-1 mb-4">{description}</p>
      <Button variant="secondary" size="sm" onClick={onClick}>
        {action} →
      </Button>
    </div>
  );
}
