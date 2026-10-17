import "server-only";

import type { Repository, Movement } from "@/lib/server/repo";
import type { MovementWithUser, ProductMovementsResult } from "./types";

const DEFAULT_PAGE_SIZE = 25;

function isValidPageSize(size: number): boolean {
  return size === 25 || size === 50 || size === 100;
}

export async function getProductMovements(
  repo: Repository,
  sku: string,
  params: {
    store?: string | "all";
    type?: "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in" | "import";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<ProductMovementsResult> {
  const { store = "all", type, from, to, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const validatedPageSize = isValidPageSize(pageSize) ? pageSize : DEFAULT_PAGE_SIZE;

  const stores =
    store === "all" ? repo.getStores() : repo.getStores().filter((s) => s.id === store);

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
