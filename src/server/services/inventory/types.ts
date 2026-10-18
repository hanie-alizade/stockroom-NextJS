import { ADJUSTMENT_TYPE } from "@/constants";
import type { Repository } from "@/server/repositories";
import type {
  AdjustmentInput,
  SavedMovement,
  Role,
  StoreRecord,
} from "@/types";

export type AdjustmentContext = {
  role: Role;
  idempotencyKey: string;
  productId?: string;
  userId?: string;
  repo?: Repository;
};

export type ExecutionContext = {
  storeMap: Map<string, StoreRecord>;
  requestHash: string;
  idempotencyKey: string;
  now: string;
  userName: string;
  userId: string;
  note: string | null;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isRepository(value: unknown): value is Repository {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.transaction === "function" &&
    typeof value.getStock === "function" &&
    typeof value.setStock === "function"
  );
}

export function isAdjustment(value: unknown): value is AdjustmentInput {
  if (!isRecord(value)) {
    return false;
  }
  const type = value.type;
  return (
    type === ADJUSTMENT_TYPE.RECEIVE ||
    type === ADJUSTMENT_TYPE.SELL ||
    type === ADJUSTMENT_TYPE.WRITE_OFF ||
    type === ADJUSTMENT_TYPE.TRANSFER
  );
}

export function isAdjustmentContext(value: unknown): value is AdjustmentContext {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.idempotencyKey === "string";
}

export function isStoredAdjustmentBody(
  body: unknown,
): body is { movements: SavedMovement[]; stock: { storeId: string; onHand: number }[] } {
  if (!isRecord(body)) {
    return false;
  }
  return Array.isArray(body.movements) && Array.isArray(body.stock);
}
