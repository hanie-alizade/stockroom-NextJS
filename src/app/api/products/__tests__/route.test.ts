import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../route";
import { cookies } from "next/headers";

import { mockCookies } from "tests/helpers";

// next/headers has no request scope in vitest; withApi reads the cookie here.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const staffCookies = mockCookies("faiz-hakim");

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(staffCookies);
  });

  it("returns 248 products for the all stores scope", async () => {
    const response = await GET(new Request("http://localhost/api/products"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(248);
    expect(data.items).toHaveLength(25);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(25);
  });

  it("sums on hand and reorder level across the carrying stores and derives status", async () => {
    const url = new URL("http://localhost/api/products?store=all&q=kl-1042");
    const response = await GET(new Request(url));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].sku).toBe("KL-1042");
    expect(data.items[0].onHand).toBe(84);
    expect(data.items[0].reorderLevel).toBe(30);
    expect(data.items[0].status).toBe("in_stock");
  });

  it("lists only products carried at the scoped store (Mont Kiara has 212)", async () => {
    const url = new URL("http://localhost/api/products?store=mont-kiara");
    const response = await GET(new Request(url));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(212);
    expect(data.summary.totalProducts).toBe(212);
    expect(data.items.map((item: { sku: string }) => item.sku).includes("KL-1042")).toBe(true);
  });

  it("searches by SKU case-insensitively", async () => {
    const response = await GET(new Request("http://localhost/api/products?q=kl-1042"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].sku).toBe("KL-1042");
  });

  it("searches by name case-insensitively", async () => {
    const response = await GET(new Request("http://localhost/api/products?q=arabica"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(3);
    expect(
      data.items
        .map((item: { name: string }) => item.name.toLowerCase().includes("arabica"))
        .includes(false),
    ).toBe(false);
  });

  it("filters by category", async () => {
    const response = await GET(new Request("http://localhost/api/products?category=Coffee"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(53);
    expect(
      data.items.map((item: { category: string }) => item.category === "Coffee").includes(false),
    ).toBe(false);
  });

  it("filters by status out", async () => {
    const response = await GET(new Request("http://localhost/api/products?status=out"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(new Set(data.items.map((item: { status: string }) => item.status))).toEqual(
      new Set(["out"]),
    );
  });

  it("filters by status low", async () => {
    const response = await GET(new Request("http://localhost/api/products?status=low"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(11);
    expect(new Set(data.items.map((item: { status: string }) => item.status))).toEqual(
      new Set(["low"]),
    );
  });

  it("filters by status in_stock", async () => {
    const response = await GET(new Request("http://localhost/api/products?status=in_stock"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(236);
    expect(new Set(data.items.map((item: { status: string }) => item.status))).toEqual(
      new Set(["in_stock"]),
    );
  });

  it("sorts by updatedAt desc by default", async () => {
    const response = await GET(new Request("http://localhost/api/products?pageSize=100"));
    const data = await response.json();
    const dates = data.items.map((item: { updatedAt: string }) => item.updatedAt);

    expect(response.status).toBe(200);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  const statusRank = (status: string): number => {
    const order: Record<string, number> = { out: 0, low: 1, in_stock: 2 };
    return order[status];
  };

  it("sorts by status descending (out, low, in stock)", async () => {
    const url = new URL("http://localhost/api/products?sort=status&dir=desc&pageSize=100");
    const response = await GET(new Request(url));
    const data = await response.json();
    const ranks = data.items.map((item: { status: string }) => statusRank(item.status));
    const expectedSkus = [...data.items]
      .sort((a: { status: string; sku: string }, b: { status: string; sku: string }) => {
        const rankA = statusRank(a.status);
        const rankB = statusRank(b.status);
        if (rankA !== rankB) return rankA - rankB;
        return a.sku.localeCompare(b.sku);
      })
      .map((item: { sku: string }) => item.sku);

    expect(response.status).toBe(200);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(data.items.map((item: { sku: string }) => item.sku)).toEqual(expectedSkus);
  });

  it("sorts by status ascending (in stock, low, out)", async () => {
    const url = new URL("http://localhost/api/products?sort=status&dir=asc&pageSize=100");
    const response = await GET(new Request(url));
    const data = await response.json();
    const ranks = data.items.map((item: { status: string }) => statusRank(item.status));
    const expectedSkus = [...data.items]
      .sort((a: { status: string; sku: string }, b: { status: string; sku: string }) => {
        const rankA = statusRank(a.status);
        const rankB = statusRank(b.status);
        if (rankA !== rankB) return rankB - rankA;
        return b.sku.localeCompare(a.sku);
      })
      .map((item: { sku: string }) => item.sku);

    expect(response.status).toBe(200);
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    expect(data.items.map((item: { sku: string }) => item.sku)).toEqual(expectedSkus);
  });

  it("paginates with page size 25", async () => {
    const response = await GET(new Request("http://localhost/api/products?page=1&pageSize=25"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(25);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(25);
    expect(data.total).toBe(248);
  });

  it("paginates with page size 50", async () => {
    const response = await GET(new Request("http://localhost/api/products?page=1&pageSize=50"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(50);
    expect(data.pageSize).toBe(50);
    expect(data.total).toBe(248);
  });

  it("paginates with page size 100", async () => {
    const response = await GET(new Request("http://localhost/api/products?page=1&pageSize=100"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(100);
    expect(data.pageSize).toBe(100);
    expect(data.total).toBe(248);
  });

  it("returns the second page", async () => {
    const response = await GET(new Request("http://localhost/api/products?page=2&pageSize=25"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(25);
    expect(data.page).toBe(2);
    expect(data.total).toBe(248);
    expect(data.items[0].sku).not.toBe("KL-1042");
  });

  it("summary has stock value sen for the all stores scope", async () => {
    const response = await GET(new Request("http://localhost/api/products"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalProducts).toBe(248);
    expect(data.summary.stockValueSen).toBe(214155292);
    expect(data.summary.lowStock).toBe(11);
    expect(data.summary.outOfStock).toBe(1);
  });

  it("summary ignores search and category filters", async () => {
    const url = new URL("http://localhost/api/products?q=kl-1042&category=Coffee");
    const response = await GET(new Request(url));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.summary.totalProducts).toBe(248);
    expect(data.summary.stockValueSen).toBe(214155292);
  });

  it("summary follows store scope", async () => {
    const url = new URL("http://localhost/api/products?store=mont-kiara");
    const response = await GET(new Request(url));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalProducts).toBe(212);
    expect(typeof data.summary.stockValueSen).toBe("number");
    expect(data.summary.stockValueSen).toBeGreaterThan(0);
  });

  it("returns 500 INTERNAL_ERROR when fail=1", async () => {
    const response = await GET(new Request("http://localhost/api/products?fail=1"));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("INTERNAL_ERROR");
  });

  it("does not fail when fail=0", async () => {
    const response = await GET(new Request("http://localhost/api/products?fail=0"));
    expect(response.status).toBe(200);
  });
});
