import "server-only";

import type {
  Category,
  IdempotencyRecord,
  Repository,
  Supplier,
} from "./types";
import { ROLE } from "@/constants";
import type {
  MovementRecord,
  MovementType,
  ProductRecord,
  StockRecord,
  StoreRecord,
  UserRecord,
} from "@/types";
import seedJson from "@data/seed.json";

function toUser(u: { id: string; name: string; initials: string; role: string }): UserRecord {
  return {
    id: u.id,
    name: u.name,
    initials: u.initials,
    role: u.role === ROLE.MANAGER ? ROLE.MANAGER : ROLE.STAFF,
  };
}

const STORE_KEY = "__stockroom_store__";

function getGlobalStore(): StoreData | null {
  const value = (globalThis as Record<string, unknown>)[STORE_KEY];
  return value ? (value as StoreData) : null;
}

function setGlobalStore(data: StoreData): void {
  (globalThis as Record<string, unknown>)[STORE_KEY] = data;
}

interface StoreData {
  stores: StoreRecord[];
  categories: Category[];
  suppliers: Supplier[];
  users: UserRecord[];
  products: Map<string, ProductRecord>;
  stock: Map<string, StockRecord[]>; // productId -> StockRecord[]
  movements: MovementRecord[];
  idempotency: Map<string, IdempotencyRecord>;
}

function getStore(): StoreData {
  const existing = getGlobalStore();
  if (existing) {
    return existing;
  }

  const data: StoreData = {
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
    movements: seedJson.movements.map((m, i: number) => ({
      ...m,
      type: m.type as MovementType,
      id: `m_${i}`,
    })),
    idempotency: new Map(),
  };
  setGlobalStore(data);
  return data;
}

class InMemoryRepository implements Repository {
  private data: StoreData;
  private touched: Set<string> = new Set();
  private snapshots: Map<string, unknown> = new Map();

  constructor() {
    this.data = getStore();
  }

  private touch(key: string): void {
    this.touched.add(key);
  }

  private snapshot(key: string, value: unknown): void {
    if (!this.snapshots.has(key)) {
      if (value === undefined) {
        this.snapshots.set(key, undefined);
      } else {
        // Deep clone to capture state before modification
        this.snapshots.set(key, JSON.parse(JSON.stringify(value)));
      }
    }
  }

  getStores(): StoreRecord[] {
    return this.data.stores;
  }

  getCategories(): Category[] {
    return this.data.categories;
  }

  getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  getUsers(): UserRecord[] {
    return this.data.users;
  }

  getProduct(sku: string): ProductRecord | null {
    return this.data.products.get(sku) ?? null;
  }

  listProducts(): ProductRecord[] {
    return Array.from(this.data.products.values());
  }

  getStock(productId: string, storeId: string): StockRecord | null {
    const stocks = this.data.stock.get(productId) ?? [];
    return stocks.find((s) => s.storeId === storeId) ?? null;
  }

  listStock(productId: string): StockRecord[] {
    return this.data.stock.get(productId) ?? [];
  }

  getMovements(
    productId: string,
    storeId: string,
    options?: {
      type?: MovementType;
      from?: string;
      to?: string;
      limit?: number;
    },
  ): MovementRecord[] {
    let filtered = this.data.movements.filter(
      (m) => m.productId === productId && m.storeId === storeId,
    );

    if (options?.type) {
      filtered = filtered.filter((m) => m.type === options.type);
    }
    const from = options?.from;
    const to = options?.to;
    if (from !== undefined) {
      filtered = filtered.filter((m) => m.createdAt >= from);
    }
    if (to !== undefined) {
      filtered = filtered.filter((m) => m.createdAt <= to);
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getIdempotency(key: string): IdempotencyRecord | null {
    return this.data.idempotency.get(key) ?? null;
  }

  createProduct(product: ProductRecord): void {
    const key = `product:${product.sku}`;
    this.touch(key);
    this.snapshot(key, this.data.products.get(product.sku));
    this.data.products.set(product.sku, product);
  }

  updateProduct(sku: string, product: Partial<ProductRecord>): void {
    const key = `product:${sku}`;
    this.touch(key);
    this.snapshot(key, this.data.products.get(sku));
    const existing = this.data.products.get(sku);
    if (existing) {
      this.data.products.set(sku, { ...existing, ...product });
    }
  }

  setStock(productId: string, storeId: string, onHand: number, reorderLevel: number): void {
    const key = `stock:${productId}:${storeId}`;
    this.touch(key);
    let stocks = this.data.stock.get(productId);
    if (!stocks) {
      stocks = [];
      this.data.stock.set(productId, stocks);
    }
    const existing = stocks.find((s) => s.storeId === storeId);
    this.snapshot(key, existing);
    if (existing) {
      existing.onHand = onHand;
      existing.reorderLevel = reorderLevel;
    } else {
      stocks.push({ storeId, onHand, reorderLevel });
    }
  }

  addMovement(movement: Omit<MovementRecord, "id">): MovementRecord {
    const id = `m_${this.data.movements.length}`;
    const newMovement: MovementRecord = { ...movement, id };
    const key = `movements`;
    this.touch(key);
    this.snapshot(key, this.data.movements);
    this.data.movements.push(newMovement);
    return newMovement;
  }

  setIdempotency(record: IdempotencyRecord): void {
    const key = `idempotency:${record.idempotencyKey}`;
    this.touch(key);
    this.snapshot(key, this.data.idempotency.get(record.idempotencyKey));
    this.data.idempotency.set(record.idempotencyKey, record);
  }

  transaction<T>(fn: (repo: Repository) => T): T {
    const outerTouched = this.touched;
    const outerSnapshots = this.snapshots;

    this.touched = new Set();
    this.snapshots = new Map();

    try {
      const result = fn(this);
      this.touched = outerTouched;
      this.snapshots = outerSnapshots;
      return result;
    } catch (error) {
      // Rollback: restore snapshots
      for (const [key, snapshot] of this.snapshots) {
        if (key.startsWith("product:")) {
          const sku = key.slice(8);
          if (snapshot === undefined) {
            this.data.products.delete(sku);
          } else {
            this.data.products.set(sku, snapshot as ProductRecord);
          }
        } else if (key.startsWith("stock:")) {
          const parts = key.slice(6).split(":");
          const productId = parts[0];
          const storeId = parts[1];
          const stocks = this.data.stock.get(productId);
          if (stocks) {
            const index = stocks.findIndex((s) => s.storeId === storeId);
            if (snapshot === undefined) {
              if (index !== -1) {
                stocks.splice(index, 1);
              }
            } else {
              if (index !== -1) {
                stocks[index] = snapshot as StockRecord;
              } else {
                stocks.push(snapshot as StockRecord);
              }
            }
          }
        } else if (key === "movements") {
          this.data.movements = snapshot as MovementRecord[];
        } else if (key.startsWith("idempotency:")) {
          const idempotencyKey = key.slice(13);
          if (snapshot === undefined) {
            this.data.idempotency.delete(idempotencyKey);
          } else {
            this.data.idempotency.set(idempotencyKey, snapshot as IdempotencyRecord);
          }
        }
      }

      this.touched = outerTouched;
      this.snapshots = outerSnapshots;
      throw error;
    }
  }

  reset(): void {
    setGlobalStore({
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
      movements: seedJson.movements.map((m, i: number) => ({
        ...m,
        type: m.type as MovementType,
        id: `m_${i}`,
      })),
      idempotency: new Map(),
    });
    this.data = getStore();
  }
}

export function createRepository(): Repository {
  return new InMemoryRepository();
}
