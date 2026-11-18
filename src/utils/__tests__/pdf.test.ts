import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_COMPANY_SETTINGS, CompanySettings, Estimate, Invoice } from '../../types';

// The invoice PDF is the second, independent renderer of a document. These tests
// guard the failure mode CLAUDE.md warns about: a section that renders on screen
// and silently vanishes from the export.
//
// jsPDF assigns its methods as own properties on each instance rather than on
// the prototype, so there is nothing to spy on there. Instead we wrap the
// constructor and patch each instance as it is built: `rect` records its
// arguments, and `save` is neutered so jsdom does not attempt a download.

const rectCalls: number[][] = [];
const textCalls: string[] = [];

vi.mock('jspdf', async importOriginal => {
  const actual = await importOriginal<typeof import('jspdf')>();
  const Real = actual.default;

  class RecordingPdf extends Real {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      super(...(args as [any]));
      const realRect = this.rect.bind(this);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.rect = (...a: any[]) => {
        rectCalls.push(a as number[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (realRect as any)(...a);
      };
      const realText = this.text.bind(this);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.text = ((...a: any[]) => {
        textCalls.push(...[a[0]].flat().map(String));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (realText as any)(...a);
      }) as typeof this.text;
      // `save` is overloaded (it can return a Promise), so cast rather than
      // try to satisfy both signatures with a stub.
      this.save = ((): RecordingPdf => this) as typeof this.save;
    }
  }

  return { ...actual, default: RecordingPdf, jsPDF: RecordingPdf };
});

const { generateEstimatePdf, generateInvoicePdf } = await import('../pdf');

const invoice: Invoice = {
  id: 'inv-1',
  invoiceNumber: 'INV-014',
  clientName: 'Sarah Chen',
  clientEmail: 'sarah@example.com',
  clientPhone: '(555) 019-4412',
  pianoMake: 'Steinway & Sons',
  pianoModel: 'M',
  pianoSerial: '412887',
  pianoLocation: 'Living room',
  date: '2026-08-24',
  dueDate: '2026-09-23',
  lineItems: [
    { id: 'li1', description: 'Standard tuning', type: 'labor', quantity: 1, unitPriceCents: 18500 },
  ],
  notes: 'Next service in 6 months.',
  status: 'sent',
  createdAt: '2026-08-24T10:00:00.000Z',
  updatedAt: '2026-08-24T10:00:00.000Z',
};

function companyWith(payment: Partial<CompanySettings['payment']>): CompanySettings {
  return {
    ...DEFAULT_COMPANY_SETTINGS,
    name: 'Lirette Piano Service',
    payment: {
      ...DEFAULT_COMPANY_SETTINGS.payment,
      acceptOnlineCard: true,
      onlineCardName: 'Venmo',
      onlineCardUrl: 'https://venmo.com/u/chase-tunes',
      ...payment,
    },
  };
}

/**
 * Rects that are QR modules rather than page furniture. A module is
 * PAYMENT_QR_SIZE / (count + 2*quietZone) points tall — under 3pt for any
 * symbol we draw — whereas table row fills are 15pt and up.
 */
function qrModuleRects() {
  return rectCalls.filter(call => {
    const h = Number(call[3]);
    return h > 0 && h < 5;
  });
}

beforeEach(() => {
  rectCalls.length = 0;
  textCalls.length = 0;
});

describe('generateInvoicePdf — payment QR', () => {
  it('draws the QR modules when it is on', () => {
    generateInvoicePdf(invoice, companyWith({ showPaymentQr: true }));
    // A 29x29 symbol coalesced into horizontal runs is well over 50 rects.
    expect(qrModuleRects().length).toBeGreaterThan(50);
  });

  it('draws no QR modules when it is switched off', () => {
    generateInvoicePdf(invoice, companyWith({ showPaymentQr: false }));
    expect(qrModuleRects().length).toBe(0);
  });

  it('still draws the QR when showPaymentQr is absent (legacy settings)', () => {
    const company = companyWith({});
    delete (company.payment as { showPaymentQr?: boolean }).showPaymentQr;
    generateInvoicePdf(invoice, company);
    expect(qrModuleRects().length).toBeGreaterThan(50);
  });

  it('draws no QR when online card payment is off', () => {
    generateInvoicePdf(invoice, companyWith({ acceptOnlineCard: false }));
    expect(qrModuleRects().length).toBe(0);
  });

  it('draws no QR when there is no payment link', () => {
    generateInvoicePdf(invoice, companyWith({ onlineCardUrl: '' }));
    expect(qrModuleRects().length).toBe(0);
  });

  it('draws no QR, and does not throw, when the URL is too long to encode', () => {
    expect(() =>
      generateInvoicePdf(
        invoice,
        companyWith({ onlineCardUrl: 'https://x.co/' + 'y'.repeat(5000) }),
      ),
    ).not.toThrow();
    expect(qrModuleRects().length).toBe(0);
  });

  it('does not throw for an invoice with no payment methods at all', () => {
    expect(() =>
      generateInvoicePdf(invoice, {
        ...DEFAULT_COMPANY_SETTINGS,
        payment: { ...DEFAULT_COMPANY_SETTINGS.payment, acceptOnlineCard: false },
      }),
    ).not.toThrow();
  });

  it('keeps every QR module on the page for a long invoice', () => {
    const long: Invoice = {
      ...invoice,
      notes: 'Detail. '.repeat(120),
      lineItems: Array.from({ length: 20 }, (_, i) => ({
        id: `li${i}`,
        description: `Service item ${i}`,
        type: 'labor' as const,
        quantity: 1,
        unitPriceCents: 12000,
        lineNotes: 'Notes about this item that wrap onto more than one line.',
      })),
    };
    generateInvoicePdf(long, companyWith({ showPaymentQr: true }));

    // A letter page is 792pt tall. pdf.ts has no page-break handling, so this is
    // the guard that the QR block does not march off the bottom.
    const modules = qrModuleRects();
    expect(modules.length).toBeGreaterThan(50);
    for (const call of modules) {
      const y = Number(call[1]);
      const h = Number(call[3]);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + h).toBeLessThanOrEqual(792);
    }
  });
});

describe('client block — organizations', () => {
  const org = {
    clientName: 'Riverside Country Club',
    clientType: 'organization' as const,
    clientContact: 'Dana Ruiz',
  };

  it('prints the organization name and an Attn line on the invoice', () => {
    generateInvoicePdf({ ...invoice, ...org }, companyWith({}));
    expect(textCalls).toContain('Riverside Country Club');
    expect(textCalls).toContain('Attn: Dana Ruiz');
  });

  it('prints the Attn line on the estimate', () => {
    const estimate: Estimate = {
      id: invoice.id,
      estimateNumber: 'EST-003',
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone,
      pianoMake: invoice.pianoMake,
      pianoModel: invoice.pianoModel,
      pianoSerial: invoice.pianoSerial,
      pianoLocation: invoice.pianoLocation,
      date: invoice.date,
      lineItems: invoice.lineItems,
      notes: invoice.notes,
      status: 'sent',
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      ...org,
    };
    generateEstimatePdf(estimate, companyWith({}));
    expect(textCalls).toContain('Attn: Dana Ruiz');
  });

  it('prints no Attn line for an individual, even with a leftover contact', () => {
    generateInvoicePdf({ ...invoice, clientType: 'individual', clientContact: 'Dana Ruiz' }, companyWith({}));
    expect(textCalls.some(t => t.startsWith('Attn:'))).toBe(false);
  });
});
