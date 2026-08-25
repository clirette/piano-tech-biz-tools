import { useState } from 'react';
import {
  INTERVALS,
  INTERVAL_ORDER,
  IntervalKind,
  temperamentTable,
  intervalTemper,
} from '../../../utils/pitch';

const TEMPER_STYLES = {
  wide: { label: 'WIDE of pure', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  narrow: { label: 'NARROW of pure', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  pure: { label: 'pure', className: 'bg-slate-50 text-slate-600 border-slate-200' },
} as const;

const fieldClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

interface BeatRateToolProps {
  a4Hz: number;
}

export function BeatRateTool({ a4Hz }: BeatRateToolProps) {
  const [kind, setKind] = useState<IntervalKind>('M3');
  const spec = INTERVALS[kind];
  const rows = temperamentTable(kind, { a4Hz });
  const temper = intervalTemper(spec);
  const temperStyle = TEMPER_STYLES[temper];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="beat-interval">
            Interval
          </label>
          <select
            id="beat-interval"
            className={fieldClass}
            value={kind}
            onChange={e => setKind(e.target.value as IntervalKind)}
          >
            {INTERVAL_ORDER.map(k => (
              <option key={k} value={k}>
                {INTERVALS[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <span
            className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${temperStyle.className}`}
          >
            {spec.label} is tempered {temperStyle.label}
          </span>
          <p className="text-xs text-slate-500">
            Coincident partials {spec.ratio} — beats are the difference between partial{' '}
            {spec.lowPartial} of the lower note and partial {spec.highPartial} of the upper.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3 py-2 font-medium">Interval</th>
              <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">Lower Hz</th>
              <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">Upper Hz</th>
              <th className="px-3 py-2 font-medium text-right">Beats/sec</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.lowMidi} className="border-t border-slate-100 tabular-nums text-slate-700">
                <td className="px-3 py-1.5 font-medium">
                  {row.lowName}–{row.highName}
                </td>
                <td className="px-3 py-1.5 text-right hidden sm:table-cell text-slate-500">
                  {row.lowHz.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right hidden sm:table-cell text-slate-500">
                  {row.highHz.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold">
                  {row.beatsPerSecond.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
        <strong className="text-slate-700">Setting this interval:</strong>{' '}
        {temper === 'wide' ? (
          <>
            equal temperament stretches the {spec.label.toLowerCase()} <strong>wider</strong> than
            pure, so it always beats. Widening it further makes it beat faster; narrowing it toward
            pure slows the beat toward zero.
          </>
        ) : temper === 'narrow' ? (
          <>
            equal temperament shrinks the {spec.label.toLowerCase()} <strong>narrower</strong> than
            pure, so it beats slowly. Narrowing it further makes it beat faster; widening it toward
            pure slows the beat toward zero.
          </>
        ) : (
          <>this interval is untempered in equal temperament, so a clean one does not beat.</>
        )}{' '}
        Thirds and sixths are tempered far more than fourths and fifths, which is why they beat so
        much faster.
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Equal-tempered rates across the temperament octave (F3–F4) at A4 = {a4Hz} Hz. These assume
        ideal harmonic strings. Real piano strings are inharmonic, so measured beat rates run
        faster than these — increasingly so toward the ends of the keyboard.
      </p>
    </div>
  );
}
