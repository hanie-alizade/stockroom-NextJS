import { z } from "zod";
import { MOVEMENT_TYPE } from "@/constants";
import { storeScopeSchema } from "./common";

export const movementListQuerySchema = z.object({
  store: storeScopeSchema.optional(),
  type: z.nativeEnum(MOVEMENT_TYPE).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const productMovementsQuerySchema = movementListQuerySchema;
