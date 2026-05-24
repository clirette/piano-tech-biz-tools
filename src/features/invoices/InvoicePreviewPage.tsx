import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Button } from '../../components/Button';
import { GoogleGIcon } from '../../components/GoogleGIcon';
import { Badge } from '../../components/Badge';
import { formatCurrency } from '../../utils/currency';
import { lineItemTotal, estimateTotal } from '../../utils/calculations';
import { generateInvoicePdf } from '../../utils/pdf';

export function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice } = useInvoices();
  const { settings: company } = useCompanySettings();

  const invoice = id ? getInvoice(id) : undefined;

  useEffect(() => {
    if (!invoice) navigate('/invoices');
  }, [invoice, navigate]);

  if (!invoice) return null;

  const total = estimateTotal(invoice);
  const invoiceNum = invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase();
  const { payment } = company;

  function formatDate(iso: string): string {
    const [year, month, day] = iso.split('-');
    return `${month}/${day}/${year}`;
  }

  const paymentMethods: string[] = [];
  if (payment?.acceptCash) paymentMethods.push('Cash');
  if (payment?.acceptCheck) paymentMethods.push('Check');
  if (payment?.acceptOnlineCard) paymentMethods.push('Credit Card');

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center gap-3 mb-6 no-print flex-wrap">
        <button
          onClick={() => navigate(`/invoices/${invoice.id}`)}
          className="text-brand-600 hover:text-brand-800 text-sm font-medium"
        >
          ← Edit
        </button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => window.print()}>
          🖨 Print
        </Button>
        <Button onClick={() => generateInvoicePdf(invoice, company)}>
          ⬇ Export PDF
        </Button>
      </div>

      {/* Invoice document */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto" id="invoice-preview">
        {/* Company header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {company.logoDataUrl && (
              <img
                src={company.logoDataUrl}
                alt="Company logo"
                className="h-16 w-16 object-contain"
              />
            )}
            {company.name && (
              <div>
                <h1 className="text-2xl font-bold text-brand-700">{company.name}</h1>
                {company.slogan && (
                  <p className="text-sm text-slate-500 italic">{company.slogan}</p>
                )}
              </div>
            )}
          </div>
          <div className="text-right text-sm text-slate-500 space-y-0.5">
            {company.address && <p>{company.address}</p>}
            {company.phone && <p>{company.phone}</p>}
            {company.email && <p>{company.email}</p>}
            {company.website && <p>{company.website}</p>}
          </div>
        </div>

        {/* Invoice title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-brand-600 tracking-wide">INVOICE</h2>
            <p className="text-slate-500 text-sm">#{invoiceNum}</p>
          </div>
          <div className="text-right text-sm text-slate-600 space-y-1">
            <p><span className="font-medium">Date:</span> {formatDate(invoice.date)}</p>
            {invoice.dueDate && (
              <p><span className="font-medium">Due:</span> {formatDate(invoice.dueDate)}</p>
            )}
            <Badge status={invoice.status} />
          </div>
        </div>

        {/* Client + Piano info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
            <div className="text-sm text-slate-700 space-y-0.5">
              {invoice.clientName && <p className="font-semibold">{invoice.clientName}</p>}
              {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
              {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Piano</h3>
            <div className="text-sm text-slate-700 space-y-0.5">
              {(invoice.pianoMake || invoice.pianoModel) && (
                <p className="font-semibold">
                  {`${invoice.pianoMake} ${invoice.pianoModel}`.trim()}
                </p>
              )}
              {invoice.pianoSerial && <p>S/N: {invoice.pianoSerial}</p>}
              {invoice.pianoLocation && <p>{invoice.pianoLocation}</p>}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="bg-brand-600 text-white text-xs uppercase tracking-wide">
              <th className="text-left px-3 py-2 rounded-tl">Description</th>
              <th className="px-3 py-2 text-center">Type</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-center">Hours</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right rounded-tr">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr
                key={item.id}
                className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
              >
                <td className="px-3 py-2">
                  <div>{item.description}</div>
                  {item.lineNotes && (
                    <div className="text-xs text-slate-400 italic mt-0.5">{item.lineNotes}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-slate-500 capitalize">{item.type}</td>
                <td className="px-3 py-2 text-center">{item.quantity}</td>
                <td className="px-3 py-2 text-center text-slate-500">
                  {item.hours != null ? item.hours : '—'}
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(item.unitPriceCents)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(lineItemTotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-6">
          <div className="border-t-2 border-brand-600 pt-2 min-w-48">
            <div className="flex justify-between items-center font-bold text-lg text-brand-700">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Payment methods */}
        {paymentMethods.length > 0 && (
          <div className="border-t border-slate-200 pt-4 mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment</h3>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">Accepted:</span> {paymentMethods.join(', ')}
            </p>
            {payment.acceptCheck && payment.checkPayableTo && (
              <p className="text-sm text-slate-600">
                Make check payable to: <span className="font-semibold">{payment.checkPayableTo}</span>
              </p>
            )}
            {payment.acceptOnlineCard && payment.onlineCardUrl && (
              <p className="text-sm mt-1">
                <a
                  href={payment.onlineCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 font-semibold hover:underline"
                >
                  {payment.onlineCardName ? `Pay by Credit Card via ${payment.onlineCardName}` : 'Pay by Credit Card'} →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Google review — hidden when printing */}
        {company.googleReviewUrl && company.showGoogleReviewOnInvoices && (
          <div className="border-t border-slate-200 pt-5 flex flex-col items-center gap-2 text-center no-print">
            <p className="text-sm text-slate-500">
              We'd love your feedback —{' '}
              <a
                href={company.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4285F4] font-semibold hover:underline"
              >
                <GoogleGIcon size={14} />
                Click Here to Leave a Google Review
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
