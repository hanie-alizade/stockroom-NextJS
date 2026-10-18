/**
 * Parse a money string to sen (integer cents).
 * Accepts "68.00", "RM 68", "RM 12.50". Returns null for invalid formats.
 */
export function parseMoneyToSen(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(?:rm\s*)?([0-9,]+)(?:\.([0-9]{1,2}))?$/i);
  if (!match) {
    return null;
  }

  const wholeStr = match[1];
  const decStr = match[2];

  if (wholeStr.includes(",")) {
    if (!/^\d{1,3}(?:,\d{3})+$/.test(wholeStr)) {
      return null;
    }
  }

  const whole = Number.parseInt(wholeStr.replace(/,/g, ""), 10);
  const dec = Number.parseInt((decStr ?? "").padEnd(2, "0"), 10);

  return whole * 100 + dec;
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
