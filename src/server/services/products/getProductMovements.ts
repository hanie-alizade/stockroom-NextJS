import "server-only";

import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PERIOD,
  ERROR_CODE,
  HTTP_STATUS,
  PERIOD_DAYS,
} from "@/constants";
import { AppError } from "@/domain";
import { paginate } from "@/helpers";
import type { Repository } from "@/server/repositories";
import type { Movement, MovementListResponse, MovementPeriod, MovementType } from "@/types";

import { toMovementDto } from "@/server/services/movementDto";

/**
 * Retrieves paginated product movements for a given SKU and optional store and type filters.
 */
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
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const { store = ALL_STORES, type, from, to, period, page = DEFAULT_PAGE, pageSize } = params;

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
      allMovements.push(toMovementDto(m, userMap, transferCounterpartMap));
    }
  }

  allMovements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = allMovements.length;
  const validatedPageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  const items = paginate(allMovements, page, validatedPageSize);

  return {
    items,
    page,
    pageSize: validatedPageSize,
    total,
  };
}
