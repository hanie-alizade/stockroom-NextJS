import type {
  SavedMovement,
  Role,
  StoreRecord,
} from "@/types";

export type AdjustmentContext = {
  role: Role;
  idempotencyKey: string;
  userId?: string;
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

export function isStoredAdjustmentBody(
  body: unknown,
): body is { movements: SavedMovement[]; stock: { storeId: string; onHand: number }[] } {
  if (!isRecord(body)) {
    return false;
  }
  return Array.isArray(body.movements) && Array.isArray(body.stock);
}
