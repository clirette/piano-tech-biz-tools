import { EstimateStatus, InvoiceStatus } from '../types';

type AnyStatus = EstimateStatus | InvoiceStatus;

const config: Record<AnyStatus, { label: string; classes: string }> = {
  draft:    { label: 'Draft',    classes: 'bg-slate-100 text-slate-600' },
  sent:     { label: 'Sent',     classes: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', classes: 'bg-red-100 text-red-700' },
  paid:     { label: 'Paid',     classes: 'bg-emerald-100 text-emerald-700' },
  overdue:  { label: 'Overdue',  classes: 'bg-orange-100 text-orange-700' },
};

export function Badge({ status }: { status: AnyStatus }) {
  const { label, classes } = config[status] ?? { label: status, classes: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
