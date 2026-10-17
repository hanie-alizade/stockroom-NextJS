import { vi } from "vitest";
import type {
  Repository,
  User,
  Product,
  Stock,
  Movement,
  IdempotencyRecord,
} from "@/lib/server/repo";

const DEFAULT_USERS: User[] = [
  { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
  { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
];

export function mockRepository(overrides: Partial<Repository> = {}): Repository {
  const repo: Repository = {
    getStores: vi.fn(() => []),
    getCategories: vi.fn(() => []),
    getSuppliers: vi.fn(() => []),
    getUsers: vi.fn(() => DEFAULT_USERS),
    getProduct: vi.fn((_sku: string): Product | null => null),
    listProducts: vi.fn(() => []),
    getStock: vi.fn((_productId: string, _storeId: string): Stock | null => null),
    listStock: vi.fn((_productId: string): Stock[] => []),
    getMovements: vi.fn(() => []),
    getIdempotency: vi.fn((_key: string): IdempotencyRecord | null => null),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    setStock: vi.fn(),
    addMovement: vi.fn((movement: Omit<Movement, "id">): Movement => ({
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
