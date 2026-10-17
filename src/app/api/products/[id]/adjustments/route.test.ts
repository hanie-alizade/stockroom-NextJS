import { describe, it, expect, beforeEach, vi } from "vitest";
import { cookies } from "next/headers";

import { createRepository } from "@/lib/server/repo";
import { mockCookies } from "tests/helpers";

import { POST } from "./route";

// next/headers has no request scope in vitest; withApi reads the cookie here.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const managerCookies = mockCookies("aina-rahman");
const staffCookies = mockCookies("faiz-hakim");

const repo = createRepository();

describe("POST /api/products/:id/adjustments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.reset();
  });

  it("allows manager to transfer stock returning 201 and updating both stocks", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);

    const url = new URL("http://localhost/api/products/KL-1042/adjustments");
    const request = new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "route-manager-transfer-1",
      },
      body: JSON.stringify({
        type: "transfer",
        fromStoreId: "mont-kiara",
        toStoreId: "subang",
        quantity: 5,
      }),
    });

    const response = await POST(request, { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.stock).toEqual([
      { storeId: "mont-kiara", onHand: 13 },
      { storeId: "subang", onHand: 9 },
    ]);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(13);
    expect(repo.getStock("KL-1042", "subang")?.onHand).toBe(9);
  });

  it("returns 403 FORBIDDEN when staff attempts write_off", async () => {
    vi.mocked(cookies).mockResolvedValue(staffCookies);

    const url = new URL("http://localhost/api/products/KL-1042/adjustments");
    const request = new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "route-staff-write-off-1",
      },
      body: JSON.stringify({
        type: "write_off",
        storeId: "mont-kiara",
        quantity: 1,
        reason: "Damaged packaging",
      }),
    });

    const response = await POST(request, { params: { id: "KL-1042" } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("FORBIDDEN");
  });
});
