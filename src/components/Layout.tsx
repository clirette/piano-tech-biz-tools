import { NavLink, Link, Outlet } from 'react-router-dom';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-700 text-white'
      : 'text-brand-100 hover:bg-brand-700 hover:text-white'
  }`;

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-600 shadow-md no-print">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-white font-bold text-base sm:text-lg tracking-tight hover:text-brand-100 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="hidden sm:inline">🎹 Piano Tech Biz Tools</span>
            <span className="sm:hidden">🎹 PTBT</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <NavLink to="/estimates" className={navLink}>
              Estimates
            </NavLink>
            <NavLink to="/invoices" className={navLink}>
              Invoices
            </NavLink>
            <NavLink to="/tools" className={navLink}>
              Tools
            </NavLink>
            <NavLink to="/settings" className={navLink}>
              Settings
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="no-print border-t border-gray-200 py-4">
        <div className="max-w-5xl mx-auto px-4 flex justify-center">
          <a
            href="https://buymeacoffee.com/clirette"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-yellow-900 font-semibold text-sm px-4 py-2 rounded-full shadow-sm transition-colors"
          >
            <span className="text-base">☕</span>
            <span>Buy me a coffee</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
