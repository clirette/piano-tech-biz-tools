export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type LineItemType = 'labor' | 'parts';
/** Who a document is made out to. Absent on documents saved by older versions = 'individual'. */
export type ClientType = 'individual' | 'organization';

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
  /** Optional: 'organization' makes `clientName` the organization's name. Omitted = individual */
  clientType?: ClientType;
  /** Optional: person to address at the organization ("Attn:"). Only shown for organizations */
  clientContact?: string;
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

/** One online way to pay (Venmo, Zelle, a card link…), shown on invoices. */
export interface OnlinePaymentMethod {
  id: string;
  /** e.g. "Venmo", "Zelle", "Credit Card" */
  name: string;
  /** Optional link the client opens to pay; also encoded as a QR */
  url?: string;
  /** Optional how-to-pay text, e.g. "Send to (555) 555-0100 — Jane Doe" */
  instructions?: string;
  /** Show a scan-to-pay QR for `url`. Absent = true */
  showQr?: boolean;
}

export interface PaymentSettings {
  acceptCash: boolean;
  acceptCheck: boolean;
  /** Name on the check, shown on invoice */
  checkPayableTo: string;
  /**
   * Online payment methods. Optional: settings saved before this was a list
   * don't have it, and carry a single method in the legacy fields below.
   * Read it through `getOnlineMethods()` in `utils/payment.ts`, which handles
   * that migration — never directly.
   */
  onlineMethods?: OnlinePaymentMethod[];
  /** @deprecated legacy single online method; superseded by `onlineMethods` */
  acceptOnlineCard: boolean;
  /** @deprecated legacy single online method; superseded by `onlineMethods` */
  onlineCardName: string;
  /** @deprecated legacy single online method; superseded by `onlineMethods` */
  onlineCardUrl: string;
  /** @deprecated legacy single online method; superseded by `onlineMethods` */
  showPaymentQr?: boolean;
}

// No `onlineMethods` here on purpose: `useCompanySettings` spreads these
// defaults under the stored value, and a default `[]` would mask a legacy
// stored method that `getOnlineMethods()` needs to migrate.
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
  /** Optional: 'organization' makes `clientName` the organization's name. Omitted = individual */
  clientType?: ClientType;
  /** Optional: person to address at the organization ("Attn:"). Only shown for organizations */
  clientContact?: string;
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

