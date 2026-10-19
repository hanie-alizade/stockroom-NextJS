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
