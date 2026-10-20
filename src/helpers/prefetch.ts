import { DEV_PARAM } from "@/constants";

type SearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined
  | null;

function getParam(source: SearchParamsSource, key: string): string | undefined {
  if (!source) return undefined;
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }
  const val = source[key];
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
}

/**
 * Checks if ?fail=1 is requested.
 */
export function isFailRequested(source: SearchParamsSource): boolean {
  return getParam(source, DEV_PARAM.FAIL) === DEV_PARAM.VALUE;
}

/**
 * Checks if ?slow=1 is requested.
 */
export function isSlowRequested(source: SearchParamsSource): boolean {
  return getParam(source, DEV_PARAM.SLOW) === DEV_PARAM.VALUE;
}

/**
 * Determines whether server-side prefetching should be skipped.
 * Returns true if either ?slow=1 or ?fail=1 is present.
 */
export function shouldSkipPrefetch(source: SearchParamsSource): boolean {
  return isFailRequested(source) || isSlowRequested(source);
}
