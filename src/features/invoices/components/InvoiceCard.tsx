import { useNavigate } from 'react-router-dom';
import { Invoice } from '../../../types';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { formatCurrency } from '../../../utils/currency';
import { estimateTotal } from '../../../utils/calculations';

interface InvoiceCardProps {
  invoice: Invoice;
  onDelete: (id: string) => void;
}

export function InvoiceCard({ invoice, onDelete }: InvoiceCardProps) {
  const navigate = useNavigate();
  const total = estimateTotal(invoice);
  const itemCount = invoice.lineItems.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-800 truncate">
            {invoice.clientName || <span className="text-slate-400 italic">No client name</span>}
          </h3>
          <Badge status={invoice.status} />
        </div>
        <p className="text-sm text-slate-500">
          {invoice.pianoMake || invoice.pianoModel
            ? `${invoice.pianoMake} ${invoice.pianoModel}`.trim()
            : 'No piano info'}{' '}
          · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatDate(invoice.date)}
          {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span className="text-lg font-bold text-brand-700">{formatCurrency(total)}</span>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}`)}>
          Edit
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/preview`)}>
          Preview
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700"
          onClick={() => {
            if (confirm(`Delete invoice for "${invoice.clientName || 'this client'}"?`)) {
              onDelete(invoice.id);
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${month}/${day}/${year}`;
}
