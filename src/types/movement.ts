import type { z } from "zod";
import type { MOVEMENT_TYPE, PERIOD } from "@/constants";
import type { movementListQuerySchema } from "@/schemas";
import type { Paginated } from "./common";
import type { StoreId } from "./store";

export type MovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE];

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

export type MovementPeriod = (typeof PERIOD)[keyof typeof PERIOD];

export type MovementListQuery = z.infer<typeof movementListQuerySchema>;

export type MovementListResponse = Paginated<Movement>;

// Repository internal type
export type MovementRecord = {
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

export type MovementWithUser = MovementRecord & { createdBy: string };

export type ProductMovementsResult = {
  items: MovementWithUser[];
  page: number;
  pageSize: number;
  total: number;
};
