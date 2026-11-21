import { describe, it, expect } from 'vitest';
import {
  acceptedPaymentLabels,
  getOnlineMethods,
  invoiceOnlineMethods,
  LEGACY_ONLINE_METHOD_ID,
  methodShowsQr,
} from '../payment';
import { DEFAULT_PAYMENT_SETTINGS, PaymentSettings } from '../../types';

const legacy: PaymentSettings = {
  acceptCash: false,
  acceptCheck: false,
  checkPayableTo: '',
  acceptOnlineCard: true,
  onlineCardName: 'Venmo',
  onlineCardUrl: 'https://venmo.com/u/chase-tunes',
  showPaymentQr: true,
};

describe('getOnlineMethods — legacy migration', () => {
  it('reads the single pre-list method as a one-item list', () => {
    expect(getOnlineMethods(legacy)).toEqual([
      {
        id: LEGACY_ONLINE_METHOD_ID,
        name: 'Venmo',
        url: 'https://venmo.com/u/chase-tunes',
        instructions: '',
        showQr: true,
      },
    ]);
  });

  it('keeps the QR on for legacy settings saved before showPaymentQr existed', () => {
    const old = { ...legacy };
    delete old.showPaymentQr;
    expect(methodShowsQr(getOnlineMethods(old)[0])).toBe(true);
  });

  it('carries an explicit legacy QR opt-out across', () => {
    expect(methodShowsQr(getOnlineMethods({ ...legacy, showPaymentQr: false })[0])).toBe(false);
  });

  it('names an unnamed legacy method "Credit Card", as the old invoice did', () => {
    expect(getOnlineMethods({ ...legacy, onlineCardName: '', onlineCardUrl: '' })[0].name).toBe('Credit Card');
  });

  it('returns nothing when legacy online payment was off', () => {
    expect(getOnlineMethods({ ...legacy, acceptOnlineCard: false })).toEqual([]);
  });

  it('prefers onlineMethods, even empty, over the legacy fields', () => {
    expect(getOnlineMethods({ ...legacy, onlineMethods: [] })).toEqual([]);
  });

  it('handles missing payment settings', () => {
    expect(getOnlineMethods(undefined)).toEqual([]);
  });

  it('the defaults carry no onlineMethods key, so merging them cannot mask a legacy method', () => {
    expect('onlineMethods' in DEFAULT_PAYMENT_SETTINGS).toBe(false);
    expect(getOnlineMethods({ ...DEFAULT_PAYMENT_SETTINGS, ...legacy })).toHaveLength(1);
  });
});

describe('invoiceOnlineMethods', () => {
  it('drops blank rows and trims fields', () => {
    const result = invoiceOnlineMethods({
      ...DEFAULT_PAYMENT_SETTINGS,
      onlineMethods: [
        { id: 'a', name: '  Zelle ', instructions: ' Send to (555) 555-0100 ' },
        { id: 'b', name: '', url: '  ', instructions: '' },
      ],
    });
    expect(result).toEqual([
      { id: 'a', name: 'Zelle', url: '', instructions: 'Send to (555) 555-0100' },
    ]);
  });

  it('gives an unnamed method with content a generic label', () => {
    const [m] = invoiceOnlineMethods({
      ...DEFAULT_PAYMENT_SETTINGS,
      onlineMethods: [{ id: 'a', name: '', url: 'https://pay.example.com' }],
    });
    expect(m.name).toBe('Online payment');
  });
});

describe('methodShowsQr', () => {
  it('needs a link and defaults to on', () => {
    expect(methodShowsQr({ id: 'a', name: 'Venmo', url: 'https://venmo.com/u/x' })).toBe(true);
    expect(methodShowsQr({ id: 'a', name: 'Venmo', url: 'https://venmo.com/u/x', showQr: false })).toBe(false);
    expect(methodShowsQr({ id: 'a', name: 'Zelle', instructions: 'Send to me' })).toBe(false);
  });
});

describe('acceptedPaymentLabels', () => {
  it('lists cash, check, then each online method by name', () => {
    expect(
      acceptedPaymentLabels({
        ...DEFAULT_PAYMENT_SETTINGS,
        acceptCash: true,
        acceptCheck: true,
        onlineMethods: [
          { id: 'a', name: 'Venmo', url: 'https://venmo.com/u/x' },
          { id: 'b', name: 'Zelle', instructions: 'Send to me' },
        ],
      }),
    ).toEqual(['Cash', 'Check', 'Venmo', 'Zelle']);
  });

  it('is empty when nothing is accepted', () => {
    expect(acceptedPaymentLabels(DEFAULT_PAYMENT_SETTINGS)).toEqual([]);
    expect(acceptedPaymentLabels(undefined)).toEqual([]);
  });
});
