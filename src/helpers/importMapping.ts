import {
  IMPORT_FIELD_ALIASES,
  IMPORT_REQUIRED_FIELDS,
} from "@/constants";
import type { ImportField, ImportMapping } from "@/types";

/**
 * Normalizes a column name or alias by trimming, converting to lower case,
 * and stripping spaces, hyphens, and underscores.
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, "");
}

/**
 * Strips parentheses and brackets including their contents.
 */
function stripBrackets(name: string): string {
  return name.replace(/\([^)]*\)|\[[^\]]*\]/g, "");
}

/**
 * Automatically maps CSV headers to Stockroom import fields using normalized alias matching.
 * Matches full names first, then falls back to ignoring text in brackets.
 * Each field and column is used at most once; first match wins.
 */
export function autoMatchColumns(headers: readonly string[]): ImportMapping {
  const result: ImportMapping = {};
  const matchedFields = new Set<ImportField>();
  const matchedColumns = new Set<string>();

  // Normalized alias cache per field
  const normalizedAliases = new Map<ImportField, string[]>();
  for (const field of IMPORT_REQUIRED_FIELDS) {
    const aliases = IMPORT_FIELD_ALIASES[field] ?? [];
    normalizedAliases.set(field, aliases.map(normalizeColumnName));
  }

  // Pass 1: Try full normalized header match
  for (const header of headers) {
    if (matchedColumns.has(header)) continue;
    const normalized = normalizeColumnName(header);
    if (!normalized) continue;

    for (const field of IMPORT_REQUIRED_FIELDS) {
      if (matchedFields.has(field)) continue;
      const aliases = normalizedAliases.get(field) ?? [];
      if (aliases.includes(normalized)) {
        result[field] = header;
        matchedFields.add(field);
        matchedColumns.add(header);
        break;
      }
    }
  }

  // Pass 2: For unmatched headers and fields, try ignoring text in brackets
  for (const header of headers) {
    if (matchedColumns.has(header)) continue;
    const stripped = stripBrackets(header);
    if (stripped === header) continue;

    const normalized = normalizeColumnName(stripped);
    if (!normalized) continue;

    for (const field of IMPORT_REQUIRED_FIELDS) {
      if (matchedFields.has(field)) continue;
      const aliases = normalizedAliases.get(field) ?? [];
      if (aliases.includes(normalized)) {
        result[field] = header;
        matchedFields.add(field);
        matchedColumns.add(header);
        break;
      }
    }
  }

  return result;
}
