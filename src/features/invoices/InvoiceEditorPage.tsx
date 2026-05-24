import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice, InvoiceStatus } from '../../types';
import { Button } from '../../components/Button';
import { ImportButton } from '../../components/ImportButton';
import { TextArea } from '../../components/TextArea';
import { Badge } from '../../components/Badge';
import { InvoiceClientInfoForm } from './components/InvoiceClientInfoForm';
import { LineItemsTable } from '../estimates/components/LineItemsTable';
import { formatCurrency } from '../../utils/currency';
import { estimateTotal } from '../../utils/calculations';
import { exportInvoiceBackup, AnyBackup, InvoiceBackup } from '../../utils/backup';
import { generateId } from '../../utils/generateId';

const STATUS_OPTIONS: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue'];

export function InvoiceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoice, updateLineItems, setInvoices } = useInvoices();

  const invoice = id ? getInvoice(id) : undefined;
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    if (!invoice) navigate('/invoices');
  }, [invoice, navigate]);

  if (!invoice) return null;

  function handleImportInvoice(backup: AnyBackup) {
    if (backup.type !== 'invoice') {
      setImportMsg('That file is not a single-invoice backup.');
      setTimeout(() => setImportMsg(''), 4000);
      return;
    }
    const imported = { ...(backup as InvoiceBackup).invoice, id: generateId() };
    setInvoices(prev => [imported, ...prev]);
    setImportMsg(`✓ Added "${imported.clientName || 'imported invoice'}" as a new invoice.`);
    setTimeout(() => setImportMsg(''), 5000);
  }

  function handleChange(changes: Partial<Invoice>) {
    if (!id) return;
    updateInvoice(id, changes);
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
          onClick={() => navigate('/invoices')}
          className="text-brand-600 hover:text-brand-800 text-sm font-medium flex items-center gap-1"
        >
          ← Invoices
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex-1">
          {invoice.clientName || 'New Invoice'}
        </h1>
        <Badge status={invoice.status} />
      </div>

      <div className="space-y-4">
        <InvoiceClientInfoForm invoice={invoice} onChange={handleChange} />

        <LineItemsTable
          lineItems={invoice.lineItems}
          onChange={items => { if (id) updateLineItems(id, items); setSaved(false); }}
        />

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <TextArea
            label="Notes"
            value={invoice.notes}
            onChange={e => handleChange({ notes: e.target.value })}
            placeholder="Additional notes to include on the invoice…"
            rows={3}
          />
        </div>

        {/* Status + totals + actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={invoice.status}
              onChange={e => handleChange({ status: e.target.value as InvoiceStatus })}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <span className="sm:ml-auto text-xl font-bold text-brand-700">
              Total: {formatCurrency(estimateTotal(invoice))}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportInvoiceBackup(invoice)}>
              ⬇ Export
            </Button>
            <ImportButton label="⬆ Import" variant="secondary" size="sm" onImport={handleImportInvoice} />
            <Button variant="secondary" size="sm" onClick={() => navigate(`/invoices/${invoice.id}/preview`)}>
              Preview / PDF
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
            {saved && <span className="text-sm text-green-600 font-medium self-center">✓ Saved</span>}
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
