# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A detailed architecture reference already exists at [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — full type shapes, localStorage keys, and route table. Read it for details; this file covers the commands and the invariants that are easy to break.

## Commands

```bash
npm run dev        # Dev server → http://localhost:5173
npm run build      # tsc -b && vite build → dist/
npm run preview    # Serve the production build
npm run lint       # ESLint
npm test           # Vitest, single run
npm run test:watch # Watch mode
npm run coverage   # Coverage report
```

Run one test file or one case (args after `--` go to vitest):

```bash
npm test -- expiration                 # files matching "expiration"
npm test -- expiration -t "leap"       # plus test names matching "leap"
```

Node 26.2.0+ is required (`.nvmrc`; `nvm use`).

## Architecture

Client-side only React 18 + TypeScript + Vite + Tailwind app for piano technicians: build estimates, convert them to invoices, export PDFs. No backend, no accounts — `localStorage` is the entire database. Routing is `HashRouter` so the app works from static hosts and `file://`. Ships as an installable PWA (`vite-plugin-pwa` / Workbox, configured in `vite.config.ts`).

Layout: `src/components/` shared primitives, `src/features/<area>/` pages, `src/hooks/` persistence, `src/utils/` pure helpers, `src/types/index.ts` all shared types and their `DEFAULT_*` values.

### State lives in localStorage, not in a store

There is no context or global store. `useEstimates()`, `useInvoices()`, and `useCompanySettings()` each wrap `useLocalStorage`, which seeds a **separate** `useState` from `localStorage` on every mount. Consequences:

- Two components mounted at once do not see each other's updates. Data flows between routes only because navigation remounts the next page, which re-reads storage.
- `useLocalStorage`'s setter writes to `localStorage` **synchronously** before calling `setState`, so a `navigate()` in the same event handler lands on a route that reads fresh data. Do not "simplify" this into a `useEffect`-only write — the effect fires too late and the next route reads stale data.

### Editors autosave; the Save button is decorative

Every field's `onChange` calls `updateEstimate` / `updateInvoice`, which persists immediately. `handleSave()` only flashes a "✓ Saved" message. Don't add save-gating logic on the assumption that edits are buffered.

### Documents have two independent renderers

Each document is rendered twice, by unrelated code:

1. `features/<area>/<X>PreviewPage.tsx` — JSX for screen and print
2. `utils/pdf.ts` — jsPDF drawing calls for the PDF export

**Any field added to a document must be added to both**, or it will appear on screen and silently vanish from the exported PDF. The same applies to conditional sections — the Google review prompt (needs `googleReviewUrl` non-empty *and* the matching `showGoogleReviewOn*` flag in both places), and the scan-to-pay QR on invoices.

The QR is the worked example of how to keep the two renderers honest: `utils/qr.ts` owns both the gate (`shouldShowPaymentQr`) and the module matrix (`qrMatrix`), so neither the condition nor the bitmap can drift. `components/QrCode.tsx` paints that matrix as SVG rects for the preview; `drawQrMatrix` in `pdf.ts` paints the same matrix as jsPDF rects. `src/utils/__tests__/pdf.test.ts` wraps the jsPDF constructor to count drawn rects, which is what catches the section going missing from the export.

`pdf.ts` does manual layout with a `y` cursor in points — every conditional block must advance `y` by what it drew, including per-line advances for wrapped text (`doc.splitTextToSize`). The line-item description cell is hand-drawn via autoTable's `willDrawCell`/`didDrawCell` hooks so the description can be bold while its notes stay regular; text is pre-wrapped in the font it will be drawn in, because autoTable would otherwise rewrap bold text at normal-weight widths and overflow the cell.

Print output is controlled by the `.no-print` class (see the `@media print` block in `src/index.css`), applied to nav, action bars, and anything screen-only.

## Invariants

- **Money is integer cents.** Store and compute `unitPriceCents`; format with `formatCurrency(cents)` and parse input with `parseToCents()` from `utils/currency.ts`. Never `* 100` / `/ 100` inline.
- **Totals go through `utils/calculations.ts`** — `lineItemTotal`, `documentTotal` (works for both Estimate and Invoice), `laborTotal`, `partsTotal`. `estimateTotal` is deprecated in favor of `documentTotal`, but is still called in several places.
- **Dates are local `YYYY-MM-DD` strings**, built by the manual `localDateString()` helper in the hooks. Never `toISOString().slice(0,10)` — it shifts the day for western time zones. Date arithmetic should step through `new Date(y, m - 1, d + n)` so results stay on the local calendar day (see `utils/expiration.ts`).
- **New document fields should be optional** (`field?: T`). Estimates and invoices are read back from users' existing `localStorage` and from JSON backup files written by older versions; a required field breaks both. `useCompanySettings` handles the same problem by merging stored settings over `DEFAULT_COMPANY_SETTINGS` on read — keep that merge in the hook.
- **No direct `localStorage` calls in components** — go through `useLocalStorage`. (`utils/backup.ts` reads the `lastBackupAt` key directly; that's the one exception.)
- **Backups are versioned envelopes**: `{ version: 1, type: 'full' | 'company' | 'estimate' | 'invoice', ... }`. Import goes through `parseBackupFile(file)`, and importers must check `backup.type` before using it.

## Tests

Vitest 4 + React Testing Library + jsdom, with test files in `__tests__/` directories beside the code they cover.

`src/test/setup.ts` unconditionally replaces `globalThis.localStorage` and `sessionStorage` with in-memory mocks: Node 26 exposes an experimental `localStorage` global that shadows jsdom's inside the vitest vm context and returns `undefined`. It also stubs `window.matchMedia`. Leave both in place.

## Contributing

Per the README, `main` is protected and all changes go through a pull request. The app is deliberately client-side with no backend — keep it that way.
