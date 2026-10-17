import type { z } from "zod";
import type { adjustmentSchema } from "@/lib/domain/schemas";
import type { Movement } from "./movement";
import type { StoreId } from "./store";

export type Adjustment = z.infer<typeof adjustmentSchema>;

export type AdjustmentResult = {
  movements: Movement[];
  stock: {
    storeId: StoreId;
    onHand: number;
  }[];
};
