import "server-only";

import { createHash } from "node:crypto";
import {
  ERROR_CODE,
  HTTP_STATUS,
  IMPORT_ROW_STATUS,
  MOVEMENT_TYPE,
} from "@/constants";
import { AppError } from "@/domain";
import type { Repository } from "@/server/repositories";
import { hashPayload, isRecord } from "@/server/services/inventory/idempotency";
import type { ImportCommitResult, ImportRowError } from "@/types";
import type {
  ImportCommitContext,
  ImportCommitResultWithReplay,
  ImportFileInput,
} from "./types";
import { validateImport } from "./validateImport";

function isStoredCommitResult(body: unknown): body is ImportCommitResult {
  if (!isRecord(body)) return false;
  return (
    typeof body.created === "number" &&
    typeof body.updated === "number" &&
    typeof body.unchanged === "number" &&
    typeof body.skipped === "number" &&
    Array.isArray(body.skippedRows)
  );
}

/**
 * Commits an import file within a single transaction.
 * Re-validates the file, applies valid creates and updates,
 * writes movements for non-zero quantity deltas, and persists the idempotency record.
 */
export async function commitImport(
  repo: Repository,
  input: ImportFileInput,
  ctx: ImportCommitContext,
): Promise<ImportCommitResultWithReplay> {
  if (!ctx.idempotencyKey || ctx.idempotencyKey.trim() === "") {
    throw new AppError(
      ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED,
      HTTP_STATUS.BAD_REQUEST,
      "Missing Idempotency-Key header",
    );
  }

  const fileHash = createHash("sha256").update(input.fileText).digest("hex");
  const requestHash = hashPayload({
    fileHash,
    storeId: input.storeId,
    mapping: input.mapping,
  });

  return repo.transaction((txRepo) => {
    const existing = txRepo.getIdempotency(ctx.idempotencyKey!);
    if (existing) {
      if (existing.requestHash === requestHash && isStoredCommitResult(existing.body)) {
        return {
          replay: true,
          ...existing.body,
        };
      }
      throw new AppError(
        ERROR_CODE.IDEMPOTENCY_KEY_REUSED,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "Idempotency key has already been used with a different request payload",
      );
    }

    const validation = validateImport(txRepo, input);

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let skipped = 0;
    const skippedRows: { rowNumber: number; errors: ImportRowError[] }[] = [];

    const nowIso = (ctx.now ?? new Date()).toISOString();
    const movementReason = ctx.fileName.slice(0, 200);

    for (const row of validation.rows) {
      if (row.status !== IMPORT_ROW_STATUS.VALID || !row.data) {
        skipped++;
        skippedRows.push({
          rowNumber: row.rowNumber,
          errors: row.errors,
        });
        continue;
      }

      const { sku, name, category, quantity, unitCostSen } = row.data;
      const product = txRepo.getProduct(sku);
      const stock = txRepo.getStock(sku, input.storeId);
      const currentOnHand = stock ? stock.onHand : 0;
      const delta = quantity - currentOnHand;

      if (!product) {
        txRepo.createProduct({
          sku,
          name,
          category,
          supplier: null,
          unitCostSen,
        });
        txRepo.setStock(sku, input.storeId, quantity, 0);
        created++;

        if (delta !== 0) {
          txRepo.addMovement({
            productId: sku,
            storeId: input.storeId,
            type: MOVEMENT_TYPE.IMPORT,
            quantity: delta,
            balanceAfter: quantity,
            reason: movementReason,
            transferId: null,
            createdAt: nowIso,
            userId: ctx.user.id,
          });
        }
      } else {
        const isCarried = stock !== null;
        const nameChanged = product.name !== name;
        const categoryChanged = product.category !== category;
        const costChanged = product.unitCostSen !== unitCostSen;
        const quantityChanged = delta !== 0;

        const isUnchanged =
          !nameChanged && !categoryChanged && !costChanged && !quantityChanged;

        if (isUnchanged) {
          unchanged++;
        } else {
          updated++;
          if (nameChanged || categoryChanged || costChanged) {
            txRepo.updateProduct(sku, {
              name,
              category,
              unitCostSen,
            });
          }

          if (quantityChanged || !isCarried) {
            const reorderLevel = stock ? stock.reorderLevel : 0;
            txRepo.setStock(sku, input.storeId, quantity, reorderLevel);
          }

          if (quantityChanged) {
            txRepo.addMovement({
              productId: sku,
              storeId: input.storeId,
              type: MOVEMENT_TYPE.IMPORT,
              quantity: delta,
              balanceAfter: quantity,
              reason: movementReason,
              transferId: null,
              createdAt: nowIso,
              userId: ctx.user.id,
            });
          }
        }
      }
    }

    const commitResult: ImportCommitResult = {
      created,
      updated,
      unchanged,
      skipped,
      skippedRows,
    };

    txRepo.setIdempotency({
      idempotencyKey: ctx.idempotencyKey!,
      requestHash,
      status: HTTP_STATUS.OK,
      body: commitResult,
    });

    return commitResult;
  });
}
