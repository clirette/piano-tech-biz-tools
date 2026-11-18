import { Invoice } from '../../../types';
import { Input } from '../../../components/Input';
import { ClientTypeToggle } from '../../../components/ClientTypeToggle';
import { formatPhone } from '../../../utils/format';
import { isOrganization } from '../../../utils/client';

interface InvoiceClientInfoFormProps {
  invoice: Invoice;
  onChange: (changes: Partial<Invoice>) => void;
}

export function InvoiceClientInfoForm({ invoice, onChange }: InvoiceClientInfoFormProps) {
  const isOrg = isOrganization(invoice);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-700">Client Information</h2>
        <ClientTypeToggle
          value={invoice.clientType}
          onChange={clientType => onChange({ clientType })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="client-name"
          label={isOrg ? 'Organization Name' : 'Client Name'}
          value={invoice.clientName}
          onChange={e => onChange({ clientName: e.target.value })}
          placeholder={isOrg ? 'Riverside Country Club' : 'Jane Smith'}
        />
        <Input
          label="Invoice #"
          value={invoice.invoiceNumber}
          onChange={e => onChange({ invoiceNumber: e.target.value })}
          placeholder="Auto-generated if blank"
        />
        <Input
          label="Invoice Date"
          type="date"
          value={invoice.date}
          onChange={e => onChange({ date: e.target.value })}
        />
        <Input
          label="Due Date"
          type="date"
          value={invoice.dueDate}
          onChange={e => onChange({ dueDate: e.target.value })}
        />
        {isOrg && (
          <Input
            id="client-contact"
            label="Contact Person"
            value={invoice.clientContact ?? ''}
            onChange={e => onChange({ clientContact: e.target.value })}
            placeholder="Jane Smith, Events Manager"
            hint='Optional — printed as "Attn:" under the organization name.'
          />
        )}
        <Input
          label="Email"
          type="email"
          value={invoice.clientEmail}
          onChange={e => onChange({ clientEmail: e.target.value })}
          placeholder={isOrg ? 'accounts@example.com' : 'jane@example.com'}
        />
        <Input
          label="Phone"
          type="tel"
          value={invoice.clientPhone}
          onChange={e => onChange({ clientPhone: formatPhone(e.target.value) })}
          placeholder="(555) 555-0100"
        />
      </div>

      <h2 className="font-semibold text-slate-700 pt-2">Piano Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Make"
          value={invoice.pianoMake}
          onChange={e => onChange({ pianoMake: e.target.value })}
          placeholder="Steinway, Yamaha, etc."
        />
        <Input
          label="Model"
          value={invoice.pianoModel}
          onChange={e => onChange({ pianoModel: e.target.value })}
          placeholder="Model D, U1, etc."
        />
        <Input
          label="Serial Number"
          value={invoice.pianoSerial}
          onChange={e => onChange({ pianoSerial: e.target.value })}
          placeholder="123456"
        />
        <Input
          label="Location"
          value={invoice.pianoLocation}
          onChange={e => onChange({ pianoLocation: e.target.value })}
          placeholder="Living room, Studio, etc."
        />
      </div>
    </div>
  );
}
