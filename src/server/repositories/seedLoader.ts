import "server-only";

import { env } from "@/config/env";
import { ROLE } from "@/constants";
import type { MovementType } from "@/types";
import seedJson from "@data/seed.json";
import { rebaseSeed } from "./rebaseSeed";
import type {
  Category,
  IdempotencyRecord,
  MovementRecord,
  ProductRecord,
  StockRecord,
  StoreRecord,
  Supplier,
  UserRecord,
} from "./types";

export interface StoreData {
  stores: StoreRecord[];
  categories: Category[];
  suppliers: Supplier[];
  users: UserRecord[];
  products: Map<string, ProductRecord>;
  stock: Map<string, StockRecord[]>; // productId -> StockRecord[]
  movements: MovementRecord[];
  movementsBySku: Map<string, MovementRecord[]>;
  idempotency: Map<string, IdempotencyRecord>;
}

function toUser(u: { id: string; name: string; initials: string; role: string }): UserRecord {
  return {
    id: u.id,
    name: u.name,
    initials: u.initials,
    role: u.role === ROLE.MANAGER ? ROLE.MANAGER : ROLE.STAFF,
  };
}

/**
 * Loads and initializes the in-memory store from seed.json.
 * If NODE_ENV is not 'test', movements are rebased to today's date.
 */
export function loadSeedStoreData(): StoreData {
  const rawMovements: MovementRecord[] = seedJson.movements.map((m, i: number) => ({
    ...m,
    type: m.type as MovementType,
    id: `m_${i}`,
  }));

  const movements = env.NODE_ENV === "test" ? rawMovements : rebaseSeed(rawMovements, new Date());

  const movementsBySku = new Map<string, MovementRecord[]>();
  for (const m of movements) {
    let list = movementsBySku.get(m.productId);
    if (!list) {
      list = [];
      movementsBySku.set(m.productId, list);
    }
    list.push(m);
  }
  for (const list of movementsBySku.values()) {
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    stores: seedJson.stores,
    categories: seedJson.categories,
    suppliers: seedJson.suppliers,
    users: seedJson.users.map(toUser),
    products: new Map(seedJson.products.map((p: ProductRecord) => [p.sku, { ...p }])),
    stock: new Map(
      Object.entries(seedJson.stock).map(([sku, stocks]) => [
        sku,
        (stocks as StockRecord[]).map((s) => ({ ...s })),
      ]),
    ),
    movements,
    movementsBySku,
    idempotency: new Map(),
  };
}
