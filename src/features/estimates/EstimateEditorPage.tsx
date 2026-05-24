import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEstimates } from '../../hooks/useEstimates';
import { useInvoices } from '../../hooks/useInvoices';
import { Estimate, EstimateStatus } from '../../types';
import { Button } from '../../components/Button';
import { ImportButton } from '../../components/ImportButton';
import { TextArea } from '../../components/TextArea';
import { Badge } from '../../components/Badge';
import { ClientInfoForm } from './components/ClientInfoForm';
import { LineItemsTable } from './components/LineItemsTable';
import { formatCurrency } from '../../utils/currency';
import { estimateTotal } from '../../utils/calculations';
import { exportEstimateBackup, AnyBackup, EstimateBackup } from '../../utils/backup';
import { generateId } from '../../utils/generateId';

const STATUS_OPTIONS: EstimateStatus[] = ['draft', 'sent', 'accepted', 'declined'];

export function EstimateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEstimate, updateEstimate, updateLineItems, setEstimates } = useEstimates();
  const { createInvoiceFromEstimate } = useInvoices();

  const estimate = id ? getEstimate(id) : undefined;
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    if (!estimate) navigate('/estimates');
  }, [estimate, navigate]);

  if (!estimate) return null;

  function handleConvertToInvoice() {
    if (!estimate) return;
    if (!confirm(`Convert this estimate for "${estimate.clientName || 'this client'}" to an invoice?`)) return;
    const invoice = createInvoiceFromEstimate({
      clientName: estimate.clientName,
      clientEmail: estimate.clientEmail,
      clientPhone: estimate.clientPhone,
      pianoMake: estimate.pianoMake,
      pianoModel: estimate.pianoModel,
      pianoSerial: estimate.pianoSerial,
      pianoLocation: estimate.pianoLocation,
      lineItems: estimate.lineItems,
      notes: estimate.notes,
    });
    navigate(`/invoices/${invoice.id}`);
  }

  function handleImportEstimate(backup: AnyBackup) {
    if (backup.type !== 'estimate') {
      setImportMsg('That file is not a single-estimate backup.');
      setTimeout(() => setImportMsg(''), 4000);
      return;
    }
    const imported = { ...(backup as EstimateBackup).estimate, id: generateId() };
    setEstimates(prev => [imported, ...prev]);
    setImportMsg(`✓ Added "${imported.clientName || 'imported estimate'}" as a new estimate.`);
    setTimeout(() => setImportMsg(''), 5000);
  }

  function handleChange(changes: Partial<Estimate>) {
    if (!id) return;
    updateEstimate(id, changes);
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => navigate('/estimates')}
          className="text-brand-600 hover:text-brand-800 text-sm font-medium flex items-center gap-1"
        >
          ← Estimates
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex-1">
          {estimate.clientName || 'New Estimate'}
        </h1>
        <Badge status={estimate.status} />
      </div>

      <div className="space-y-4">
        <ClientInfoForm estimate={estimate} onChange={handleChange} />

        <LineItemsTable
          lineItems={estimate.lineItems}
          onChange={items => { if (id) updateLineItems(id, items); setSaved(false); }}
        />

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <TextArea
            label="Notes"
            value={estimate.notes}
            onChange={e => handleChange({ notes: e.target.value })}
            placeholder="Additional notes to include on the estimate…"
            rows={3}
          />
        </div>

        {/* Status + totals + actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={estimate.status}
                onChange={e => handleChange({ status: e.target.value as EstimateStatus })}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xl font-bold text-brand-700">
                Total: {formatCurrency(estimateTotal(estimate))}
              </span>
              <Button variant="secondary" onClick={() => exportEstimateBackup(estimate)}>
                ⬇ Export
              </Button>
              <ImportButton label="⬆ Import" variant="secondary" size="sm" onImport={handleImportEstimate} />
              <Button variant="secondary" onClick={handleConvertToInvoice}>
                → Invoice
              </Button>
              <Button variant="secondary" onClick={() => navigate(`/estimates/${estimate.id}/preview`)}>
                Preview / PDF
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
            </div>
          </div>
          {importMsg && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              {importMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
