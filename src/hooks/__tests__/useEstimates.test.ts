import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEstimates } from '../useEstimates';
import type { Estimate, LineItem } from '../../types';

const FROZEN_NOW = '2024-06-15T12:00:00.000Z';
const FROZEN_DATE = '2024-06-15';

describe('useEstimates', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_NOW));
  });

  afterEach(() => vi.useRealTimers());

  it('starts with an empty estimates array', () => {
    const { result } = renderHook(() => useEstimates());
    expect(result.current.estimates).toEqual([]);
  });

  it('createEstimate adds a new draft estimate', () => {
    const { result } = renderHook(() => useEstimates());
    act(() => { result.current.createEstimate(); });
    expect(result.current.estimates).toHaveLength(1);
    expect(result.current.estimates[0].status).toBe('draft');
  });

  it('createEstimate returns the created estimate', () => {
    const { result } = renderHook(() => useEstimates());
    let created!: Estimate;
    act(() => { created = result.current.createEstimate(); });
    expect(created.id).toBeTruthy();
    expect(created.date).toBe(FROZEN_DATE);
    expect(created.createdAt).toBe(FROZEN_NOW);
  });

  it('getEstimate finds an estimate by id', () => {
    const { result } = renderHook(() => useEstimates());
    let created!: Estimate;
    act(() => { created = result.current.createEstimate(); });
    expect(result.current.getEstimate(created.id)).toMatchObject({ id: created.id });
  });

  it('getEstimate returns undefined for an unknown id', () => {
    const { result } = renderHook(() => useEstimates());
    expect(result.current.getEstimate('nonexistent')).toBeUndefined();
  });

  it('updateEstimate changes fields and stamps updatedAt', () => {
    const { result } = renderHook(() => useEstimates());
    let created!: Estimate;
    act(() => { created = result.current.createEstimate(); });

    vi.setSystemTime(new Date('2024-06-16T09:00:00.000Z'));
    act(() => { result.current.updateEstimate(created.id, { clientName: 'Jane Smith' }); });

    const updated = result.current.getEstimate(created.id)!;
    expect(updated.clientName).toBe('Jane Smith');
    expect(updated.updatedAt).toBe('2024-06-16T09:00:00.000Z');
  });

  it('updateEstimate does not change other estimates', () => {
    const { result } = renderHook(() => useEstimates());
    let e1!: Estimate;
    let e2!: Estimate;
    act(() => { e1 = result.current.createEstimate(); });
    act(() => { e2 = result.current.createEstimate(); });
    act(() => { result.current.updateEstimate(e1.id, { clientName: 'Jane' }); });
    expect(result.current.getEstimate(e2.id)!.clientName).toBe('');
  });

  it('deleteEstimate removes the correct estimate', () => {
    const { result } = renderHook(() => useEstimates());
    let e1!: Estimate;
    let e2!: Estimate;
    act(() => { e1 = result.current.createEstimate(); });
    act(() => { e2 = result.current.createEstimate(); });
    act(() => { result.current.deleteEstimate(e1.id); });
    expect(result.current.estimates).toHaveLength(1);
    expect(result.current.estimates[0].id).toBe(e2.id);
  });

  it('setStatus updates only the status', () => {
    const { result } = renderHook(() => useEstimates());
    let created!: Estimate;
    act(() => { created = result.current.createEstimate(); });
    act(() => { result.current.setStatus(created.id, 'sent'); });
    expect(result.current.getEstimate(created.id)!.status).toBe('sent');
  });

  it('updateLineItems replaces the line items array', () => {
    const { result } = renderHook(() => useEstimates());
    let created!: Estimate;
    act(() => { created = result.current.createEstimate(); });
    const items: LineItem[] = [
      { id: 'li1', description: 'Tuning', type: 'labor', quantity: 1, unitPriceCents: 18000 },
    ];
    act(() => { result.current.updateLineItems(created.id, items); });
    expect(result.current.getEstimate(created.id)!.lineItems).toEqual(items);
  });
});
