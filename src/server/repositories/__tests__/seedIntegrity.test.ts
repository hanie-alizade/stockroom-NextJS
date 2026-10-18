import { describe, it, expect } from "vitest";
import seedData from "@data/seed.json";

interface User {
  id: string;
  name: string;
  initials: string;
  role: "manager" | "staff";
}

interface StockRow {
  storeId: string;
  onHand: number;
  reorderLevel: number;
}

interface Movement {
  productId: string;
  storeId: string;
  type: "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in";
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  transferId: string | null;
  createdAt: string;
  userId: string;
}

describe("Seed integrity", () => {
  const users = seedData.users as User[];
  const managerUserIds = new Set(
    users.filter((u) => u.role === "manager").map((u) => u.id),
  );
  const stockMap = seedData.stock as Record<string, StockRow[]>;
  const movements = seedData.movements as Movement[];

  // Group movements by product and store
  const movementsByProductStore = new Map<string, Movement[]>();
  for (const m of movements) {
    const key = `${m.productId}::${m.storeId}`;
    let list = movementsByProductStore.get(key);
    if (!list) {
      list = [];
      movementsByProductStore.set(key, list);
    }
    list.push(m);
  }

  // Sort each list in time order
  for (const list of movementsByProductStore.values()) {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  it("a) for every (product, store) stock row: newest movement's balanceAfter equals current onHand", () => {
    const errors: string[] = [];

    for (const [productId, rows] of Object.entries(stockMap)) {
      for (const row of rows) {
        const key = `${productId}::${row.storeId}`;
        const list = movementsByProductStore.get(key);
        if (!list || list.length === 0) {
          errors.push(`Missing movements for ${key}`);
          continue;
        }
        const newest = list[list.length - 1];
        if (newest.balanceAfter !== row.onHand) {
          errors.push(
            `Mismatch for ${key}: newest balanceAfter ${newest.balanceAfter} !== onHand ${row.onHand}`,
          );
        }
      }
    }

    expect(errors).toEqual([]);
  });

  it("b) for every (product, store) in time order: balanceAfter - quantity equals previous balanceAfter, and no balance is negative", () => {
    const errors: string[] = [];

    for (const [key, list] of movementsByProductStore.entries()) {
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        if (m.balanceAfter < 0) {
          errors.push(`Negative balanceAfter in ${key} at idx ${i}: ${m.balanceAfter}`);
        }
        const previousCalculated = m.balanceAfter - m.quantity;
        if (previousCalculated < 0) {
          errors.push(`Negative previous balance in ${key} at idx ${i}: ${previousCalculated}`);
        }

        if (i > 0) {
          const prev = list[i - 1];
          if (previousCalculated !== prev.balanceAfter) {
            errors.push(
              `Chain break in ${key} at idx ${i}: ${m.balanceAfter} - (${m.quantity}) = ${previousCalculated} !== prev ${prev.balanceAfter}`,
            );
          }
        }
      }
    }

    expect(errors).toEqual([]);
  });

  it("c) every transfer_out has exactly one transfer_in with same transferId, same createdAt and opposite quantity", () => {
    const errors: string[] = [];
    const transfersOut = movements.filter((m) => m.type === "transfer_out");
    const transfersIn = movements.filter((m) => m.type === "transfer_in");

    const transferInMap = new Map<string, Movement[]>();
    for (const tin of transfersIn) {
      if (!tin.transferId) {
        errors.push(`transfer_in missing transferId`);
        continue;
      }
      let list = transferInMap.get(tin.transferId);
      if (!list) {
        list = [];
        transferInMap.set(tin.transferId, list);
      }
      list.push(tin);
    }

    for (const tout of transfersOut) {
      if (!tout.transferId) {
        errors.push(`transfer_out missing transferId`);
        continue;
      }
      const ins = transferInMap.get(tout.transferId);
      if (!ins || ins.length !== 1) {
        errors.push(
          `transfer_out ${tout.transferId} matched ${ins ? ins.length : 0} transfer_in movements`,
        );
        continue;
      }
      const tin = ins[0];
      if (tin.createdAt !== tout.createdAt) {
        errors.push(
          `transfer ${tout.transferId} createdAt mismatch: out ${tout.createdAt} vs in ${tin.createdAt}`,
        );
      }
      if (tin.quantity !== -tout.quantity) {
        errors.push(
          `transfer ${tout.transferId} quantity mismatch: out ${tout.quantity} vs in ${tin.quantity}`,
        );
      }
    }

    if (transfersOut.length !== transfersIn.length) {
      errors.push(`Count mismatch: out ${transfersOut.length} vs in ${transfersIn.length}`);
    }

    expect(errors).toEqual([]);
  });

  it("d) write_off and transfer movements are made only by manager users; write_off always has a non-empty reason", () => {
    const errors: string[] = [];

    for (const m of movements) {
      if (m.type === "write_off" || m.type === "transfer_out" || m.type === "transfer_in") {
        if (!managerUserIds.has(m.userId)) {
          errors.push(
            `Movement ${m.type} for ${m.productId} made by non-manager ${m.userId}`,
          );
        }
      }
      if (m.type === "write_off") {
        if (!m.reason || m.reason.trim().length === 0) {
          errors.push(`write_off for ${m.productId} has empty or missing reason`);
        }
      }
    }

    expect(errors).toEqual([]);
  });

  it("e) every stock row has at least one movement", () => {
    const errors: string[] = [];

    for (const [productId, rows] of Object.entries(stockMap)) {
      for (const row of rows) {
        const key = `${productId}::${row.storeId}`;
        const list = movementsByProductStore.get(key);
        if (!list || list.length === 0) {
          errors.push(`Stock row ${key} has no movements`);
        }
      }
    }

    expect(errors).toEqual([]);
  });
});
