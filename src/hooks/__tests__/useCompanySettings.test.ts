import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanySettings } from '../useCompanySettings';
import { DEFAULT_COMPANY_SETTINGS, DEFAULT_PAYMENT_SETTINGS } from '../../types';

describe('useCompanySettings', () => {
  beforeEach(() => localStorage.clear());

  it('returns full defaults when storage is empty', () => {
    const { result } = renderHook(() => useCompanySettings());
    expect(result.current.settings).toEqual(DEFAULT_COMPANY_SETTINGS);
  });

  it('merges stored value with defaults so missing fields get defaults', () => {
    // Simulate a stored value that predates newer fields (e.g., missing payment)
    const partial = { name: 'Piano Pro', phone: '(555) 000-1234' };
    localStorage.setItem('piano-estimate:company', JSON.stringify(partial));
    const { result } = renderHook(() => useCompanySettings());
    expect(result.current.settings.name).toBe('Piano Pro');
    expect(result.current.settings.phone).toBe('(555) 000-1234');
    // Newly added fields should fall back to defaults, not blow up
    expect(result.current.settings.payment).toEqual(DEFAULT_PAYMENT_SETTINGS);
    expect(result.current.settings.slogan).toBe('');
  });

  it('merges nested payment settings with defaults', () => {
    const partial = {
      name: 'Piano Pro',
      payment: { acceptCash: true },
    };
    localStorage.setItem('piano-estimate:company', JSON.stringify(partial));
    const { result } = renderHook(() => useCompanySettings());
    expect(result.current.settings.payment.acceptCash).toBe(true);
    // Other payment fields should fall back to defaults
    expect(result.current.settings.payment.checkPayableTo).toBe('');
    expect(result.current.settings.payment.acceptCheck).toBe(false);
  });

  it('persists updated settings', () => {
    const { result } = renderHook(() => useCompanySettings());
    act(() => {
      result.current.setSettings({ ...DEFAULT_COMPANY_SETTINGS, name: 'My Piano Co' });
    });
    expect(result.current.settings.name).toBe('My Piano Co');
  });
});
