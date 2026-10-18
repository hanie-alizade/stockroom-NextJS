import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { createRepository } from "@/server/repositories";
import { cookies } from "next/headers";
import type { Product, Stock } from "@/server/repositories";

import { mockCookies, mockRepository } from "tests/helpers";

vi.mock("@/server/repositories", () => ({
  createRepository: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

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

    const mockRepo = mockRepository({
      getProduct: vi.fn((sku: string) => {
        if (sku === "KL-1042") return mockProduct;
        if (sku === "KL-2210") return { ...mockProduct, sku: "KL-2210" };
        return null;
      }),
      getStock: vi.fn((productId: string, storeId: string) => {
        if (productId !== "KL-1042") return null;
        return mockStocks.find((s) => s.storeId === storeId) ?? null;
      }),
      listStock: vi.fn((productId: string) => (productId === "KL-1042" ? mockStocks : [])),
    });

    vi.mocked(createRepository).mockReturnValue(mockRepo);
    vi.mocked(cookies).mockResolvedValue(mockCookies("faiz-hakim"));
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
