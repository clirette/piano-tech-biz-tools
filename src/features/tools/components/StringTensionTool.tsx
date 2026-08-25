import { useState } from 'react';
import {
  PIANO_WIRE_SIZES,
  analyzeString,
  TensionBand,
  UTS_MODEL_LABEL,
  STEEL_DENSITY_KG_M3,
  RELAXATION_THRESHOLD_PERCENT,
} from '../../../utils/pianoWire';
import { PIANO_NOTES, midiToFrequency } from '../../../utils/pitch';

const BAND_STYLES: Record<TensionBand, { label: string; className: string }> = {
  safe: { label: 'Safe', className: 'bg-green-50 text-green-700 border-green-200' },
  elevated: { label: 'Elevated', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  danger: { label: 'Near breaking', className: 'bg-red-50 text-red-700 border-red-200' },
};

const fieldClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

interface StringTensionToolProps {
  a4Hz: number;
}

export function StringTensionTool({ a4Hz }: StringTensionToolProps) {
  const [wireMode, setWireMode] = useState<'gauge' | 'diameter'>('gauge');
  const [gauge, setGauge] = useState('18');
  const [diameter, setDiameter] = useState('1.025');
  const [length, setLength] = useState('620');
  const [pitchMode, setPitchMode] = useState<'note' | 'hz'>('note');
  const [midi, setMidi] = useState('60');
  const [hz, setHz] = useState('261.63');

  const diameterMm =
    wireMode === 'gauge'
      ? (PIANO_WIRE_SIZES.find(s => String(s.gauge) === gauge)?.mm ?? NaN)
      : Number(diameter);
  const frequencyHz = pitchMode === 'note' ? midiToFrequency(Number(midi), a4Hz) : Number(hz);
  const result = analyzeString({
    diameterMm,
    speakingLengthMm: Number(length),
    frequencyHz,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className={labelClass}>Wire</span>
          <Toggle
            value={wireMode}
            options={[
              { value: 'gauge', label: 'Gauge' },
              { value: 'diameter', label: 'mm' },
            ]}
            onChange={setWireMode}
          />
          {wireMode === 'gauge' ? (
            <select className={`${fieldClass} mt-2`} value={gauge} onChange={e => setGauge(e.target.value)}>
              {PIANO_WIRE_SIZES.map(s => (
                <option key={s.label} value={s.gauge}>
                  {s.label} — {s.mm.toFixed(3)} mm
                </option>
              ))}
            </select>
          ) : (
            <input
              className={`${fieldClass} mt-2`}
              type="number"
              inputMode="decimal"
              step="0.005"
              value={diameter}
              onChange={e => setDiameter(e.target.value)}
            />
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="tension-length">
            Speaking length (mm)
          </label>
          <input
            id="tension-length"
            className={fieldClass}
            type="number"
            inputMode="decimal"
            step="1"
            value={length}
            onChange={e => setLength(e.target.value)}
          />
        </div>

        <div>
          <span className={labelClass}>Pitch</span>
          <Toggle
            value={pitchMode}
            options={[
              { value: 'note', label: 'Note' },
              { value: 'hz', label: 'Hz' },
            ]}
            onChange={setPitchMode}
          />
          {pitchMode === 'note' ? (
            <select className={`${fieldClass} mt-2`} value={midi} onChange={e => setMidi(e.target.value)}>
              {PIANO_NOTES.map(n => (
                <option key={n.midi} value={n.midi}>
                  {n.name} (key {n.pianoKey})
                </option>
              ))}
            </select>
          ) : (
            <input
              className={`${fieldClass} mt-2`}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={hz}
              onChange={e => setHz(e.target.value)}
            />
          )}
        </div>
      </div>

      {result ? (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <Readout value={`${result.tensionKgf.toFixed(1)} kg`} label="Tension" />
            <Readout value={`${result.tensionLbf.toFixed(0)} lb`} label="Tension" />
            <Readout value={`${result.tensionN.toFixed(0)} N`} label="Tension" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${
                BAND_STYLES[result.band].className
              }`}
            >
              {BAND_STYLES[result.band].label} — {result.percentOfBreaking.toFixed(0)}% of breaking
              load
            </span>
            {result.band !== 'safe' && (
              <span className="text-xs text-slate-500">
                above the {RELAXATION_THRESHOLD_PERCENT}% threshold where the wire itself starts to
                relax
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-400">
          — enter a diameter, length, and pitch
        </div>
      )}

      <p className="text-xs text-slate-400 leading-relaxed">
        Tension from T = 4·L²·f²·μ, steel density {STEEL_DENSITY_KG_M3} kg/m³. Percent of breaking
        load uses a modelled tensile strength ({UTS_MODEL_LABEL}); real wire varies by brand, batch
        and age, so treat it as a guide, not a safety limit.
      </p>
    </div>
  );
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

interface ToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

function Toggle<T extends string>({ value, options, onChange }: ToggleProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            value === opt.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
