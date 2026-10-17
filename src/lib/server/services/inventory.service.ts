import "server-only";

import { createHash } from "node:crypto";

import { AppError } from "@/lib/domain/errors";
import { can } from "@/lib/domain/policy";
import { isValidQuantity } from "@/lib/domain/stock-rules";
import { createRepository } from "@/lib/server/repo";

import { applyDirectAdjustment } from "./inventory/apply-direct";
import { applyTransfer } from "./inventory/apply-transfer";
import {
  isAdjustment,
  isAdjustmentContext,
  isRecord,
  isRepository,
  isStoredAdjustmentBody,
} from "./inventory/types";

import type { Repository } from "@/lib/server/repo";
import type { Store } from "@/lib/server/repo/types";
import type {
  AdjustmentContext,
  AdjustmentInput,
  AdjustmentResult,
  ExecutionContext,
  SavedMovement,
} from "./inventory/types";

export type { AdjustmentContext, AdjustmentInput, AdjustmentResult, SavedMovement };

function canonicalJsonString(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonString).join(",") + "]";
  }
  if (isRecord(obj)) {
    const keys = Object.keys(obj).sort();
    return (
      "{" +
      keys.map((key) => JSON.stringify(key) + ":" + canonicalJsonString(obj[key])).join(",") +
      "}"
    );
  }
  return JSON.stringify(obj);
}

export async function createAdjustment(
  input: AdjustmentInput,
  ctx: AdjustmentContext,
): Promise<AdjustmentResult>;
export async function createAdjustment(
  productId: string,
  input: AdjustmentInput,
  ctx: AdjustmentContext,
): Promise<AdjustmentResult>;
export async function createAdjustment(
  repo: Repository,
  productId: string,
  input: AdjustmentInput,
  ctx: AdjustmentContext,
): Promise<AdjustmentResult>;
export async function createAdjustment(
  inputOrRepo: AdjustmentInput | Repository | string,
  ctxOrProductId?: AdjustmentContext | string | AdjustmentInput,
  maybeInput?: AdjustmentInput | AdjustmentContext,
  maybeCtx?: AdjustmentContext,
): Promise<AdjustmentResult> {
  let repo = createRepository();
  let productId = "";
  let input: AdjustmentInput;
  let ctx: AdjustmentContext;

  if (isRepository(inputOrRepo)) {
    repo = inputOrRepo;
    productId = typeof ctxOrProductId === "string" ? ctxOrProductId : "";
    input = isAdjustment(maybeInput) ? maybeInput : { type: "receive", storeId: "", quantity: 0 };
    ctx = maybeCtx ?? { role: "manager", idempotencyKey: "" };
  } else if (typeof inputOrRepo === "string") {
    productId = inputOrRepo;
    input = isAdjustment(ctxOrProductId)
      ? ctxOrProductId
      : { type: "receive", storeId: "", quantity: 0 };
    ctx = isAdjustmentContext(maybeInput) ? maybeInput : { role: "manager", idempotencyKey: "" };
    repo = ctx.repo ?? createRepository();
  } else {
    input = inputOrRepo;
    ctx = (ctxOrProductId && isAdjustmentContext(ctxOrProductId) ? ctxOrProductId : undefined) ?? {
      role: "manager",
      idempotencyKey: "",
    };
    productId = ctx.productId ?? input.productId ?? "";
    repo = ctx.repo ?? createRepository();
  }

  if (!ctx.idempotencyKey || ctx.idempotencyKey.trim() === "") {
    throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400, "Missing Idempotency-Key header");
  }

  if (!can(ctx.role, input.type)) {
    throw new AppError("FORBIDDEN", 403, "You do not have permission to perform this action");
  }

  if (!productId || productId.trim() === "") {
    throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
  }

  let product = repo.getProduct(productId);
  if (!product) {
    product = repo.getProduct(productId.toUpperCase());
  }
  if (!product) {
    const allProducts = repo.listProducts();
    product = allProducts.find((p) => p.sku.toLowerCase() === productId.toLowerCase()) ?? null;
  }
  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
  }
  const canonicalSku = product.sku;

  if (!isValidQuantity(input.quantity)) {
    throw new AppError("VALIDATION_ERROR", 422, "Invalid quantity", [
      {
        field: "quantity",
        code: "MUST_BE_POSITIVE",
        message: "Quantity must be a positive whole number",
      },
    ]);
  }

  const note = input.reason ?? input.note ?? null;
  if (input.type === "write_off" && (!note || note.trim().length < 3)) {
    throw new AppError("VALIDATION_ERROR", 422, "Write-off requires a reason", [
      { field: "reason", code: "REQUIRED", message: "Reason must be at least 3 characters" },
    ]);
  }

  if (input.type === "transfer" && input.fromStoreId === input.toStoreId) {
    throw new AppError("VALIDATION_ERROR", 422, "Cannot transfer to the same store", [
      {
        field: "to",
        code: "SAME_STORE",
        message: "Source and destination stores must be different",
      },
    ]);
  }

  const requestHash = createHash("sha256")
    .update(canonicalJsonString({ productId: canonicalSku, ...input }))
    .digest("hex");

  return repo.transaction((txRepo) => {
    const existing = txRepo.getIdempotency(ctx.idempotencyKey);
    if (existing) {
      if (existing.requestHash === requestHash && isStoredAdjustmentBody(existing.body)) {
        return {
          replay: true,
          movements: existing.body.movements,
          stock: existing.body.stock,
        };
      }
      throw new AppError(
        "IDEMPOTENCY_KEY_REUSED",
        422,
        "Idempotency key has already been used with a different request payload",
      );
    }

    const storeMap = new Map<string, Store>(txRepo.getStores().map((s) => [s.id, s]));
    const now = new Date().toISOString();
    const users = txRepo.getUsers();
    const user =
      users.find((u) => u.id === ctx.userId) ?? users.find((u) => u.role === ctx.role) ?? users[0];

    const execCtx: ExecutionContext = {
      storeMap,
      requestHash,
      idempotencyKey: ctx.idempotencyKey,
      now,
      userName: user ? user.name : "Unknown",
      userId: user ? user.id : "unknown",
      note,
    };

    if (input.type === "transfer") {
      return applyTransfer(txRepo, canonicalSku, input, execCtx);
    }

    return applyDirectAdjustment(txRepo, canonicalSku, input, execCtx);
  });
}
