import { useNavigate } from 'react-router-dom';
import { Estimate } from '../../../types';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { formatCurrency } from '../../../utils/currency';
import { estimateTotal } from '../../../utils/calculations';
import { useInvoices } from '../../../hooks/useInvoices';

interface EstimateCardProps {
  estimate: Estimate;
  onDelete: (id: string) => void;
}

export function EstimateCard({ estimate, onDelete }: EstimateCardProps) {
  const navigate = useNavigate();
  const { createInvoiceFromEstimate } = useInvoices();
  const total = estimateTotal(estimate);
  const itemCount = estimate.lineItems.length;

  function handleConvert() {
    if (!confirm(`Convert estimate for "${estimate.clientName || 'this client'}" to an invoice?`)) return;
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-800 truncate">
            {estimate.clientName || <span className="text-slate-400 italic">No client name</span>}
          </h3>
          <Badge status={estimate.status} />
        </div>
        <p className="text-sm text-slate-500">
          {estimate.pianoMake || estimate.pianoModel
            ? `${estimate.pianoMake} ${estimate.pianoModel}`.trim()
            : 'No piano info'}{' '}
          · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatDate(estimate.date)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span className="text-lg font-bold text-brand-700">{formatCurrency(total)}</span>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/estimates/${estimate.id}`)}>
          Edit
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/estimates/${estimate.id}/preview`)}>
          Preview
        </Button>
        <Button size="sm" variant="secondary" onClick={handleConvert} className="text-brand-600">
          → Invoice
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700"
          onClick={() => {
            if (confirm(`Delete estimate for "${estimate.clientName || 'this client'}"?`)) {
              onDelete(estimate.id);
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
