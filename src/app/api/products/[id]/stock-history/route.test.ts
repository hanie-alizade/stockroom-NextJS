import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { createRepository } from "@/lib/server/repo";
import { cookies } from "next/headers";
import type { Repository, Product, Stock } from "@/lib/server/repo";

vi.mock("@/lib/server/repo", () => ({
  createRepository: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

type MockUser = { id: string; name: string; initials: string; role: "manager" | "staff" };

describe("GET /api/products/:id/stock-history", () => {
  beforeEach(() => {
    process.env.SIMULATED_LATENCY_MS = "0";
    vi.clearAllMocks();

    const mockProduct: Product = {
      sku: "KL-1042",
      name: "Arabica Beans 1kg",
      category: "Coffee",
      supplier: "Highland Roasters",
      unitCostSen: 6800,
    };

    const mockStocks: Stock[] = [
      { storeId: "s_mont_kiara", onHand: 18, reorderLevel: 5 },
      { storeId: "s_subang", onHand: 4, reorderLevel: 5 },
      { storeId: "s_cheras", onHand: 0, reorderLevel: 5 },
      { storeId: "s_damansara", onHand: 22, reorderLevel: 5 },
      { storeId: "s_puchong", onHand: 15, reorderLevel: 5 },
      { storeId: "s_shah_alam", onHand: 25, reorderLevel: 5 },
    ];

    const mockUsers: MockUser[] = [
      { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
      { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
    ];

    const mockCookies = {
      get: vi.fn(() => ({ name: "stockroom_user", value: "faiz-hakim" })),
      size: 1,
      getAll: vi.fn(() => [{ name: "stockroom_user", value: "faiz-hakim" }]),
      has: vi.fn(() => true),
      set: vi.fn(),
      delete: vi.fn(),
      *[Symbol.iterator](): Generator<[string, { name: string; value: string }]> {
        yield ["stockroom_user", { name: "stockroom_user", value: "faiz-hakim" }];
      },
    };

    const mockRepo: Repository = {
      getProduct: vi.fn((sku: string) => (sku === "KL-1042" ? mockProduct : null)),
      getStock: vi.fn((productId: string, storeId: string) => {
        if (productId !== "KL-1042") return null;
        return mockStocks.find((s) => s.storeId === storeId) ?? null;
      }),
      listStock: vi.fn((productId: string) => (productId === "KL-1042" ? mockStocks : [])),
      getUsers: vi.fn(() => mockUsers),
      getStores: vi.fn(() => []),
      getCategories: vi.fn(() => []),
      getSuppliers: vi.fn(() => []),
      listProducts: vi.fn(() => []),
      getMovements: vi.fn(() => []),
      getIdempotency: vi.fn(() => null),
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      setStock: vi.fn(),
      addMovement: vi.fn(() => ({
        id: "",
        productId: "",
        storeId: "",
        type: "receive" as const,
        quantity: 0,
        balanceAfter: 0,
        reason: null,
        transferId: null,
        createdAt: "",
        userId: "",
      })),
      setIdempotency: vi.fn(),
      transaction: vi.fn((fn) => fn(mockRepo)),
      reset: vi.fn(),
    };

    vi.mocked(createRepository).mockReturnValue(mockRepo);
    vi.mocked(cookies).mockResolvedValue(mockCookies);
  });

  it("returns stock history for a product", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.points).toBeInstanceOf(Array);
    expect(data.points.length).toBeGreaterThan(0);
    expect(data.days).toBe(30);
  });

  it("default days is 30", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBe(30);
    expect(data.points).toHaveLength(31);
  });

  it("supports 7 days", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?days=7");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBe(7);
    expect(data.points).toHaveLength(8);
  });

  it("supports 90 days", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?days=90");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBe(90);
    expect(data.points).toHaveLength(91);
  });

  it("points include date, on hand, and reorder level", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    data.points.forEach((point: { date: string; onHand: number; reorderLevel: number }) => {
      expect(point.date).toBeTruthy();
      expect(typeof point.onHand).toBe("number");
      expect(typeof point.reorderLevel).toBe("number");
    });
  });

  it("points are sorted by date ascending", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    const dates = data.points.map((point: { date: string }) => point.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1] <= dates[i]).toBe(true);
    }
  });

  it("scopes to all stores and sums reorder level", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?store=all");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.points[0].reorderLevel).toBe(30);
  });

  it("scopes to a single store", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?store=s_mont_kiara");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.points[0].reorderLevel).toBe(5);
    expect(data.points[0].onHand).toBe(18);
  });

  it("returns 404 for unknown product", async () => {
    const url = new URL("http://localhost/api/products/UNKNOWN-123/stock-history");
    const response = await GET(new Request(url), { params: { id: "UNKNOWN-123" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("PRODUCT_NOT_FOUND");
  });

  it("returns one point for a product with no history", async () => {
    const url = new URL("http://localhost/api/products/KL-2210/stock-history");
    const response = await GET(new Request(url), { params: { id: "KL-2210" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.points).toHaveLength(31);
    expect(data.points[0].onHand).toBe(0);
  });
});
