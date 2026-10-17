import type { Role } from "@/lib/domain/policy";
import type { Movement, Repository } from "@/lib/server/repo";
import type { Store } from "@/lib/server/repo/types";

export type SavedMovement = Movement & {
  note?: string;
  createdBy: string;
  by: string;
};

export type AdjustmentResult = {
  movements: SavedMovement[];
  stock: { storeId: string; onHand: number }[];
  replay?: boolean;
};

export type ReceiveAdjustment = {
  type: "receive";
  storeId: string;
  quantity: number;
  note?: string;
  reason?: string;
  productId?: string;
};

export type SellAdjustment = {
  type: "sell";
  storeId: string;
  quantity: number;
  note?: string;
  reason?: string;
  productId?: string;
};

export type WriteOffAdjustment = {
  type: "write_off";
  storeId: string;
  quantity: number;
  reason?: string;
  note?: string;
  productId?: string;
};

export type TransferAdjustment = {
  type: "transfer";
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  note?: string;
  reason?: string;
  productId?: string;
};

export type AdjustmentInput =
  ReceiveAdjustment | SellAdjustment | WriteOffAdjustment | TransferAdjustment;

export type AdjustmentContext = {
  role: Role;
  idempotencyKey: string;
  productId?: string;
  userId?: string;
  repo?: Repository;
};

export type ExecutionContext = {
  storeMap: Map<string, Store>;
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
  return type === "receive" || type === "sell" || type === "write_off" || type === "transfer";
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
