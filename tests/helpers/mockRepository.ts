import { vi } from "vitest";
import type {
  Repository,
  UserRecord,
  ProductRecord,
  StockRecord,
  MovementRecord,
  IdempotencyRecord,
} from "@/server/repositories";

const DEFAULT_USERS: UserRecord[] = [
  { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
  { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
];

export function mockRepository(overrides: Partial<Repository> = {}): Repository {
  const repo: Repository = {
    getStores: vi.fn(() => []),
    getCategories: vi.fn(() => []),
    getSuppliers: vi.fn(() => []),
    getUsers: vi.fn(() => DEFAULT_USERS),
    getProduct: vi.fn((_sku: string): ProductRecord | null => null),
    listProducts: vi.fn(() => []),
    getStock: vi.fn((_productId: string, _storeId: string): StockRecord | null => null),
    listStock: vi.fn((_productId: string): StockRecord[] => []),
    getMovements: vi.fn(() => []),
    getIdempotency: vi.fn((_key: string): IdempotencyRecord | null => null),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    setStock: vi.fn(),
    addMovement: vi.fn((movement: Omit<MovementRecord, "id">): MovementRecord => ({
      id: "mock_movement_id",
      ...movement,
    })),
    setIdempotency: vi.fn(),
    transaction: vi.fn((fn: (r: Repository) => unknown) =>
      fn(repo),
    ) as unknown as Repository["transaction"],
    reset: vi.fn(),
    ...overrides,
  };
  return repo;
}

const STORES = [
  { id: "mont-kiara", name: "Mont Kiara" },
  { id: "subang", name: "Subang" },
  { id: "cheras", name: "Cheras" },
  { id: "damansara", name: "Damansara" },
  { id: "puchong", name: "Puchong" },
  { id: "shah-alam", name: "Shah Alam" },
];

export function createProductMovementsMockRepo(): Repository {
  const makeMove = (
    id: string,
    storeId: string,
    type: MovementRecord["type"],
    createdAt: string,
    reason: string | null = null,
  ): MovementRecord => ({
    id,
    productId: "KL-1042",
    storeId,
    type,
    quantity: -1,
    balanceAfter: 10,
    reason,
    transferId: null,
    createdAt,
    userId: "faiz-hakim",
  });

  const now = Date.now();
  const base45: MovementRecord[] = Array.from({ length: 45 }, (_, i) =>
    makeMove(
      `m_${i}`,
      i === 0 ? "mont-kiara" : STORES[i % STORES.length].id,
      i < 24 ? "write_off" : "sell",
      new Date(now - (i + 1) * 43200000).toISOString(),
      i < 24 ? "Damaged" : null,
    ),
  );

  const fromAug1: MovementRecord[] = Array.from({ length: 35 }, (_, i) =>
    makeMove(
      `m_aug_${i}`,
      STORES[i % STORES.length].id,
      "sell",
      `2026-08-${String((i % 25) + 1).padStart(2, "0")}T10:00:00Z`,
    ),
  );

  const toJuly31: MovementRecord[] = Array.from({ length: 17 }, (_, i) =>
    makeMove(
      `m_jul_${i}`,
      STORES[i % STORES.length].id,
      "sell",
      `2026-07-${String((i % 25) + 1).padStart(2, "0")}T10:00:00Z`,
    ),
  );

  const kl1196Transfers: MovementRecord[] = [
    {
      id: "m_trans_out",
      productId: "KL-1196",
      storeId: "subang",
      type: "transfer_out",
      quantity: -5,
      balanceAfter: 10,
      reason: "Stock transfer",
      transferId: "transfer-1792148400652-1",
      createdAt: "2026-10-15T08:30:00Z",
      userId: "faiz-hakim",
    },
    {
      id: "m_trans_in",
      productId: "KL-1196",
      storeId: "damansara",
      type: "transfer_in",
      quantity: 5,
      balanceAfter: 15,
      reason: "Stock transfer",
      transferId: "transfer-1792148400652-1",
      createdAt: "2026-10-15T08:30:00Z",
      userId: "faiz-hakim",
    },
  ];

  return mockRepository({
    getProduct: vi.fn((sku: string) => {
      if (sku === "KL-1042" || sku === "KL-1196") {
        return {
          sku,
          name: "Mock Product",
          category: "Coffee",
          supplier: "Highland Roasters",
          unitCostSen: 6800,
          createdAt: "2026-01-01T00:00:00Z",
        };
      }
      return null;
    }),
    getStores: vi.fn(() => STORES),
    getMovements: vi.fn(
      (
        productId: string,
        storeId: string,
        options?: { type?: MovementRecord["type"]; from?: string; to?: string },
      ) => {
        if (productId === "KL-1196") {
          return kl1196Transfers.filter((m) => m.storeId === storeId);
        }
        if (productId !== "KL-1042") return [];

        if (options?.from === "2026-08-01") {
          return fromAug1.filter((m) => m.storeId === storeId);
        }
        if (options?.to === "2026-07-31") {
          return toJuly31.filter((m) => m.storeId === storeId);
        }
        if (options?.type === "receive") {
          return [];
        }
        if (options?.type === "write_off") {
          return base45.filter((m) => m.type === "write_off" && m.storeId === storeId);
        }
        if (options?.type === "sell") {
          return base45.filter((m) => m.type === "sell" && m.storeId === storeId);
        }

        if (options?.from) {
          const fromTime = new Date(options.from).getTime();
          const diffDays = (Date.now() - fromTime) / (24 * 60 * 60 * 1000);
          if (diffDays <= 8) {
            return base45
              .slice(0, 14)
              .filter((m) => m.storeId === storeId && m.createdAt >= options.from!);
          }
        }

        return base45.filter((m) => m.storeId === storeId);
      },
    ),
  });
}
