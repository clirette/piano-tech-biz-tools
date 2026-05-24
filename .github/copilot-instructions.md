# Copilot Instructions

## Project Overview

A client-side React + TypeScript web app that helps piano technicians build, save, and export service estimates and invoices. No backend — all state is persisted in `localStorage` and documents are exported as PDFs.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (tsc -b && vite build) → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

There is no test suite.

## Architecture

```
src/
  components/       # Shared primitives: Button, Input, Badge, Layout, etc.
  features/         # Feature pages: estimates/, invoices/, company/, home/
  hooks/            # useLocalStorage, useEstimates, useInvoices, useCompanySettings
  types/            # index.ts — all shared types and default values
  utils/            # Pure helpers: currency, calculations, pdf, backup, generateId
  App.tsx           # Route definitions (HashRouter)
  main.tsx
```

### Routing

Uses `HashRouter` (not `BrowserRouter`) so the app works from `file://` and static hosts without server-side routing. Routes:

```
/                     → HomePage
/estimates            → EstimatesPage
/estimates/:id        → EstimateEditorPage
/estimates/:id/preview → EstimatePreviewPage
/invoices             → InvoicesPage
/invoices/:id         → InvoiceEditorPage
/invoices/:id/preview → InvoicePreviewPage
/settings             → CompanySettingsPage
```

### Key Data Shapes (`src/types/index.ts`)

```ts
interface LineItem {
  id: string;
  description: string;
  type: 'labor' | 'parts';
  quantity: number;
  unitPriceCents: number;  // integer cents — never floats
  hours?: number;          // informational only
  lineNotes?: string;
}

interface Estimate {
  id: string;
  estimateNumber: string;
  clientName: string; clientEmail: string; clientPhone: string;
  pianoMake: string; pianoModel: string; pianoSerial: string; pianoLocation: string;
  date: string;       // YYYY-MM-DD (local date, not UTC)
  lineItems: LineItem[];
  notes: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  createdAt: string; updatedAt: string; // ISO datetime
}

interface Invoice {
  // same client/piano fields as Estimate, plus:
  invoiceNumber: string;
  dueDate: string;  // defaults to date + 30 days
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

interface CompanySettings {
  name: string; slogan: string; phone: string; email: string;
  address: string; website: string;
  logoDataUrl: string;        // base64 — use FileReader.readAsDataURL(), not object URLs
  googleReviewUrl: string;
  showGoogleReviewOnEstimates: boolean;
  showGoogleReviewOnInvoices: boolean;
  payment: PaymentSettings;   // cash / check / online card toggles + details
}
```

`DEFAULT_COMPANY_SETTINGS` and `DEFAULT_PAYMENT_SETTINGS` are exported from `src/types/index.ts`.

### localStorage Keys

All keys are namespaced under `piano-estimate:`:

| Key | Contents |
|-----|----------|
| `piano-estimate:company` | `CompanySettings` |
| `piano-estimate:estimates` | `Estimate[]` |
| `piano-estimate:invoices` | `Invoice[]` |
| `piano-estimate:lastBackupAt` | ISO datetime string |

## Key Conventions

### Prices are integer cents
`unitPriceCents` stores and computes monetary values as integer cents. Use `formatCurrency(cents)` from `src/utils/currency.ts` for display, and `parseToCents(dollarString)` to convert user input. Never do `* 100` / `/ 100` inline.

### All calculations go through `src/utils/calculations.ts`
- `lineItemTotal(item)` — quantity × unitPriceCents
- `documentTotal(doc)` — sum of all line items (works for both Estimate and Invoice)
- `laborTotal(doc)` / `partsTotal(doc)` — subtotals by type
- `estimateTotal` is deprecated; use `documentTotal` instead

### localStorage via hook only
Use `useLocalStorage<T>(key, defaultValue)` for all persisted state. Never call `localStorage.getItem/setItem` directly in components.

### `useCompanySettings` merges with defaults
`useCompanySettings` merges the stored value with `DEFAULT_COMPANY_SETTINGS` on read, so adding new fields to `CompanySettings` won't break existing stored data. Keep this merge in the hook, not in components.

### Invoices can be created from estimates
`useInvoices` exposes `createInvoiceFromEstimate(fields)` which pre-populates client/piano data from an estimate. Use this instead of `createInvoice()` when converting.

### Google review prompt
Rendered only when `googleReviewUrl` is non-empty **and** the matching flag (`showGoogleReviewOnEstimates` or `showGoogleReviewOnInvoices`) is `true`. Check both conditions in the preview UI and in PDF generation.

### PDF generation (`src/utils/pdf.ts`)
Uses `jspdf` + `jspdf-autotable`. The PDF includes: company header (logo if set), document title/number/date, Bill To + Piano columns, line-item table, totals, notes, optional Google review section, and — for invoices — payment instructions from `PaymentSettings`.

### Backup/restore (`src/utils/backup.ts`)
JSON export/import for full data backup and per-document backup. All backup objects carry `{ version: 1, type: 'full' | 'company' | 'estimate' | 'invoice' }`. Use `parseBackupFile(file)` to read and validate an import file. `daysSinceLastBackup()` reads from `piano-estimate:lastBackupAt`.

### Component naming
- Feature containers: `src/features/<area>/<Name>Page.tsx` or `<Name>Section.tsx`
- Shared primitives: `src/components/`

### Date handling
Dates are stored as `YYYY-MM-DD` local dates, created with a manual `localDateString()` helper (not `toISOString().slice(0,10)`) to avoid UTC offset shifting the displayed day.
