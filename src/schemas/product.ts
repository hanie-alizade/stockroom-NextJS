import { z } from "zod";
import { PERIOD_DAYS, PRODUCT_SORT_KEY, SORT_DIRECTION, STOCK_STATUS } from "@/constants";
import { paginationQuerySchema, storeScopeSchema } from "./common";

const VALID_DAYS = Object.values(PERIOD_DAYS) as number[];

export const productListQuerySchema = paginationQuerySchema.extend({
  store: storeScopeSchema.optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(STOCK_STATUS).optional(),
  sort: z.nativeEnum(PRODUCT_SORT_KEY).optional(),
  dir: z.nativeEnum(SORT_DIRECTION).optional(),
  fail: z.string().optional(),
});

export const productDetailQuerySchema = z.object({
  store: storeScopeSchema.optional(),
  fail: z.string().optional(),
});

export const stockHistoryQuerySchema = z.object({
  store: storeScopeSchema.optional(),
  days: z.coerce
    .number()
    .int()
    .refine((val) => VALID_DAYS.includes(val), {
      message: `Days must be one of ${VALID_DAYS.join(", ")}`,
    })
    .optional(),
  fail: z.string().optional(),
});
