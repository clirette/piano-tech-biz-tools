import React, { useState, useEffect } from 'react';
import { LineItem } from '../../../types';
import { Button } from '../../../components/Button';
import { formatCurrency, parseToCents } from '../../../utils/currency';
import { lineItemTotal } from '../../../utils/calculations';
import { generateId } from '../../../utils/generateId';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

const PRESETS: Array<Omit<LineItem, 'id'>> = [
  { description: 'Standard Tuning', type: 'labor', quantity: 1, unitPriceCents: 18000 },
  { description: 'Pitch Raise', type: 'labor', quantity: 1, unitPriceCents: 5000 },
  { description: 'Regulation', type: 'labor', quantity: 1, unitPriceCents: 30000 },
  { description: 'Voicing', type: 'labor', quantity: 1, unitPriceCents: 20000 },
  { description: 'Hammer Replacement', type: 'parts', quantity: 88, unitPriceCents: 300 },
  { description: 'String Repair', type: 'parts', quantity: 1, unitPriceCents: 5000 },
  { description: 'Damper Regulation', type: 'labor', quantity: 1, unitPriceCents: 15000 },
  { description: 'Action Cleaning', type: 'labor', quantity: 1, unitPriceCents: 10000 },
  { description: 'Pedal Repair', type: 'labor', quantity: 1, unitPriceCents: 7500 },
  { description: 'Key Re-covering', type: 'parts', quantity: 52, unitPriceCents: 400 },
];

interface LineItemsTableProps {
  lineItems: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemsTable({ lineItems, onChange }: LineItemsTableProps) {
  const isDesktop = useIsDesktop();
  const [showPresets, setShowPresets] = useState(false);
  // Track which rows have their notes textarea expanded
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(
    () => new Set(lineItems.filter(i => i.lineNotes).map(i => i.id)),
  );

  // Controlled price string state — keeps mobile card and desktop table in sync
  const [localPrices, setLocalPrices] = useState<Record<string, string>>(
    () => Object.fromEntries(lineItems.map(item => [item.id, formatCurrency(item.unitPriceCents)])),
  );

  // Controlled quantity string state — allows clearing the field mid-edit
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>(
    () => Object.fromEntries(lineItems.map(item => [item.id, String(item.quantity)])),
  );

  // Sync localPrices and localQuantities when items are added or removed
  useEffect(() => {
    setLocalPrices(prev => {
      const next: Record<string, string> = {};
      for (const item of lineItems) {
        next[item.id] = item.id in prev ? prev[item.id] : formatCurrency(item.unitPriceCents);
      }
      return next;
    });
    setLocalQuantities(prev => {
      const next: Record<string, string> = {};
      for (const item of lineItems) {
        next[item.id] = item.id in prev ? prev[item.id] : String(item.quantity);
      }
      return next;
    });
  }, [lineItems]);

  function toggleNotes(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addBlankItem() {
    onChange([...lineItems, { id: generateId(), description: '', type: 'labor', quantity: 1, unitPriceCents: 0 }]);
  }

  function addPreset(preset: Omit<LineItem, 'id'>) {
    onChange([...lineItems, { ...preset, id: generateId() }]);
    setShowPresets(false);
  }

  function updateItem(id: string, changes: Partial<LineItem>) {
    onChange(lineItems.map(item => (item.id === id ? { ...item, ...changes } : item)));
  }

  function removeItem(id: string) {
    onChange(lineItems.filter(item => item.id !== id));
  }

  function handlePriceBlur(id: string, rawValue: string) {
    const cents = parseToCents(rawValue) || 0;
    updateItem(id, { unitPriceCents: cents });
    setLocalPrices(prev => ({ ...prev, [id]: formatCurrency(cents) }));
  }

  function handleQuantityBlur(id: string, rawValue: string) {
    const qty = Math.max(1, parseInt(rawValue, 10) || 1);
    updateItem(id, { quantity: qty });
    setLocalQuantities(prev => ({ ...prev, [id]: String(qty) }));
  }

  const cellInput = 'rounded border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-slate-700">Services &amp; Parts</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowPresets(p => !p)}>
              ＋ Quick Add
            </Button>
            {showPresets && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-xl shadow-lg w-72 max-w-[calc(100vw-2rem)] py-1">
                {PRESETS.map(preset => (
                  <button
                    key={preset.description}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex justify-between items-center gap-2"
                    onClick={() => addPreset(preset)}
                  >
                    <span>{preset.description}</span>
                    <span className="text-slate-500 text-xs shrink-0">{formatCurrency(preset.unitPriceCents)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" onClick={addBlankItem}>
            ＋ Add Item
          </Button>
        </div>
      </div>

      {lineItems.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          No items yet — use Quick Add or Add Item above.
        </p>
      ) : isDesktop ? (
        /* ── Desktop table layout ── */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="pb-2 pr-3 w-full">Description</th>
                <th className="pb-2 pr-3 whitespace-nowrap">Type</th>
                <th className="pb-2 pr-3 whitespace-nowrap">Qty</th>
                <th className="pb-2 pr-3 whitespace-nowrap">Hours</th>
                <th className="pb-2 pr-3 whitespace-nowrap">Unit Price</th>
                <th className="pb-2 pr-3 whitespace-nowrap text-right">Total</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map(item => (
                <React.Fragment key={item.id}>
                <tr>
                  <td className="py-2 pr-3">
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value={item.description}
                      onChange={e => updateItem(item.id, { description: e.target.value })}
                      placeholder="Service description"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className="rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value={item.type}
                      onChange={e => updateItem(item.id, { type: e.target.value as LineItem['type'] })}
                    >
                      <option value="labor">Labor</option>
                      <option value="parts">Parts</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                     value={localQuantities[item.id] ?? String(item.quantity)}
                     onChange={e => setLocalQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
                     onBlur={e => handleQuantityBlur(item.id, e.target.value)}
                   />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.25}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value={item.hours ?? ''}
                      placeholder="—"
                      onChange={e => {
                        const val = e.target.value;
                        updateItem(item.id, { hours: val === '' ? undefined : Math.max(0, Number(val)) });
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      inputMode="decimal"
                      value={localPrices[item.id] ?? ''}
                      onChange={e => setLocalPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={e => handlePriceBlur(item.id, e.target.value)}
                      placeholder="$0.00"
                    />
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatCurrency(lineItemTotal(item))}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleNotes(item.id)}
                        className={`transition-colors text-sm leading-none px-1 ${
                          expandedNotes.has(item.id) || item.lineNotes
                            ? 'text-brand-500 hover:text-brand-700'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={expandedNotes.has(item.id) ? 'Hide note' : 'Add note'}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors text-base leading-none"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedNotes.has(item.id) && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-3 pb-3 pt-1">
                      <textarea
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-700 placeholder-slate-400 resize-y min-h-[3.5rem] focus:outline-none focus:ring-1 focus:ring-brand-500"
                        rows={2}
                        placeholder="Add a note for this line item…"
                        value={item.lineNotes ?? ''}
                        onChange={e => updateItem(item.id, { lineNotes: e.target.value || undefined })}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Mobile card layout ── */
        <div className="space-y-3">
          {lineItems.map(item => (
            <React.Fragment key={item.id}>
              <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-slate-50/50">
                {/* Description + action buttons */}
                <div className="flex gap-2 items-center">
                  <input
                    className={`flex-1 ${cellInput}`}
                    value={item.description}
                    onChange={e => updateItem(item.id, { description: e.target.value })}
                    placeholder="Service description"
                  />
                  <button
                    onClick={() => toggleNotes(item.id)}
                    className={`p-2 rounded transition-colors text-base leading-none ${
                      expandedNotes.has(item.id) || item.lineNotes
                        ? 'text-brand-500 hover:text-brand-700'
                        : 'text-slate-300 hover:text-slate-500'
                    }`}
                    title={expandedNotes.has(item.id) ? 'Hide note' : 'Add note'}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded text-slate-400 hover:text-red-500 transition-colors text-xl leading-none"
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>

                {/* Type + Qty + Hours */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    className={`flex-1 min-w-[90px] ${cellInput}`}
                    value={item.type}
                    onChange={e => updateItem(item.id, { type: e.target.value as LineItem['type'] })}
                  >
                    <option value="labor">Labor</option>
                    <option value="parts">Parts</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Qty</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className={`w-16 ${cellInput}`}
                      value={localQuantities[item.id] ?? String(item.quantity)}
                      onChange={e => setLocalQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={e => handleQuantityBlur(item.id, e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Hrs</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.25}
                      className={`w-16 ${cellInput}`}
                      value={item.hours ?? ''}
                      placeholder="—"
                      onChange={e => {
                        const val = e.target.value;
                        updateItem(item.id, { hours: val === '' ? undefined : Math.max(0, Number(val)) });
                      }}
                    />
                  </div>
                </div>

                {/* Unit Price + Total */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 shrink-0">Price</span>
                    <input
                      className={`w-28 ${cellInput}`}
                      inputMode="decimal"
                      value={localPrices[item.id] ?? ''}
                      onChange={e => setLocalPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={e => handlePriceBlur(item.id, e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>
                  <span className="font-semibold text-slate-700 whitespace-nowrap">
                    {formatCurrency(lineItemTotal(item))}
                  </span>
                </div>

                {/* Line notes */}
                {expandedNotes.has(item.id) && (
                  <textarea
                    className="w-full rounded border border-slate-200 px-2 py-2 text-sm text-slate-700 placeholder-slate-400 resize-y min-h-[3.5rem] focus:outline-none focus:ring-1 focus:ring-brand-500"
                    rows={2}
                    placeholder="Add a note for this line item…"
                    value={item.lineNotes ?? ''}
                    onChange={e => updateItem(item.id, { lineNotes: e.target.value || undefined })}
                  />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
