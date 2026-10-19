import { describe, it, expect } from "vitest";
import { rebaseSeed } from "../rebaseSeed";
import type { MovementRecord } from "../types";

describe("rebaseSeed", () => {
  const sampleMovements: MovementRecord[] = [
    {
      id: "m_0",
      productId: "KL-1000",
      storeId: "mont-kiara",
      type: "receive",
      quantity: 10,
      balanceAfter: 10,
      reason: null,
      transferId: null,
      createdAt: "2026-09-01T04:15:30.000Z",
      userId: "faiz-hakim",
    },
    {
      id: "m_1",
      productId: "KL-1000",
      storeId: "mont-kiara",
      type: "sell",
      quantity: -2,
      balanceAfter: 8,
      reason: null,
      transferId: null,
      createdAt: "2026-09-10T08:30:45.000Z",
      userId: "faiz-hakim",
    },
  ];

  it("shifts by whole days so time of day is unchanged", () => {
    // Current time: 2026-09-12T12:00:00.000Z (20:00 KL time)
    const now = new Date("2026-09-12T12:00:00.000Z");
    const rebased = rebaseSeed(sampleMovements, now);

    expect(rebased).toHaveLength(2);
    // m_0 original time of day was 04:15:30.000Z
    expect(rebased[0].createdAt.endsWith("T04:15:30.000Z")).toBe(true);
    // m_1 original time of day was 08:30:45.000Z
    expect(rebased[1].createdAt.endsWith("T08:30:45.000Z")).toBe(true);

    // Difference between dates in days is exactly a whole number of days
    const diffMs =
      new Date(rebased[1].createdAt).getTime() - new Date(sampleMovements[1].createdAt).getTime();
    expect(diffMs % (24 * 60 * 60 * 1000)).toBe(0);
  });

  it("preserves movement order", () => {
    const now = new Date("2026-09-12T12:00:00.000Z");
    const rebased = rebaseSeed(sampleMovements, now);

    expect(new Date(rebased[0].createdAt).getTime()).toBeLessThan(
      new Date(rebased[1].createdAt).getTime(),
    );
  });

  it("ensures no dates are in the future relative to now", () => {
    // Newest movement is at 08:30:45.000Z.
    // If now is on the same day but earlier (05:00:00.000Z), shifting to today would put it in the future.
    // It should shift one day less.
    const now = new Date("2026-09-12T05:00:00.000Z");
    const rebased = rebaseSeed(sampleMovements, now);

    for (const m of rebased) {
      expect(new Date(m.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  it("does not shift if movements are empty or already up to date", () => {
    expect(rebaseSeed([], new Date())).toEqual([]);

    const now = new Date("2026-09-10T08:30:45.000Z");
    const rebased = rebaseSeed(sampleMovements, now);
    expect(rebased).toEqual(sampleMovements);
  });
});
