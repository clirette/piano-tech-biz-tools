import { Estimate } from '../../../types';
import { Input } from '../../../components/Input';
import { formatPhone } from '../../../utils/format';

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
