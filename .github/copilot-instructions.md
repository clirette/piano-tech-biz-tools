# Copilot Instructions

## Project Overview

A client-side React + TypeScript web app that helps piano technicians build, save, and export service estimates to send to clients. No backend — all state is persisted in `localStorage` and estimates are exported as PDFs.

## Tech Stack

- **React 18 + TypeScript** via **Vite**
- **Tailwind CSS** for styling
- State persisted in `localStorage`
- PDF generation for printable/exportable estimates

## Build & Dev Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (tsc -b && vite build) → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Architecture

```
src/
  components/       # Reusable UI components
  features/         # Feature-level components (estimate, company, client)
  hooks/            # Custom React hooks (e.g., useLocalStorage, useEstimate)
  types/            # Shared TypeScript types/interfaces
  utils/            # Pure helpers (formatting, PDF generation, calculations)
  App.tsx
  main.tsx
```

### Key Data Shapes

**Company settings** (stored in `localStorage`):
```ts
interface CompanySettings {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  logoDataUrl?: string;       // base64-encoded image from file upload
  googleReviewUrl?: string;   // if set, shows Google review prompt on estimate
}
```

**Estimate** (stored in `localStorage`, keyed by id):
```ts
interface Estimate {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  pianoMake?: string;
  pianoModel?: string;
  pianoSerial?: string;
  date: string;               // ISO date string
  lineItems: LineItem[];
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
}

interface LineItem {
  id: string;
  description: string;        // e.g. "Tuning", "Pitch Raise", "Regulation"
  type: 'labor' | 'parts';
  quantity: number;
  unitPrice: number;          // stored in cents (integer) to avoid float math
}
```

## Key Conventions

### Prices stored in cents
All monetary values are stored and computed as **integer cents** to avoid floating-point errors. Format for display using a `formatCurrency` utility — never do `* 100` or `/ 100` inline in components.

### localStorage persistence
Use a `useLocalStorage<T>(key, defaultValue)` hook for all persisted state. Do not call `localStorage.getItem/setItem` directly in components.

### Logo upload
Company logo is stored as a base64 `dataUrl` string in `CompanySettings.logoDataUrl`. Use `FileReader.readAsDataURL()` to convert the uploaded file; do not create object URLs (they don't persist across sessions).

### PDF export
PDF generation lives in `src/utils/pdf.ts`. It should produce a self-contained document with the company header (including logo if set), client info, line-item table, subtotal/total, notes, and — if `googleReviewUrl` is set — a Google review prompt section at the bottom.

### Google review section
The Google review prompt is **optional** and only rendered (in the UI preview and PDF) when `CompanySettings.googleReviewUrl` is a non-empty string.

### Component naming
- Feature containers live in `src/features/` and are named `<Feature>Page` or `<Feature>Section`
- Shared primitives (Button, Input, Modal, etc.) live in `src/components/`
