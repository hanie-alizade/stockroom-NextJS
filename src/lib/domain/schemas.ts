import { z } from "zod";

const receiveSchema = z.object({
  type: z.literal("receive"),
  storeId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reason: z.string().optional(),
});

const sellSchema = z.object({
  type: z.literal("sell"),
  storeId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reason: z.string().optional(),
});

const writeOffSchema = z.object({
  type: z.literal("write_off"),
  storeId: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(3).max(200),
  note: z.string().optional(),
});

const transferSchema = z.object({
  type: z.literal("transfer"),
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
  store: z.union([z.literal("all"), z.string()]).optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["in_stock", "low", "out"]).optional(),
  sort: z
    .enum(["sku", "name", "category", "onHand", "reorderLevel", "status", "updatedAt"])
    .optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const importRequestSchema = z.object({
  storeId: z.string(),
  mapping: z.record(z.string()),
  rows: z.array(z.record(z.string())),
});
