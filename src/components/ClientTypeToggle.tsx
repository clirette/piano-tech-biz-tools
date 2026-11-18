import { ClientType } from '../types';

const OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'organization', label: 'Organization' },
];

interface ClientTypeToggleProps {
  /** Pass the stored value as-is; `undefined` (older documents) reads as individual. */
  value: ClientType | undefined;
  onChange: (value: ClientType) => void;
}

/** Segmented control choosing whether a document is made out to a person or an organization. */
export function ClientTypeToggle({ value = 'individual', onChange }: ClientTypeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Client type"
      className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5"
    >
      {OPTIONS.map(opt => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              selected ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
