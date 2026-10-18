import { describe, it, expect, beforeEach } from "vitest";

import { createRepository } from "@/server/repositories";

import { createAdjustment } from "../createAdjustment";

describe("createAdjustment", () => {
  const repo = createRepository();

  beforeEach(() => {
    repo.reset();
  });

  it("receives stock and updates on hand quantity", async () => {
    const result = await createAdjustment(
      repo,
      "KL-1042",
      { type: "receive", storeId: "mont-kiara", quantity: 5 },
      { role: "manager", idempotencyKey: "svc-receive-1" },
    );

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].type).toBe("receive");
    expect(result.movements[0].quantity).toBe(5);
    expect(result.movements[0].balanceAfter).toBe(23);
    expect(result.stock).toEqual([{ storeId: "mont-kiara", onHand: 23 }]);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(23);
  });

  it("sells stock and updates on hand quantity", async () => {
    const result = await createAdjustment(
      repo,
      "KL-1042",
      { type: "sell", storeId: "mont-kiara", quantity: 3 },
      { role: "manager", idempotencyKey: "svc-sell-1" },
    );

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].type).toBe("sell");
    expect(result.movements[0].quantity).toBe(-3);
    expect(result.movements[0].balanceAfter).toBe(15);
    expect(result.stock).toEqual([{ storeId: "mont-kiara", onHand: 15 }]);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(15);
  });

  it("writes off stock with a note of at least 3 characters", async () => {
    const result = await createAdjustment(
      repo,
      "KL-1042",
      { type: "write_off", storeId: "mont-kiara", quantity: 2, note: "Damaged box" },
      { role: "manager", idempotencyKey: "svc-write-off-1" },
    );

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].type).toBe("write_off");
    expect(result.movements[0].quantity).toBe(-2);
    expect(result.movements[0].balanceAfter).toBe(16);
    expect(result.movements[0].note).toBe("Damaged box");
    expect(result.stock).toEqual([{ storeId: "mont-kiara", onHand: 16 }]);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(16);
  });

  it("transfers stock creating two movements with the same transferId and leaves total stock unchanged", async () => {
    const fromBefore = repo.getStock("KL-1042", "mont-kiara")?.onHand ?? 0;
    const toBefore = repo.getStock("KL-1042", "subang")?.onHand ?? 0;
    const totalBefore = fromBefore + toBefore;

    const result = await createAdjustment(
      repo,
      "KL-1042",
      { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "subang", quantity: 5 },
      { role: "manager", idempotencyKey: "svc-transfer-1" },
    );

    expect(result.movements).toHaveLength(2);
    const [outMovement, inMovement] = result.movements;
    expect(outMovement.type).toBe("transfer_out");
    expect(outMovement.quantity).toBe(-5);
    expect(outMovement.balanceAfter).toBe(13);
    expect(inMovement.type).toBe("transfer_in");
    expect(inMovement.quantity).toBe(5);
    expect(inMovement.balanceAfter).toBe(9);
    expect(outMovement.transferId).toBeTruthy();
    expect(outMovement.transferId).toBe(inMovement.transferId);

    const fromAfter = repo.getStock("KL-1042", "mont-kiara")?.onHand ?? 0;
    const toAfter = repo.getStock("KL-1042", "subang")?.onHand ?? 0;
    expect(fromAfter + toAfter).toBe(totalBefore);
  });

  it("rejects sell above available stock with 409 INSUFFICIENT_STOCK and leaves stock unchanged", async () => {
    const onHandBefore = repo.getStock("KL-1042", "mont-kiara")?.onHand;

    await expect(
      createAdjustment(
        repo,
        "KL-1042",
        { type: "sell", storeId: "mont-kiara", quantity: 20 },
        { role: "manager", idempotencyKey: "svc-insufficient-1" },
      ),
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK",
      status: 409,
    });

    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(onHandBefore);
  });

  it("rejects transfer to the same store with 422 SAME_STORE", async () => {
    await expect(
      createAdjustment(
        repo,
        "KL-1042",
        { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "mont-kiara", quantity: 5 },
        { role: "manager", idempotencyKey: "svc-same-store-1" },
      ),
    ).rejects.toMatchObject({
      status: 422,
      fieldErrors: [expect.objectContaining({ code: "SAME_STORE" })],
    });
  });

  it("rejects adjustment when product is not stocked at the store with 422", async () => {
    // KL-1000 is not stocked at cheras
    await expect(
      createAdjustment(
        repo,
        "KL-1000",
        { type: "receive", storeId: "cheras", quantity: 5 },
        { role: "manager", idempotencyKey: "svc-not-stocked-1" },
      ),
    ).rejects.toMatchObject({
      code: "NOT_STOCKED_AT_STORE",
      status: 422,
    });
  });

  it("applies adjustment once and replays existing result for same idempotency key and payload", async () => {
    const input = { type: "receive" as const, storeId: "mont-kiara", quantity: 5 };
    const ctx = { role: "manager" as const, idempotencyKey: "svc-replay-1" };

    const first = await createAdjustment(repo, "KL-1042", input, ctx);
    const second = await createAdjustment(repo, "KL-1042", input, ctx);

    expect(second.replay).toBe(true);
    expect(second.movements).toEqual(first.movements);
    expect(second.stock).toEqual(first.stock);
    expect(repo.getStock("KL-1042", "mont-kiara")?.onHand).toBe(23);
  });

  it("rejects with 422 IDEMPOTENCY_KEY_REUSED when same key is used with different payload", async () => {
    const ctx = { role: "manager" as const, idempotencyKey: "svc-reused-1" };

    await createAdjustment(
      repo,
      "KL-1042",
      { type: "receive", storeId: "mont-kiara", quantity: 5 },
      ctx,
    );

    await expect(
      createAdjustment(
        repo,
        "KL-1042",
        { type: "receive", storeId: "mont-kiara", quantity: 10 },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_REUSED",
      status: 422,
    });
  });

  it("returns 403 FORBIDDEN when staff attempts write_off or transfer", async () => {
    await expect(
      createAdjustment(
        repo,
        "KL-1042",
        { type: "write_off", storeId: "mont-kiara", quantity: 1, note: "Damaged box" },
        { role: "staff", idempotencyKey: "svc-staff-write-off" },
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    await expect(
      createAdjustment(
        repo,
        "KL-1042",
        { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "subang", quantity: 1 },
        { role: "staff", idempotencyKey: "svc-staff-transfer" },
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects with 400 IDEMPOTENCY_KEY_REQUIRED when idempotency key is missing", async () => {
    await expect(
      createAdjustment(
        repo,
        "KL-1042",
        { type: "receive", storeId: "mont-kiara", quantity: 5 },
        { role: "manager", idempotencyKey: "" },
      ),
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_REQUIRED",
      status: 400,
    });
  });

  it("leaves both stores unchanged when transfer fails inside transaction due to destination not stocked", async () => {
    // KL-1000 is stocked at mont-kiara (15 on hand), but not stocked at cheras (null)
    const montKiaraBefore = repo.getStock("KL-1000", "mont-kiara")?.onHand;
    const cherasBefore = repo.getStock("KL-1000", "cheras");

    await expect(
      createAdjustment(
        repo,
        "KL-1000",
        { type: "transfer", fromStoreId: "mont-kiara", toStoreId: "cheras", quantity: 5 },
        { role: "manager", idempotencyKey: "svc-transfer-dest-fail" },
      ),
    ).rejects.toMatchObject({
      code: "NOT_STOCKED_AT_STORE",
      status: 422,
    });

    expect(repo.getStock("KL-1000", "mont-kiara")?.onHand).toBe(montKiaraBefore);
    expect(repo.getStock("KL-1000", "cheras")).toBe(cherasBefore);
  });
});
