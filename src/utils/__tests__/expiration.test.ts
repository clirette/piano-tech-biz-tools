import { describe, it, expect } from 'vitest';
import { expirationDate, validityStatement, VALID_DAYS_OPTIONS } from '../expiration';

describe('expirationDate', () => {
  it('adds the validity window to the estimate date', () => {
    expect(expirationDate('2026-08-24', 30)).toBe('2026-09-23');
  });

  it('rolls over month and year boundaries', () => {
    expect(expirationDate('2026-12-20', 30)).toBe('2027-01-19');
  });

  it('handles leap days', () => {
    expect(expirationDate('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('returns null when no validity window is set', () => {
    expect(expirationDate('2026-08-24', undefined)).toBeNull();
    expect(expirationDate('2026-08-24', 0)).toBeNull();
    expect(expirationDate('2026-08-24', -5)).toBeNull();
  });

  it('returns null for an unparseable date', () => {
    expect(expirationDate('', 30)).toBeNull();
  });
});

describe('validityStatement', () => {
  it('pluralizes the day count', () => {
    expect(validityStatement(30, '09/23/2026')).toBe(
      'This estimate is valid for 30 days from the date of issue, through 09/23/2026.',
    );
    expect(validityStatement(1, '08/25/2026')).toContain('1 day from');
  });
});

describe('VALID_DAYS_OPTIONS', () => {
  it('offers "no expiration" as the first choice', () => {
    expect(VALID_DAYS_OPTIONS[0]).toEqual({ days: 0, label: 'No expiration' });
  });
});
