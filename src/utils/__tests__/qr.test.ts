import { describe, it, expect } from 'vitest';
import { qrMatrix, shouldShowPaymentQr } from '../qr';
import type { PaymentSettings } from '../../types';

describe('qrMatrix', () => {
  it('returns a square matrix for a URL', () => {
    const m = qrMatrix('https://venmo.com/u/chase-tunes');
    expect(m).not.toBeNull();
    const size = m!.length;
    expect(size).toBeGreaterThan(0);
    for (const row of m!) {
      expect(row).toHaveLength(size);
    }
  });

  it('produces a valid QR module count (21 + 4n, capped at 177)', () => {
    const m = qrMatrix('https://example.com/pay');
    const size = m!.length;
    expect((size - 21) % 4).toBe(0);
    expect(size).toBeGreaterThanOrEqual(21);
    expect(size).toBeLessThanOrEqual(177);
  });

  it('draws a well-formed finder pattern in each of the three corners', () => {
    const m = qrMatrix('https://example.com/pay')!;
    const last = m.length - 1;

    // A finder pattern is a 7x7 block: dark ring, light ring, dark 3x3 core.
    const finderOk = (top: number, left: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const ring = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          expect(m[top + r][left + c]).toBe(ring || core);
        }
      }
    };

    finderOk(0, 0);
    finderOk(0, last - 6);
    finderOk(last - 6, 0);
  });

  it('is deterministic for the same input', () => {
    const a = qrMatrix('https://example.com/pay');
    const b = qrMatrix('https://example.com/pay');
    expect(a).toEqual(b);
  });

  it('grows the symbol as the input gets longer', () => {
    const short = qrMatrix('https://a.co')!;
    const long = qrMatrix('https://example.com/' + 'x'.repeat(300))!;
    expect(long.length).toBeGreaterThan(short.length);
  });

  it('uses a denser symbol at higher error correction', () => {
    const low = qrMatrix('https://example.com/pay', 'L')!;
    const high = qrMatrix('https://example.com/pay', 'H')!;
    expect(high.length).toBeGreaterThanOrEqual(low.length);
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(qrMatrix('')).toBeNull();
    expect(qrMatrix('   ')).toBeNull();
  });

  it('returns null instead of throwing when the input cannot be encoded', () => {
    // Well past the ~2953 byte ceiling of a version 40 byte-mode symbol.
    expect(() => qrMatrix('x'.repeat(10000))).not.toThrow();
    expect(qrMatrix('x'.repeat(10000))).toBeNull();
  });
});

describe('shouldShowPaymentQr', () => {
  const base: PaymentSettings = {
    acceptCash: false,
    acceptCheck: false,
    checkPayableTo: '',
    acceptOnlineCard: true,
    onlineCardName: 'Venmo',
    onlineCardUrl: 'https://venmo.com/u/chase-tunes',
    showPaymentQr: true,
  };

  it('shows the QR when online payment is on with a link', () => {
    expect(shouldShowPaymentQr(base)).toBe(true);
  });

  it('defaults to on for settings saved before the flag existed', () => {
    // The backward-compat case: older localStorage and backup files have no
    // showPaymentQr key at all, and must still get a QR.
    const legacy = { ...base };
    delete legacy.showPaymentQr;
    expect(shouldShowPaymentQr(legacy)).toBe(true);
  });

  it('hides the QR when explicitly switched off', () => {
    expect(shouldShowPaymentQr({ ...base, showPaymentQr: false })).toBe(false);
  });

  it('hides the QR when there is no link or online payment is off', () => {
    expect(shouldShowPaymentQr({ ...base, onlineCardUrl: '' })).toBe(false);
    expect(shouldShowPaymentQr({ ...base, acceptOnlineCard: false })).toBe(false);
  });

  it('hides the QR when payment settings are missing entirely', () => {
    expect(shouldShowPaymentQr(undefined)).toBe(false);
  });
});
