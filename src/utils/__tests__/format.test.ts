import { describe, it, expect } from 'vitest';
import { formatPhone } from '../format';

describe('formatPhone', () => {
  it('returns empty string for empty input', () => expect(formatPhone('')).toBe(''));
  it('formats 1–3 digits with open paren', () => expect(formatPhone('555')).toBe('(555'));
  it('formats 4 digits with area code and space', () => expect(formatPhone('5551')).toBe('(555) 1'));
  it('formats 6 digits', () => expect(formatPhone('555123')).toBe('(555) 123'));
  it('formats full 10-digit number', () =>
    expect(formatPhone('5551234567')).toBe('(555) 123-4567'));
  it('strips non-digits from already-formatted string', () =>
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567'));
  it('ignores digits beyond 10', () =>
    expect(formatPhone('55512345678')).toBe('(555) 123-4567'));
  it('strips non-digit characters', () =>
    expect(formatPhone('abc5551234567xyz')).toBe('(555) 123-4567'));
  // A pasted 11-digit US number with leading 1 uses the first 10 digits (documents behavior)
  it('handles 11-digit number with leading 1 by taking first 10 digits', () =>
    expect(formatPhone('15551234567')).toBe('(155) 512-3456'));
});
