/** Choices offered for how long an estimate stays valid. 0 = no expiration. */
export const VALID_DAYS_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: 'No expiration' },
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
];

/**
 * Returns the ISO date (YYYY-MM-DD) an estimate expires, or null when it has no
 * expiration. Dates are stepped in local time so the result matches the calendar
 * day the technician sees, regardless of time zone.
 */
export function expirationDate(isoDate: string, validDays?: number): string | null {
  if (!validDays || validDays <= 0) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(year, month - 1, day + validDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Sentence shown on the estimate itself, e.g. "This estimate is valid for 30 days…" */
export function validityStatement(validDays: number, expiresFormatted: string): string {
  const unit = validDays === 1 ? 'day' : 'days';
  return `This estimate is valid for ${validDays} ${unit} from the date of issue, through ${expiresFormatted}.`;
}
