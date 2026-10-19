import type { z } from "zod";
import type {
  adjustmentSchema,
  receiveAdjustmentSchema,
  sellAdjustmentSchema,
  writeOffAdjustmentSchema,
  transferAdjustmentSchema,
} from "@/schemas";
import type { Movement } from "./movement";
import type { StoreId } from "./store";

export type Adjustment = z.infer<typeof adjustmentSchema>;
export type ReceiveAdjustment = z.infer<typeof receiveAdjustmentSchema>;
export type SellAdjustment = z.infer<typeof sellAdjustmentSchema>;
export type WriteOffAdjustment = z.infer<typeof writeOffAdjustmentSchema>;
export type TransferAdjustment = z.infer<typeof transferAdjustmentSchema>;
export type AdjustmentInput = Adjustment;

export type AdjustmentResult = {
  movements: Movement[];
  stock: {
    storeId: StoreId;
    onHand: number;
  }[];
  replay?: boolean;
};
