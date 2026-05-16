/**
 * Formats a number as a USD currency string with two decimals.
 * `0` → `"$0.00"`, `124.5` → `"$124.50"`.
 */
export function formatUsd(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
