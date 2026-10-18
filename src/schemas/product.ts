import { z } from "zod";
import { PRODUCT_SORT_KEY, SORT_DIRECTION, STOCK_STATUS } from "@/constants";
import { paginationQuerySchema, storeScopeSchema } from "./common";

export const productListQuerySchema = paginationQuerySchema.extend({
  store: storeScopeSchema.optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(STOCK_STATUS).optional(),
  sort: z.nativeEnum(PRODUCT_SORT_KEY).optional(),
  dir: z.nativeEnum(SORT_DIRECTION).optional(),
});

export const productDetailQuerySchema = z.object({
  store: storeScopeSchema.optional(),
});

export const stockHistoryQuerySchema = z.object({
  store: storeScopeSchema.optional(),
  days: z.coerce.number().int().positive().optional(),
});
