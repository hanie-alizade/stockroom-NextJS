import type { MovementType, Role } from "@/types";

export type Category = {
  name: string;
};

export type Supplier = {
  name: string;
};

export type ProductRecord = {
  sku: string;
  name: string;
  category: string;
  supplier: string | null;
  unitCostSen: number;
};

export type StockRecord = {
  storeId: string;
  onHand: number;
  reorderLevel: number;
};

export type StoreRecord = {
  id: string;
  name: string;
};

export type UserRecord = {
  id: string;
  name: string;
  initials: string;
  role: Role;
};

export type MovementRecord = {
  id: string;
  productId: string;
  storeId: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  transferId: string | null;
  createdAt: string;
  userId: string;
};

export type IdempotencyRecord = {
  idempotencyKey: string;
  requestHash: string;
  status: number;
  body: unknown;
};

export interface Repository {
  // Reads
  getStores(): StoreRecord[];
  getCategories(): Category[];
  getSuppliers(): Supplier[];
  getUsers(): UserRecord[];
  getProduct(sku: string): ProductRecord | null;
  listProducts(): ProductRecord[];
  getStock(productId: string, storeId: string): StockRecord | null;
  listStock(productId: string): StockRecord[];
  getMovements(
    productId: string,
    storeId: string,
    options?: {
      type?: MovementType;
      from?: string;
      to?: string;
      limit?: number;
    },
  ): MovementRecord[];
  getIdempotency(key: string): IdempotencyRecord | null;

  // Writes
  createProduct(product: ProductRecord): void;
  updateProduct(sku: string, product: Partial<ProductRecord>): void;
  setStock(productId: string, storeId: string, onHand: number, reorderLevel: number): void;
  addMovement(movement: Omit<MovementRecord, "id">): MovementRecord;
  setIdempotency(record: IdempotencyRecord): void;

  // Transaction: fn runs synchronously, touched rows are restored if it throws
  transaction<T>(fn: (repo: Repository) => T): T;

  // Reset: restore seed data (for E2E testing)
  reset(): void;
}
