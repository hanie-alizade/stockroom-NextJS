import { z } from "zod";
import {
  ADJUSTMENT_TYPE,
  ALL_STORES,
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
} from "@/constants";

const receiveSchema = z.object({
  type: z.literal(ADJUSTMENT_TYPE.RECEIVE),
  storeId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reason: z.string().optional(),
});

const sellSchema = z.object({
  type: z.literal(ADJUSTMENT_TYPE.SELL),
  storeId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reason: z.string().optional(),
});

const writeOffSchema = z.object({
  type: z.literal(ADJUSTMENT_TYPE.WRITE_OFF),
  storeId: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(3).max(200),
  note: z.string().optional(),
});

const transferSchema = z.object({
  type: z.literal(ADJUSTMENT_TYPE.TRANSFER),
  fromStoreId: z.string(),
  toStoreId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reason: z.string().optional(),
});

export const adjustmentSchema = z.discriminatedUnion("type", [
  receiveSchema,
  sellSchema,
  writeOffSchema,
  transferSchema,
]);

export type Adjustment = z.infer<typeof adjustmentSchema>;

export const productListQuerySchema = z.object({
  store: z.union([z.literal(ALL_STORES), z.string()]).optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(STOCK_STATUS).optional(),
  sort: z.nativeEnum(PRODUCT_SORT_KEY).optional(),
  dir: z.nativeEnum(SORT_DIRECTION).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const importRequestSchema = z.object({
  storeId: z.string(),
  mapping: z.record(z.string()),
  rows: z.array(z.record(z.string())),
});
