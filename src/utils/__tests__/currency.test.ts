import { describe, it, expect } from 'vitest';
import { formatCurrency, parseToCents } from '../currency';

describe('formatCurrency', () => {
  it('formats zero', () => expect(formatCurrency(0)).toBe('$0.00'));
  it('formats positive cents', () => expect(formatCurrency(12099)).toBe('$120.99'));
  it('formats large value with comma', () => expect(formatCurrency(100000)).toBe('$1,000.00'));
  it('formats a single cent', () => expect(formatCurrency(1)).toBe('$0.01'));
  it('formats negative cents', () => expect(formatCurrency(-500)).toBe('-$5.00'));
});

describe('parseToCents', () => {
  it('parses a plain number string', () => expect(parseToCents('10')).toBe(1000));
  it('strips dollar sign', () => expect(parseToCents('$10.00')).toBe(1000));
  it('strips commas', () => expect(parseToCents('$1,200.00')).toBe(120000));
  it('parses decimal correctly', () => expect(parseToCents('120.99')).toBe(12099));
  it('parses 50 cents', () => expect(parseToCents('0.50')).toBe(50));
  it('returns NaN for empty string', () => expect(parseToCents('')).toBeNaN());
  it('returns NaN for whitespace only', () => expect(parseToCents('   ')).toBeNaN());
  it('returns NaN for non-numeric string', () => expect(parseToCents('abc')).toBeNaN());
  it('handles negative values', () => expect(parseToCents('-5.00')).toBe(-500));
  // parseFloat('12abc') === 12 — document this known behavior
  it('accepts trailing non-numeric chars (parseFloat behavior)', () =>
    expect(parseToCents('12abc')).toBe(1200));
});
