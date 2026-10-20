import { describe, it, expect, beforeEach, vi } from "vitest";
import { cookies } from "next/headers";

import { createRepository } from "@/server/repositories";
import { mockCookies } from "tests/helpers";

import { POST } from "../route";

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

    const response = await POST(request, { params: Promise.resolve({ id: "KL-1042" }) });
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
        note: "Damaged packaging",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("FORBIDDEN");
  });

  function createReq(id: string, body: unknown, key: string, query = "") {
    return new Request(`http://localhost/api/products/${id}/adjustments${query}`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": key },
      body: JSON.stringify(body),
    });
  }

  it("returns 403 FORBIDDEN with unified error body when staff attempts transfer", async () => {
    vi.mocked(cookies).mockResolvedValue(staffCookies);
    const req = createReq("KL-1042", { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "subang", quantity: 1 }, "staff-transfer-gap");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = (await response.json()) as { error: string; message: string; fieldErrors: unknown[] };

    expect(response.status).toBe(403);
    expect(data.error).toBe("FORBIDDEN");
    expect(typeof data.message).toBe("string");
    expect(Array.isArray(data.fieldErrors)).toBe(true);
  });

  it("returns 403 FORBIDDEN when staff attempts write_off with NO note", async () => {
    vi.mocked(cookies).mockResolvedValue(staffCookies);
    const req = createReq("KL-1042", { type: "write_off", storeId: "mont-kiara", quantity: 1 }, "staff-write-off-no-note");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("FORBIDDEN");
  });

  it("returns 403 FORBIDDEN when staff attempts transfer with same fromStoreId and toStoreId", async () => {
    vi.mocked(cookies).mockResolvedValue(staffCookies);
    const req = createReq("KL-1042", { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "mont-kiara", quantity: 1 }, "staff-transfer-same-store");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("FORBIDDEN");
  });

  it("returns 403 FORBIDDEN when staff attempts write_off with negative quantity", async () => {
    vi.mocked(cookies).mockResolvedValue(staffCookies);
    const req = createReq("KL-1042", { type: "write_off", storeId: "mont-kiara", quantity: -5, note: "Damaged packaging" }, "staff-write-off-neg-qty");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("FORBIDDEN");
  });

  it("returns 422 VALIDATION_ERROR when manager submits unknown adjustment type", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const req = createReq("KL-1042", { type: "unknown_type", storeId: "mont-kiara", quantity: 1 }, "manager-unknown-type");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe("VALIDATION_ERROR");
  });

  it("allows staff to receive and staff to sell returning 201", async () => {
    vi.mocked(cookies).mockResolvedValue(staffCookies);

    const receiveRes = await POST(
      createReq("KL-1042", { type: "receive", storeId: "mont-kiara", quantity: 2 }, "staff-receive-gap"),
      { params: Promise.resolve({ id: "KL-1042" }) },
    );
    expect(receiveRes.status).toBe(201);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(20);

    const sellRes = await POST(
      createReq("KL-1042", { type: "sell", storeId: "mont-kiara", quantity: 3 }, "staff-sell-gap"),
      { params: Promise.resolve({ id: "KL-1042" }) },
    );
    expect(sellRes.status).toBe(201);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(17);
  });

  it("returns 409 INSUFFICIENT_STOCK when selling more than on hand and leaves stock unchanged", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const req = createReq("KL-1042", { type: "sell", storeId: "mont-kiara", quantity: 25 }, "oversell-gap");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(409);
    expect(data.error).toBe("INSUFFICIENT_STOCK");
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(18);
  });

  it("returns 409 when transfer exceeds source stock, leaving both stores unchanged with no new movements", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const montKiaraMovementsBefore = repo.getMovements("KL-1042", "mont-kiara").length;
    const subangMovementsBefore = repo.getMovements("KL-1042", "subang").length;

    const req = createReq("KL-1042", { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "subang", quantity: 25 }, "transfer-insufficient-gap");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(409);
    expect(data.error).toBe("INSUFFICIENT_STOCK");
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(18);
    expect(repo.getStock("KL-1042", "subang")?.onHand).toBe(4);
    expect(repo.getMovements("KL-1042", "mont-kiara").length).toBe(montKiaraMovementsBefore);
    expect(repo.getMovements("KL-1042", "subang").length).toBe(subangMovementsBefore);
  });

  it("replays the same response on duplicate Idempotency-Key with single stock and movement change", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const montKiaraMovementsBefore = repo.getMovements("KL-1042", "mont-kiara").length;
    const body = { type: "receive", storeId: "mont-kiara", quantity: 5 };

    const res1 = await POST(createReq("KL-1042", body, "duplicate-key-gap"), { params: Promise.resolve({ id: "KL-1042" }) });
    const data1 = await res1.json();
    expect(res1.status).toBe(201);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(23);

    const res2 = await POST(createReq("KL-1042", body, "duplicate-key-gap"), { params: Promise.resolve({ id: "KL-1042" }) });
    const data2 = await res2.json();
    expect(res2.status).toBe(201);
    expect(data2).toEqual(data1);

    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(23);
    expect(repo.getMovements("KL-1042", "mont-kiara").length).toBe(montKiaraMovementsBefore + 1);
  });

  it("applies adjustment only once when same key is sent via Promise.all", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const montKiaraMovementsBefore = repo.getMovements("KL-1042", "mont-kiara").length;
    const body = { type: "receive", storeId: "mont-kiara", quantity: 4 };

    const [res1, res2] = await Promise.all([
      POST(createReq("KL-1042", body, "concurrent-key-gap"), { params: Promise.resolve({ id: "KL-1042" }) }),
      POST(createReq("KL-1042", body, "concurrent-key-gap"), { params: Promise.resolve({ id: "KL-1042" }) }),
    ]);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(22);
    expect(repo.getMovements("KL-1042", "mont-kiara").length).toBe(montKiaraMovementsBefore + 1);
  });

  it("applies adjustment again when a different key is provided", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const body = { type: "receive", storeId: "mont-kiara", quantity: 3 };

    const res1 = await POST(createReq("KL-1042", body, "diff-key-1"), { params: Promise.resolve({ id: "KL-1042" }) });
    expect(res1.status).toBe(201);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(21);

    const res2 = await POST(createReq("KL-1042", body, "diff-key-2"), { params: Promise.resolve({ id: "KL-1042" }) });
    expect(res2.status).toBe(201);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(24);
  });

  it("returns 422 VALIDATION_ERROR with note field error when write-off lacks a note", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const req = createReq("KL-1042", { type: "write_off", storeId: "mont-kiara", quantity: 1 }, "write-off-no-note-gap");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = (await response.json()) as { error: string; fieldErrors: Array<{ field: string; message: string }> };

    expect(response.status).toBe(422);
    expect(data.error).toBe("VALIDATION_ERROR");
    expect(data.fieldErrors.some((fe) => fe.field === "note")).toBe(true);
  });

  it("returns 404 PRODUCT_NOT_FOUND when product does not exist", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const req = createReq("NON-EXISTENT", { type: "receive", storeId: "mont-kiara", quantity: 1 }, "unknown-product-gap");
    const response = await POST(req, { params: Promise.resolve({ id: "NON-EXISTENT" }) });
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(data.error).toBe("PRODUCT_NOT_FOUND");
  });

  it("returns 500 INTERNAL_ERROR in unified format when ?fail=1 is passed", async () => {
    vi.mocked(cookies).mockResolvedValue(managerCookies);
    const req = createReq("KL-1042", { type: "receive", storeId: "mont-kiara", quantity: 1 }, "fail-switch-gap", "?fail=1");
    const response = await POST(req, { params: Promise.resolve({ id: "KL-1042" }) });
    const data = (await response.json()) as { error: string; message: string; fieldErrors: unknown[] };

    expect(response.status).toBe(500);
    expect(data.error).toBe("INTERNAL_ERROR");
    expect(typeof data.message).toBe("string");
    expect(Array.isArray(data.fieldErrors)).toBe(true);
  });
});

