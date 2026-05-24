import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { useEstimates } from '../../hooks/useEstimates';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Button } from '../../components/Button';
import { ImportButton } from '../../components/ImportButton';
import { InvoiceCard } from './components/InvoiceCard';
import { exportFullBackup, daysSinceLastBackup, AnyBackup, FullBackup, InvoiceBackup } from '../../utils/backup';
import { generateId } from '../../utils/generateId';

export function InvoicesPage() {
  const navigate = useNavigate();
  const { invoices, createInvoice, deleteInvoice, setInvoices } = useInvoices();
  const { estimates, setEstimates } = useEstimates();
  const { settings: company, setSettings: setCompany } = useCompanySettings();
  const [importMsg, setImportMsg] = useState('');
  const [backupDays, setBackupDays] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    setBackupDays(daysSinceLastBackup());
  }, []);

  const showBanner =
    !bannerDismissed &&
    invoices.length > 0 &&
    (backupDays === null || backupDays >= 7);

  function handleNew() {
    const invoice = createInvoice();
    navigate(`/invoices/${invoice.id}`);
  }

  function handleImport(backup: AnyBackup) {
    if (backup.type === 'full') {
      const b = backup as FullBackup;
      if (!confirm(`This will replace ALL your estimates (${b.estimates.length}), invoices (${b.invoices?.length ?? 0}), and company settings. Are you sure?`)) return;
      setCompany(b.company);
      setEstimates(b.estimates);
      if (b.invoices) setInvoices(b.invoices);
      setImportMsg(`✓ Restored ${b.estimates.length} estimates, ${b.invoices?.length ?? 0} invoices, and company settings.`);
    } else if (backup.type === 'invoice') {
      const imported = { ...(backup as InvoiceBackup).invoice, id: generateId() };
      setInvoices(prev => [imported, ...prev]);
      setImportMsg(`✓ Imported invoice for "${imported.clientName || 'unknown client'}".`);
    } else if (backup.type === 'estimate') {
      setImportMsg('That file is a single estimate. It has been added — find it under Estimates.');
    } else if (backup.type === 'company') {
      setImportMsg('That file contains only company settings. Use the import on the Settings page to restore them.');
    }
    setTimeout(() => setImportMsg(''), 5000);
  }

  return (
    <div>
      {showBanner && (
        <div className="mb-4 flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <span>
            {backupDays === null
              ? '⚠️ You have never exported a backup. Your data lives only in this browser — export regularly to avoid loss.'
              : `⚠️ Your last backup was ${backupDays} day${backupDays !== 1 ? 's' : ''} ago. Consider exporting a fresh backup.`}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={() => { exportFullBackup(company, estimates, invoices); setBackupDays(0); }}>
              Export Now
            </Button>
            <button onClick={() => setBannerDismissed(true)} className="text-amber-500 hover:text-amber-700 text-lg leading-none">×</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => exportFullBackup(company, estimates, invoices)}>
            ⬇ Export Backup
          </Button>
          <ImportButton label="⬆ Import Backup" size="sm" onImport={handleImport} />
          <Button onClick={handleNew} size="lg">
            + New Invoice
          </Button>
        </div>
      </div>

      {importMsg && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {importMsg}
        </p>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">🧾</p>
          <p className="text-lg font-medium mb-1">No invoices yet</p>
          <p className="text-sm mb-6">Create a new invoice or convert an estimate from the Estimates page.</p>
          <Button onClick={handleNew}>+ New Invoice</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onDelete={deleteInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
