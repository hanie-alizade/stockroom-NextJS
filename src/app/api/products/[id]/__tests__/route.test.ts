import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../route";
import { cookies } from "next/headers";

import { mockCookies } from "tests/helpers";

// next/headers has no request scope in vitest; withApi reads the cookie here.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const staffCookies = mockCookies("faiz-hakim");

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(staffCookies);
  });

  it("returns product details for KL-1042", async () => {
    const url = new URL("http://localhost/api/products/KL-1042");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sku).toBe("KL-1042");
    expect(data.name).toBe("Arabica beans 1 kg");
    expect(data.category).toBe("Coffee");
    expect(data.supplier).toBe("Highland Roasters");
    expect(data.unitCostSen).toBe(6800);
  });

  it("returns stock value sen summed across all carrying stores", async () => {
    const url = new URL("http://localhost/api/products/KL-1042?store=all");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stockValueSen).toBe(84 * 6800);
  });

  it("returns stock by store for all six carrying stores", async () => {
    const url = new URL("http://localhost/api/products/KL-1042?store=all");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stockByStore).toHaveLength(6);
  });

  it("stock by store includes on hand, reorder level and per-store status", async () => {
    const url = new URL("http://localhost/api/products/KL-1042?store=all");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stockByStore).toEqual([
      {
        storeId: "mont-kiara",
        onHand: 18,
        reorderLevel: 5,
        status: "in_stock",
        lastMovementAt: expect.any(String),
      },
      {
        storeId: "subang",
        onHand: 4,
        reorderLevel: 5,
        status: "low",
        lastMovementAt: expect.any(String),
      },
      {
        storeId: "cheras",
        onHand: 0,
        reorderLevel: 5,
        status: "out",
        lastMovementAt: expect.any(String),
      },
      {
        storeId: "damansara",
        onHand: 22,
        reorderLevel: 5,
        status: "in_stock",
        lastMovementAt: expect.any(String),
      },
      {
        storeId: "puchong",
        onHand: 15,
        reorderLevel: 5,
        status: "in_stock",
        lastMovementAt: expect.any(String),
      },
      {
        storeId: "shah-alam",
        onHand: 25,
        reorderLevel: 5,
        status: "in_stock",
        lastMovementAt: expect.any(String),
      },
    ]);
  });

  it("scopes stock by store and stock value to a single store", async () => {
    const url = new URL("http://localhost/api/products/KL-1042?store=mont-kiara");
    const response = await GET(new Request(url), { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stockByStore).toHaveLength(1);
    expect(data.stockByStore[0].storeId).toBe("mont-kiara");
    expect(data.stockValueSen).toBe(18 * 6800);
  });

  it("returns 404 PRODUCT_NOT_FOUND for unknown product", async () => {
    const url = new URL("http://localhost/api/products/UNKNOWN-123");
    const response = await GET(new Request(url), { params: { id: "UNKNOWN-123" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("PRODUCT_NOT_FOUND");
    expect(data.fieldErrors).toEqual([]);
  });
});
