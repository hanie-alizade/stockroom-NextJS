import { z } from "zod";
import { MOVEMENT_TYPE, PERIOD } from "@/constants";
import { paginationQuerySchema, storeScopeSchema } from "./common";

export const movementListQuerySchema = paginationQuerySchema.extend({
  store: storeScopeSchema.optional(),
  type: z.nativeEnum(MOVEMENT_TYPE).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.nativeEnum(PERIOD).optional(),
  fail: z.string().optional(),
});

export const productMovementsQuerySchema = movementListQuerySchema;
