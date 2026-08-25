import { useState } from 'react';
import {
  PIANO_NOTES,
  midiToFrequency,
  centsBetween,
  shiftByCents,
  nearestNote,
} from '../../../utils/pitch';

const fieldClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

interface PitchConverterToolProps {
  a4Hz: number;
}

export function PitchConverterTool({ a4Hz }: PitchConverterToolProps) {
  const [midi, setMidi] = useState('69');
  const [f1, setF1] = useState('440');
  const [f2, setF2] = useState('466.16');
  const [shiftFrom, setShiftFrom] = useState('440');
  const [cents, setCents] = useState('-50');

  const noteHz = midiToFrequency(Number(midi), a4Hz);
  const interval = centsBetween(Number(f1), Number(f2));
  const shifted = shiftByCents(Number(shiftFrom), Number(cents));
  const shiftedNote = nearestNote(shifted, a4Hz);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Note → frequency
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className={labelClass} htmlFor="pitch-note">
              Note
            </label>
            <select id="pitch-note" className={fieldClass} value={midi} onChange={e => setMidi(e.target.value)}>
              {PIANO_NOTES.map(n => (
                <option key={n.midi} value={n.midi}>
                  {n.name} (key {n.pianoKey})
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-2xl font-bold text-slate-800 tabular-nums">{noteHz.toFixed(2)} Hz</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              at A4 = {a4Hz} Hz
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Interval between two frequencies
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className={labelClass} htmlFor="pitch-f1">
              From (Hz)
            </label>
            <input
              id="pitch-f1"
              className={fieldClass}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={f1}
              onChange={e => setF1(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pitch-f2">
              To (Hz)
            </label>
            <input
              id="pitch-f2"
              className={fieldClass}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={f2}
              onChange={e => setF2(e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-2xl font-bold text-slate-800 tabular-nums">
              {Number.isFinite(interval) ? `${interval > 0 ? '+' : ''}${interval.toFixed(1)}` : '—'}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">cents</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Shift a frequency by cents
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className={labelClass} htmlFor="pitch-shift-from">
              Frequency (Hz)
            </label>
            <input
              id="pitch-shift-from"
              className={fieldClass}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={shiftFrom}
              onChange={e => setShiftFrom(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pitch-shift-cents">
              Shift (cents)
            </label>
            <input
              id="pitch-shift-cents"
              className={fieldClass}
              type="number"
              inputMode="decimal"
              step="1"
              value={cents}
              onChange={e => setCents(e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-2xl font-bold text-slate-800 tabular-nums">
              {Number.isFinite(shifted) ? shifted.toFixed(2) : '—'}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Hz
              {shiftedNote &&
                ` · ${shiftedNote.name} ${shiftedNote.centsOff >= 0 ? '+' : ''}${shiftedNote.centsOff.toFixed(0)}¢`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
