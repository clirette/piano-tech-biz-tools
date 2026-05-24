# 🎹 Piano Tech Biz Tools

A free, offline-friendly web app for piano technicians. Build itemized estimates, convert them to invoices, track payment status, and export professional PDFs — all without an account or a server.

**[→ Use it at pianotechbiztools.com](https://pianotechbiztools.com)**

## Features

- **Estimates** — Build line-item estimates with labor and parts, per-item notes, and a professional PDF export
- **Invoices** — Convert estimates to invoices with one click; track draft / sent / paid / overdue status
- **Company settings** — Add your logo, slogan, contact info, Google review link, and accepted payment methods; they appear automatically on all documents
- **Backup & restore** — Export all your data as a JSON file and re-import it at any time; your data never leaves your browser

## Running locally

**Requirements:** Node.js 18+

```bash
git clone https://github.com/clirette/piano-tech-biz-tools.git
cd piano-tech-biz-tools
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
```

## Contributing

Contributions are welcome! A few things to know before you start:

- **Open an issue first** for anything non-trivial so we can agree on the approach before you spend time on it
- **All changes go through a pull request** — direct pushes to `main` are not allowed
- The app is intentionally **client-side only** with no backend; please keep it that way
- All monetary values are stored as **integer cents** — use the `formatCurrency` / `parseToCents` utilities in `src/utils/currency.ts`, never do `/ 100` or `* 100` inline
- See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for a full architecture overview and code conventions

## License

[MIT](LICENSE)
