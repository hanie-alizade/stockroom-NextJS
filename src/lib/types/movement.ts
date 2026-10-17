import type { Paginated } from "./common";
import type { StoreId } from "./store";

export type MovementType =
  "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in" | "import";

export type MovementDraft = {
  productId: string;
  storeId: StoreId;
  type: MovementType;
  quantity: number; /* signed */
  balanceAfter: number;
  note?: string;
  transferId?: string;
};

export type Movement = MovementDraft & {
  id: string;
  createdAt: string;
  by: {
    id: string;
    name: string;
    initials: string;
  };
  counterpartStoreId?: StoreId;
};

export type MovementPeriod = "7d" | "30d" | "90d";

export type MovementListResponse = Paginated<Movement>;

// Repository internal type (has different structure than contracts)
export type RepoMovement = {
  id: string;
  productId: string;
  storeId: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  transferId: string | null;
  createdAt: string;
  userId: string;
};
