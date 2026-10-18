import { z } from "zod";
import { ADJUSTMENT_TYPE } from "@/constants";
import { quantitySchema, storeIdSchema, noteSchema } from "./common";

const baseAdjustmentSchema = z.object({
  quantity: quantitySchema,
});

export const receiveAdjustmentSchema = baseAdjustmentSchema.extend({
  type: z.literal(ADJUSTMENT_TYPE.RECEIVE),
  storeId: storeIdSchema,
  note: noteSchema.optional(),
});

export const sellAdjustmentSchema = baseAdjustmentSchema.extend({
  type: z.literal(ADJUSTMENT_TYPE.SELL),
  storeId: storeIdSchema,
  note: noteSchema.optional(),
});

export const writeOffAdjustmentSchema = baseAdjustmentSchema.extend({
  type: z.literal(ADJUSTMENT_TYPE.WRITE_OFF),
  storeId: storeIdSchema,
  note: z.string().trim().min(3).max(200),
});

export const transferAdjustmentSchema = baseAdjustmentSchema.extend({
  type: z.literal(ADJUSTMENT_TYPE.TRANSFER),
  fromStoreId: storeIdSchema,
  toStoreId: storeIdSchema,
  note: noteSchema.optional(),
});

export const adjustmentSchema = z.discriminatedUnion("type", [
  receiveAdjustmentSchema,
  sellAdjustmentSchema,
  writeOffAdjustmentSchema,
  transferAdjustmentSchema,
]);
