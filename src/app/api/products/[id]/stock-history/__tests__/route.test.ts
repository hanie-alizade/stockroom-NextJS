import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../route";
import { createRepository } from "@/server/repositories";
import { cookies } from "next/headers";
import { TIME_ZONE } from "@/constants";
import type { MovementRecord, ProductRecord, StockRecord } from "@/server/repositories";

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

    const mockProduct: ProductRecord = {
      sku: "KL-1042",
      name: "Arabica Beans 1kg",
      category: "Coffee",
      supplier: "Highland Roasters",
      unitCostSen: 6800,
    };

    const mockStocks: StockRecord[] = [
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
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.points).toBeInstanceOf(Array);
    expect(data.points.length).toBeGreaterThan(0);
    expect(data.days).toBe(30);
  });

  it("default days is 30", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBe(30);
    expect(data.points).toHaveLength(31);
  });

  it("supports 7 days", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?days=7");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBe(7);
    expect(data.points).toHaveLength(8);
  });

  it("supports 90 days", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?days=90");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBe(90);
    expect(data.points).toHaveLength(91);
  });

  it("points include date, on hand, and reorder level", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
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
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    const dates = data.points.map((point: { date: string }) => point.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1] <= dates[i]).toBe(true);
    }
  });

  it("scopes to all stores and sums reorder level", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?store=all");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reorderLevel).toBe(30);
    expect(data.points[0].reorderLevel).toBe(30);
  });

  it("scopes to a single store", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?store=s_mont_kiara");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reorderLevel).toBe(5);
    expect(data.points[0].reorderLevel).toBe(5);
    expect(data.points[data.points.length - 1].onHand).toBe(18);
  });

  it("returns 404 for unknown product", async () => {
    const url = new URL("http://localhost/api/products/UNKNOWN-123/stock-history");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "UNKNOWN-123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("PRODUCT_NOT_FOUND");
  });

  it("returns one point for a product with no history", async () => {
    const url = new URL("http://localhost/api/products/KL-2210/stock-history");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-2210" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.points).toHaveLength(31);
    expect(data.points[0].onHand).toBe(0);
  });

  it("returns 422 VALIDATION_ERROR when days is not 7, 30 or 90", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/stock-history?days=14");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe("VALIDATION_ERROR");
  });

  it("rebuilds with two movements (history before and after a sell)", async () => {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterday);

    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const twoDaysAgoStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(twoDaysAgo);

    const mockProduct: ProductRecord = {
      sku: "KL-1042",
      name: "Arabica Beans 1kg",
      category: "Coffee",
      supplier: "Highland Roasters",
      unitCostSen: 6800,
    };

    const mockStocks: StockRecord[] = [
      { storeId: "s_mont_kiara", onHand: 18, reorderLevel: 5 },
    ];

    const mockMovements: MovementRecord[] = [
      {
        id: "m_sell",
        productId: "KL-1042",
        storeId: "s_mont_kiara",
        type: "sell",
        quantity: -2,
        balanceAfter: 18,
        reason: null,
        transferId: null,
        createdAt: now.toISOString(),
        userId: "faiz-hakim",
      },
      {
        id: "m_receive",
        productId: "KL-1042",
        storeId: "s_mont_kiara",
        type: "receive",
        quantity: 5,
        balanceAfter: 20,
        reason: "PO-1234",
        transferId: null,
        createdAt: yesterday.toISOString(),
        userId: "faiz-hakim",
      },
    ];

    const mockRepo = mockRepository({
      getProduct: vi.fn(() => mockProduct),
      getStock: vi.fn(() => mockStocks[0]),
      listStock: vi.fn(() => mockStocks),
      getMovements: vi.fn(() => mockMovements),
    });

    vi.mocked(createRepository).mockReturnValue(mockRepo);

    const url = new URL("http://localhost/api/products/KL-1042/stock-history?store=s_mont_kiara&days=7");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reorderLevel).toBe(5);
    expect(data.days).toBe(7);
    expect(data.points).toHaveLength(8);

    const todayPoint = data.points.find((p: { date: string }) => p.date === todayStr);
    expect(todayPoint?.onHand).toBe(18);

    const yesterdayPoint = data.points.find((p: { date: string }) => p.date === yesterdayStr);
    expect(yesterdayPoint?.onHand).toBe(20);

    const twoDaysAgoPoint = data.points.find((p: { date: string }) => p.date === twoDaysAgoStr);
    expect(twoDaysAgoPoint?.onHand).toBe(15);
  });
});
