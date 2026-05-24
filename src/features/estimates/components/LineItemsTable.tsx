import React, { useState } from 'react';
import { LineItem } from '../../../types';
import { Button } from '../../../components/Button';
import { formatCurrency, parseToCents } from '../../../utils/currency';
import { lineItemTotal } from '../../../utils/calculations';
import { generateId } from '../../../utils/generateId';

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
  const [showPresets, setShowPresets] = useState(false);
  // Track which rows have their notes textarea expanded
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(
    () => new Set(lineItems.filter(i => i.lineNotes).map(i => i.id)),
  );

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

  function handlePriceInput(id: string, rawValue: string) {
    // Allow user to type freely; parse on blur
    updateItem(id, { unitPriceCents: parseToCents(rawValue) || 0 });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">Services &amp; Parts</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowPresets(p => !p)}>
              ＋ Quick Add
            </Button>
            {showPresets && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-xl shadow-lg w-72 py-1">
                {PRESETS.map(preset => (
                  <button
                    key={preset.description}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
                    onClick={() => addPreset(preset)}
                  >
                    <span>{preset.description}</span>
                    <span className="text-slate-500 text-xs">{formatCurrency(preset.unitPriceCents)}</span>
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
      ) : (
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
                      min={1}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
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
                      defaultValue={formatCurrency(item.unitPriceCents)}
                      key={item.id + '-price'}
                      onBlur={e => handlePriceInput(item.id, e.target.value)}
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
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
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
      )}
    </div>
  );
}
