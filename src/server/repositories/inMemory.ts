import "server-only";

import { loadSeedStoreData, type StoreData } from "./seedLoader";
import { TransactionManager } from "./transaction";
import type {
  Category,
  IdempotencyRecord,
  MovementRecord,
  ProductRecord,
  Repository,
  StockRecord,
  StoreRecord,
  Supplier,
  UserRecord,
} from "./types";
import type { MovementType } from "@/types";

const STORE_KEY = "__stockroom_store__";

function getGlobalStore(): StoreData | null {
  const value = (globalThis as Record<string, unknown>)[STORE_KEY];
  return value ? (value as StoreData) : null;
}

function setGlobalStore(data: StoreData): void {
  (globalThis as Record<string, unknown>)[STORE_KEY] = data;
}

function getStore(): StoreData {
  const existing = getGlobalStore();
  if (existing) {
    return existing;
  }
  const data = loadSeedStoreData();
  setGlobalStore(data);
  return data;
}

class InMemoryRepository implements Repository {
  private data: StoreData;
  private txManager: TransactionManager | null = null;

  constructor() {
    this.data = getStore();
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
    const skuMovements = this.data.movementsBySku.get(productId) ?? [];
    let filtered = skuMovements.filter((m) => m.storeId === storeId);

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

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getIdempotency(key: string): IdempotencyRecord | null {
    return this.data.idempotency.get(key) ?? null;
  }

  createProduct(product: ProductRecord): void {
    this.txManager?.snapshotProduct(product.sku, this.data.products.get(product.sku));
    this.data.products.set(product.sku, product);
  }

  updateProduct(sku: string, product: Partial<ProductRecord>): void {
    this.txManager?.snapshotProduct(sku, this.data.products.get(sku));
    const existing = this.data.products.get(sku);
    if (existing) {
      this.data.products.set(sku, { ...existing, ...product });
    }
  }

  setStock(productId: string, storeId: string, onHand: number, reorderLevel: number): void {
    let stocks = this.data.stock.get(productId);
    if (!stocks) {
      stocks = [];
      this.data.stock.set(productId, stocks);
    }
    const existing = stocks.find((s) => s.storeId === storeId);
    this.txManager?.snapshotStock(productId, storeId, existing);
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

    this.txManager?.snapshotMovements(this.data.movements.length);
    this.data.movements.push(newMovement);

    let skuList = this.data.movementsBySku.get(newMovement.productId);
    if (!skuList) {
      skuList = [];
      this.data.movementsBySku.set(newMovement.productId, skuList);
    }
    skuList.unshift(newMovement);

    return newMovement;
  }

  setIdempotency(record: IdempotencyRecord): void {
    this.txManager?.snapshotIdempotency(record.idempotencyKey, this.data.idempotency.get(record.idempotencyKey));
    this.data.idempotency.set(record.idempotencyKey, record);
  }

  transaction<T>(fn: (repo: Repository) => T): T {
    const prevTx = this.txManager;
    const currentTx = new TransactionManager();
    this.txManager = currentTx;

    try {
      const result = fn(this);
      this.txManager = prevTx;
      return result;
    } catch (error) {
      currentTx.rollback(this.data);
      this.txManager = prevTx;
      throw error;
    }
  }

  reset(): void {
    setGlobalStore(loadSeedStoreData());
    this.data = getStore();
  }
}

/**
 * Creates and returns the in-memory repository instance.
 */
export function createRepository(): Repository {
  return new InMemoryRepository();
}
