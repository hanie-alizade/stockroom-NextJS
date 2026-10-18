import type {
  MovementRecord,
  MovementType,
  ProductRecord,
  StockRecord,
  StoreRecord,
  UserRecord,
} from "@/types";


export type Category = {
  name: string;
};

export type Supplier = {
  name: string;
};

export type IdempotencyRecord = {
  idempotencyKey: string;
  requestHash: string;
  status: number;
  body: unknown;
};

// Aliases for compatibility
export type Store = StoreRecord;
export type User = UserRecord;
export type Product = ProductRecord;
export type Stock = StockRecord;
export type Movement = MovementRecord;

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
