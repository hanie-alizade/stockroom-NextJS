import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../route";
import { cookies } from "next/headers";

import { createRepository } from "@/server/repositories";
import { createProductMovementsMockRepo, mockCookies } from "tests/helpers";

vi.mock("@/server/repositories", () => ({
  createRepository: vi.fn(),
}));

// next/headers has no request scope in vitest; withApi reads the cookie here.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const staffCookies = mockCookies("faiz-hakim");

describe("GET /api/products/:id/movements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(staffCookies);
    vi.mocked(createRepository).mockReturnValue(createProductMovementsMockRepo());
  });

  it("returns movements for a product sorted newest first", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(25);
    expect(data.pageSize).toBe(25);
    expect(data.total).toBe(45);
    const dates = data.items.map((item: { createdAt: string }) => item.createdAt);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  it("paginates movements with total", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?page=1&pageSize=25");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(25);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(25);
    expect(data.total).toBe(45);
  });

  it("returns 404 PRODUCT_NOT_FOUND for unknown product", async () => {
    const url = new URL("http://localhost/api/products/UNKNOWN-SKU/movements");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "UNKNOWN-SKU" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("PRODUCT_NOT_FOUND");
  });

  it("returns 422 for invalid pageSize", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?pageSize=10");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe("VALIDATION_ERROR");
  });

  it("filters by movement type write_off", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?type=write_off");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(24);
    expect(
      data.items.map((item: { type: string }) => item.type === "write_off").includes(false),
    ).toBe(false);
  });

  it("filters by movement type sell", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?type=sell");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(21);
    expect(data.items.map((item: { type: string }) => item.type === "sell").includes(false)).toBe(
      false,
    );
  });

  it("filters by movement type receive returns none", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?type=receive");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it("filters by from date", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?from=2026-08-01&pageSize=50");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(35);
    expect(
      data.items
        .map((item: { createdAt: string }) => item.createdAt >= "2026-08-01")
        .includes(false),
    ).toBe(false);
  });

  it("filters by to date", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?to=2026-07-31");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(17);
    expect(
      data.items
        .map((item: { createdAt: string }) => item.createdAt <= "2026-07-31")
        .includes(false),
    ).toBe(false);
  });

  it("filters by period", async () => {
    const url7d = new URL("http://localhost/api/products/KL-1042/movements?period=7d");
    const url30d = new URL("http://localhost/api/products/KL-1042/movements?period=30d");
    const response7d = await GET(new Request(url7d), { params: Promise.resolve({ id: "KL-1042" }) });
    const response30d = await GET(new Request(url30d), { params: Promise.resolve({ id: "KL-1042" }) });
    const data7d = await response7d.json();
    const data30d = await response30d.json();

    expect(response7d.status).toBe(200);
    expect(response30d.status).toBe(200);
    expect(data7d.items.length).toBeGreaterThan(0);
    expect(data30d.items.length).toBeGreaterThanOrEqual(data7d.items.length);
  });

  it("scopes to a single store", async () => {
    const url = new URL("http://localhost/api/products/KL-1042/movements?store=mont-kiara");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items.length).toBeGreaterThan(0);
    expect(
      data.items.map((item: { storeId: string }) => item.storeId === "mont-kiara").includes(false),
    ).toBe(false);
  });

  it("transfer shows both rows with counterpartStoreId", async () => {
    const url = new URL("http://localhost/api/products/KL-1196/movements");
    const response = await GET(new Request(url), { params: Promise.resolve({ id: "KL-1196" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    const transfer = data.items.filter(
      (item: { transferId: string | null }) => item.transferId === "transfer-1792148400652-1",
    );
    expect(transfer).toHaveLength(2);
    const outRow = transfer.find((item: { type: string }) => item.type === "transfer_out");
    const inRow = transfer.find((item: { type: string }) => item.type === "transfer_in");
    expect(outRow).toBeDefined();
    expect(inRow).toBeDefined();
    expect(outRow?.storeId).toBe("subang");
    expect(outRow?.counterpartStoreId).toBe("damansara");
    expect(outRow?.quantity).toBeLessThan(0);
    expect(inRow?.storeId).toBe("damansara");
    expect(inRow?.counterpartStoreId).toBe("subang");
    expect(inRow?.quantity).toBeGreaterThan(0);
  });
});
