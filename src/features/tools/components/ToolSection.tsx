import { ReactNode } from 'react';

interface ToolSectionProps {
  id: string;
  title: string;
  emoji: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * One collapsible card in the bench tools accordion. A real button rather than
 * <details> so the open state stays controlled by the page and can be synced
 * with the URL.
 */
export function ToolSection({
  id,
  title,
  emoji,
  subtitle,
  open,
  onToggle,
  children,
}: ToolSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-slate-800">{title}</span>
          {subtitle && <span className="block text-xs text-slate-500 mt-0.5">{subtitle}</span>}
        </span>
        <span
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="px-5 pb-5 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}
