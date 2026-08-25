import { useState } from 'react';
import {
  PIANO_WIRE_SIZES,
  mmToNearestGauge,
  mmToInches,
  inchesToMm,
  LINEAR_GAUGE_RANGE,
} from '../../../utils/pianoWire';

const fieldClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

type Unit = 'mm' | 'in';

export function WireGaugeTool() {
  // Inches by default — a micrometer reads thousandths of an inch, which is how
  // the measurement usually arrives at the bench.
  const [unit, setUnit] = useState<Unit>('in');
  const [mmValue, setMmValue] = useState('0.925');
  const [inValue, setInValue] = useState('0.036');

  // A micrometer reads thousandths of an inch, so keep that as the entry
  // precision and convert to mm for the lookup.
  const measuredMm = unit === 'mm' ? Number(mmValue) : inchesToMm(Number(inValue));
  const nearest = mmToNearestGauge(measuredMm);

  function switchUnit(next: Unit) {
    if (next === unit) return;
    // Carry the current measurement across so the reading does not jump.
    if (next === 'in' && Number.isFinite(Number(mmValue))) {
      setInValue(mmToInches(Number(mmValue)).toFixed(3));
    } else if (next === 'mm' && Number.isFinite(Number(inValue))) {
      setMmValue(inchesToMm(Number(inValue)).toFixed(3));
    }
    setUnit(next);
  }

  const deltaInches = nearest ? mmToInches(nearest.deltaMm) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`${labelClass} mb-0`}>Measured diameter</span>
            <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
              {(['mm', 'in'] as Unit[]).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => switchUnit(u)}
                  className={`px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    unit === u
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          {unit === 'mm' ? (
            <input
              aria-label="Measured diameter in millimetres"
              className={fieldClass}
              type="number"
              inputMode="decimal"
              step="0.005"
              value={mmValue}
              onChange={e => setMmValue(e.target.value)}
            />
          ) : (
            <input
              aria-label="Measured diameter in inches"
              className={fieldClass}
              type="number"
              inputMode="decimal"
              step="0.001"
              value={inValue}
              onChange={e => setInValue(e.target.value)}
            />
          )}
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {Number.isFinite(measuredMm) && measuredMm > 0
              ? unit === 'mm'
                ? `= ${mmToInches(measuredMm).toFixed(4)} in`
                : `= ${measuredMm.toFixed(3)} mm`
              : unit === 'in'
              ? 'Thousandths of an inch, as read off a micrometer'
              : ' '}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
          {nearest ? (
            <>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">
                Gauge {nearest.size.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {nearest.size.mm.toFixed(3)} mm · {mmToInches(nearest.size.mm).toFixed(4)} in
              </p>
              {Math.abs(nearest.deltaMm) > 1e-9 && (
                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                  measured {nearest.deltaMm > 0 ? '+' : '−'}
                  {Math.abs(nearest.deltaMm).toFixed(3)} mm (
                  {deltaInches > 0 ? '+' : '−'}
                  {Math.abs(deltaInches).toFixed(4)} in)
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">— enter a diameter</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Music Wire Gauge chart
        </h4>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2 font-medium">Gauge</th>
                <th className="px-3 py-2 font-medium text-right">mm</th>
                <th className="px-3 py-2 font-medium text-right">inches</th>
              </tr>
            </thead>
            <tbody>
              {PIANO_WIRE_SIZES.map(size => {
                const isNearest = nearest?.size.label === size.label;
                return (
                  <tr
                    key={size.label}
                    className={`border-t border-slate-100 tabular-nums ${
                      isNearest ? 'bg-brand-50 font-semibold text-brand-800' : 'text-slate-700'
                    }`}
                  >
                    <td className="px-3 py-1.5">{size.label}</td>
                    <td className="px-3 py-1.5 text-right">{size.mm.toFixed(3)}</td>
                    <td className="px-3 py-1.5 text-right">{mmToInches(size.mm).toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Source: Fletcher &amp; Newman piano wire gauge chart. Between gauges {LINEAR_GAUGE_RANGE.min}{' '}
        and {LINEAR_GAUGE_RANGE.max} the sizes follow mm = 0.725 + (gauge − 12) × 0.05 exactly, but
        the series is irregular outside that range — gauge 11 is 0.660 mm and gauge 23 is 1.300 mm,
        not what the formula predicts. Inches are computed from mm to four decimals, so they are
        finer than the three-decimal values printed on most charts.
      </p>
    </div>
  );
}
