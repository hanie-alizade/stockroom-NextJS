import { beforeEach, describe, expect, it } from "vitest";
import {
  ERROR_CODE,
  HTTP_STATUS,
  IMPORT_FIELD,
  MOVEMENT_TYPE,
  ROLE,
} from "@/constants";
import { createRepository } from "@/server/repositories";
import type { ImportMapping, User } from "@/types";
import { commitImport } from "../commitImport";
import type { ImportFileInput } from "../types";

describe("commitImport", () => {
  const repo = createRepository();
  const managerUser: User = {
    id: "u1",
    name: "Aina Rahman",
    initials: "AR",
    role: ROLE.MANAGER,
  };

  const defaultMapping: ImportMapping = {
    [IMPORT_FIELD.SKU]: "SKU",
    [IMPORT_FIELD.NAME]: "Name",
    [IMPORT_FIELD.CATEGORY]: "Category",
    [IMPORT_FIELD.QUANTITY]: "Quantity",
    [IMPORT_FIELD.UNIT_COST]: "Unit cost",
  };

  beforeEach(() => {
    repo.reset();
  });

  it("creates new products with supplier null and records movements", async () => {
    const csv = [
      "SKU,Name,Category,Quantity,Unit cost",
      "NEW-ITEM-1,Brand New Item,Coffee,15,30.00",
    ].join("\n");

    const input: ImportFileInput = {
      storeId: "mont-kiara",
      mapping: defaultMapping,
      fileText: csv,
      fileName: "batch.csv",
    };

    const result = await commitImport(repo, input, {
      user: managerUser,
      idempotencyKey: "key-create-1",
      fileName: "batch.csv",
    });

    expect(result).toEqual({
      created: 1,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      skippedRows: [],
    });

    const product = repo.getProduct("NEW-ITEM-1");
    expect(product).toBeDefined();
    expect(product?.supplier).toBeNull();
    expect(product?.name).toBe("Brand New Item");

    const stock = repo.getStock("NEW-ITEM-1", "mont-kiara");
    expect(stock?.onHand).toBe(15);
    expect(stock?.reorderLevel).toBe(0);

    const movements = repo.getMovements("NEW-ITEM-1", "mont-kiara");
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe(MOVEMENT_TYPE.IMPORT);
    expect(movements[0].quantity).toBe(15);
    expect(movements[0].balanceAfter).toBe(15);
    expect(movements[0].reason).toBe("batch.csv");
  });

  it("updates existing products and counts unchanged with no movement written when delta is 0", async () => {
    const initialStock = repo.getStock("KL-1042", "mont-kiara")!;
    const initialOnHand = initialStock.onHand;
    const initialProduct = repo.getProduct("KL-1042")!;

    // 1. Same values -> unchanged, no movement
    const unchangedCsv = [
      "SKU,Name,Category,Quantity,Unit cost",
      `KL-1042,${initialProduct.name},${initialProduct.category},${initialOnHand},${(initialProduct.unitCostSen / 100).toFixed(2)}`,
    ].join("\n");

    const unchangedResult = await commitImport(
      repo,
      {
        storeId: "mont-kiara",
        mapping: defaultMapping,
        fileText: unchangedCsv,
        fileName: "test.csv",
      },
      { user: managerUser, idempotencyKey: "key-unchanged-1", fileName: "test.csv" },
    );

    expect(unchangedResult).toEqual({
      created: 0,
      updated: 0,
      unchanged: 1,
      skipped: 0,
      skippedRows: [],
    });

    const initialMovementsCount = repo.getMovements("KL-1042", "mont-kiara").length;

    // 2. Changed quantity -> updated, 1 movement written
    const changedCsv = [
      "SKU,Name,Category,Quantity,Unit cost",
      `KL-1042,${initialProduct.name},${initialProduct.category},${initialOnHand + 5},${(initialProduct.unitCostSen / 100).toFixed(2)}`,
    ].join("\n");

    const changedResult = await commitImport(
      repo,
      {
        storeId: "mont-kiara",
        mapping: defaultMapping,
        fileText: changedCsv,
        fileName: "test2.csv",
      },
      { user: managerUser, idempotencyKey: "key-changed-1", fileName: "test2.csv" },
    );

    expect(changedResult).toEqual({
      created: 0,
      updated: 1,
      unchanged: 0,
      skipped: 0,
      skippedRows: [],
    });

    const afterMovements = repo.getMovements("KL-1042", "mont-kiara");
    expect(afterMovements.length).toBe(initialMovementsCount + 1);
    expect(afterMovements[0].type).toBe(MOVEMENT_TYPE.IMPORT);
    expect(afterMovements[0].quantity).toBe(5);
    expect(afterMovements[0].balanceAfter).toBe(initialOnHand + 5);
  });

  it("rolls back all writes if an error occurs inside transaction", async () => {
    const csv = [
      "SKU,Name,Category,Quantity,Unit cost",
      "ROLLBACK-1,Item One,Coffee,10,12.00",
    ].join("\n");

    const input: ImportFileInput = {
      storeId: "mont-kiara",
      mapping: defaultMapping,
      fileText: csv,
      fileName: "test.csv",
    };

    const originalAdd = repo.addMovement.bind(repo);
    repo.addMovement = () => {
      throw new Error("Disk error simulated");
    };

    try {
      await expect(
        commitImport(repo, input, {
          user: managerUser,
          idempotencyKey: "key-rollback",
          fileName: "test.csv",
        }),
      ).rejects.toThrow("Disk error simulated");
    } finally {
      repo.addMovement = originalAdd;
    }

    expect(repo.getProduct("ROLLBACK-1")).toBeNull();
  });

  it("replays stored result on identical idempotency key and throws on key reuse", async () => {
    const csv = [
      "SKU,Name,Category,Quantity,Unit cost",
      "IDEM-1,Item,Coffee,5,10.00",
    ].join("\n");

    const input: ImportFileInput = {
      storeId: "mont-kiara",
      mapping: defaultMapping,
      fileText: csv,
      fileName: "test.csv",
    };

    const first = await commitImport(repo, input, {
      user: managerUser,
      idempotencyKey: "same-key-1",
      fileName: "test.csv",
    });
    expect(first.created).toBe(1);

    // Replay
    const replay = await commitImport(repo, input, {
      user: managerUser,
      idempotencyKey: "same-key-1",
      fileName: "test.csv",
    });
    expect(replay.replay).toBe(true);
    expect(replay.created).toBe(1);

    // Same key, different payload -> 422 IDEMPOTENCY_KEY_REUSED
    const diffInput: ImportFileInput = {
      ...input,
      fileText: csv.replace("IDEM-1", "IDEM-2"),
    };
    await expect(
      commitImport(repo, diffInput, {
        user: managerUser,
        idempotencyKey: "same-key-1",
        fileName: "test.csv",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODE.IDEMPOTENCY_KEY_REUSED,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  });

  it("throws 400 when idempotency key is missing", async () => {
    const input: ImportFileInput = {
      storeId: "mont-kiara",
      mapping: defaultMapping,
      fileText: "SKU,Name,Category,Quantity,Unit cost\nA,B,Coffee,1,1.00",
      fileName: "test.csv",
    };
    await expect(
      commitImport(repo, input, {
        user: managerUser,
        idempotencyKey: "",
        fileName: "test.csv",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST,
    });
  });
});
