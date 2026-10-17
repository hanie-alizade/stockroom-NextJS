import type { MovementType } from "@/lib/domain/stock-rules";

export type Store = {
  id: string;
  name: string;
};

export type Category = {
  name: string;
};

export type Supplier = {
  name: string;
};

export type User = {
  id: string;
  name: string;
  initials: string;
  role: "manager" | "staff";
};

export type Product = {
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
};

export type Stock = {
  storeId: string;
  onHand: number;
  reorderLevel: number;
};

export type Movement = {
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
  getStores(): Store[];
  getCategories(): Category[];
  getSuppliers(): Supplier[];
  getUsers(): User[];
  getProduct(sku: string): Product | null;
  listProducts(): Product[];
  getStock(productId: string, storeId: string): Stock | null;
  listStock(productId: string): Stock[];
  getMovements(
    productId: string,
    storeId: string,
    options?: {
      type?: MovementType;
      from?: string;
      to?: string;
      limit?: number;
    },
  ): Movement[];
  getIdempotency(key: string): IdempotencyRecord | null;

  // Writes
  createProduct(product: Product): void;
  updateProduct(sku: string, product: Partial<Product>): void;
  setStock(productId: string, storeId: string, onHand: number, reorderLevel: number): void;
  addMovement(movement: Omit<Movement, "id">): Movement;
  setIdempotency(record: IdempotencyRecord): void;

  // Transaction: fn runs synchronously, touched rows are restored if it throws
  transaction<T>(fn: (repo: Repository) => T): T;

  // Reset: restore seed data (for E2E testing)
  reset(): void;
}
