import "server-only";

import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PERIOD,
  PERIOD_DAYS,
} from "@/constants";
import type { Repository } from "@/server/repositories";
import type {
  Movement,
  MovementListResponse,
  MovementPeriod,
  MovementType,
  StoreId,
} from "@/types";

export async function getProductMovements(
  repo: Repository,
  sku: string,
  params: {
    store?: string | typeof ALL_STORES;
    type?: MovementType;
    from?: string;
    to?: string;
    period?: MovementPeriod;
    page?: number;
    pageSize?: number;
  },
): Promise<MovementListResponse> {
  const {
    store = ALL_STORES,
    type,
    from,
    to,
    period,
    page = DEFAULT_PAGE,
    pageSize,
  } = params;

  const activePeriod = period ?? (from || to ? undefined : DEFAULT_PERIOD);
  let effectiveFrom = from;
  if (effectiveFrom === undefined && activePeriod !== undefined) {
    const days = PERIOD_DAYS[activePeriod];
    const lowerBound = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    effectiveFrom = lowerBound.toISOString();
  }

  const stores =
    store === ALL_STORES ? repo.getStores() : repo.getStores().filter((s) => s.id === store);

  // Look up counterparts across all stores in the repository for transfer movements
  const allStores = repo.getStores();
  const allTransfersForProduct = allStores
    .flatMap((s) => repo.getMovements(sku, s.id))
    .filter((m) => Boolean(m.transferId));

  const transferCounterpartMap = new Map<string, string>();
  for (const tm of allTransfersForProduct) {
    if (!tm.transferId) continue;
    const counterpart = allTransfersForProduct.find(
      (other) => other.transferId === tm.transferId && other.id !== tm.id,
    );
    if (counterpart) {
      transferCounterpartMap.set(tm.id, counterpart.storeId);
    }
  }

  const users = repo.getUsers();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const allMovements: Movement[] = [];
  for (const s of stores) {
    const movements = repo.getMovements(sku, s.id, { type, from: effectiveFrom, to });

    for (const m of movements) {
      const user = userMap.get(m.userId);
      const counterpartStoreId = transferCounterpartMap.get(m.id);

      const item: Movement = {
        id: m.id,
        productId: m.productId,
        storeId: m.storeId,
        type: m.type,
        quantity: m.quantity,
        balanceAfter: m.balanceAfter,
        createdAt: m.createdAt,
        by: {
          id: user?.id ?? m.userId,
          name: user?.name ?? "Unknown",
          initials: user?.initials ?? "?",
        },
        ...(m.reason ? { note: m.reason } : {}),
        ...(m.transferId ? { transferId: m.transferId } : {}),
        ...(counterpartStoreId ? { counterpartStoreId: counterpartStoreId as StoreId } : {}),
      };

      allMovements.push(item);
    }
  }

  allMovements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = allMovements.length;
  const items =
    pageSize !== undefined
      ? allMovements.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
      : allMovements;

  return {
    items,
    page,
    pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
    total,
  };
}
