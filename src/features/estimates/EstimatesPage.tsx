import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimates } from '../../hooks/useEstimates';
import { useInvoices } from '../../hooks/useInvoices';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Button } from '../../components/Button';
import { ImportButton } from '../../components/ImportButton';
import { EstimateCard } from './components/EstimateCard';
import {
  exportFullBackup,
  daysSinceLastBackup,
  AnyBackup,
  FullBackup,
} from '../../utils/backup';
import { generateId } from '../../utils/generateId';

export function EstimatesPage() {
  const navigate = useNavigate();
  const { estimates, createEstimate, deleteEstimate, setEstimates } = useEstimates();
  const { invoices, setInvoices } = useInvoices();
  const { settings: company, setSettings: setCompany } = useCompanySettings();
  const [backupDays, setBackupDays] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    setBackupDays(daysSinceLastBackup());
  }, []);

  const showBanner =
    !bannerDismissed &&
    estimates.length > 0 &&
    (backupDays === null || backupDays >= 7);

  function handleNew() {
    const estimate = createEstimate();
    navigate(`/estimates/${estimate.id}`);
  }

  function handleImport(backup: AnyBackup) {
    if (backup.type === 'full') {
      const b = backup as FullBackup;
      if (!confirm(`This will replace ALL your estimates (${b.estimates.length}), invoices (${b.invoices?.length ?? 0}), and company settings. Are you sure?`)) return;
      setCompany(b.company);
      setEstimates(b.estimates);
      if (b.invoices) setInvoices(b.invoices);
      setImportMsg(`✓ Restored ${b.estimates.length} estimates, ${b.invoices?.length ?? 0} invoices, and company settings.`);
    } else if (backup.type === 'estimate') {
      const imported = { ...backup.estimate, id: generateId() };
      setEstimates(prev => [imported, ...prev]);
      setImportMsg(`✓ Imported estimate for "${imported.clientName || 'unknown client'}".`);
    } else if (backup.type === 'invoice') {
      const imported = { ...backup.invoice, id: generateId() };
      setInvoices(prev => [imported, ...prev]);
      setImportMsg(`✓ Imported invoice for "${imported.clientName || 'unknown client'}". View it under Invoices.`);
    } else {
      setImportMsg('This file contains only company settings. Use the import on the Company Settings page.');
    }
    setTimeout(() => setImportMsg(''), 5000);
  }

  return (
    <div>
      {/* Backup reminder banner */}
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
        <h1 className="text-2xl font-bold text-slate-800">Estimates</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => exportFullBackup(company, estimates, invoices)}>
            ⬇ Export Backup
          </Button>
          <ImportButton label="⬆ Import Backup" size="sm" onImport={handleImport} />
          <Button onClick={handleNew} size="lg">
            + New Estimate
          </Button>
        </div>
      </div>

      {importMsg && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {importMsg}
        </p>
      )}

      {estimates.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">🎹</p>
          <p className="text-lg font-medium mb-1">No estimates yet</p>
          <p className="text-sm mb-6">Create your first estimate to get started.</p>
          <Button onClick={handleNew}>+ New Estimate</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {estimates.map(estimate => (
            <EstimateCard
              key={estimate.id}
              estimate={estimate}
              onDelete={deleteEstimate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
