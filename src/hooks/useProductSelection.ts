"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { ProductListItem } from "@/types";

export interface ProductSelectionFilterDeps {
  store?: string;
  q?: string;
  category?: string;
  status?: string;
  userId?: string;
}

export function useProductSelection(deps?: ProductSelectionFilterDeps) {
  const [selectedMap, setSelectedMap] = useState<Map<string, ProductListItem>>(() => new Map());

  const store = deps?.store;
  const q = deps?.q;
  const category = deps?.category;
  const status = deps?.status;
  const userId = deps?.userId;

  const prevDepsRef = useRef<
    | {
        store?: string;
        q?: string;
        category?: string;
        status?: string;
        userId?: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const prev = prevDepsRef.current;
    if (
      prev &&
      (prev.store !== store ||
        prev.q !== q ||
        prev.category !== category ||
        prev.status !== status ||
        prev.userId !== userId)
    ) {
      setSelectedMap(new Map());
    }
    prevDepsRef.current = { store, q, category, status, userId };
  }, [store, q, category, status, userId]);

  const selectedItems = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const count = selectedMap.size;

  const isSelected = useCallback((id: string): boolean => selectedMap.has(id), [selectedMap]);

  const toggle = useCallback((item: ProductListItem): void => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  }, []);

  const togglePage = useCallback((pageItems: readonly ProductListItem[]): void => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      const allSelected = pageItems.length > 0 && pageItems.every((item) => next.has(item.id));
      if (allSelected) {
        for (const item of pageItems) {
          next.delete(item.id);
        }
      } else {
        for (const item of pageItems) {
          next.set(item.id, item);
        }
      }
      return next;
    });
  }, []);

  const isPageSelected = useCallback(
    (pageItems: readonly ProductListItem[]): boolean => {
      return pageItems.length > 0 && pageItems.every((item) => selectedMap.has(item.id));
    },
    [selectedMap],
  );

  const isPagePartiallySelected = useCallback(
    (pageItems: readonly ProductListItem[]): boolean => {
      if (pageItems.length === 0) return false;
      const some = pageItems.some((item) => selectedMap.has(item.id));
      const all = pageItems.every((item) => selectedMap.has(item.id));
      return some && !all;
    },
    [selectedMap],
  );

  const clear = useCallback((): void => {
    setSelectedMap(new Map());
  }, []);

  return {
    selectedItems,
    count,
    isSelected,
    toggle,
    togglePage,
    isPageSelected,
    isPagePartiallySelected,
    clear,
  };
}
