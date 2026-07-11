/**
 * Matches signed decimal strings with up to two fractional digits so stored
 * PostgreSQL numeric values can be converted to integer cents safely.
 */
const DECIMAL_MONEY_PATTERN = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

export function decimalStringToCents(value: string): number {
  const match = DECIMAL_MONEY_PATTERN.exec(value);
  if (!match) return Number.NaN;

  const [, sign, whole, fraction = ''] = match;
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, '0'), 10);
  return sign === '-' ? -cents : cents;
}
