/**
 * Parse a money string to sen (integer cents).
 * Accepts "68.00", "RM 68", "RM 12.50". Returns null for invalid formats.
 */
export function parseMoneyToSen(input: string): number | null {
  const trimmed = input.trim();

  const withoutPrefix = trimmed.replace(/^RM\s*/i, "");
  const cleaned = withoutPrefix.replace(/,/g, "");

  const parsed = parseFloat(cleaned);

  if (Number.isNaN(parsed)) {
    return null;
  }

  if (parsed < 0) {
    return null;
  }

  const decimalIndex = cleaned.indexOf(".");
  if (decimalIndex !== -1 && cleaned.length - decimalIndex - 1 > 2) {
    return null;
  }

  const sen = Math.round(parsed * 100);

  return sen;
}

/**
 * Format sen to a money string with two decimal places.
 * Optionally includes RM prefix and thousands separators.
 */
export function formatMoney(sen: number, options?: { withCurrency?: boolean }): string {
  const withCurrency = options?.withCurrency ?? false;

  const formatted = new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sen / 100);

  if (withCurrency) {
    return `RM ${formatted}`;
  }

  return formatted;
}
