import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());

  it('returns the default value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));
    expect(result.current[0]).toBe(42);
  });

  it('reads an existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify(99));
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    expect(result.current[0]).toBe(99);
  });

  it('persists the updated value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe(42);
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('test-key', []));
    act(() => result.current[1](prev => [...prev, 1]));
    act(() => result.current[1](prev => [...prev, 2]));
    expect(result.current[0]).toEqual([1, 2]);
  });

  it('falls back to default when stored value is corrupted JSON', () => {
    localStorage.setItem('test-key', 'not-valid-json{{{');
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists objects correctly', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('test-key', {}),
    );
    act(() => result.current[1]({ name: 'Piano Pro' }));
    expect(result.current[0]).toEqual({ name: 'Piano Pro' });
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'Piano Pro' });
  });
});
