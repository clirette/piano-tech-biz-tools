export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type LineItemType = 'labor' | 'parts';

export interface LineItem {
  id: string;
  description: string;
  type: LineItemType;
  quantity: number;
  /** Price stored in cents (integer) to avoid float math */
  unitPriceCents: number;
  /** Optional time spent in hours (display/informational only) */
  hours?: number;
  /** Optional notes shown beneath this line item */
  lineNotes?: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pianoMake: string;
  pianoModel: string;
  pianoSerial: string;
  pianoLocation: string;
  date: string; // ISO date string YYYY-MM-DD
  /** Optional: days the estimate stays valid after `date`. Omitted/0 = no expiration */
  validDays?: number;
  lineItems: LineItem[];
  notes: string;
  status: EstimateStatus;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface PaymentSettings {
  acceptCash: boolean;
  acceptCheck: boolean;
  /** Name on the check, shown on invoice */
  checkPayableTo: string;
  acceptOnlineCard: boolean;
  /** e.g. "Stripe", "Venmo", "Zelle" */
  onlineCardName: string;
  /** Payment link shown on invoice */
  onlineCardUrl: string;
  /**
   * Show a scannable QR code for the payment link on the invoice.
   * Optional so settings stored by older versions still load; the call sites
   * treat `undefined` as true.
   */
  showPaymentQr?: boolean;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  acceptCash: false,
  acceptCheck: false,
  checkPayableTo: '',
  acceptOnlineCard: false,
  onlineCardName: '',
  onlineCardUrl: '',
  showPaymentQr: true,
};

export interface CompanySettings {
  name: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logoDataUrl: string; // base64-encoded image
  googleReviewUrl: string;
  showGoogleReviewOnEstimates: boolean;
  showGoogleReviewOnInvoices: boolean;
  payment: PaymentSettings;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: '',
  slogan: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  logoDataUrl: '',
  googleReviewUrl: '',
  showGoogleReviewOnEstimates: true,
  showGoogleReviewOnInvoices: true,
  payment: DEFAULT_PAYMENT_SETTINGS,
};

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pianoMake: string;
  pianoModel: string;
  pianoSerial: string;
  pianoLocation: string;
  date: string; // ISO date string YYYY-MM-DD
  dueDate: string; // ISO date string YYYY-MM-DD
  lineItems: LineItem[];
  notes: string;
  status: InvoiceStatus;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

