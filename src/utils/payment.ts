import type { OnlinePaymentMethod, PaymentSettings } from '../types';

/** Stable id for the method migrated from the single pre-list online payment fields. */
export const LEGACY_ONLINE_METHOD_ID = 'legacy-online';

/**
 * The online payment methods as stored, for the settings editor.
 *
 * Settings saved before methods were a list have no `onlineMethods` key; they
 * carry one method in the flat `acceptOnlineCard` / `onlineCardName` /
 * `onlineCardUrl` / `showPaymentQr` fields. Those are read back as a one-item
 * list here so old localStorage and backup files keep their method. Once
 * `onlineMethods` exists (even empty) it wins and the flat fields are ignored.
 */
export function getOnlineMethods(payment: PaymentSettings | undefined): OnlinePaymentMethod[] {
  if (!payment) return [];
  if (Array.isArray(payment.onlineMethods)) return payment.onlineMethods;
  if (!payment.acceptOnlineCard) return [];
  return [
    {
      id: LEGACY_ONLINE_METHOD_ID,
      name: payment.onlineCardName || 'Credit Card',
      url: payment.onlineCardUrl || '',
      instructions: '',
      showQr: payment.showPaymentQr,
    },
  ];
}

/**
 * The online methods a document should print: trimmed, with blank rows (an
 * "Add" clicked but never filled in) dropped, and an unnamed method given a
 * generic label. Both invoice renderers — the preview JSX and `pdf.ts` — read
 * this, so they cannot disagree about which methods appear.
 */
export function invoiceOnlineMethods(payment: PaymentSettings | undefined): OnlinePaymentMethod[] {
  return getOnlineMethods(payment)
    .map(m => ({
      ...m,
      name: m.name?.trim() ?? '',
      url: m.url?.trim() ?? '',
      instructions: m.instructions?.trim() ?? '',
    }))
    .filter(m => m.name || m.url || m.instructions)
    .map(m => ({ ...m, name: m.name || 'Online payment' }));
}

/**
 * Whether a method gets a scan-to-pay QR. `showQr` is optional and treated as
 * on when absent. Callers still need `qrMatrix(url)` to be non-null — a link
 * too long to encode falls back to the text link alone.
 */
export function methodShowsQr(method: OnlinePaymentMethod): boolean {
  return !!method.url && method.showQr !== false;
}

/** Labels for the invoice's "Accepted:" line, in display order. */
export function acceptedPaymentLabels(payment: PaymentSettings | undefined): string[] {
  const labels: string[] = [];
  if (payment?.acceptCash) labels.push('Cash');
  if (payment?.acceptCheck) labels.push('Check');
  for (const m of invoiceOnlineMethods(payment)) labels.push(m.name);
  return labels;
}

/** Link text for a method that has a URL. */
export function payLinkLabel(method: OnlinePaymentMethod): string {
  return `Pay with ${method.name}`;
}
