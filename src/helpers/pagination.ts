import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants";
import type { PageSize } from "@/types";

export function isPageSize(size: unknown): size is PageSize {
  return PAGE_SIZE_OPTIONS.some((option) => option === size);
}

export function normalizePageSize(size?: unknown): PageSize {
  if (isPageSize(size)) {
    return size;
  }
  return DEFAULT_PAGE_SIZE;
}

export function paginate<T>(items: readonly T[], page: number, size: number): T[] {
  const safePage = Math.max(1, page);
  const startIndex = (safePage - 1) * size;
  return items.slice(startIndex, startIndex + size);
}

export function getRangeText(page: number, pageSize: number, total: number): string {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}–${end} of ${total}`;
}
