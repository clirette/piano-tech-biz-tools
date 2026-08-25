import { useState } from 'react';
import { ToolSection } from './components/ToolSection';
import { StringTensionTool } from './components/StringTensionTool';
import { WireGaugeTool } from './components/WireGaugeTool';
import { PitchConverterTool } from './components/PitchConverterTool';
import { BeatRateTool } from './components/BeatRateTool';
import { A4_DEFAULT_HZ } from '../../utils/pitch';
import {
  REGULATION_SPECS,
  SOURCE_CITATION,
  EXPECTED_SPEC_NAMES,
  hasRegulationSpecs,
} from '../../utils/regulationSpecs';

export function ToolsPage() {
  const [open, setOpen] = useState<string | null>('tension');
  const [a4Hz, setA4Hz] = useState(A4_DEFAULT_HZ);

  const toggle = (id: string) => setOpen(prev => (prev === id ? null : id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">🔧 Bench Tools</h1>
        <p className="text-sm text-slate-500">
          Piano-technical calculators and reference tables for work at the instrument. Everything
          here runs on your device — no signal needed.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="a4-reference">
          Concert pitch reference
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">A4 =</span>
          <input
            id="a4-reference"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="380"
            max="500"
            value={a4Hz}
            onChange={e => setA4Hz(Number(e.target.value) || A4_DEFAULT_HZ)}
            className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <span className="text-sm text-slate-500">Hz</span>
        </div>
        <p className="text-xs text-slate-400 w-full sm:w-auto">
          Used by the tension, pitch, and beat rate tools.
        </p>
      </div>

      <ToolSection
        id="tension"
        emoji="🎚️"
        title="String Tension"
        subtitle="Tension and percent of breaking load from wire, length, and pitch"
        open={open === 'tension'}
        onToggle={() => toggle('tension')}
      >
        <StringTensionTool a4Hz={a4Hz} />
      </ToolSection>

      <ToolSection
        id="wire"
        emoji="📏"
        title="Wire Gauge"
        subtitle="Music Wire Gauge chart and diameter lookup"
        open={open === 'wire'}
        onToggle={() => toggle('wire')}
      >
        <WireGaugeTool />
      </ToolSection>

      <ToolSection
        id="pitch"
        emoji="🎵"
        title="Cents & Frequency"
        subtitle="Note to Hz, intervals in cents, and cent shifts"
        open={open === 'pitch'}
        onToggle={() => toggle('pitch')}
      >
        <PitchConverterTool a4Hz={a4Hz} />
      </ToolSection>

      <ToolSection
        id="beats"
        emoji="〰️"
        title="Beat Rates"
        subtitle="Equal-tempered beat rates across the temperament octave"
        open={open === 'beats'}
        onToggle={() => toggle('beats')}
      >
        <BeatRateTool a4Hz={a4Hz} />
      </ToolSection>

      <ToolSection
        id="regulation"
        emoji="📐"
        title="Regulation Specs"
        subtitle="Typical action measurements"
        open={open === 'regulation'}
        onToggle={() => toggle('regulation')}
      >
        {hasRegulationSpecs() ? (
          <div className="space-y-3">
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
              Typical values only — these vary by manufacturer, model, and era. Always defer to the
              maker&apos;s service manual for the instrument in front of you.
            </div>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">Measurement</th>
                    <th className="px-3 py-2 font-medium">Grand</th>
                    <th className="px-3 py-2 font-medium">Vertical</th>
                  </tr>
                </thead>
                <tbody>
                  {REGULATION_SPECS.map(spec => (
                    <tr key={spec.name} className="border-t border-slate-100 text-slate-700">
                      <td className="px-3 py-1.5 font-medium">
                        {spec.name}
                        {spec.note && (
                          <span className="block text-xs text-slate-400">{spec.note}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums">{spec.grand}</td>
                      <td className="px-3 py-1.5 tabular-nums">{spec.vertical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {SOURCE_CITATION && <p className="text-xs text-slate-400">Source: {SOURCE_CITATION}</p>}
          </div>
        ) : (
          <div className="text-sm text-slate-500 space-y-2">
            <p>
              This reference is not filled in yet. Unlike the other tools, regulation specs are
              published figures rather than calculations — and since an action could actually be
              regulated to whatever appears here, the table stays empty until the numbers are
              transcribed from a citable source rather than guessed at.
            </p>
            <p className="text-xs text-slate-400">
              Planned rows: {EXPECTED_SPEC_NAMES.join(', ')}.
            </p>
          </div>
        )}
      </ToolSection>
    </div>
  );
}
