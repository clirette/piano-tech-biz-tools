import { describe, it, expect } from 'vitest';
import { lineItemTotal, documentTotal, laborTotal, partsTotal } from '../calculations';
import type { LineItem } from '../../types';

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'test-id',
    description: 'Test',
    type: 'labor',
    quantity: 1,
    unitPriceCents: 10000,
    ...overrides,
  };
}

describe('lineItemTotal', () => {
  it('multiplies quantity by unit price', () =>
    expect(lineItemTotal(makeItem({ quantity: 3, unitPriceCents: 5000 }))).toBe(15000));
  it('returns 0 for zero unit price', () =>
    expect(lineItemTotal(makeItem({ unitPriceCents: 0 }))).toBe(0));
  it('handles quantity greater than 1', () =>
    expect(lineItemTotal(makeItem({ quantity: 88, unitPriceCents: 300 }))).toBe(26400));
});

describe('documentTotal', () => {
  it('sums all line items', () => {
    const items = [makeItem({ unitPriceCents: 10000 }), makeItem({ unitPriceCents: 5000 })];
    expect(documentTotal({ lineItems: items })).toBe(15000);
  });
  it('returns 0 for empty item list', () =>
    expect(documentTotal({ lineItems: [] })).toBe(0));
  it('accounts for quantity in each item', () => {
    const items = [makeItem({ quantity: 2, unitPriceCents: 3000 })];
    expect(documentTotal({ lineItems: items })).toBe(6000);
  });
});

describe('laborTotal and partsTotal', () => {
  const items = [
    makeItem({ type: 'labor', unitPriceCents: 10000 }),
    makeItem({ type: 'parts', unitPriceCents: 5000 }),
    makeItem({ type: 'labor', quantity: 2, unitPriceCents: 3000 }),
  ];

  it('sums only labor items', () => expect(laborTotal({ lineItems: items })).toBe(16000));
  it('sums only parts items', () => expect(partsTotal({ lineItems: items })).toBe(5000));
  it('labor + parts equals document total', () =>
    expect(laborTotal({ lineItems: items }) + partsTotal({ lineItems: items })).toBe(
      documentTotal({ lineItems: items }),
    ));
  it('returns 0 when no items of that type', () => {
    const laborOnly = [makeItem({ type: 'labor' })];
    expect(partsTotal({ lineItems: laborOnly })).toBe(0);
  });
});
