/** Format integer cents to a USD currency string, e.g. 12099 → "$120.99" */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Parse a user-entered dollar string to cents.
 * Returns NaN if the input cannot be parsed.
 */
export function parseToCents(dollarString: string): number {
  const cleaned = dollarString.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return NaN;
  return Math.round(parsed * 100);
}
