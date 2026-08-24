import { Estimate } from '../../../types';
import { Input } from '../../../components/Input';
import { formatPhone } from '../../../utils/format';
import { VALID_DAYS_OPTIONS } from '../../../utils/expiration';

interface ClientInfoFormProps {
  estimate: Estimate;
  onChange: (changes: Partial<Estimate>) => void;
}

export function ClientInfoForm({ estimate, onChange }: ClientInfoFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <h2 className="font-semibold text-slate-700">Client Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Client Name"
          value={estimate.clientName}
          onChange={e => onChange({ clientName: e.target.value })}
          placeholder="Jane Smith"
        />
        <Input
          label="Estimate #"
          value={estimate.estimateNumber}
          onChange={e => onChange({ estimateNumber: e.target.value })}
          placeholder="Auto-generated if blank"
        />
        <Input
          label="Date"
          type="date"
          value={estimate.date}
          onChange={e => onChange({ date: e.target.value })}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="valid-for" className="text-sm font-medium text-slate-700">
            Valid For
          </label>
          <select
            id="valid-for"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            value={estimate.validDays ?? 0}
            onChange={e => onChange({ validDays: Number(e.target.value) })}
          >
            {VALID_DAYS_OPTIONS.map(opt => (
              <option key={opt.days} value={opt.days}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Optional — shown on the estimate as an expiration date.</p>
        </div>
        <Input
          label="Email"
          type="email"
          value={estimate.clientEmail}
          onChange={e => onChange({ clientEmail: e.target.value })}
          placeholder="jane@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={estimate.clientPhone}
          onChange={e => onChange({ clientPhone: formatPhone(e.target.value) })}
          placeholder="(555) 555-0100"
        />
      </div>

      <h2 className="font-semibold text-slate-700 pt-2">Piano Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Make"
          value={estimate.pianoMake}
          onChange={e => onChange({ pianoMake: e.target.value })}
          placeholder="Steinway, Yamaha, etc."
        />
        <Input
          label="Model"
          value={estimate.pianoModel}
          onChange={e => onChange({ pianoModel: e.target.value })}
          placeholder="Model D, U1, etc."
        />
        <Input
          label="Serial Number"
          value={estimate.pianoSerial}
          onChange={e => onChange({ pianoSerial: e.target.value })}
          placeholder="123456"
        />
        <Input
          label="Location"
          value={estimate.pianoLocation}
          onChange={e => onChange({ pianoLocation: e.target.value })}
          placeholder="Living room, Studio, etc."
        />
      </div>
    </div>
  );
}
