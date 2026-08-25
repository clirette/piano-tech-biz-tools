import qrcode from 'qrcode-generator';
import type { PaymentSettings } from '../types';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

/**
 * Whether the invoice should carry a scan-to-pay QR.
 *
 * Lives here rather than at the call sites because the invoice has two
 * independent renderers (the preview JSX and the jsPDF export) and a gate
 * condition duplicated across both is exactly the kind of thing that drifts.
 *
 * `showPaymentQr` is optional, so settings saved before this feature existed
 * have it undefined — `!== false` makes those default to on.
 */
export function shouldShowPaymentQr(payment: PaymentSettings | undefined): boolean {
  return !!payment?.acceptOnlineCard && !!payment.onlineCardUrl && payment.showPaymentQr !== false;
}

/**
 * Builds the QR module matrix for `text` as rows of booleans, where `true` is a
 * dark module. Returns null when there is nothing to encode or the input is too
 * long to fit even the largest symbol, so callers can fall back to plain text
 * instead of throwing.
 *
 * Returning a matrix rather than an image keeps a single source of truth for the
 * two renderers a document has: the preview draws it as SVG rects, the PDF draws
 * it as filled jsPDF rects. Both read the same booleans.
 *
 * Error correction defaults to 'M' — enough redundancy to survive a phone camera
 * pointed at a printed invoice without making the modules so small they blur.
 */
export function qrMatrix(text: string, ecc: QrErrorCorrection = 'M'): boolean[][] | null {
  if (!text || !text.trim()) return null;

  try {
    // Type number 0 lets the library pick the smallest symbol that fits.
    const qr = qrcode(0, ecc);
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const matrix: boolean[][] = [];
    for (let row = 0; row < count; row++) {
      const cells: boolean[] = [];
      for (let col = 0; col < count; col++) {
        cells.push(qr.isDark(row, col));
      }
      matrix.push(cells);
    }
    return matrix;
  } catch {
    // Over-long input (or any encoder failure) degrades to no QR at all.
    return null;
  }
}
