import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoices } from '../useInvoices';
import type { Invoice, LineItem } from '../../types';

const FROZEN_NOW = '2024-01-15T12:00:00.000Z';
const FROZEN_DATE = '2024-01-15';
const FROZEN_DUE = '2024-02-14'; // 30 days after Jan 15

describe('useInvoices', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_NOW));
  });

  afterEach(() => { vi.useRealTimers(); });

  it('starts with an empty invoices array', () => {
    const { result } = renderHook(() => useInvoices());
    expect(result.current.invoices).toEqual([]);
  });

  it('createInvoice adds a new draft invoice with correct dates', () => {
    const { result } = renderHook(() => useInvoices());
    act(() => { result.current.createInvoice(); });
    expect(result.current.invoices).toHaveLength(1);
    const inv = result.current.invoices[0];
    expect(inv.status).toBe('draft');
    expect(inv.date).toBe(FROZEN_DATE);
    expect(inv.dueDate).toBe(FROZEN_DUE);
  });

  it('createInvoiceFromEstimate pre-populates client and piano fields', () => {
    const { result } = renderHook(() => useInvoices());
    const fields = {
      clientName: 'Jane Smith',
      clientEmail: 'jane@example.com',
      clientPhone: '(555) 123-4567',
      pianoMake: 'Steinway',
      pianoModel: 'Model D',
      pianoSerial: 'ABC123',
      pianoLocation: 'Living room',
      lineItems: [] as LineItem[],
      notes: 'Handle carefully',
    };
    let created!: Invoice;
    act(() => { created = result.current.createInvoiceFromEstimate(fields); });
    expect(created.clientName).toBe('Jane Smith');
    expect(created.pianoMake).toBe('Steinway');
    expect(created.notes).toBe('Handle carefully');
    expect(created.status).toBe('draft');
    expect(created.dueDate).toBe(FROZEN_DUE);
  });

  it('createInvoiceFromEstimate copies line items', () => {
    const { result } = renderHook(() => useInvoices());
    const lineItems: LineItem[] = [
      { id: 'li1', description: 'Tuning', type: 'labor', quantity: 1, unitPriceCents: 18000 },
    ];
    let created!: Invoice;
    act(() => {
      created = result.current.createInvoiceFromEstimate({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        pianoMake: '',
        pianoModel: '',
        pianoSerial: '',
        pianoLocation: '',
        lineItems,
        notes: '',
      });
    });
    expect(created.lineItems).toEqual(lineItems);
  });

  it('dueDate is 30 days after invoice date (month-end rollover)', () => {
    // Jan 31 + 30 days = Mar 1 (or Mar 2 in leap year logic via Date arithmetic)
    vi.setSystemTime(new Date('2024-01-31T12:00:00.000Z'));
    const { result } = renderHook(() => useInvoices());
    act(() => { result.current.createInvoice(); });
    expect(result.current.invoices[0].dueDate).toBe('2024-03-01');
  });

  it('updateInvoice changes fields and stamps updatedAt', () => {
    const { result } = renderHook(() => useInvoices());
    let created!: Invoice;
    act(() => { created = result.current.createInvoice(); });

    vi.setSystemTime(new Date('2024-01-20T10:00:00.000Z'));
    act(() => { result.current.updateInvoice(created.id, { clientName: 'Bob' }); });

    const updated = result.current.getInvoice(created.id)!;
    expect(updated.clientName).toBe('Bob');
    expect(updated.updatedAt).toBe('2024-01-20T10:00:00.000Z');
  });

  it('deleteInvoice removes the correct invoice', () => {
    const { result } = renderHook(() => useInvoices());
    let i1!: Invoice;
    let i2!: Invoice;
    act(() => { i1 = result.current.createInvoice(); });
    act(() => { i2 = result.current.createInvoice(); });
    act(() => { result.current.deleteInvoice(i1.id); });
    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].id).toBe(i2.id);
  });

  it('setStatus updates invoice status', () => {
    const { result } = renderHook(() => useInvoices());
    let created!: Invoice;
    act(() => { created = result.current.createInvoice(); });
    act(() => { result.current.setStatus(created.id, 'paid'); });
    expect(result.current.getInvoice(created.id)!.status).toBe('paid');
  });

  it('getInvoice returns undefined for an unknown id', () => {
    const { result } = renderHook(() => useInvoices());
    expect(result.current.getInvoice('nonexistent')).toBeUndefined();
  });
});
