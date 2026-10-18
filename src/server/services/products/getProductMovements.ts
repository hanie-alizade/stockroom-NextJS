import "server-only";

import { ALL_STORES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants";
import type { Repository } from "@/server/repositories";
import type { MovementWithUser, ProductMovementsResult } from "@/types";

function isValidPageSize(size: number): boolean {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size);
}

export async function getProductMovements(
  repo: Repository,
  sku: string,
  params: {
    store?: string | typeof ALL_STORES;
    type?: "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in" | "import";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<ProductMovementsResult> {
  const { store = ALL_STORES, type, from, to, page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = params;

  const validatedPageSize = isValidPageSize(pageSize) ? pageSize : DEFAULT_PAGE_SIZE;

  const stores =
    store === ALL_STORES ? repo.getStores() : repo.getStores().filter((s) => s.id === store);

  const allMovements: MovementWithUser[] = [];
  for (const s of stores) {
    const movements = repo.getMovements(sku, s.id, { type, from, to });
    const users = repo.getUsers();
    const userMap = new Map(users.map((u) => [u.id, u]));

    movements.forEach((m) => {
      const user = userMap.get(m.userId);
      allMovements.push({
        ...m,
        createdBy: user ? user.name : "Unknown",
      });
    });
  }

  allMovements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = allMovements.length;
  const startIndex = (page - 1) * validatedPageSize;
  const endIndex = startIndex + validatedPageSize;
  const items = allMovements.slice(startIndex, endIndex);

  return {
    items,
    page,
    pageSize: validatedPageSize,
    total,
  };
}
